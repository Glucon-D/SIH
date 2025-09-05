import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  User,
  Mail,
  MapPin,
  Sprout,
  Calendar,
  Settings,
  Save,
  X,
  Edit3,
  Bell,
  Globe,
  Shield,
  Loader,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { authService } from "../services/auth";
import toast from "react-hot-toast";

const Profile = () => {
  const { isAuthenticated, isLoading, user, updateUser } = useAuth();
  const { setLoading } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    profile: {
      firstName: "",
      lastName: "",
      location: "",
      farmSize: "",
      cropTypes: [],
      experience: "beginner",
    },
    preferences: {
      language: "en",
      notifications: {
        email: true,
        push: true,
      },
    },
  });

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        profile: {
          firstName: user.profile?.firstName || "",
          lastName: user.profile?.lastName || "",
          location: user.profile?.location || "",
          farmSize: user.profile?.farmSize || "",
          cropTypes: user.profile?.cropTypes || [],
          experience: user.profile?.experience || "beginner",
        },
        preferences: {
          language: user.preferences?.language || "en",
          notifications: {
            email: user.preferences?.notifications?.email ?? true,
            push: user.preferences?.notifications?.push ?? true,
          },
        },
      });
    }
  }, [user]);

  const handleInputChange = (section, field, value) => {
    if (section === "profile" || section === "preferences") {
      if (field.includes(".")) {
        const [parentField, childField] = field.split(".");
        setFormData((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [parentField]: {
              ...prev[section][parentField],
              [childField]: value,
            },
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleCropTypesChange = (value) => {
    const cropTypes = value
      .split(",")
      .map((crop) => crop.trim())
      .filter(Boolean);
    handleInputChange("profile", "cropTypes", cropTypes);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await authService.updateProfile(formData);

      if (response.success) {
        updateUser(response.data.user);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        username: user.username || "",
        profile: {
          firstName: user.profile?.firstName || "",
          lastName: user.profile?.lastName || "",
          location: user.profile?.location || "",
          farmSize: user.profile?.farmSize || "",
          cropTypes: user.profile?.cropTypes || [],
          experience: user.profile?.experience || "beginner",
        },
        preferences: {
          language: user.preferences?.language || "en",
          notifications: {
            email: user.preferences?.notifications?.email ?? true,
            push: user.preferences?.notifications?.push ?? true,
          },
        },
      });
    }
    setIsEditing(false);
  };

  const getUserInitials = () => {
    const firstName = user?.profile?.firstName || "";
    const lastName = user?.profile?.lastName || "";
    const username = user?.username || "";

    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (username) {
      return username.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    const firstName = user?.profile?.firstName || "";
    const lastName = user?.profile?.lastName || "";

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    }
    return user?.username || "User";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 animate-spin text-green-600" />
          <span className="text-gray-600 dark:text-gray-400">
            Loading profile...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                {/* User Avatar */}
                <div className="flex items-center justify-center w-20 h-20 rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white font-bold text-2xl shadow-lg">
                  {getUserInitials()}
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getDisplayName()}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                    <Mail className="w-4 h-4 mr-2" />
                    {user?.email}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Member since{" "}
                    {new Date(user?.createdOn).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              <div className="flex space-x-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
                    >
                      {isSaving ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <User className="w-5 h-5 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </h2>
              </div>

              <div className="space-y-4">
                {/* Username - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                  />
                </div>

                {/* Email - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                  />
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.profile.firstName}
                    onChange={(e) =>
                      handleInputChange("profile", "firstName", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:dark:bg-gray-700 disabled:cursor-not-allowed"
                    placeholder="Enter your first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.profile.lastName}
                    onChange={(e) =>
                      handleInputChange("profile", "lastName", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:dark:bg-gray-700 disabled:cursor-not-allowed"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Farm Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <Sprout className="w-5 h-5 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Farm Information
                </h2>
              </div>

              <div className="space-y-4">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.profile.location}
                    onChange={(e) =>
                      handleInputChange("profile", "location", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:dark:bg-gray-700 disabled:cursor-not-allowed"
                    placeholder="Enter your farm location"
                  />
                </div>

                {/* Farm Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Farm Size
                  </label>
                  <input
                    type="text"
                    value={formData.profile.farmSize}
                    onChange={(e) =>
                      handleInputChange("profile", "farmSize", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:dark:bg-gray-700 disabled:cursor-not-allowed"
                    placeholder="e.g., 5 acres, 2 hectares"
                  />
                </div>

                {/* Crop Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Crop Types
                  </label>
                  <input
                    type="text"
                    value={formData.profile.cropTypes.join(", ")}
                    onChange={(e) => handleCropTypesChange(e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:dark:bg-gray-700 disabled:cursor-not-allowed"
                    placeholder="e.g., Rice, Wheat, Corn (comma separated)"
                  />
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={formData.profile.experience}
                    onChange={(e) =>
                      handleInputChange("profile", "experience", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:dark:bg-gray-700 disabled:cursor-not-allowed"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <Settings className="w-5 h-5 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Preferences
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Language
                  </label>
                  <select
                    value={formData.preferences.language}
                    onChange={(e) =>
                      handleInputChange(
                        "preferences",
                        "language",
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:dark:bg-gray-700 disabled:cursor-not-allowed"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="ml">Malayalam</option>
                  </select>
                </div>

                {/* Notifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Bell className="w-4 h-4 inline mr-1" />
                    Notifications
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferences.notifications.email}
                        onChange={(e) =>
                          handleInputChange(
                            "preferences",
                            "notifications.email",
                            e.target.checked
                          )
                        }
                        disabled={!isEditing}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:cursor-not-allowed"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Email notifications
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferences.notifications.push}
                        onChange={(e) =>
                          handleInputChange(
                            "preferences",
                            "notifications.push",
                            e.target.checked
                          )
                        }
                        disabled={!isEditing}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:cursor-not-allowed"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Push notifications
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
