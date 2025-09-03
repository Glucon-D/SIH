# Project File Structure & Tech Stack

## AI-Based Farmer Query Support and Advisory System

### Tech Stack Overview

#### Frontend Technologies

- **React.js 18+**: Modern React with hooks and functional components
- **Tailwind CSS v4**: Utility-first CSS framework for rapid UI development
- **React Icons**: Comprehensive icon library
- **React Router DOM**: Client-side routing
- **Axios**: HTTP client for API communication
- **React Hook Form**: Form handling and validation
- **React Context API**: Global state management for user auth, theme, and app state
- **Framer Motion**: Animation library
- **React Hot Toast**: Toast notifications
- **Lucide React**: Additional modern icons

#### Backend Technologies

- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: MongoDB object modeling
- **OpenRouter**: LLM integration service
- **Nodemon**: Development server auto-restart
- **bcryptjs**: Password hashing and encryption
- **jsonwebtoken**: JWT authentication
- **cors**: Cross-origin resource sharing
- **multer**: File upload handling
- **helmet**: Security middleware
- **express-rate-limit**: API rate limiting
- **dotenv**: Environment variable management

#### Additional Services & Tools

- **Cloudinary**: Image storage and processing
- **Socket.io**: Real-time communication
- **Winston**: Logging library
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Project File Structure

```
SIH/
├── README.md
├── idea.md
├── fileStructure.md
├── .gitignore
├── docker-compose.yml (optional)
│
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── index.html
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── manifest.json
│   │   └── robots.txt
│   │
│   └── src/
│       ├── main.jsx          # Entry point with routing configuration
│       ├── App.jsx           # Main app component with context providers
│       ├── index.css
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   ├── Footer.jsx
│       │   │   ├── Layout.jsx
│       │   │   └── ThemeProvider.jsx
│       │   │
│       │   ├── ui/
│       │   │   ├── Button.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Accordion.jsx
│       │   │   ├── Spinner.jsx
│       │   │   ├── Alert.jsx
│       │   │   ├── Badge.jsx
│       │   │   ├── Dropdown.jsx
│       │   │   └── Tooltip.jsx
│       │   │
│       │   ├── forms/
│       │   │   ├── LoginForm.jsx
│       │   │   ├── SignupForm.jsx
│       │   │   ├── QueryForm.jsx
│       │   │   └── FeedbackForm.jsx
│       │   │
│       │   └── chat/
│       │       ├── ChatInterface.jsx
│       │       ├── MessageBubble.jsx
│       │       ├── VoiceInput.jsx
│       │       ├── ImageUpload.jsx
│       │       └── TypingIndicator.jsx
│       │
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   ├── Chat.jsx
│       │   ├── Profile.jsx
│       │   ├── About.jsx
│       │   ├── Contact.jsx
│       │   └── NotFound.jsx
│       │
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useTheme.js
│       │   ├── useChat.js
│       │   ├── useLocalStorage.js
│       │   ├── useDebounce.js
│       │   ├── useSocket.js
│       │   └── useAppState.js
│       │
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   ├── ThemeContext.jsx
│       │   ├── ChatContext.jsx
│       │   ├── SocketContext.jsx
│       │   └── AppContext.jsx
│       │
│       ├── services/
│       │   ├── api.js
│       │   ├── auth.js
│       │   ├── chat.js
│       │   ├── upload.js
│       │   └── socket.js
│       │
│       ├── utils/
│       │   ├── constants.js
│       │   ├── helpers.js
│       │   ├── validation.js
│       │   ├── formatters.js
│       │   └── storage.js
│       │
│       └── assets/
│           ├── images/
│           ├── icons/
│           └── fonts/
│
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── server.js
│   ├── app.js
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── openrouter.js
│   │   ├── cloudinary.js
│   │   └── cors.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Query.js
│   │   ├── Response.js
│   │   ├── Feedback.js
│   │   └── KnowledgeBase.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── chat.js
│   │   ├── queries.js
│   │   ├── upload.js
│   │   └── admin.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── chatController.js
│   │   ├── queryController.js
│   │   ├── uploadController.js
│   │   └── adminController.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── upload.js
│   │   ├── rateLimiter.js
│   │   ├── errorHandler.js
│   │   └── logger.js
│   │
│   ├── services/
│   │   ├── aiService.js
│   │   ├── imageProcessing.js
│   │   ├── voiceProcessing.js
│   │   ├── translationService.js
│   │   ├── weatherService.js
│   │   └── notificationService.js
│   │
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── constants.js
│   │   ├── validation.js
│   │   ├── encryption.js
│   │   └── logger.js
│   │
│   ├── data/
│   │   ├── seeds/
│   │   ├── migrations/
│   │   └── knowledge-base/
│   │
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── fixtures/
│
└── docs/
    ├── api/
    │   ├── authentication.md
    │   ├── chat.md
    │   ├── users.md
    │   └── upload.md
    │
    ├── deployment/
    │   ├── docker.md
    │   ├── aws.md
    │   └── environment.md
    │
    └── development/
        ├── setup.md
        ├── contributing.md
        └── testing.md
```

