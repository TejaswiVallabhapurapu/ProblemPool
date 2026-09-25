const mongoose = require('mongoose');

const savedProblemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem reference is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate saves per user per problem
savedProblemSchema.index({ user: 1, problem: 1 }, { unique: true });

const SavedProblem = mongoose.model('SavedProblem', savedProblemSchema);

module.exports = SavedProblem;
