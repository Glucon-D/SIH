# Digital Krishi Officer (DKO)

AI-Based Farmer Query Support and Advisory System - A comprehensive platform that provides farmers with expert agricultural advice through AI-powered conversations.

## 🌾 Overview

Digital Krishi Officer is an intelligent agricultural advisory system designed to help farmers get instant expert advice on:

- **Pest Management** - Identify and control agricultural pests
- **Disease Control** - Diagnose and treat crop diseases  
- **Fertilizer Advice** - Optimize fertilizer usage for better yields
- **Weather Guidance** - Make weather-informed farming decisions
- **Crop Planning** - Plan seasonal crops and rotations
- **Market Information** - Get current market prices and trends
- **Government Schemes** - Access information about agricultural subsidies and programs

## 🚀 Features

### Core Features
- **AI-Powered Chat** - Instant responses using Google Gemini 2.5 Flash Lite
- **Real-time Streaming** - Live AI responses with WebSocket support
- **Multi-language Support** - English, Malayalam, and Hindi
- **Image Upload** - Upload crop/pest images for visual analysis
- **Conversation History** - Persistent chat threads and message history
- **User Authentication** - Secure JWT-based authentication
- **Responsive Design** - Works seamlessly on desktop and mobile

### Technical Features
- **Real-time Communication** - Socket.io for live updates
- **Dark Mode Support** - Automatic theme switching
- **Offline Capability** - Progressive Web App features
- **Data Security** - Encrypted passwords and secure API endpoints
- **Scalable Architecture** - Microservices-ready backend design

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: OpenRouter with Google Gemini 2.5 Flash Lite
- **Authentication**: JWT with bcryptjs
- **Real-time**: Socket.io
- **Logging**: Winston
- **Validation**: Express-validator

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand + Context API
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **UI Components**: Lucide React icons
- **Notifications**: React Hot Toast

## 📁 Project Structure

```
SIH/
├── backend/
│   ├── config/          # Database and OpenRouter configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Authentication and error handling
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── logs/            # Application logs
│   ├── server.js        # Main server file
│   └── package.json     # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context providers
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service functions
│   │   └── main.jsx     # Application entry point
│   ├── public/          # Static assets
│   └── package.json     # Frontend dependencies
├── .env.example         # Environment variables template
└── README.md           # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- OpenRouter API key

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/sih-farmer-advisory
   JWT_SECRET=your-super-secret-jwt-key
   OPENROUTER_API_KEY=your-openrouter-api-key
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:5173](http://localhost:5173) in your browser

## 📊 Database Schema

### User Schema
```javascript
{
  username: String,
  email: String,
  password: String (encrypted),
  profile: {
    firstName: String,
    lastName: String,
    location: String,
    farmSize: String,
    cropTypes: [String],
    experience: String
  },
  createdOn: Date,
  updatedOn: Date
}
```

### Thread Schema
```javascript
{
  userId: ObjectId,
  title: String,
  category: String,
  status: String,
  messageCount: Number,
  createdOn: Date,
  updatedOn: Date
}
```

### Message Schema
```javascript
{
  threadId: ObjectId,
  userId: ObjectId,
  role: String, // 'user' | 'assistant'
  content: String,
  metadata: {
    model: String,
    tokens: Object,
    processingTime: Number
  },
  createdOn: Date,
  updatedOn: Date
}
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get user profile
- `POST /api/auth/logout` - User logout

### Chat & Threads
- `GET /api/threads` - Get user threads
- `POST /api/threads` - Create new thread
- `GET /api/chat/history/:threadId` - Get chat history
- `POST /api/chat/stream` - Stream AI chat response

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics

## 🌐 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or DigitalOcean
4. Set up SSL certificates for HTTPS

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3
3. Configure environment variables for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Agricultural Experts** - Domain knowledge and advisory content
- **AI/ML Engineers** - AI model integration and optimization
- **Full Stack Developers** - Application development and deployment
- **UI/UX Designers** - User interface and experience design

## 📞 Support

For support and questions:
- Email: support@digitalkrishi.com
- Phone: +91-1234567890
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)

## 🙏 Acknowledgments

- OpenRouter for AI model access
- MongoDB for database services
- All the farmers who provided feedback and requirements
- Open source community for the amazing tools and libraries

---

**Digital Krishi Officer** - Empowering farmers with AI-powered agricultural expertise 🌾
