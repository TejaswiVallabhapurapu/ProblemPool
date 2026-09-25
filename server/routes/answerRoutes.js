const express = require('express');
const router = express.Router();
const {
  voteAnswer,
  removeAnswerVote,
} = require('../controllers/answerController');
const {
  getReviewsByAnswer,
  createReview,
} = require('../controllers/reviewController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Answer Voting (Helpful / Not Helpful)
router.route('/:answerId/vote')
  .post(protect, voteAnswer)
  .delete(protect, removeAnswerVote);

// Reviews on Answers
router.route('/:answerId/reviews')
  .get(optionalProtect, getReviewsByAnswer)
  .post(protect, createReview);

module.exports = router;
