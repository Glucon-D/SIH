import { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Thermometer,
  Droplets,
  Cloud,
  Loader,
  AlertCircle,
  Lightbulb,
  Zap,
  Settings,
  User,
  CheckCircle,
} from "lucide-react";
import { nudgesService } from "../../services/nudges";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import MarkdownRenderer from "../chat/MarkdownRenderer";

const NudgesModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState("crop-selection"); // 'crop-selection', 'loading', 'results', 'error'
  const [selectedCrop, setSelectedCrop] = useState("");
  const [customCrop, setCustomCrop] = useState("");
  const [isCustomCrop, setIsCustomCrop] = useState(false);
  const [location, setLocation] = useState(null);
  const [nudgesData, setNudgesData] = useState(null);
  const [error, setError] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const crops = nudgesService.getStaticCrops();

  // Get user's crops from profile
  const userCrops = user?.profile?.cropTypes || [];
  const hasUserCrops = userCrops.length > 0;

  // Reset state when modal opens and handle location
  useEffect(() => {
    if (isOpen) {
      setStep("crop-selection");
      setSelectedCrop("");
      setCustomCrop("");
      setIsCustomCrop(false);
      setLocation(null);
      setNudgesData(null);
      setError("");

      // Auto-select crop if user has only one crop
      if (userCrops.length === 1) {
        const userCrop = userCrops[0];
        const predefinedCrop = crops.find(c => c.name.toLowerCase() === userCrop.toLowerCase());

        if (predefinedCrop) {
          setSelectedCrop(predefinedCrop.id);
        } else {
          // It's a custom crop
          setIsCustomCrop(true);
          setCustomCrop(userCrop);
        }
      }

      // Check if user has stored location
      if (user?.profile?.location) {
        // Use stored location
        setLocation({
          locationString: user.profile.location,
          coords: { source: 'stored' }
        });

        // If user has only one crop and location, skip to results
        if (userCrops.length === 1) {
          // Small delay to ensure state is set
          setTimeout(() => {
            handleGetNudges();
          }, 100);
        }
      } else {
        // No stored location, automatically start location detection
        handleGetLocation();
      }
    }
  }, [isOpen, user]);

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

  const handleUseStoredLocation = () => {
    if (user?.profile?.location) {
      setLocation({
        locationString: user.profile.location,
        coords: { source: 'stored' }
      });
      setError("");
    }
  };

  const handleCropSelect = (cropId) => {
    setSelectedCrop(cropId);
    setIsCustomCrop(false);
    setCustomCrop("");
  };

  const handleCustomCropSelect = () => {
    setIsCustomCrop(true);
    setSelectedCrop("");
  };

  const getCurrentCrop = () => {
    return isCustomCrop ? customCrop : selectedCrop;
  };

  const handleGetNudges = async () => {
    const currentCrop = getCurrentCrop();
    if (!currentCrop || !location) return;

    setStep("loading");
    setError("");

    try {
      const data = await nudgesService.getNudges(
        currentCrop,
        location.locationString,
        currentLanguage
      );
      setNudgesData(data);
      setStep("results");
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to get nudges. Please try again."
      );
      setStep("error");
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleTryAgain = () => {
    setStep("crop-selection");
    setError("");
    setNudgesData(null);
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
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-600 to-green-700 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI Farming Nudges
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get personalized farming tips based on your location and
                  weather
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

          {/* Content */}
          <div className="p-4">
            {step === "crop-selection" && (
              <div className="space-y-4">
                {/* Crop Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {hasUserCrops
                      ? "Select from your crops or choose another:"
                      : "Select your crop:"
                    }
                  </label>

                  {/* User's Crops Section */}
                  {hasUserCrops && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2 flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        Your Crops
                      </h4>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-3">
                        {userCrops.map((userCrop, index) => {
                          const predefinedCrop = crops.find(c => c.name.toLowerCase() === userCrop.toLowerCase());
                          const isSelected = predefinedCrop
                            ? selectedCrop === predefinedCrop.id && !isCustomCrop
                            : isCustomCrop && customCrop === userCrop;

                          return (
                            <button
                              key={`user-${index}`}
                              onClick={() => {
                                if (predefinedCrop) {
                                  handleCropSelect(predefinedCrop.id);
                                } else {
                                  setIsCustomCrop(true);
                                  setSelectedCrop("");
                                  setCustomCrop(userCrop);
                                }
                              }}
                              className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                                isSelected
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                  : "border-green-200 dark:border-green-600 hover:border-green-300 dark:hover:border-green-500 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300"
                              }`}
                            >
                              <div className="text-lg mb-1">
                                {predefinedCrop ? predefinedCrop.icon : "🌱"}
                              </div>
                              <div className="text-xs font-medium truncate">{userCrop}</div>
                              {isSelected && (
                                <CheckCircle className="w-3 h-3 text-green-600 mx-auto mt-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Other Crops
                        </h4>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {crops.map((crop) => (
                      <button
                        key={crop.id}
                        onClick={() => handleCropSelect(crop.id)}
                        className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                          selectedCrop === crop.id && !isCustomCrop
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : "border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <div className="text-lg mb-1">{crop.icon}</div>
                        <div className="text-xs font-medium truncate">{crop.name}</div>
                        {selectedCrop === crop.id && !isCustomCrop && (
                          <CheckCircle className="w-3 h-3 text-green-600 mx-auto mt-1" />
                        )}
                      </button>
                    ))}

                    {/* Custom Crop Option */}
                    <button
                      onClick={handleCustomCropSelect}
                      className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                        isCustomCrop
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                          : "border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div className="text-lg mb-1">🌱</div>
                      <div className="text-xs font-medium">Other</div>
                      {isCustomCrop && (
                        <CheckCircle className="w-3 h-3 text-green-600 mx-auto mt-1" />
                      )}
                    </button>
                  </div>

                  {/* Custom Crop Input */}
                  {isCustomCrop && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={customCrop}
                        onChange={(e) => setCustomCrop(e.target.value)}
                        placeholder="Enter crop name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location:
                  </label>
                  {!location ? (
                    <div className="space-y-3">
                      {/* Show stored location option if available */}
                      {user?.profile?.location && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Settings className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700 dark:text-green-300">
                                Use saved location: {user.profile.location}
                              </span>
                            </div>
                            <button
                              onClick={handleUseStoredLocation}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Use This
                            </button>
                          </div>
                        </div>
                      )}

                      {isLoadingLocation ? (
                        <div className="flex items-center space-x-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                          <Loader className="w-5 h-5 animate-spin text-green-600" />
                          <span className="text-green-700 dark:text-green-300">
                            Detecting your current location...
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
                          <div className="flex space-x-2">
                            <button
                              onClick={handleGetLocation}
                              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Retry location
                            </button>
                            {user?.profile?.location && (
                              <button
                                onClick={handleUseStoredLocation}
                                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                              >
                                Use Saved Location
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                            <MapPin className="w-5 h-5 text-green-600" />
                            <span className="text-green-700 dark:text-green-300">
                              Preparing location...
                            </span>
                          </div>
                          {user?.profile?.location && (
                            <button
                              onClick={handleUseStoredLocation}
                              className="w-full px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                              Or use saved location: {user.profile.location}
                            </button>
                          )}
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
                            {location.coords.source === 'stored' ? (
                              `Using saved location: ${location.locationString}`
                            ) : (
                              `Location obtained (${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)})`
                            )}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {location.coords.source === 'stored' && (
                            <button
                              onClick={handleGetLocation}
                              className="text-xs text-green-600 hover:text-green-800 underline"
                            >
                              Use Current
                            </button>
                          )}
                          <button
                            onClick={() => setLocation(null)}
                            className="text-xs text-green-600 hover:text-green-800 underline"
                          >
                            Change
                          </button>
                        </div>
                      </div>

                      {location.coords.source && location.coords.source !== 'stored' && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                          Source:{" "}
                          {location.coords.source === "gps"
                            ? "GPS"
                            : "IP Address"}
                          {location.coords.accuracy &&
                            ` • Accuracy: ~${Math.round(
                              location.coords.accuracy
                            )}m`}
                        </div>
                      )}

                      {location.coords.source === 'stored' && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                          Source: Saved in profile
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 dark:text-red-300">
                      {error}
                    </span>
                  </div>
                )}

                {/* Get Nudges Button */}
                <button
                  onClick={handleGetNudges}
                  disabled={!getCurrentCrop() || !location}
                  className="w-full py-2 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  Get AI Farming Nudges
                </button>
              </div>
            )}

            {step === "loading" && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="w-12 h-12 animate-spin text-green-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Generating AI Nudges
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Analyzing weather conditions and generating personalized
                  farming tips...
                </p>
              </div>
            )}

            {step === "results" && nudgesData && (
              <div className="space-y-6">
                {/* Weather Info */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 border border-green-200 dark:border-green-700">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Cloud className="w-4 h-4 mr-2 text-green-600" />
                    Current Weather
                  </h3>
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-5 h-5 text-red-500" />
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Temperature</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {nudgesData.weather.temperature}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Droplets className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Humidity</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {nudgesData.weather.humidity}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Cloud className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Conditions</div>
                        <div className="font-semibold text-gray-900 dark:text-white capitalize">
                          {nudgesData.weather.conditions}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Nudges */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-green-600" />
                      AI Farming Tips for{" "}
                      {isCustomCrop ? customCrop : crops.find((c) => c.id === selectedCrop)?.name}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setStep("crop-selection")}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        Change Crop
                      </button>
                      <button
                        onClick={() => setLocation(null)}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        Change Location
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {nudgesData.nudges.map((nudge, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            <MarkdownRenderer content={nudge} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleTryAgain}
                    className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {step === "error" && (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                  {error}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleTryAgain}
                    className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
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

export default NudgesModal;
