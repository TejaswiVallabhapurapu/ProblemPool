const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Collection name is required'],
      trim: true,
      maxlength: [80, 'Collection name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    color: {
      type: String,
      default: 'indigo',
      enum: ['indigo', 'emerald', 'amber', 'rose', 'purple', 'sky', 'cyan', 'blue', 'orange'],
    },
    problems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound unique index so a user cannot create two collections with the exact same name
collectionSchema.index({ user: 1, name: 1 }, { unique: true });

const Collection = mongoose.model('Collection', collectionSchema);

module.exports = Collection;
