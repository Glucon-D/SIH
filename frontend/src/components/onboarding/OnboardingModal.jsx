import { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Loader,
  AlertCircle,
  CheckCircle,
  User,
  Sprout,
  Award,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { nudgesService } from "../../services/nudges";
import { authService } from "../../services/auth";
import ConfirmDialog from "../ui/ConfirmDialog";
import toast from "react-hot-toast";

const OnboardingModal = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1); // 1: location, 2: crops, 3: experience, 4: complete
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [customCrops, setCustomCrops] = useState([]);
  const [customCropInput, setCustomCropInput] = useState("");
  const [experience, setExperience] = useState("beginner");
  const [error, setError] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  const crops = nudgesService.getStaticCrops();
  const experienceLevels = [
    { id: "beginner", name: "Beginner", description: "New to farming", icon: "🌱" },
    { id: "intermediate", name: "Intermediate", description: "Some farming experience", icon: "🌿" },
    { id: "advanced", name: "Advanced", description: "Experienced farmer", icon: "🌳" },
  ];

  // Reset state when modal opens and auto-fetch location
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setLocation(null);
      setSelectedCrops([]);
      setCustomCrops([]);
      setCustomCropInput("");
      setExperience("beginner");
      setError("");
      // Automatically start location detection
      handleGetLocation();
    }
  }, [isOpen]);

  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    setError("");

    try {
      const coords = await nudgesService.getCurrentLocation();
      const locationString = await nudgesService.coordinatesToLocationString(
        coords.latitude,
        coords.longitude
      );
      setLocation({ coords, locationString });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleCropToggle = (cropId) => {
    setSelectedCrops(prev =>
      prev.includes(cropId)
        ? prev.filter(id => id !== cropId)
        : [...prev, cropId]
    );
  };

  const handleAddCustomCrop = () => {
    if (customCropInput.trim() && !customCrops.includes(customCropInput.trim())) {
      const newCrop = customCropInput.trim();
      setCustomCrops(prev => [...prev, newCrop]);
      setCustomCropInput("");
    }
  };

  const handleRemoveCustomCrop = (cropToRemove) => {
    setCustomCrops(prev => prev.filter(crop => crop !== cropToRemove));
  };

  const handleCustomCropKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomCrop();
    }
  };

  const handleNext = () => {
    if (step === 1 && !location) {
      setError("Please allow location access or wait for location detection");
      return;
    }
    if (step === 2 && selectedCrops.length === 0 && customCrops.length === 0) {
      setError("Please select at least one crop type");
      return;
    }
    
    setError("");
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError("");

    try {
      const allCrops = [...selectedCrops, ...customCrops];
      const profileData = {
        profile: {
          location: location.locationString,
          cropTypes: allCrops,
          experience: experience,
        }
      };

      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        setStep(4);
        toast.success("Profile setup completed!");
        setTimeout(() => {
          onComplete && onComplete();
          onClose();
        }, 2000);
      } else {
        throw new Error(response.message || "Failed to save profile");
      }
    } catch (err) {
      setError(err.message || "Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 4) {
      onClose();
    } else {
      // Show confirmation dialog if not completed
      setShowSkipDialog(true);
    }
  };

  const handleSkipConfirm = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Complete Your Profile
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Step {step} of 3 - Help us personalize your experience
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {step > stepNum ? <CheckCircle className="w-4 h-4" /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        step > stepNum ? "bg-green-600" : "bg-gray-200 dark:bg-gray-600"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Location */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    What's your location?
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    We'll use this to provide weather-based farming tips
                  </p>
                </div>

                {!location ? (
                  <div className="space-y-4">
                    {isLoadingLocation ? (
                      <div className="flex items-center space-x-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                        <Loader className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-blue-700 dark:text-blue-300">
                          Detecting your location...
                        </span>
                      </div>
                    ) : error ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-red-700 dark:text-red-300">
                            {error}
                          </span>
                        </div>
                        <button
                          onClick={handleGetLocation}
                          className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Retry location
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="text-blue-700 dark:text-blue-300">
                          Preparing location...
                        </span>
                      </div>
                    )}

                    {nudgesService.isLocationAccessDenied() && (
                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">
                            GPS access was denied. Using IP-based location.
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            nudgesService.resetLocationPreferences();
                            handleGetLocation();
                          }}
                          className="text-xs text-yellow-600 hover:text-yellow-800 underline"
                        >
                          Retry GPS
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 dark:text-green-300">
                          Location obtained ({location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)})
                        </span>
                      </div>
                      <button
                        onClick={() => setLocation(null)}
                        className="text-xs text-green-600 hover:text-green-800 underline"
                      >
                        Change
                      </button>
                    </div>

                    {location.coords.source && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        Source: {location.coords.source === "gps" ? "GPS" : "IP Address"}
                        {location.coords.accuracy && ` • Accuracy: ~${Math.round(location.coords.accuracy)}m`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Crop Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Sprout className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    What crops do you grow?
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Select all the crops you're currently growing or planning to grow
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {crops.map((crop) => (
                    <button
                      key={crop.id}
                      onClick={() => handleCropToggle(crop.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedCrops.includes(crop.id)
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                          : "border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-2">{crop.icon}</div>
                      <div className="text-sm font-medium">{crop.name}</div>
                      {selectedCrops.includes(crop.id) && (
                        <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-2" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Crop Input */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={customCropInput}
                      onChange={(e) => setCustomCropInput(e.target.value)}
                      onKeyDown={handleCustomCropKeyPress}
                      placeholder="Add custom crop (e.g., Mango, Sugarcane)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddCustomCrop}
                      disabled={!customCropInput.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Display Custom Crops */}
                  {customCrops.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Crops:</p>
                      <div className="flex flex-wrap gap-2">
                        {customCrops.map((crop, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm"
                          >
                            <span>{crop}</span>
                            <button
                              onClick={() => handleRemoveCustomCrop(crop)}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Selected: {selectedCrops.length + customCrops.length} crop{(selectedCrops.length + customCrops.length) !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Step 3: Experience Level */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Award className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    What's your farming experience?
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    This helps us provide tips appropriate for your skill level
                  </p>
                </div>

                <div className="space-y-3">
                  {experienceLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setExperience(level.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        experience === level.id
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 bg-white dark:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{level.icon}</div>
                        <div className="flex-1">
                          <div className={`font-medium ${
                            experience === level.id 
                              ? "text-green-700 dark:text-green-300" 
                              : "text-gray-900 dark:text-white"
                          }`}>
                            {level.name}
                          </div>
                          <div className={`text-sm ${
                            experience === level.id 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-gray-500 dark:text-gray-400"
                          }`}>
                            {level.description}
                          </div>
                        </div>
                        {experience === level.id && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {step === 4 && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Setup Complete!
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Your profile has been updated. You're all set to get personalized farming tips!
                </p>
              </div>
            )}

            {error && step < 4 && (
              <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 4 && (
              <div className="flex justify-between pt-6">
                <button
                  onClick={handleBack}
                  disabled={step === 1}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                {step === 3 ? (
                  <button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>{isLoading ? "Saving..." : "Complete Setup"}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skip Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showSkipDialog}
        onClose={() => setShowSkipDialog(false)}
        onConfirm={handleSkipConfirm}
        title="Skip Profile Setup?"
        message="Are you sure you want to skip the setup? You can complete it later in your profile settings, but having this information helps us provide better farming recommendations."
        confirmText="Skip Setup"
        cancelText="Continue Setup"
        type="warning"
      />
    </div>
  );
};

export default OnboardingModal;
