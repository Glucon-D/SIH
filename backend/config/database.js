const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  logger.error(`Mongoose connection error: ${err}`);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongoose disconnected from MongoDB");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("Mongoose connection closed through app termination");
  process.exit(0);
});

module.exports = connectDB;
