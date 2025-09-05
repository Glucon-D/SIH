import { useState, useRef, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Archive,
  RotateCcw,
  X,
  Save,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import ChatInterface from "../components/chat/ChatInterface";

const Dashboard = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const {
    threads,
    currentThread,
    createThread,
    selectThread,
    updateThread,
    deleteThread,
    loadThreads,
    pagination,
    messageCache,
    isLoading: chatLoading,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modal and dropdown states
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Thread action handlers
  const handleEditThread = (thread) => {
    setSelectedThread(thread);
    setEditTitle(thread.title);
    setEditCategory(thread.category);
    setEditStatus(thread.status);
    setEditPriority(thread.priority);
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const handleDeleteThread = (thread) => {
    setSelectedThread(thread);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  const handleArchiveThread = async (thread) => {
    await updateThread(thread._id, { status: "archived" });
    setActiveDropdown(null);
  };

  const handleUnarchiveThread = async (thread) => {
    await updateThread(thread._id, { status: "active" });
    setActiveDropdown(null);
  };

  const handleMarkResolved = async (thread) => {
    await updateThread(thread._id, { status: "resolved" });
    setActiveDropdown(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedThread) return;

    const updateData = {
      title: editTitle,
      category: editCategory,
      status: editStatus,
      priority: editPriority,
    };

    const updatedThread = await updateThread(selectedThread._id, updateData);
    if (updatedThread) {
      setShowEditModal(false);
      setSelectedThread(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedThread) return;

    await deleteThread(selectedThread._id);
    setShowDeleteModal(false);
    setSelectedThread(null);

    // If the deleted thread was the current thread, clear it
    if (currentThread?._id === selectedThread._id) {
      // The context will handle clearing the current thread
    }
  };

  const toggleDropdown = (threadId, event) => {
    event.stopPropagation();
    setActiveDropdown(activeDropdown === threadId ? null : threadId);
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
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-16" : "w-80"
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conversations
            </h2>
          )}
          <div className="flex items-center space-x-2">
            {!sidebarCollapsed && (
              <button
                onClick={handleCreateNewChat}
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors duration-200"
                title="New conversation"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Search and Filter - Only show when sidebar is expanded */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
        )}

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {chatLoading ? (
            <div className="p-4 text-center">
              <Loader className="w-6 h-6 animate-spin text-green-600 mx-auto" />
              {!sidebarCollapsed && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Loading conversations...
                </p>
              )}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-4 text-center">
              {!sidebarCollapsed && (
                <>
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
                </>
              )}
              {sidebarCollapsed && (
                <button
                  onClick={handleCreateNewChat}
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors duration-200"
                  title="New conversation"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredThreads.map((thread) => (
                <div
                  key={thread._id}
                  onClick={() => selectThread(thread)}
                  className={`${
                    sidebarCollapsed ? "p-2" : "p-4"
                  } cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                    currentThread?._id === thread._id
                      ? "bg-green-50 dark:bg-green-900/20 border-r-2 border-green-500"
                      : ""
                  }`}
                  title={sidebarCollapsed ? thread.title : ""}
                >
                  {sidebarCollapsed ? (
                    <div className="flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-gray-500" />
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {thread.title}
                          </h3>
                          {messageCache[thread._id] && (
                            <div
                              className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"
                              title="Messages cached for faster loading"
                            />
                          )}
                        </div>
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
                      <div
                        className="relative"
                        ref={activeDropdown === thread._id ? dropdownRef : null}
                      >
                        <button
                          onClick={(e) => toggleDropdown(thread._id, e)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdown === thread._id && (
                          <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                            <button
                              onClick={() => handleEditThread(thread)}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit Title
                            </button>

                            {thread.status === "active" && (
                              <button
                                onClick={() => handleMarkResolved(thread)}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark as Resolved
                              </button>
                            )}

                            {thread.status !== "archived" ? (
                              <button
                                onClick={() => handleArchiveThread(thread)}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnarchiveThread(thread)}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Unarchive
                              </button>
                            )}

                            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                            <button
                              onClick={() => handleDeleteThread(thread)}
                              className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Load More Button */}
              {!chatLoading && pagination && pagination.page < pagination.pages && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => loadThreads({ page: pagination.page + 1, append: true })}
                    className="w-full px-4 py-2 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  >
                    Load More ({pagination.total - (pagination.page * pagination.limit)} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Chat Interface */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentThread ? (
          <ChatInterface />
        ) : (
          <div className="flex-1 bg-white dark:bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Start a New Conversation
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Click the button below to begin chatting with Krishi Officer.
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

      {/* Edit Thread Modal */}
      {showEditModal && selectedThread && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowEditModal(false)}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Edit Thread
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Update thread details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter thread title"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="pest_management">Pest Management</option>
                    <option value="disease_control">Disease Control</option>
                    <option value="fertilizer_advice">Fertilizer Advice</option>
                    <option value="weather_guidance">Weather Guidance</option>
                    <option value="crop_planning">Crop Planning</option>
                    <option value="market_information">
                      Market Information
                    </option>
                    <option value="government_schemes">
                      Government Schemes
                    </option>
                    <option value="general_query">General Query</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedThread && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDeleteModal(false)}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Delete Thread
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete the thread "
                  {selectedThread.title}"? This will permanently remove the
                  thread and all its messages.
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Thread
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
