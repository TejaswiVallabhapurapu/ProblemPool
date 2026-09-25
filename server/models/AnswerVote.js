const mongoose = require('mongoose');

const answerVoteSchema = new mongoose.Schema(
  {
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
      required: [true, 'Answer reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    voteType: {
      type: String,
      enum: {
        values: ['helpful', 'not_helpful'],
        message: 'Vote type must be either helpful or not_helpful',
      },
      required: [true, 'Vote type is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate votes per user per answer at DB level
answerVoteSchema.index({ answer: 1, user: 1 }, { unique: true });

const AnswerVote = mongoose.model('AnswerVote', answerVoteSchema);

module.exports = AnswerVote;
