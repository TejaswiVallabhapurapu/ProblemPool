const mongoose = require('mongoose');
const SavedProblem = require('../models/SavedProblem');
const Problem = require('../models/Problem');
const Answer = require('../models/Answer');
const AnswerVote = require('../models/AnswerVote');

/**
 * Helper to compute problem status
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

/**
 * @desc    Save a problem to solve later
 * @route   POST /api/problems/:problemId/save
 * @access  Private (JWT Protected)
 */
const saveProblem = async (req, res) => {
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

    // Upsert or create saved problem record (unique index prevents duplicates)
    await SavedProblem.findOneAndUpdate(
      { user: req.user._id, problem: problemId },
      { user: req.user._id, problem: problemId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Problem saved successfully',
      isSaved: true,
      problemId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to save problem: ' + error.message,
    });
  }
};

/**
 * @desc    Unsave / remove a problem from saved list
 * @route   DELETE /api/problems/:problemId/save
 * @access  Private (JWT Protected)
 */
const unsaveProblem = async (req, res) => {
  try {
    const { problemId } = req.params;

    if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid problem ID format',
      });
    }

    await SavedProblem.findOneAndDelete({
      user: req.user._id,
      problem: problemId,
    });

    return res.status(200).json({
      success: true,
      message: 'Problem removed from saved list',
      isSaved: false,
      problemId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to unsave problem: ' + error.message,
    });
  }
};

/**
 * @desc    Get list of IDs of all problems saved by current user (for fast badge checks)
 * @route   GET /api/users/me/saved-problems/ids
 * @access  Private (JWT Protected)
 */
const getMySavedProblemIds = async (req, res) => {
  try {
    const savedDocs = await SavedProblem.find({ user: req.user._id }).select('problem').lean();
    const savedProblemIds = savedDocs.map((doc) => doc.problem.toString());

    return res.status(200).json({
      success: true,
      count: savedProblemIds.length,
      savedProblemIds,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch saved problem IDs: ' + error.message,
    });
  }
};

/**
 * @desc    Get all saved problems for the current user with full details & statistics
 * @route   GET /api/users/me/saved-problems
 * @access  Private (JWT Protected)
 */
const getMySavedProblems = async (req, res) => {
  try {
    const { sort = 'newest_saved' } = req.query;

    const sortOption = sort === 'oldest_saved' ? { createdAt: 1 } : { createdAt: -1 };

    const savedRecords = await SavedProblem.find({ user: req.user._id })
      .populate({
        path: 'problem',
        populate: [
          { path: 'createdBy', select: 'name email' },
          { path: 'bestAnswer' },
        ],
      })
      .sort(sortOption)
      .lean();

    // Filter out orphaned records if the referenced problem was deleted
    const validSavedRecords = savedRecords.filter((rec) => rec.problem != null);

    // Compute answersCount, total helpful votes, and status for each saved problem
    const savedProblemsWithMeta = await Promise.all(
      validSavedRecords.map(async (rec) => {
        const prob = rec.problem;
        const probId = prob._id;

        // Get answers count and answer IDs
        const answers = await Answer.find({ problem: probId }).select('_id').lean();
        const answersCount = answers.length;
        const answerIds = answers.map((a) => a._id);

        // Aggregate total helpful votes across all answers for this problem
        const totalHelpfulVotes = await AnswerVote.countDocuments({
          answer: { $in: answerIds },
          voteType: 'helpful',
        });

        const status = computeProblemStatus(prob, answersCount);

        const problemData = {
          ...prob,
          answersCount,
          totalHelpfulVotes,
          status,
          isSaved: true,
        };

        return {
          _id: prob._id, // Problem ID
          savedProblemId: rec._id,
          user: rec.user,
          savedAt: rec.createdAt,
          createdAt: rec.createdAt,
          problem: problemData,
          ...problemData,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: savedProblemsWithMeta.length,
      savedProblems: savedProblemsWithMeta,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch saved problems: ' + error.message,
    });
  }
};

module.exports = {
  saveProblem,
  unsaveProblem,
  getMySavedProblemIds,
  getMySavedProblems,
};
