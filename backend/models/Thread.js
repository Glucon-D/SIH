const mongoose = require("mongoose");

const threadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    title: {
      type: String,
      required: [true, "Thread title is required"],
      trim: true,
      maxlength: [200, "Thread title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Thread description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      enum: [
        "pest_management",
        "disease_control",
        "fertilizer_advice",
        "weather_guidance",
        "crop_planning",
        "market_information",
        "government_schemes",
        "general_query",
        "other",
      ],
      default: "general_query",
    },
    status: {
      type: String,
      enum: ["active", "resolved", "archived"],
      default: "active",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    metadata: {
      cropType: {
        type: String,
        trim: true,
      },
      season: {
        type: String,
        enum: ["kharif", "rabi", "zaid", "perennial"],
      },
      location: {
        type: String,
        trim: true,
      },
      farmSize: {
        type: String,
        trim: true,
      },
      urgencyLevel: {
        type: Number,
        min: 1,
        max: 5,
        default: 3,
      },
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        trim: true,
        maxlength: [500, "Feedback comment cannot exceed 500 characters"],
      },
      helpful: {
        type: Boolean,
      },
      submittedAt: {
        type: Date,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdOn: {
      type: Date,
      default: Date.now,
    },
    updatedOn: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "createdOn", updatedAt: "updatedOn" },
  }
);

// Indexes for better query performance
threadSchema.index({ userId: 1, createdOn: -1 });
threadSchema.index({ status: 1, priority: 1 });
threadSchema.index({ category: 1 });
threadSchema.index({ lastMessageAt: -1 });
threadSchema.index({ tags: 1 });

// Virtual for getting messages
threadSchema.virtual("messages", {
  ref: "Message",
  localField: "_id",
  foreignField: "threadId",
});

// Instance method to update last message timestamp
threadSchema.methods.updateLastMessage = function () {
  this.lastMessageAt = new Date();
  this.updatedOn = new Date();
  return this.save();
};

// Instance method to increment message count
threadSchema.methods.incrementMessageCount = function () {
  this.messageCount += 1;
  this.lastMessageAt = new Date();
  this.updatedOn = new Date();
  return this.save();
};

// Instance method to mark as resolved
threadSchema.methods.markAsResolved = function () {
  this.status = "resolved";
  this.resolvedAt = new Date();
  this.updatedOn = new Date();
  return this.save();
};

// Static method to find active threads for user
threadSchema.statics.findActiveByUser = function (userId) {
  return this.find({
    userId,
    status: "active",
    isActive: true,
  }).sort({ lastMessageAt: -1 });
};

// Static method to find threads by category
threadSchema.statics.findByCategory = function (category, limit = 10) {
  return this.find({
    category,
    isActive: true,
  })
    .populate("userId", "username profile.firstName profile.lastName")
    .sort({ lastMessageAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model("Thread", threadSchema);
