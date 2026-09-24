const mongoose = require('mongoose');
const Answer = require('../models/Answer');
const Problem = require('../models/Problem');

/**
 * @desc    Get all answers for a specific problem
 * @route   GET /api/problems/:problemId/answers
 * @access  Public
 */
const getAnswersByProblem = async (req, res) => {
  try {
    const problemId = req.params.problemId || req.params.id;

    if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid problem ID format',
      });
    }

    // Verify problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    // Fetch answers sorted by newest first
    const answers = await Answer.find({ problem: problemId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: answers.length,
      answers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve answers: ' + error.message,
    });
  }
};

/**
 * @desc    Submit a new answer to a problem
 * @route   POST /api/problems/:problemId/answers
 * @access  Private (JWT Protected)
 */
const createAnswer = async (req, res) => {
  try {
    const problemId = req.params.problemId || req.params.id;
    const { content } = req.body;

    if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid problem ID format',
      });
    }

    // Verify problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    // Validate answer content
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Answer cannot be empty',
      });
    }

    // Create answer associated with problem & logged-in user
    const newAnswer = await Answer.create({
      problem: problemId,
      user: req.user._id,
      content: content.trim(),
    });

    // Populate user info for immediate frontend display
    const populatedAnswer = await Answer.findById(newAnswer._id).populate(
      'user',
      'name email'
    );

    return res.status(201).json({
      success: true,
      message: 'Answer submitted successfully',
      answer: populatedAnswer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit answer: ' + error.message,
    });
  }
};

/**
 * @desc    Delete an answer
 * @route   DELETE /api/problems/:problemId/answers/:answerId
 * @access  Private (Author or Admin)
 */
const deleteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;

    if (!answerId || !mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer ID format',
      });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found',
      });
    }

    // Only answer author can delete their answer
    if (answer.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this answer',
      });
    }

    await Answer.findByIdAndDelete(answerId);

    return res.status(200).json({
      success: true,
      message: 'Answer deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete answer: ' + error.message,
    });
  }
};

module.exports = {
  getAnswersByProblem,
  createAnswer,
  deleteAnswer,
};
