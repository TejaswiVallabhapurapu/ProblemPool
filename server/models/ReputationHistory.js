const mongoose = require('mongoose');

const reputationHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    points: {
      type: Number,
      required: [true, 'Points amount is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    referenceType: {
      type: String,
      enum: ['problem', 'answer', 'answer_vote', 'best_answer', 'review', 'review_vote', 'system'],
      default: 'system',
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user history ordered by creation
reputationHistorySchema.index({ user: 1, createdAt: -1 });

const ReputationHistory = mongoose.model('ReputationHistory', reputationHistorySchema);

module.exports = ReputationHistory;
