const mongoose = require('mongoose');
const Answer = require('../models/Answer');
const Problem = require('../models/Problem');
const AnswerVote = require('../models/AnswerVote');
const Review = require('../models/Review');
const ReviewVote = require('../models/ReviewVote');
const Reply = require('../models/Reply');

/**
 * @desc    Get all answers for a specific problem with vote counts, user vote, and best answer status
 * @route   GET /api/problems/:problemId/answers
 * @access  Public (Optional JWT for userVote status)
 */
const getAnswersByProblem = async (req, res) => {
  try {
    const problemId = req.params.problemId || req.params.id;
    const { sort = 'best_answer' } = req.query;

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

    // Fetch all answers for this problem
    const rawAnswers = await Answer.find({ problem: problemId })
      .populate('user', 'name email')
      .lean();

    const currentUserId = req.user ? req.user._id.toString() : null;
    const bestAnswerIdStr = problem.bestAnswer ? problem.bestAnswer.toString() : null;

    // Aggregate votes and reviews in parallel for all answers
    const answersWithMeta = await Promise.all(
      rawAnswers.map(async (ans) => {
        const ansId = ans._id;

        const [helpfulCount, notHelpfulCount, reviewCount, userVoteDoc] =
          await Promise.all([
            AnswerVote.countDocuments({ answer: ansId, voteType: 'helpful' }),
            AnswerVote.countDocuments({ answer: ansId, voteType: 'not_helpful' }),
            Review.countDocuments({ answer: ansId }),
            currentUserId
              ? AnswerVote.findOne({ answer: ansId, user: currentUserId }).lean()
              : null,
          ]);

        const isBestAnswer = Boolean(bestAnswerIdStr && bestAnswerIdStr === ansId.toString());

        return {
          ...ans,
          helpfulCount,
          notHelpfulCount,
          reviewCount,
          userVote: userVoteDoc ? userVoteDoc.voteType : null,
          isBestAnswer,
        };
      })
    );

    // Apply Sorting logic
    answersWithMeta.sort((a, b) => {
      if (sort === 'best_answer') {
        // Best answer strictly on top, then newest
        if (a.isBestAnswer && !b.isBestAnswer) return -1;
        if (!a.isBestAnswer && b.isBestAnswer) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      if (sort === 'most_helpful') {
        // Sort by net helpful votes (helpful - notHelpful) descending
        const scoreA = a.helpfulCount - a.notHelpfulCount;
        const scoreB = b.helpfulCount - b.notHelpfulCount;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      if (sort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      // Default / 'newest':
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({
      success: true,
      count: answersWithMeta.length,
      bestAnswerId: bestAnswerIdStr,
      answers: answersWithMeta,
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
        message: 'Answer content cannot be empty',
      });
    }

const { adjustReputation, REPUTATION_RULES } = require('../services/reputationService');

    // Create answer associated with problem & logged-in user
    const newAnswer = await Answer.create({
      problem: problemId,
      user: req.user._id,
      content: content.trim(),
    });

    // Award reputation points for answering (+5)
    adjustReputation({
      userId: req.user._id,
      points: REPUTATION_RULES.POST_ANSWER,
      reason: `Posted an answer to: "${problem.title.slice(0, 45)}..."`,
      referenceType: 'answer',
      referenceId: newAnswer._id,
    });

    // Populate user info for immediate frontend display
    const populatedAnswer = await Answer.findById(newAnswer._id)
      .populate('user', 'name email')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Answer submitted successfully',
      answer: {
        ...populatedAnswer,
        helpfulCount: 0,
        notHelpfulCount: 0,
        reviewCount: 0,
        userVote: null,
        isBestAnswer: false,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit answer: ' + error.message,
    });
  }
};

/**
 * @desc    Delete an answer and cascade delete its votes, reviews, replies
 * @route   DELETE /api/problems/:problemId/answers/:answerId
 * @access  Private (Author only)
 */
const deleteAnswer = async (req, res) => {
  try {
    const { answerId, problemId } = req.params;

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

    // If this was the best answer, remove reference from Problem
    if (problemId && mongoose.Types.ObjectId.isValid(problemId)) {
      await Problem.updateOne(
        { _id: problemId, bestAnswer: answerId },
        { $set: { bestAnswer: null } }
      );
    } else {
      await Problem.updateMany(
        { bestAnswer: answerId },
        { $set: { bestAnswer: null } }
      );
    }

    // Find all reviews belonging to this answer to cascade delete replies & review votes
    const reviews = await Review.find({ answer: answerId }).select('_id');
    const reviewIds = reviews.map((r) => r._id);

    // Cascade cleanups
    await Promise.all([
      Answer.findByIdAndDelete(answerId),
      AnswerVote.deleteMany({ answer: answerId }),
      Review.deleteMany({ answer: answerId }),
      ReviewVote.deleteMany({ review: { $in: reviewIds } }),
      Reply.deleteMany({ review: { $in: reviewIds } }),
    ]);

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

/**
 * @desc    Vote Helpful or Not Helpful on an answer
 * @route   POST /api/answers/:answerId/vote
 * @access  Private (JWT Protected)
 */
const voteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { voteType } = req.body;

    if (!answerId || !mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer ID format',
      });
    }

    if (!voteType || !['helpful', 'not_helpful'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: "voteType must be either 'helpful' or 'not_helpful'",
      });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found',
      });
    }

    // Rule: Answer author cannot vote on their own answer
    if (answer.user.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own answer',
      });
    }

    // Check if user has already voted
    const existingVote = await AnswerVote.findOne({
      answer: answerId,
      user: req.user._id,
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Same vote clicked again -> remove vote (toggle off)
        if (existingVote.voteType === 'helpful') {
          adjustReputation({
            userId: answer.user,
            points: -REPUTATION_RULES.HELPFUL_ANSWER_VOTE,
            reason: 'Helpful vote removed on your answer',
            referenceType: 'answer_vote',
            referenceId: answer._id,
          });
        }
        await AnswerVote.findByIdAndDelete(existingVote._id);
      } else {
        // Change vote (e.g. from helpful to not_helpful or vice versa)
        if (existingVote.voteType === 'helpful' && voteType === 'not_helpful') {
          adjustReputation({
            userId: answer.user,
            points: -REPUTATION_RULES.HELPFUL_ANSWER_VOTE,
            reason: 'Helpful vote changed on your answer',
            referenceType: 'answer_vote',
            referenceId: answer._id,
          });
        } else if (existingVote.voteType === 'not_helpful' && voteType === 'helpful') {
          adjustReputation({
            userId: answer.user,
            points: REPUTATION_RULES.HELPFUL_ANSWER_VOTE,
            reason: 'Your answer received a helpful vote',
            referenceType: 'answer_vote',
            referenceId: answer._id,
          });
        }
        existingVote.voteType = voteType;
        await existingVote.save();
      }
    } else {
      // Create new vote
      await AnswerVote.create({
        answer: answerId,
        user: req.user._id,
        voteType,
      });

      if (voteType === 'helpful') {
        adjustReputation({
          userId: answer.user,
          points: REPUTATION_RULES.HELPFUL_ANSWER_VOTE,
          reason: 'Your answer received a helpful vote',
          referenceType: 'answer_vote',
          referenceId: answer._id,
        });
      }
    }

    // Return updated counts and active user vote
    const [helpfulCount, notHelpfulCount, activeVote] = await Promise.all([
      AnswerVote.countDocuments({ answer: answerId, voteType: 'helpful' }),
      AnswerVote.countDocuments({ answer: answerId, voteType: 'not_helpful' }),
      AnswerVote.findOne({ answer: answerId, user: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      helpfulCount,
      notHelpfulCount,
      userVote: activeVote ? activeVote.voteType : null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to record vote: ' + error.message,
    });
  }
};

