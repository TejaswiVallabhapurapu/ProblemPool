const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const Answer = require('../models/Answer');
const AnswerVote = require('../models/AnswerVote');
const Review = require('../models/Review');
const ReviewVote = require('../models/ReviewVote');
const Reply = require('../models/Reply');

/**
 * Helper to determine dynamic problem status
 */
const computeProblemStatus = (problem, answersCount) => {
  if (problem.bestAnswer) {
    return 'Solved';
  }
  if (answersCount > 0) {
    return 'Answered';
  }
  return 'Unanswered';
};

// @desc    Get all problems (newest first) with answersCount and status
// @route   GET /api/problems
const getProblems = async (req, res) => {
  try {
    const rawProblems = await Problem.find()
      .populate('createdBy', 'name email')
      .populate('bestAnswer')
      .sort({ createdAt: -1 })
      .lean();

    const problemsWithMeta = await Promise.all(
      rawProblems.map(async (p) => {
        const answersCount = await Answer.countDocuments({ problem: p._id });
        return {
          ...p,
          answersCount,
          status: computeProblemStatus(p, answersCount),
        };
      })
    );

    return res.status(200).json({
      success: true,
      problems: problemsWithMeta,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch problems: ' + error.message,
    });
  }
};

// @desc    Get single problem by ID with answersCount and status
// @route   GET /api/problems/:id
const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid problem ID format',
      });
    }

    const problem = await Problem.findById(id)
      .populate('createdBy', 'name email')
      .populate('bestAnswer')
      .lean();

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    const answersCount = await Answer.countDocuments({ problem: id });
    const status = computeProblemStatus(problem, answersCount);

    return res.status(200).json({
      success: true,
      problem: {
        ...problem,
        answersCount,
        status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch problem: ' + error.message,
    });
  }
};

// @desc    Create a new problem (Protected)
// @route   POST /api/problems
const createProblem = async (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    // Validate that all fields are provided
    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, category, and location',
      });
    }

    // Creator comes strictly from req.user._id set by authMiddleware
    const newProblem = await Problem.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      createdBy: req.user._id,
      bestAnswer: null,
    });

    const populatedProblem = await Problem.findById(newProblem._id)
      .populate('createdBy', 'name email')
      .lean();

    return res.status(201).json({
      success: true,
      problem: {
        ...populatedProblem,
        answersCount: 0,
        status: 'Unanswered',
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create problem: ' + error.message,
    });
  }
};

// @desc    Delete a problem and cascade delete all associated answers, votes, reviews, replies
// @route   DELETE /api/problems/:id
const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid problem ID format',
      });
    }

    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    // Authorization: only problem creator can delete
    if (problem.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this problem',
      });
    }

    // Find all answers belonging to this problem
    const answers = await Answer.find({ problem: id }).select('_id');
    const answerIds = answers.map((a) => a._id);

    // Find all reviews belonging to these answers
    const reviews = await Review.find({ answer: { $in: answerIds } }).select('_id');
    const reviewIds = reviews.map((r) => r._id);

    // Perform cascade delete
    await Promise.all([
      Problem.findByIdAndDelete(id),
      Answer.deleteMany({ problem: id }),
      AnswerVote.deleteMany({ answer: { $in: answerIds } }),
      Review.deleteMany({ answer: { $in: answerIds } }),
      ReviewVote.deleteMany({ review: { $in: reviewIds } }),
      Reply.deleteMany({ review: { $in: reviewIds } }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Problem and all associated answers/reviews deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete problem: ' + error.message,
    });
  }
};

// @desc    Get problems by category
// @route   GET /api/problems/category/:category
const getProblemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // Case-insensitive category match
    const rawProblems = await Problem.find({
      category: new RegExp(`^${category.trim()}$`, 'i'),
    })
      .populate('createdBy', 'name email')
      .populate('bestAnswer')
      .sort({ createdAt: -1 })
      .lean();

    const problemsWithMeta = await Promise.all(
      rawProblems.map(async (p) => {
        const answersCount = await Answer.countDocuments({ problem: p._id });
        return {
          ...p,
          answersCount,
          status: computeProblemStatus(p, answersCount),
        };
      })
    );

    return res.status(200).json({
      success: true,
      problems: problemsWithMeta,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch problems for category: ' + error.message,
    });
  }
};

// @desc    Mark an answer as the Best Answer (Problem Owner Only)
// @route   PUT /api/problems/:problemId/best-answer/:answerId
// @access  Private (Problem Owner only)
const setBestAnswer = async (req, res) => {
  try {
    const { problemId, answerId } = req.params;

    if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid problem ID format',
      });
    }

    if (!answerId || !mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer ID format',
      });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    // Strict Backend Authorization: ONLY problem creator can mark best answer
    if (problem.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the problem owner can select the Best Answer',
      });
    }

    // Verify answer exists and belongs to this problem
    const answer = await Answer.findById(answerId);
    if (!answer || answer.problem.toString() !== problemId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Answer does not belong to this problem',
      });
    }

    // If same answer is already best answer, leave it or confirm
    problem.bestAnswer = answerId;
    await problem.save();

    return res.status(200).json({
      success: true,
      message: 'Best Answer marked successfully',
      bestAnswer: answerId,
      status: 'Solved',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to set best answer: ' + error.message,
    });
  }
};

// @desc    Remove Best Answer designation (Problem Owner Only)
// @route   DELETE /api/problems/:problemId/best-answer
// @access  Private (Problem Owner only)
const removeBestAnswer = async (req, res) => {
  try {
    const { problemId } = req.params;

    if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid problem ID format',
      });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    // Strict Backend Authorization: ONLY problem creator can remove best answer
    if (problem.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the problem owner can remove the Best Answer',
      });
    }

    problem.bestAnswer = null;
    await problem.save();

    const answersCount = await Answer.countDocuments({ problem: problemId });
    const status = computeProblemStatus(problem, answersCount);

    return res.status(200).json({
      success: true,
      message: 'Best Answer removed successfully',
      bestAnswer: null,
      status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to remove best answer: ' + error.message,
    });
  }
};

module.exports = {
  getProblems,
  getProblemById,
  createProblem,
  deleteProblem,
  getProblemsByCategory,
  setBestAnswer,
  removeBestAnswer,
};
