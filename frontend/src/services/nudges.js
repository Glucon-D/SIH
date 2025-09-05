import { apiService } from "./api";

export const nudgesService = {
  // Get AI-generated nudges based on crop and location
  getNudges: async (crop, location) => {
    try {
      console.log("🚀 Making nudges API request with:", { crop, location });

      const response = await apiService.get("/nudges", {
        params: {
          crop,
          location,
        },
      });

      console.log("✅ Nudges API Response Status:", response.status);
      console.log("✅ Nudges API Response Headers:", response.headers);
      console.log("✅ Nudges API Response Data:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching nudges:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      console.error("❌ Error headers:", error.response?.headers);
      throw error;
    }
  },

  // Get user's current location using browser geolocation API
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      console.log("Starting geolocation request...");

      if (!navigator.geolocation) {
        console.error("Geolocation not supported, falling back to IP location");
        nudgesService.getLocationFromIP().then(resolve).catch(reject);
        return;
      }

      console.log("Geolocation is supported, requesting position...");

      // Check if user previously denied location access
      const locationDenied = localStorage.getItem('location_access_denied');
      if (locationDenied === 'true') {
        console.log("Location access previously denied, using IP location");
        nudgesService.getLocationFromIP().then(resolve).catch(reject);
        return;
      }

      // Fallback to IP-based location
      const fallbackToIP = (reason) => {
        console.log(`Falling back to IP location: ${reason}`);
        nudgesService
          .getLocationFromIP()
          .then((ipLocation) => {
            console.log("IP-based location successful:", ipLocation);
            resolve(ipLocation);
          })
          .catch((ipError) => {
            console.error("IP-based location also failed:", ipError);
            reject(
              new Error(
                `Location services are unavailable. ${reason}. Please enable location services or try again later.`
              )
            );
          });
      };

      // First attempt with permissive settings
      const attemptGeolocation = (options, attemptNumber = 1) => {
        console.log(
          `Geolocation attempt ${attemptNumber} with options:`,
          options
        );

        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("Geolocation success:", position);
            const { latitude, longitude } = position.coords;
            // Clear any previous denial flag on success
            localStorage.removeItem('location_access_denied');
            resolve({
              latitude,
              longitude,
              accuracy: position.coords.accuracy,
              source: 'gps'
            });
          },
          (error) => {
            console.error(`Geolocation attempt ${attemptNumber} failed:`, {
              code: error.code,
              message: error.message,
              PERMISSION_DENIED: error.PERMISSION_DENIED,
              POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
              TIMEOUT: error.TIMEOUT,
            });

            // Handle permission denied - remember this choice
            if (error.code === error.PERMISSION_DENIED) {
              localStorage.setItem('location_access_denied', 'true');
              fallbackToIP("Location access denied by user");
              return;
            }

            // If first attempt fails with non-permission error, try with different settings
            if (attemptNumber === 1) {
              console.log("Trying fallback geolocation settings...");
              attemptGeolocation(
                {
                  enableHighAccuracy: false, // Less accurate but faster
                  timeout: 45000,
                  maximumAge: 300000, // 5 minutes
                },
                2
              );
              return;
            }

            // Second attempt failed - fall back to IP location for any error
            const errorMessages = {
              [error.POSITION_UNAVAILABLE]: "GPS position unavailable",
              [error.TIMEOUT]: "Location request timed out",
            };

            const reason = errorMessages[error.code] || `Location error (Code: ${error.code})`;
            fallbackToIP(reason);
          },
          options
        );
      };

      // Start with permissive settings
      attemptGeolocation({
        enableHighAccuracy: false,
        timeout: 20000, // Reduced timeout for faster fallback
        maximumAge: 600000, // 10 minutes
      });
    });
  },

  // Fallback method to get location from IP address
  getLocationFromIP: async () => {
    try {
      console.log("Attempting IP-based location...");

      // Try multiple IP geolocation services for better reliability
      const services = [
        { url: "https://ipapi.co/json/", name: "ipapi.co" },
        { url: "https://ip-api.com/json/", name: "ip-api.com" },
      ];

      for (const service of services) {
        try {
          console.log(`Trying ${service.name}...`);
          const response = await fetch(service.url, { timeout: 10000 });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();

          // Handle different response formats
          const latitude = data.latitude || data.lat;
          const longitude = data.longitude || data.lon;

          if (latitude && longitude) {
            console.log(`IP-based location success via ${service.name}:`, data);
            return {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              city: data.city,
              region: data.region || data.regionName,
              country: data.country_name || data.country,
              source: 'ip',
              accuracy: 50000, // IP-based location is less accurate
              provider: service.name
            };
          }
        } catch (serviceError) {
          console.warn(`${service.name} failed:`, serviceError.message);
          continue; // Try next service
        }
      }

      throw new Error("All IP geolocation services failed");
    } catch (error) {
      console.error("IP-based location failed:", error);
      throw new Error("Unable to determine location from IP address");
    }
  },

  // Reset location preferences (allow user to retry GPS)
  resetLocationPreferences: () => {
    localStorage.removeItem('location_access_denied');
    console.log("Location preferences reset - GPS will be attempted again");
  },

  // Check if location access was previously denied
  isLocationAccessDenied: () => {
    return localStorage.getItem('location_access_denied') === 'true';
  },

  // Convert coordinates to location string for API
  coordinatesToLocationString: async (latitude, longitude) => {
    try {
      // For now, we'll use coordinates directly as OpenWeatherMap supports this format
      // Format: "lat,lon" which OpenWeatherMap API accepts
      return `${latitude},${longitude}`;
    } catch (error) {
      console.error("Error converting coordinates:", error);
      return `${latitude},${longitude}`;
    }
  },

  // Static crop options (will be replaced with user profile data later)
  getStaticCrops: () => {
    return [
      { id: "potato", name: "Potato", icon: "🥔" },
      { id: "onion", name: "Onion", icon: "🧅" },
      { id: "tomato", name: "Tomato", icon: "🍅" },
      { id: "rice", name: "Rice", icon: "🌾" },
      { id: "wheat", name: "Wheat", icon: "🌾" },
      { id: "corn", name: "Corn", icon: "🌽" },
      { id: "carrot", name: "Carrot", icon: "🥕" },
      { id: "cabbage", name: "Cabbage", icon: "🥬" },
      { id: "spinach", name: "Spinach", icon: "🥬" },
      { id: "chili", name: "Chili", icon: "🌶️" },
    ];
  },
};

export default nudgesService;
