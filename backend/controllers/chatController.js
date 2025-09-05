const { validationResult } = require("express-validator");
const { streamText } = require("ai");
const { getModel } = require("../config/openrouter");
const { generateThreadTitle } = require("../config/aiConfig");
const Message = require("../models/Message");
const Thread = require("../models/Thread");
const logger = require("../utils/logger");

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

    // Get conversation history
    const conversationHistory = await Message.getConversationHistory(threadId);

    // Prepare messages for AI
    const messages = [
      {
        role: "system",
        content: `You are a Digital Krishi Officer, an AI-powered agricultural advisory assistant. You help farmers with:
        - Pest and disease management
        - Weather-related decisions
        - Input optimization (fertilizers, pesticides)
        - Government subsidies and schemes
        - Market trends and pricing
        - Crop planning and seasonal guidance
        
        Provide helpful, accurate, and practical advice. Be concise but thorough. If you're unsure about something, recommend consulting with local agricultural experts.`,
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

module.exports = {
  sendMessage,
  streamChat,
  getChatHistory,
  deleteMessage,
  editMessage,
  addReaction,
  removeReaction,
};
