const { improveProblem, summarizeAnswers } = require('../services/aiService');
const Problem = require('../models/Problem');
const Answer = require('../models/Answer');

/**
 * POST /api/ai/improve-problem
 * Suggests improved title, structured description, tags, and category for a problem draft.
 */
exports.handleImproveProblem = async (req, res) => {
  try {
    const { title = '', description = '', category = '', tags = [] } = req.body;

    if (!title.trim() && !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least a title or a description draft to improve.',
      });
    }

    // Call AI service abstraction
    const suggestion = await improveProblem({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      tags: Array.isArray(tags) ? tags : [],
    });

    return res.status(200).json({
      success: true,
      suggestion,
    });
  } catch (error) {
    console.error('Error in handleImproveProblem:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate problem improvement suggestions.',
    });
  }
};

/**
 * POST /api/ai/summarize-answers
 * Generates an AI summary for community answers on a problem.
 */
exports.handleSummarizeAnswers = async (req, res) => {
  try {
    const { problemId, problemTitle, problemDescription, answers: passedAnswers } = req.body;

    let targetTitle = problemTitle;
    let targetDescription = problemDescription;
    let targetAnswers = passedAnswers;

    // If problemId is provided and answers aren't passed, fetch from DB
    if (problemId && (!targetAnswers || targetAnswers.length === 0)) {
      const problem = await Problem.findById(problemId);
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }
      targetTitle = problem.title;
      targetDescription = problem.description;

      const dbAnswers = await Answer.find({ problem: problemId }).sort({ upvotes: -1, createdAt: 1 });
      targetAnswers = dbAnswers.map((a) => ({
        content: a.content,
        upvotes: a.upvotes || 0,
        isAccepted: a.isAccepted || false,
        createdAt: a.createdAt,
      }));
    }

    if (!targetAnswers || targetAnswers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No answers found to summarize for this problem.',
      });
    }

    // Call AI service abstraction
    const summaryResult = await summarizeAnswers({
      problemTitle: targetTitle || 'Technical Problem',
      problemDescription: targetDescription || '',
      answers: targetAnswers,
    });

    return res.status(200).json({
      success: true,
      ...summaryResult,
    });
  } catch (error) {
    console.error('Error in handleSummarizeAnswers:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate answers summary.',
    });
  }
};
