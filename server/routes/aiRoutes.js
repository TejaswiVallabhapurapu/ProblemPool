const express = require('express');
const router = express.Router();
const { handleImproveProblem, handleSummarizeAnswers } = require('../controllers/aiController');

// POST /api/ai/improve-problem - Suggest title, description, tags, category
router.post('/improve-problem', handleImproveProblem);

// POST /api/ai/summarize-answers - Summarize community answers for a problem
router.post('/summarize-answers', handleSummarizeAnswers);

module.exports = router;
