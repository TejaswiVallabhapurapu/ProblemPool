const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [60, 'Team name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Team description cannot exceed 300 characters'],
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Leader reference is required'],
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'SUBMITTED', 'COMPLETED', 'CLOSED'],
      default: 'ACTIVE',
      index: true,
    },
    sharedSolution: {
      type: String,
      default: '',
    },
    submittedAnswerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize queries for finding teams by problem and status
teamSchema.index({ problemId: 1, status: 1 });
teamSchema.index({ members: 1 });
teamSchema.index({ leaderId: 1 });

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
