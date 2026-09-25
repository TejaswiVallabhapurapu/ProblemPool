const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
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
    content: {
      type: String,
      required: [true, 'Reply content cannot be empty'],
      trim: true,
      maxlength: [500, 'Reply cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const Reply = mongoose.model('Reply', replySchema);

module.exports = Reply;
