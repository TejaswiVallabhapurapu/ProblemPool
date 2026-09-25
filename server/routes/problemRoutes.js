const express = require('express');
const router = express.Router();
const {
  getProblems,
  searchProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemsByCategory,
  getProblemsByTag,
  getPopularTags,
  getTrendingProblems,
  getPopularProblems,
  setBestAnswer,
  removeBestAnswer,
} = require('../controllers/problemController');
const {
  getAnswersByProblem,
  createAnswer,
  deleteAnswer,
} = require('../controllers/answerController');
const {
  saveProblem,
  unsaveProblem,
} = require('../controllers/savedProblemController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Search, Tags, Trending & Popular endpoints (must come before /:id)
router.get('/search', optionalProtect, searchProblems);
router.get('/trending', optionalProtect, getTrendingProblems);
router.get('/popular', optionalProtect, getPopularProblems);
router.get('/tags', getPopularTags);
router.get('/tag/:tag', optionalProtect, getProblemsByTag);
router.get('/category/:category', optionalProtect, getProblemsByCategory);

// Problem CRUD
router.route('/')
  .get(optionalProtect, getProblems)
  .post(protect, createProblem);

router.route('/:id')
  .get(optionalProtect, getProblemById)
  .put(protect, updateProblem)
  .delete(protect, deleteProblem);

// Save / Unsave Problem (Protected)
router.route('/:problemId/save')
  .post(protect, saveProblem)
  .delete(protect, unsaveProblem);

// Best Answer actions (Problem owner only)
router.route('/:problemId/best-answer/:answerId')
  .put(protect, setBestAnswer);

router.route('/:problemId/best-answer')
  .delete(protect, removeBestAnswer);

// Answers under problem
router.route('/:problemId/answers')
  .get(optionalProtect, getAnswersByProblem)
  .post(protect, createAnswer);

router.route('/:problemId/answers/:answerId')
  .delete(protect, deleteAnswer);

module.exports = router;