/**
 * @desc    Explicitly remove vote on an answer
 * @route   DELETE /api/answers/:answerId/vote
 * @access  Private (JWT Protected)
 */
const removeAnswerVote = async (req, res) => {
  try {
    const { answerId } = req.params;

    if (!answerId || !mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer ID format',
      });
    }

    const answer = await Answer.findById(answerId);
    const existingVote = await AnswerVote.findOne({
      answer: answerId,
      user: req.user._id,
    });

    if (existingVote && existingVote.voteType === 'helpful' && answer) {
      adjustReputation({
        userId: answer.user,
        points: -REPUTATION_RULES.HELPFUL_ANSWER_VOTE,
        reason: 'Helpful vote removed on your answer',
        referenceType: 'answer_vote',
        referenceId: answerId,
      });
    }

    await AnswerVote.findOneAndDelete({
      answer: answerId,
      user: req.user._id,
    });

    const [helpfulCount, notHelpfulCount] = await Promise.all([
      AnswerVote.countDocuments({ answer: answerId, voteType: 'helpful' }),
      AnswerVote.countDocuments({ answer: answerId, voteType: 'not_helpful' }),
    ]);

    return res.status(200).json({
      success: true,
      helpfulCount,
      notHelpfulCount,
      userVote: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to remove vote: ' + error.message,
    });
  }
};

module.exports = {
  getAnswersByProblem,
  createAnswer,
  deleteAnswer,
  voteAnswer,
  removeAnswerVote,
};
