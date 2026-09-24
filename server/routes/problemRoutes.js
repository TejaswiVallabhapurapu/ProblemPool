const express = require('express');
const router = express.Router();
const {
  getProblems,
  getProblemById,
  createProblem,
  deleteProblem,
  getProblemsByCategory,
} = require('../controllers/problemController');
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

module.exports = router;
