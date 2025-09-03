# 🚀 Digital Krishi Officer - Startup Guide

This guide will help you get the Digital Krishi Officer application up and running quickly.

## ✅ Fixed Issues

The following MongoDB schema warnings have been resolved:
- ✅ Removed duplicate index definitions in User, Thread, and Message models
- ✅ Added OpenRouter configuration validation
- ✅ Improved error handling and logging

## 📋 Prerequisites

Before starting, make sure you have:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** - Either:
   - Local MongoDB installation, OR
   - MongoDB Atlas account (free tier available)
3. **OpenRouter API Key** - [Get one here](https://openrouter.ai/)

## 🔧 Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `backend/.env` file with your actual values:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/sih-farmer-advisory
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sih-farmer-advisory

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random
JWT_EXPIRES_IN=7d

# OpenRouter API Key (Required for AI features)
OPENROUTER_API_KEY=sk-or-your-openrouter-api-key-here

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Test Backend Configuration

```bash
# Run the setup test
node test-setup.js
```

This will verify:
- ✅ Environment variables are set correctly
- ✅ Database connection works
- ✅ OpenRouter API key is valid

### 4. Start Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# OR Production mode
npm start
```

You should see:
```
Server running on port 5000
MongoDB Connected: localhost:27017
OpenRouter configuration validated successfully
```

### 5. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 6. Configure Frontend Environment

Edit the `frontend/.env` file:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=Digital Krishi Officer
```

### 7. Start Frontend Development Server

```bash
npm run dev
```

The frontend will be available at: http://localhost:5173

## 🎯 Testing the Application

### 1. Access the Application
- Open http://localhost:5173 in your browser
- You should see the Digital Krishi Officer homepage

### 2. Create an Account
- Click "Sign Up" or "Get Started"
- Fill in the registration form
- You'll be redirected to the dashboard

### 3. Test AI Chat
- Click "New Conversation" in the dashboard
- Ask a farming question like: "How do I control aphids on my tomato plants?"
- You should get an AI-powered response

### 4. API Health Check
- Visit http://localhost:5000/api/health
- You should see: `{"status":"OK","timestamp":"...","uptime":...}`

## 🔍 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running locally, or use MongoDB Atlas

#### 2. OpenRouter API Error
```
Error: OPENROUTER_API_KEY is required
```
**Solution**: Add your OpenRouter API key to the `.env` file

#### 3. Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**: Change the PORT in `.env` or stop the process using port 5000

#### 4. CORS Errors in Browser
**Solution**: Make sure FRONTEND_URL in backend `.env` matches your frontend URL

### 5. Frontend Build Errors
```
Module not found: Can't resolve 'react-hot-toast'
```
**Solution**: Make sure all dependencies are installed with `npm install`

## 📊 Application Structure

### Backend (Port 5000)
- **API Endpoints**: `/api/*`
- **Health Check**: `/api/health`
- **WebSocket**: Socket.io for real-time chat
- **Database**: MongoDB with Mongoose

### Frontend (Port 5173)
- **Homepage**: Landing page with features
- **Authentication**: Login/Signup pages
- **Dashboard**: Main chat interface
- **About/Contact**: Information pages

## 🔐 Security Notes

1. **JWT Secret**: Use a strong, random JWT secret in production
2. **Database**: Use MongoDB Atlas with authentication in production
3. **API Keys**: Never commit API keys to version control
4. **CORS**: Configure CORS properly for production domains

## 🚀 Production Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set environment variables on your hosting platform
2. Use MongoDB Atlas for the database
3. Configure CORS for your production frontend URL

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables for production API URL

## 📞 Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Run the backend test script: `node test-setup.js`
4. Check that all required services (MongoDB, OpenRouter) are accessible

## 🎉 Success!

If everything is working correctly, you should be able to:
- ✅ Access the homepage at http://localhost:5173
- ✅ Register and login users
- ✅ Create chat conversations
- ✅ Get AI-powered responses to farming questions
- ✅ See real-time message streaming

Happy farming! 🌾
