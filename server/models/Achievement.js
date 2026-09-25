const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    achievementType: {
      type: String,
      required: [true, 'Achievement type is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Achievement title is required'],
    },
    description: {
      type: String,
      required: [true, 'Achievement description is required'],
    },
    icon: {
      type: String,
      default: '🏆',
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate achievements per user
achievementSchema.index({ user: 1, achievementType: 1 }, { unique: true });

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;
