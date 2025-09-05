const { validationResult } = require("express-validator");
const { streamText } = require("ai");
const { getModel } = require("../config/openrouter");
const { generateThreadTitle } = require("../config/aiConfig");
const Message = require("../models/Message");
const Thread = require("../models/Thread");
const logger = require("../utils/logger");
const OpenAI = require("openai");

// Helper function to build personalized system prompt
const buildPersonalizedSystemPrompt = (user) => {
  const profile = user.profile || {};
  const preferences = user.preferences || {};

  // Language mapping
  const languageInstructions = {
    en: "Respond in English.",
    hi: "Respond in Hindi (हिंदी). Use Devanagari script and include English terms in parentheses for technical words when needed.",
    ml: "Respond in Malayalam (മലയാളം). Use Malayalam script and include English terms in parentheses for technical words when needed."
  };

  const userLanguage = preferences.language || 'en';
  const languageInstruction = languageInstructions[userLanguage] || languageInstructions.en;

  // Base system prompt
  let systemPrompt = `You are a Digital Krishi Officer, an AI-powered agricultural advisory assistant designed to help farmers with personalized advice. You provide expert guidance on:

🌐 LANGUAGE: ${languageInstruction}

🌾 CORE EXPERTISE:
- Pest and disease management with specific treatment recommendations
- Weather-based farming decisions and seasonal planning
- Input optimization (fertilizers, pesticides, seeds) with cost-effective solutions
- Government subsidies, schemes, and financial assistance programs
- Market trends, pricing strategies, and crop profitability analysis
- Soil health management and sustainable farming practices
- Irrigation techniques and water management
- Post-harvest handling, storage, and value addition

📋 RESPONSE GUIDELINES:
- Provide practical, actionable advice that farmers can implement immediately
- Include specific product names, quantities, and application methods when relevant
- Mention approximate costs and ROI when discussing inputs or techniques
- Suggest local alternatives and indigenous solutions when possible
- Always prioritize sustainable and environmentally friendly practices
- If unsure about specific local conditions, recommend consulting local agricultural experts

✨ FORMATTING GUIDELINES:
- Use **bold text** for important terms, product names, and key actions
- Use *italics* for emphasis and scientific names
- Create numbered lists (1. 2. 3.) for step-by-step instructions
- Create bullet points (- or •) for multiple options or features
- Use headings (## or ###) to organize complex responses
- Highlight quantities and measurements clearly
- Make responses visually scannable and easy to read
- For non-English responses: Keep markdown formatting but use the specified language for content`;

  // Add user-specific context if available
  if (profile.firstName || profile.lastName) {
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
    systemPrompt += `\n\n👤 USER CONTEXT:\nYou are assisting ${name}, a farmer`;
  } else {
    systemPrompt += `\n\n👤 USER CONTEXT:\nYou are assisting a farmer`;
  }

  // Add experience level context
  if (profile.experience) {
    const experienceContext = {
      beginner: "who is new to farming. Provide detailed explanations, basic concepts, and step-by-step guidance. Avoid complex technical jargon and focus on fundamental practices.",
      intermediate: "with moderate farming experience. Provide balanced advice with some technical details and intermediate-level techniques. Include both traditional and modern approaches.",
      advanced: "with extensive farming experience. Provide advanced technical guidance, latest research findings, and sophisticated farming techniques. You can use technical terminology and discuss complex agricultural concepts."
    };
    systemPrompt += ` ${experienceContext[profile.experience]}`;
  }

  // Add location context
  if (profile.location) {
    systemPrompt += `\n\n📍 LOCATION: The farmer is located in ${profile.location}. Consider local climate conditions, soil types, common pests/diseases in this region, and locally available resources when providing advice.`;
  }

  // Add crop-specific context
  if (profile.cropTypes && profile.cropTypes.length > 0) {
    systemPrompt += `\n\n🌱 CROPS: The farmer primarily grows: ${profile.cropTypes.join(', ')}. Tailor your advice specifically for these crops, including:
- Crop-specific pest and disease management
- Optimal planting and harvesting times for these crops
- Suitable fertilizer and input recommendations
- Market trends and pricing for these specific crops
- Crop rotation and intercropping opportunities
- Variety selection and seed recommendations`;
  }

  // Add farm size context
  if (profile.farmSize) {
    systemPrompt += `\n\n🏞️ FARM SIZE: The farm size is ${profile.farmSize}. Scale your recommendations appropriately:
- Suggest equipment and techniques suitable for this farm size
- Provide cost estimates relevant to the scale of operation
- Recommend appropriate input quantities
- Consider labor requirements and mechanization needs`;
  }

  // Add language preference
  const languageMap = {
    'hi': 'Hindi',
    'ml': 'Malayalam',
    'en': 'English'
  };

  if (user.preferences?.language && user.preferences.language !== 'en') {
    const language = languageMap[user.preferences.language] || 'English';
    systemPrompt += `\n\n🗣️ LANGUAGE: The farmer prefers communication in ${language}. While you should respond primarily in English for technical accuracy, you may include local terms and can acknowledge their language preference. If they ask questions in ${language}, respond appropriately.`;
  }

  systemPrompt += `\n\n💡 IMPORTANT: Always be encouraging and supportive. Farming can be challenging, so provide hope and practical solutions. If recommending any chemicals or treatments, always mention safety precautions and environmental considerations.`;

  return systemPrompt;
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { threadId, content, role = "user" } = req.body;
    const userId = req.user._id;

    // Verify thread exists and belongs to user
    const thread = await Thread.findOne({ _id: threadId, userId });
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    // Create message
    const message = new Message({
      threadId,
      userId,
      role,
      content,
      status: "completed",
    });

    await message.save();

    // Update thread
    await thread.incrementMessageCount();

    // Populate user info
    await message.populate(
      "userId",
      "username profile.firstName profile.lastName"
    );

    logger.info(`Message sent in thread ${threadId} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        message,
      },
    });
  } catch (error) {
    logger.error(`Send message error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// Stream chat with AI
const streamChat = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { threadId, message: userMessage, model } = req.body;
    const userId = req.user._id;

    // Debug logging
    logger.info(
      `Stream chat request - threadId: ${threadId}, message: "${userMessage}", model: ${model}`
    );

    // Additional validation for userMessage
    if (!userMessage || userMessage.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be empty",
      });
    }

    // Verify thread exists and belongs to user
    const thread = await Thread.findOne({ _id: threadId, userId });
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    // Save user message
    const userMsg = new Message({
      threadId,
      userId,
      role: "user",
      content: userMessage,
      status: "completed",
    });
    await userMsg.save();

    // Populate user info for socket emission
    await userMsg.populate(
      "userId",
      "username profile.firstName profile.lastName"
    );

    // Emit user message to socket
    const io = req.app.get("io");
    if (io) {
      io.to(threadId).emit("new_message", {
        message: userMsg,
      });
    }

    // Check if this is the first user message and update thread title if needed
    const messageCount = await Message.countDocuments({
      threadId,
      role: "user",
    });
    if (
      messageCount === 1 &&
      (thread.title === "New Chat" || thread.title.startsWith("New Chat"))
    ) {
      try {
        // Generate a better title based on the user's first message
        const newTitle = await generateThreadTitle(userMessage);

        // Update the thread title
        thread.title = newTitle;
        await thread.save();

        // Emit thread update to socket for real-time UI update
        if (io) {
          io.to(threadId).emit("thread_updated", {
            threadId: threadId,
            title: newTitle,
          });
        }

        logger.info(`Thread title updated: ${threadId} -> "${newTitle}"`);
      } catch (error) {
        logger.error(`Failed to update thread title: ${error.message}`);
        // Continue with the chat even if title update fails
      }
    }

    // Get user profile data for personalized responses
    const User = require("../models/User");
    const user = await User.findById(userId).select('profile preferences username');

    // Get conversation history
    const conversationHistory = await Message.getConversationHistory(threadId);

    // Build personalized system prompt with user context
    const systemPrompt = buildPersonalizedSystemPrompt(user || {});

    // Log personalized context for debugging
    logger.info(`Personalized chat context for user ${userId}:`, {
      hasProfile: !!user?.profile,
      experience: user?.profile?.experience,
      location: user?.profile?.location,
      cropTypes: user?.profile?.cropTypes?.length || 0,
      language: user?.preferences?.language
    });

    // Prepare messages for AI
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Set response headers for streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Connection", "keep-alive");
    res.setHeader(
      "Access-Control-Allow-Origin",
      process.env.FRONTEND_URL || "http://localhost:5173"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Get AI model
    const aiModel = getModel(model);

    // Create assistant message placeholder
    const assistantMsg = new Message({
      threadId,
      userId,
      role: "assistant",
      content: "...", // Placeholder content to satisfy validation
      status: "processing",
      metadata: {
        model: model || "google/gemini-2.5-flash-lite",
      },
    });
    await assistantMsg.save();

    let fullResponse = "";
    const startTime = Date.now();

    try {
      logger.info(
        `Starting AI stream for thread ${threadId} with model ${model || "google/gemini-2.5-flash-lite"}`
      );

      // Stream response from AI with optimized settings
      const result = await streamText({
        model: aiModel,
        messages,
        temperature: 0.7,
        maxTokens: 2000,
        // Add performance optimizations
        stream: true,
        // Add timeout to prevent hanging requests
        abortSignal: AbortSignal.timeout(60000), // 60 second timeout
      });

      logger.info(`AI stream initialized successfully for thread ${threadId}`);

      // Process the stream with memory optimization
      let chunkCount = 0;
      const maxChunkSize = 1024; // Limit chunk size to prevent memory issues
      let buffer = "";

      try {
        for await (const delta of result.textStream) {
          // Check if response was aborted
          if (res.destroyed || res.closed) {
            logger.warn(`Response closed early for thread ${threadId}`);
            break;
          }

          chunkCount++;
          buffer += delta;

          // Send chunks in batches to optimize performance
          if (buffer.length >= maxChunkSize || delta.includes("\n")) {
            fullResponse += buffer;

            // Send chunk to client
            if (!res.headersSent && !res.destroyed) {
              res.write(buffer);
            }

            // Emit to socket if available (throttled)
            const io = req.app.get("io");
            if (io && chunkCount % 2 === 0) {
              // Emit every 2nd chunk to reduce socket load
              io.to(threadId).emit("message_chunk", {
                messageId: assistantMsg._id,
                chunk: buffer,
                isComplete: false,
              });
            }

            // Log first few chunks for debugging
            if (chunkCount <= 3) {
              logger.info(
                `Chunk ${chunkCount} for thread ${threadId}: "${buffer.substring(0, 50)}..."`
              );
            }

            buffer = ""; // Clear buffer to prevent memory buildup
          }
        }

        // Send any remaining buffer content
        if (buffer.length > 0) {
          fullResponse += buffer;
          if (!res.headersSent && !res.destroyed) {
            res.write(buffer);
          }

          const io = req.app.get("io");
          if (io) {
            io.to(threadId).emit("message_chunk", {
              messageId: assistantMsg._id,
              chunk: buffer,
              isComplete: false,
            });
          }
        }
      } catch (streamError) {
        logger.error(
          `Stream processing error for thread ${threadId}: ${streamError.message}`
        );
        throw streamError;
      }

      logger.info(
        `AI stream completed for thread ${threadId}, total response length: ${fullResponse.length}`
      );

      // Update assistant message with full response
      assistantMsg.content = fullResponse;
      assistantMsg.status = "completed";
      assistantMsg.metadata.processingTime = Date.now() - startTime;

      // Get usage info if available
      if (result.usage) {
        assistantMsg.metadata.tokens = {
          input: result.usage.promptTokens,
          output: result.usage.completionTokens,
          total: result.usage.totalTokens,
        };
      }

      await assistantMsg.save();

      // Update thread
      await thread.incrementMessageCount();

      // End the response
      res.end();

      // Emit completion to socket
      const io = req.app.get("io");
      if (io) {
        logger.info(`Emitting message_complete to thread ${threadId}`);
        io.to(threadId).emit("message_complete", {
          messageId: assistantMsg._id,
          message: assistantMsg,
        });
      }

      logger.info(`AI response generated for thread ${threadId}`);
    } catch (aiError) {
      logger.error(`AI streaming error: ${aiError.message}`);

      // Update message status to failed
      assistantMsg.status = "failed";
      assistantMsg.content =
        "Sorry, I encountered an error while processing your request. Please try again.";
      await assistantMsg.save();

      res.write(
        "\n\nSorry, I encountered an error while processing your request. Please try again."
      );
      res.end();
    }
  } catch (error) {
    logger.error(`Stream chat error: ${error.message}`);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to process chat request",
      });
    } else {
      res.end();
    }
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    // Verify thread exists and belongs to user
    const thread = await Thread.findOne({ _id: threadId, userId });
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    const skip = (page - 1) * limit;
    const messages = await Message.findByThread(threadId, limit, skip);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: thread.messageCount,
        },
      },
    });
  } catch (error) {
    logger.error(`Get chat history error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to get chat history",
    });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({ _id: messageId, userId });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    message.isVisible = false;
    await message.save();

    logger.info(`Message deleted: ${messageId} by user ${userId}`);

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    logger.error(`Delete message error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
};

// Edit message
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      userId,
      role: "user",
    });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or cannot be edited",
      });
    }

    await message.editContent(content);

    logger.info(`Message edited: ${messageId} by user ${userId}`);

    res.json({
      success: true,
      message: "Message edited successfully",
      data: { message },
    });
  } catch (error) {
    logger.error(`Edit message error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to edit message",
    });
  }
};

// Add reaction to message
const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { type } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await message.addReaction(userId, type);

    res.json({
      success: true,
      message: "Reaction added successfully",
    });
  } catch (error) {
    logger.error(`Add reaction error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to add reaction",
    });
  }
};

