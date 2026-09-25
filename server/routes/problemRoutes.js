const express = require('express');
const router = express.Router();
const {
  getProblems,
  getProblemById,
  createProblem,
  deleteProblem,
  getProblemsByCategory,
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

// Problem CRUD
router.route('/')
  .get(getProblems)
  .post(protect, createProblem);

router.route('/category/:category')
  .get(getProblemsByCategory);

router.route('/:id')
  .get(getProblemById)
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
