const mongoose = require('mongoose');
const Review = require('../models/Review');
const ReviewVote = require('../models/ReviewVote');
const Reply = require('../models/Reply');
const Answer = require('../models/Answer');
const Problem = require('../models/Problem');
const { createNotification, parseAndNotifyMentions } = require('../services/notificationService');

/**
 * @desc    Get all reviews for an answer with vote count, user vote status, and populated replies
 * @route   GET /api/answers/:answerId/reviews
 * @access  Public (Optional JWT for hasVoted status)
 */
const getReviewsByAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { sort = 'most_helpful' } = req.query;

    if (!answerId || !mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer ID format',
      });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found',
      });
    }

    const rawReviews = await Review.find({ answer: answerId })
      .populate('user', 'name email')
      .lean();

    const currentUserId = req.user ? req.user._id.toString() : null;

    // Attach helpful votes and 1-level replies for each review
    const reviewsWithMeta = await Promise.all(
      rawReviews.map(async (rev) => {
        const revId = rev._id;

        const [helpfulCount, userVoteDoc, replies] = await Promise.all([
          ReviewVote.countDocuments({ review: revId }),
          currentUserId
            ? ReviewVote.findOne({ review: revId, user: currentUserId }).lean()
            : null,
          Reply.find({ review: revId })
            .populate('user', 'name email')
            .sort({ createdAt: 1 })
            .lean(),
        ]);

        return {
          ...rev,
          helpfulCount,
          hasVoted: Boolean(userVoteDoc),
          replies,
          repliesCount: replies.length,
        };
      })
    );

    // Apply Review Sorting logic
    reviewsWithMeta.sort((a, b) => {
      if (sort === 'most_helpful') {
        if (b.helpfulCount !== a.helpfulCount) {
          return b.helpfulCount - a.helpfulCount;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      if (sort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      // Default / 'newest':
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({
      success: true,
      count: reviewsWithMeta.length,
      reviews: reviewsWithMeta,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reviews: ' + error.message,
    });
  }
};

/**
 * @desc    Submit a review on an answer
 * @route   POST /api/answers/:answerId/reviews
 * @access  Private (JWT Protected)
 */
const createReview = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { content } = req.body;

    if (!answerId || !mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer ID format',
      });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found',
      });
    }

    // Rule: Answer author cannot review their own answer
    if (answer.user.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review your own answer',
      });
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Review content cannot be empty',
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review cannot exceed 1000 characters',
      });
    }

    const newReview = await Review.create({
      answer: answerId,
      user: req.user._id,
      content: content.trim(),
    });

    // Notify answer author
    const problem = await Problem.findById(answer.problem).select('title').lean();
    createNotification({
      recipient: answer.user,
      sender: req.user._id,
      type: 'review',
      title: 'New Review on Your Answer',
      message: `${req.user.name} reviewed your answer on "${problem ? problem.title.slice(0, 50) : 'a problem'}..."`,
      referenceType: 'answer',
      referenceId: answer._id,
      link: `/problems/${answer.problem}`,
    });

    // Parse mentions
    parseAndNotifyMentions({
      text: content,
      senderUser: req.user,
      referenceType: 'problem',
      referenceId: answer.problem,
      link: `/problems/${answer.problem}`,
      contextTitle: problem ? problem.title : '',
    });

    const populatedReview = await Review.findById(newReview._id)
      .populate('user', 'name email')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review: {
        ...populatedReview,
        helpfulCount: 0,
        hasVoted: false,
        replies: [],
        repliesCount: 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create review: ' + error.message,
    });
  }
};

/**
 * @desc    Edit a review
 * @route   PUT /api/reviews/:reviewId
 * @access  Private (Author only)
 */
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format',
      });
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Review content cannot be empty',
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review cannot exceed 1000 characters',
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Only review author can edit
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this review',
      });
    }

    review.content = content.trim();
    await review.save();

    const updatedReview = await Review.findById(reviewId)
      .populate('user', 'name email')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update review: ' + error.message,
    });
  }
};

/**
 * @desc    Delete a review and cascade delete its votes and replies
 * @route   DELETE /api/reviews/:reviewId
 * @access  Private (Author only)
 */
const deleteReview = async (req, res) => {
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

    // Only review author can delete
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    await Promise.all([
      Review.findByIdAndDelete(reviewId),
      ReviewVote.deleteMany({ review: reviewId }),
      Reply.deleteMany({ review: reviewId }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete review: ' + error.message,
    });
  }
};

/**
 * @desc    Vote Helpful on a review
 * @route   POST /api/reviews/:reviewId/vote
 * @access  Private (JWT Protected)
 */
const voteReview = async (req, res) => {
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

    // Rule: Review author cannot vote on their own review
    if (review.user.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own review',
      });
    }

    const existingVote = await ReviewVote.findOne({
      review: reviewId,
      user: req.user._id,
    });

const { adjustReputation, REPUTATION_RULES } = require('../services/reputationService');

    let hasVoted = false;
    if (existingVote) {
      // Toggle off if already voted
      adjustReputation({
        userId: review.user,
        points: -REPUTATION_RULES.HELPFUL_REVIEW_VOTE,
        reason: 'Helpful vote removed on your review',
        referenceType: 'review_vote',
        referenceId: review._id,
      });
      await ReviewVote.findByIdAndDelete(existingVote._id);
      hasVoted = false;
    } else {
      await ReviewVote.create({
        review: reviewId,
        user: req.user._id,
      });
      adjustReputation({
        userId: review.user,
        points: REPUTATION_RULES.HELPFUL_REVIEW_VOTE,
        reason: 'Your review received a helpful vote',
        referenceType: 'review_vote',
        referenceId: review._id,
      });
      hasVoted = true;
    }

    const helpfulCount = await ReviewVote.countDocuments({ review: reviewId });

    return res.status(200).json({
      success: true,
      helpfulCount,
      hasVoted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to vote on review: ' + error.message,
    });
  }
};

/**
 * @desc    Remove Helpful vote on a review
 * @route   DELETE /api/reviews/:reviewId/vote
 * @access  Private (JWT Protected)
 */
const removeReviewVote = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format',
      });
    }

    const review = await Review.findById(reviewId);
    const existingVote = await ReviewVote.findOne({
      review: reviewId,
      user: req.user._id,
    });

    if (existingVote && review) {
      adjustReputation({
        userId: review.user,
        points: -REPUTATION_RULES.HELPFUL_REVIEW_VOTE,
        reason: 'Helpful vote removed on your review',
        referenceType: 'review_vote',
        referenceId: reviewId,
      });
    }

    await ReviewVote.findOneAndDelete({
      review: reviewId,
      user: req.user._id,
    });

    const helpfulCount = await ReviewVote.countDocuments({ review: reviewId });

    return res.status(200).json({
      success: true,
      helpfulCount,
      hasVoted: false,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to remove vote: ' + error.message,
    });
  }
};

module.exports = {
  getReviewsByAnswer,
  createReview,
  updateReview,
  deleteReview,
  voteReview,
  removeReviewVote,
};
