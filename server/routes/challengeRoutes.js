const express = require('express');
const router = express.Router();
const {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  submitChallengeSolution,
  selectChallengeBestAnswer,
} = require('../controllers/challengeController');
const { protect, optionalProtect, requireAdmin, checkSuspended } = require('../middleware/authMiddleware');

// Public browse endpoints
router.get('/', optionalProtect, getChallenges);
router.get('/:id', optionalProtect, getChallengeById);

// Submit challenge answer (JWT Protected, Not Suspended)
router.post('/:id/submit', protect, checkSuspended, submitChallengeSolution);

// Admin challenge management (Admin only)
router.post('/', protect, requireAdmin, createChallenge);
router.put('/:id', protect, requireAdmin, updateChallenge);
router.delete('/:id', protect, requireAdmin, deleteChallenge);
router.put('/:id/best-answer/:answerId', protect, requireAdmin, selectChallengeBestAnswer);

module.exports = router;
