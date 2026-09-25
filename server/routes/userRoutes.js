const express = require('express');
const router = express.Router();
const {
  getMySavedProblems,
  getMySavedProblemIds,
} = require('../controllers/savedProblemController');
const { protect } = require('../middleware/authMiddleware');

// Get saved problems for current logged-in user
router.get('/me/saved-problems', protect, getMySavedProblems);

// Fast endpoint to get list of saved problem IDs for current user
router.get('/me/saved-problems/ids', protect, getMySavedProblemIds);

module.exports = router;
