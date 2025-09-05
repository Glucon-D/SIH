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
        console.error("Geolocation not supported");
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      console.log("Geolocation is supported, requesting position...");

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
            resolve({ latitude, longitude });
          },
          (error) => {
            console.error(`Geolocation attempt ${attemptNumber} failed:`, {
              code: error.code,
              message: error.message,
              PERMISSION_DENIED: error.PERMISSION_DENIED,
              POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
              TIMEOUT: error.TIMEOUT,
            });

            // If first attempt fails and it's not a permission issue, try with different settings
            if (attemptNumber === 1 && error.code !== error.PERMISSION_DENIED) {
              console.log("Trying fallback geolocation settings...");
              attemptGeolocation(
                {
                  enableHighAccuracy: true,
                  timeout: 60000,
                  maximumAge: 0,
                },
                2
              );
              return;
            }

            // If second attempt also fails, try IP-based location as last resort
            if (error.code === error.POSITION_UNAVAILABLE) {
              console.log("GPS failed, trying IP-based location...");
              nudgesService
                .getLocationFromIP()
                .then(resolve)
                .catch((ipError) => {
                  console.error("IP-based location also failed:", ipError);
                  reject(
                    new Error(
                      `Location services are unavailable (Code: ${error.code}). Please enable location services in macOS Settings → Privacy & Security → Location Services, or try again later.`
                    )
                  );
                });
              return;
            }

            // For other errors, give up immediately
            let errorMessage = "Unable to retrieve location";

            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = `Location access denied (Code: ${error.code}). Please allow location access in your browser settings and try again.`;
                break;
              case error.TIMEOUT:
                errorMessage = `Location request timed out (Code: ${error.code}). Please try again.`;
                break;
              default:
                errorMessage = `Location access failed (Code: ${error.code}). Error: ${error.message}`;
            }

            reject(new Error(errorMessage));
          },
          options
        );
      };

      // Start with permissive settings
      attemptGeolocation({
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 900000,
      });
    });
  },

  // Fallback method to get location from IP address
  getLocationFromIP: async () => {
    try {
      console.log("Attempting IP-based location...");
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();

      if (data.latitude && data.longitude) {
        console.log("IP-based location success:", data);
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city,
          region: data.region,
          country: data.country_name,
        };
      } else {
        throw new Error("No location data from IP service");
      }
    } catch (error) {
      console.error("IP-based location failed:", error);
      throw new Error("Unable to determine location from IP address");
    }
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
