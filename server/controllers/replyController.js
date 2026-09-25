const mongoose = require('mongoose');
const Reply = require('../models/Reply');
const Review = require('../models/Review');

/**
 * @desc    Get all replies for a specific review
 * @route   GET /api/reviews/:reviewId/replies
 * @access  Public
 */
const getRepliesByReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format',
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const replies = await Reply.find({ review: reviewId })
      .populate('user', 'name email')
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: replies.length,
      replies,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve replies: ' + error.message,
    });
  }
};

/**
 * @desc    Add a reply to a review
 * @route   POST /api/reviews/:reviewId/replies
 * @access  Private (JWT Protected)
 */
const createReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format',
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Cannot reply to a non-existent or deleted review',
      });
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reply content cannot be empty',
      });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Reply cannot exceed 500 characters',
      });
    }

    const newReply = await Reply.create({
      review: reviewId,
      user: req.user._id,
      content: content.trim(),
    });

    const populatedReply = await Reply.findById(newReply._id)
      .populate('user', 'name email')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply: populatedReply,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create reply: ' + error.message,
    });
  }
};

/**
 * @desc    Edit a reply
 * @route   PUT /api/replies/:replyId
 * @access  Private (Author only)
 */
const updateReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const { content } = req.body;

    if (!replyId || !mongoose.Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reply ID format',
      });
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reply content cannot be empty',
      });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Reply cannot exceed 500 characters',
      });
    }

    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found',
      });
    }

    // Only reply author can edit
    if (reply.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this reply',
      });
    }

    reply.content = content.trim();
    await reply.save();

    const updatedReply = await Reply.findById(replyId)
      .populate('user', 'name email')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Reply updated successfully',
      reply: updatedReply,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update reply: ' + error.message,
    });
  }
};

/**
 * @desc    Delete a reply
 * @route   DELETE /api/replies/:replyId
 * @access  Private (Author only)
 */
const deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;

    if (!replyId || !mongoose.Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reply ID format',
      });
    }

    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found',
      });
    }

    // Only reply author can delete
    if (reply.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reply',
      });
    }

    await Reply.findByIdAndDelete(replyId);

    return res.status(200).json({
      success: true,
      message: 'Reply deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete reply: ' + error.message,
    });
  }
};

module.exports = {
  getRepliesByReview,
  createReply,
  updateReply,
  deleteReply,
};
