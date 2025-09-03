const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: [true, "Thread ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: [true, "Message role is required"],
      default: "user",
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [10000, "Message content cannot exceed 10000 characters"],
    },
    contentType: {
      type: String,
      enum: ["text", "image", "audio", "file"],
      default: "text",
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ["image", "audio", "document"],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
        },
        mimeType: {
          type: String,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    metadata: {
      model: {
        type: String,
        trim: true,
      },
      tokens: {
        input: {
          type: Number,
          min: 0,
        },
        output: {
          type: Number,
          min: 0,
        },
        total: {
          type: Number,
          min: 0,
        },
      },
      cost: {
        type: Number,
        min: 0,
      },
      processingTime: {
        type: Number,
        min: 0,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      language: {
        type: String,
        enum: ["en", "ml", "hi"],
        default: "en",
      },
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "completed",
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        content: {
          type: String,
          required: true,
        },
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        type: {
          type: String,
          enum: ["like", "dislike", "helpful", "not_helpful"],
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isVisible: {
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
messageSchema.index({ threadId: 1, createdOn: 1 });
messageSchema.index({ userId: 1, createdOn: -1 });
messageSchema.index({ role: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ createdOn: -1 });

// Virtual for getting thread information
messageSchema.virtual("thread", {
  ref: "Thread",
  localField: "threadId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for getting user information
messageSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Instance method to add reaction
messageSchema.methods.addReaction = function (userId, reactionType) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    (reaction) => !reaction.userId.equals(userId)
  );

  // Add new reaction
  this.reactions.push({
    userId,
    type: reactionType,
  });

  this.updatedOn = new Date();
  return this.save();
};

// Instance method to remove reaction
messageSchema.methods.removeReaction = function (userId) {
  this.reactions = this.reactions.filter(
    (reaction) => !reaction.userId.equals(userId)
  );

  this.updatedOn = new Date();
  return this.save();
};

// Instance method to edit message
messageSchema.methods.editContent = function (newContent) {
  // Save current content to edit history
  this.editHistory.push({
    content: this.content,
  });

  // Update content
  this.content = newContent;
  this.isEdited = true;
  this.updatedOn = new Date();

  return this.save();
};

// Static method to find messages by thread
messageSchema.statics.findByThread = function (threadId, limit = 50, skip = 0) {
  return this.find({
    threadId,
    isVisible: true,
  })
    .populate("userId", "username profile.firstName profile.lastName")
    .sort({ createdOn: 1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get conversation history for AI
messageSchema.statics.getConversationHistory = function (threadId, limit = 20) {
  return this.find({
    threadId,
    isVisible: true,
    role: { $in: ["user", "assistant"] },
  })
    .select("role content createdOn")
    .sort({ createdOn: 1 })
    .limit(limit);
};

module.exports = mongoose.model("Message", messageSchema);
