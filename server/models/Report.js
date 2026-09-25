const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
      index: true,
    },
    contentType: {
      type: String,
      enum: ['problem', 'answer', 'review', 'user'],
      required: [true, 'Content type is required'],
      index: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Content ID is required'],
      index: true,
    },
    reason: {
      type: String,
      enum: [
        'Spam',
        'Duplicate',
        'Offensive content',
        'Incorrect/inappropriate content',
        'Personal information',
        'Other',
      ],
      required: [true, 'Report reason is required'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Dismissed', 'Resolved'],
      default: 'Pending',
      index: true,
    },
    actionTaken: {
      type: String,
      default: '',
      trim: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending reports from the same user for the same content
reportSchema.index({ reportedBy: 1, contentType: 1, contentId: 1, status: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