### Key Features Implementation

#### State Management with React Context API

- **AuthContext**: User authentication state, login/logout functions, user profile data
- **ThemeContext**: Dark/light mode toggle, theme persistence, system preference detection
- **ChatContext**: Chat history, current conversation, message state management
- **SocketContext**: Real-time connection management, socket event handlers
- **AppContext**: Global app state, notifications, loading states, error handling

#### Authentication & Security

- **bcryptjs**: Password hashing with salt rounds
- **JWT**: Secure token-based authentication stored in AuthContext
- **CORS**: Proper cross-origin configuration
- **Helmet**: Security headers
- **Rate Limiting**: API abuse prevention
- **Context-based Auth**: Centralized authentication state management

#### Theme System

- **Context-Driven Theming**: ThemeContext managing dark/light mode state
- **System Preference Detection**: Automatic theme detection and application
- **Tailwind CSS**: CSS custom properties for theme switching
- **Persistent Storage**: Theme preference saved in localStorage via Context

#### File Upload & Processing

- **Multer**: File upload middleware
- **Cloudinary**: Image storage and optimization
- **Image Processing**: Crop disease detection
- **Voice Processing**: Malayalam speech-to-text

#### Real-time Features

- **Socket.io**: Real-time chat functionality managed through SocketContext
- **Context Integration**: Socket events handled via SocketContext provider
- **Typing Indicators**: Enhanced user experience with real-time state updates
- **Live Notifications**: Instant updates managed through AppContext

#### Database Schema

- **Users**: Authentication and profile data
- **Queries**: Farmer questions and context
- **Responses**: AI and expert answers
- **Feedback**: System improvement data
- **Knowledge Base**: Agricultural information

### Application Architecture

#### Routing Strategy

- **Centralized Routing**: All route definitions in `main.jsx` for better maintainability
- **Nested Routes**: Layout component wraps all pages for consistent UI structure
- **Protected Routes**: Authentication checks handled through AuthContext
- **Dynamic Imports**: Code splitting for better performance (can be added later)

#### Component Hierarchy

```
main.jsx (Routing + App wrapper)
├── App.jsx (Context Providers)
│   ├── Layout.jsx (Navbar + Footer + Outlet)
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Chat.jsx
│   │   ├── Profile.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   └── NotFound.jsx
```

### Development Workflow

1. **Setup**: Environment configuration and dependency installation
2. **Development**: Concurrent frontend and backend development
3. **Testing**: Unit and integration tests
4. **Deployment**: Production deployment with CI/CD
5. **Monitoring**: Performance and error tracking

### React Context API Architecture

#### Application Structure

```jsx
// main.jsx - Entry point with routing configuration
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

// Import all pages
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Chat from "./pages/Chat.jsx";
import Profile from "./pages/Profile.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import NotFound from "./pages/NotFound.jsx";

// Import layout components
import Layout from "./components/layout/Layout.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="chat" element={<Chat />} />
            <Route path="profile" element={<Profile />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </App>
    </BrowserRouter>
  </React.StrictMode>
);
```

```jsx
// App.jsx - Context Provider Hierarchy
<AppProvider>
  <AuthProvider>
    <ThemeProvider>
      <SocketProvider>
        <ChatProvider>{children}</ChatProvider>
      </SocketProvider>
    </ThemeProvider>
  </AuthProvider>
</AppProvider>
```

#### Context Responsibilities

**AuthContext:**

- User authentication state (isAuthenticated, user data)
- Login/logout functions
- Token management
- Protected route logic
- User profile updates

**ThemeContext:**

- Current theme state (dark/light)
- Theme toggle functionality
- System preference detection
- Persistent theme storage
- CSS custom property updates

**ChatContext:**

- Chat messages and history
- Current conversation state
- Message sending/receiving
- Chat UI state (typing indicators, loading)
- Message pagination and search

**SocketContext:**

- WebSocket connection management
- Real-time event handling
- Connection status monitoring
- Socket event listeners
- Real-time notifications

**AppContext:**

- Global loading states
- Error handling and notifications
- App-wide settings
- Navigation state
- Offline/online status

This structure provides a scalable, maintainable foundation for the AI-Based Farmer Query Support and Advisory System with centralized state management using React Context API.