// Remove reaction from message
const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await message.removeReaction(userId);

    res.json({
      success: true,
      message: "Reaction removed successfully",
    });
  } catch (error) {
    logger.error(`Remove reaction error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to remove reaction",
    });
  }
};

// Transcribe audio using OpenAI Whisper
const transcribeAudio = async (req, res) => {
  try {
    // Check if audio file is provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No audio file provided"
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Create a File object from the buffer
    const audioFile = new File([req.file.buffer], 'audio.webm', {
      type: req.file.mimetype
    });

    logger.info(`Transcribing audio file: ${req.file.originalname}, size: ${req.file.size} bytes`);

    // Call Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      // Remove language parameter to enable auto-detection
      response_format: "verbose_json" // Get detailed response with language detection
    });

    logger.info(`Transcription completed. Detected language: ${transcription.language}`);

    res.json({
      success: true,
      transcription: transcription.text,
      language: transcription.language,
      duration: transcription.duration
    });

  } catch (error) {
    logger.error(`Transcription error: ${error.message}`);

    // Handle specific OpenAI API errors
    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: "Invalid audio file or format"
      });
    }

    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        message: "OpenAI API authentication failed"
      });
    }

    if (error.status === 413) {
      return res.status(400).json({
        success: false,
        message: "Audio file too large"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to transcribe audio"
    });
  }
};

module.exports = {
  sendMessage,
  streamChat,
  getChatHistory,
  deleteMessage,
  editMessage,
  addReaction,
  removeReaction,
  transcribeAudio,
};
