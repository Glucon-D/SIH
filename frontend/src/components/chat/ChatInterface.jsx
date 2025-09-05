import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Send, Loader, User, Bot, Image, Paperclip } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { format } from "date-fns";

const ChatInterface = () => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const {
    currentThread,
    messages,
    sendMessage,
    isStreaming,
    isThinking,
    streamingMessage,
    loadMessages,
  } = useChat();
  const { user } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!message.trim() || isStreaming) return;

      const userMessage = message.trim();
      setMessage("");
      setIsTyping(true);

      try {
        await sendMessage(currentThread?._id, userMessage);
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsTyping(false);
      }
    },
    [message, isStreaming, sendMessage, currentThread?._id]
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  // Pre-written questions for new conversations
  const suggestedQuestions = [
    "What's the best time to plant tomatoes in my region?",
    "How can I identify and treat common crop diseases?",
    "What are the most effective organic pest control methods?",
    "How do I improve soil fertility naturally?",
    "What government schemes are available for farmers?",
    "How can I plan crop rotation for better yields?",
  ];

  const handleSuggestedQuestion = (question) => {
    setMessage(question);
    // Focus the textarea after setting the message
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const formatTime = (date) => {
    return format(new Date(date), "HH:mm");
  };

  const formatDate = (date) => {
    return format(new Date(date), "MMM dd, yyyy");
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === "user";
    const isAssistant = msg.role === "assistant";

    return (
      <div
        key={msg._id || index}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`flex max-w-xs lg:max-w-md ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {/* Avatar */}
          <div className={`flex-shrink-0 ${isUser ? "ml-2" : "mr-2"}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isUser ? "bg-green-600 text-white" : "bg-blue-600 text-white"
              }`}
            >
              {isUser ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* Message Content */}
          <div
            className={`px-4 py-2 rounded-lg ${
              isUser
                ? "bg-green-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
            }`}
          >
            <div className="text-sm break-words">
              {isUser ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}
            </div>
            <div
              className={`text-xs mt-1 ${
                isUser ? "text-green-100" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {formatTime(msg.createdOn)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!currentThread) {
    return (
      <div className="bg-white dark:bg-gray-800 h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Select a conversation to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {currentThread.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {currentThread.category
            ?.replace("_", " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back,{" "}
              {user?.profile?.firstName || user?.username || "Farmer"}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ask questions, get expert advice, and manage your farming
              conversations.
            </p>

            {/* Suggested Questions */}
            <div className="max-w-2xl mx-auto">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Try asking about:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="p-3 text-left text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 border border-gray-200 dark:border-gray-600"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => renderMessage(msg, index))}

            {/* Thinking Indicator */}
            {isThinking && !streamingMessage && (
              <div className="flex justify-start mb-4">
                <div className="flex max-w-xs lg:max-w-md">
                  <div className="flex-shrink-0 mr-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
                    <div className="text-sm flex items-center space-x-2">
                      <span>Krishi Officer is thinking</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" />
                        <div
                          className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Streaming Message */}
            {isStreaming && streamingMessage && (
              <div className="flex justify-start mb-4">
                <div className="flex max-w-xs lg:max-w-md">
                  <div className="flex-shrink-0 mr-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
                    <div className="text-sm break-words">
                      <MarkdownRenderer content={streamingMessage} />
                      <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && !isStreaming && (
              <div className="flex justify-start mb-4">
                <div className="flex max-w-xs lg:max-w-md">
                  <div className="flex-shrink-0 mr-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          {/* File Upload Button */}
          <button
            type="button"
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Image Upload Button */}
          <button
            type="button"
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            title="Upload image"
          >
            <Image className="w-5 h-5" />
          </button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about farming, pests, weather, or anything agricultural..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none min-h-[40px] max-h-32"
              rows={1}
              disabled={isStreaming}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || isStreaming}
            className="flex-shrink-0 p-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isStreaming ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        {/* Helper Text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default memo(ChatInterface);
