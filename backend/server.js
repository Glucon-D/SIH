const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const nudgesRoutes = require("./routes/nudgesRoutes");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const userRoutes = require("./routes/users");
const threadRoutes = require("./routes/threads");


const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const connectDB = require("./config/database");

const { validateConfig } = require("./config/openrouter");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

connectDB();


// ---- Validate OpenRouter ----
try {
  validateConfig();
} catch (error) {
  logger.error(`OpenRouter configuration error: ${error.message}`);
  console.error(`OpenRouter configuration error: ${error.message}`);
}

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// ---- Routes ----
app.use("/api/nudges", nudgesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/threads", threadRoutes);


app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ---- Socket.io ----
io.on("connection", (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on("join_thread", (threadId) => {
    socket.join(threadId);
    logger.info(`User ${socket.id} joined thread ${threadId}`);
    socket.emit("thread_joined", { threadId });
  });

  socket.on("leave_thread", (threadId) => {
    socket.leave(threadId);
    logger.info(`User ${socket.id} left thread ${threadId}`);
  });

  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

app.set("io", io);

app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ---- Start server ----
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
