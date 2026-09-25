const express = require('express');
const router = express.Router();
const {
  updateReview,
  deleteReview,
  voteReview,
  removeReviewVote,
} = require('../controllers/reviewController');
const {
  getRepliesByReview,
  createReply,
} = require('../controllers/replyController');
const { protect } = require('../middleware/authMiddleware');

// Review Edit / Delete (Author only)
router.route('/:reviewId')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

// Review Voting (Helpful toggle)
router.route('/:reviewId/vote')
  .post(protect, voteReview)
  .delete(protect, removeReviewVote);

// Replies under Review
router.route('/:reviewId/replies')
  .get(getRepliesByReview)
  .post(protect, createReply);

module.exports = router;
