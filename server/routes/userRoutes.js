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
  updateUserInterests,
  getMyReputationHistory,
  getMyActivityTimeline,
  getMyProblems,
  getMyAnswers,
  followUser,
  getUserFollowers,
  getUserFollowing,
} = require('../controllers/profileController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Logged-in user stats, profile & settings
router.get('/me/stats', protect, getMyProfileStats);
router.put('/me/profile', protect, updateMyProfile);
router.put('/me/interests', protect, updateUserInterests);
router.get('/me/activity', protect, getMyActivityTimeline);
router.get('/me/reputation-history', protect, getMyReputationHistory);
router.get('/me/problems', protect, getMyProblems);
router.get('/me/answers', protect, getMyAnswers);

// Saved problems for current logged-in user
router.get('/me/saved-problems', protect, getMySavedProblems);
router.get('/me/saved-problems/ids', protect, getMySavedProblemIds);

// Followers & Following lists by identifier
router.get('/profile/:idOrUsername/followers', optionalProtect, getUserFollowers);
router.get('/profile/:idOrUsername/following', optionalProtect, getUserFollowing);
router.get('/:id/followers', optionalProtect, getUserFollowers);
router.get('/:id/following', optionalProtect, getUserFollowing);

// Follow / Unfollow user (Private JWT)
router.post('/:id/follow', protect, followUser);

// Public user profile (by ObjectId or username)
router.get('/profile/:idOrUsername', optionalProtect, getPublicUserProfile);

module.exports = router;
