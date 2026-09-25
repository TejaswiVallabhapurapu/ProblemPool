const express = require('express');
const router = express.Router();
const {
  getMySavedProblems,
  getMySavedProblemIds,
} = require('../controllers/savedProblemController');
const {
  getMyProfileStats,
  getPublicUserProfile,
  updateMyProfile,
  getMyReputationHistory,
  getMyActivityTimeline,
  getMyProblems,
  getMyAnswers,
  followUser,
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// Logged-in user stats & profile
router.get('/me/stats', protect, getMyProfileStats);
router.put('/me/profile', protect, updateMyProfile);
router.get('/me/activity', protect, getMyActivityTimeline);
router.get('/me/reputation-history', protect, getMyReputationHistory);
router.get('/me/problems', protect, getMyProblems);
router.get('/me/answers', protect, getMyAnswers);

// Saved problems for current logged-in user
router.get('/me/saved-problems', protect, getMySavedProblems);
router.get('/me/saved-problems/ids', protect, getMySavedProblemIds);

// Follow user
router.post('/:id/follow', protect, followUser);

// Public user profile (by ObjectId or username)
router.get('/profile/:idOrUsername', getPublicUserProfile);

module.exports = router;
