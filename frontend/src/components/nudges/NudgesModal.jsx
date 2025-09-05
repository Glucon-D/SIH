import { useState, useEffect } from 'react';
import { X, MapPin, Thermometer, Droplets, Cloud, Loader, AlertCircle, Lightbulb, Zap } from 'lucide-react';
import { nudgesService } from '../../services/nudges';

const NudgesModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('crop-selection'); // 'crop-selection', 'loading', 'results', 'error'
  const [selectedCrop, setSelectedCrop] = useState('');
  const [location, setLocation] = useState(null);
  const [nudgesData, setNudgesData] = useState(null);
  const [error, setError] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const crops = nudgesService.getStaticCrops();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('crop-selection');
      setSelectedCrop('');
      setLocation(null);
      setNudgesData(null);
      setError('');
    }
  }, [isOpen]);

  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    setError('');
    
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

  const handleGetNudges = async () => {
    if (!selectedCrop || !location) return;

    setStep('loading');
    setError('');

    try {
      const data = await nudgesService.getNudges(selectedCrop, location.locationString);
      setNudgesData(data);
      setStep('results');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get nudges. Please try again.');
      setStep('error');
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleTryAgain = () => {
    setStep('crop-selection');
    setError('');
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
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI Farming Nudges
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get personalized farming tips based on your location and weather
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
          <div className="p-6">
            {step === 'crop-selection' && (
              <div className="space-y-6">
                {/* Crop Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select your crop:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {crops.map((crop) => (
                      <button
                        key={crop.id}
                        onClick={() => setSelectedCrop(crop.id)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedCrop === crop.id
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{crop.icon}</div>
                        <div className="text-sm font-medium">{crop.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Location:
                  </label>
                  {!location ? (
                    <button
                      onClick={handleGetLocation}
                      disabled={isLoadingLocation}
                      className="flex items-center space-x-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                    >
                      {isLoadingLocation ? (
                        <Loader className="w-5 h-5 animate-spin text-blue-600" />
                      ) : (
                        <MapPin className="w-5 h-5 text-blue-600" />
                      )}
                      <span className="text-blue-700 dark:text-blue-300">
                        {isLoadingLocation ? 'Getting location...' : 'Get my location'}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 dark:text-green-300">
                        Location obtained ({location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)})
                      </span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 dark:text-red-300">{error}</span>
                  </div>
                )}

                {/* Get Nudges Button */}
                <button
                  onClick={handleGetNudges}
                  disabled={!selectedCrop || !location}
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  Get AI Farming Nudges
                </button>
              </div>
            )}

            {step === 'loading' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="w-12 h-12 animate-spin text-green-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Generating AI Nudges
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Analyzing weather conditions and generating personalized farming tips...
                </p>
              </div>
            )}

            {step === 'results' && nudgesData && (
              <div className="space-y-6">
                {/* Weather Info */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Cloud className="w-5 h-5 mr-2 text-blue-600" />
                    Current Weather
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <Thermometer className="w-6 h-6 text-red-500 mx-auto mb-1" />
                      <div className="text-sm text-gray-600 dark:text-gray-400">Temperature</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {nudgesData.weather.temperature}
                      </div>
                    </div>
                    <div className="text-center">
                      <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                      <div className="text-sm text-gray-600 dark:text-gray-400">Humidity</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {nudgesData.weather.humidity}
                      </div>
                    </div>
                    <div className="text-center">
                      <Cloud className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                      <div className="text-sm text-gray-600 dark:text-gray-400">Conditions</div>
                      <div className="font-semibold text-gray-900 dark:text-white capitalize">
                        {nudgesData.weather.conditions}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Nudges */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                    AI Farming Tips for {crops.find(c => c.id === selectedCrop)?.name}
                  </h3>
                  <div className="space-y-3">
                    {nudgesData.nudges.map((nudge, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {nudge}
                          </p>
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

            {step === 'error' && (
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
