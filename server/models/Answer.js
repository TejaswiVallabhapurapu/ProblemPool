const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    content: {
      type: String,
      required: [true, 'Answer content cannot be empty'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;
