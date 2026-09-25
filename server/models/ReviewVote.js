const mongoose = require('mongoose');

const reviewVoteSchema = new mongoose.Schema(
  {
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: [true, 'Review reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate helpful votes per user per review
reviewVoteSchema.index({ review: 1, user: 1 }, { unique: true });

const ReviewVote = mongoose.model('ReviewVote', reviewVoteSchema);

module.exports = ReviewVote;
