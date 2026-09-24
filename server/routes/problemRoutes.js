const express = require('express');
const router = express.Router();
const {
  getProblems,
  getProblemById,
  createProblem,
  deleteProblem,
  getProblemsByCategory,
} = require('../controllers/problemController');
const {
  getAnswersByProblem,
  createAnswer,
  deleteAnswer,
} = require('../controllers/answerController');
const { protect } = require('../middleware/authMiddleware');

// Route for getting all problems & creating a problem (creating is protected)
router.route('/')
  .get(getProblems)
  .post(protect, createProblem);

// Route for getting problems by category
router.route('/category/:category')
  .get(getProblemsByCategory);

// Route for getting and deleting a specific problem by ID
router.route('/:id')
  .get(getProblemById)
  .delete(deleteProblem);

// Routes for problem answers: GET answers & POST new answer (protected)
router.route('/:problemId/answers')
  .get(getAnswersByProblem)
  .post(protect, createAnswer);

// Route for deleting a specific answer from a problem (protected)
router.route('/:problemId/answers/:answerId')
  .delete(protect, deleteAnswer);

module.exports = router;
