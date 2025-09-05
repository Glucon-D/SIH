import { Toaster } from "react-hot-toast";

// Import context providers
import { AppProvider } from "./context/AppContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";

function App({ children }) {
  return (
    <AppProvider>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <SocketProvider>
              <ChatProvider>
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "#363636",
                      color: "#fff",
                    },
                    success: {
                      duration: 3000,
                      theme: {
                        primary: "#10b981",
                        secondary: "#ffffff",
                      },
                    },
                    error: {
                      duration: 5000,
                      theme: {
                        primary: "#ef4444",
                        secondary: "#ffffff",
                      },
                    },
                  }}
                />
              </ChatProvider>
            </SocketProvider>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
