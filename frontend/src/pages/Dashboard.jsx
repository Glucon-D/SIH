import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  MessageCircle,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import ChatInterface from "../components/chat/ChatInterface";

const Dashboard = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const {
    threads,
    currentThread,
    loadThreads,
    createThread,
    selectThread,
    isLoading: chatLoading,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 animate-spin text-green-600" />
          <span className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  const handleCreateNewChat = async () => {
    const thread = await createThread({
      title: "New Chat",
      category: "general_query",
    });

    if (thread) {
      selectThread(thread);
    }
  };

  const filteredThreads = threads.filter((thread) => {
    const matchesSearch = thread.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || thread.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "archived":
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      pest_management: "Pest Management",
      disease_control: "Disease Control",
      fertilizer_advice: "Fertilizer Advice",
      weather_guidance: "Weather Guidance",
      crop_planning: "Crop Planning",
      market_information: "Market Information",
      government_schemes: "Government Schemes",
      general_query: "General Query",
      other: "Other",
    };
    return categories[category] || category;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back,{" "}
            {user?.profile?.firstName || user?.username || "Farmer"}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Ask questions, get expert advice, and manage your farming
            conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Thread List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Conversations
                  </h2>
                  <button
                    onClick={handleCreateNewChat}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors duration-200"
                    title="New conversation"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Thread List */}
              <div className="max-h-96 overflow-y-auto">
                {chatLoading ? (
                  <div className="p-4 text-center">
                    <Loader className="w-6 h-6 animate-spin text-green-600 mx-auto" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Loading conversations...
                    </p>
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-4 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {searchQuery || filterStatus !== "all"
                        ? "No conversations found"
                        : "No conversations yet"}
                    </p>
                    {!searchQuery && filterStatus === "all" && (
                      <button
                        onClick={handleCreateNewChat}
                        className="mt-2 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                      >
                        Start your first conversation
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredThreads.map((thread) => (
                      <div
                        key={thread._id}
                        onClick={() => selectThread(thread)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                          currentThread?._id === thread._id
                            ? "bg-green-50 dark:bg-green-900/20 border-r-2 border-green-500"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {thread.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {getCategoryLabel(thread.category)}
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              {getStatusIcon(thread.status)}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {thread.messageCount} messages
                              </span>
                            </div>
                          </div>
                          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Chat Interface */}
          <div className="lg:col-span-2">
            {currentThread ? (
              <ChatInterface />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-96 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Choose a conversation from the sidebar or start a new one.
                  </p>
                  <button
                    onClick={handleCreateNewChat}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Conversation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
