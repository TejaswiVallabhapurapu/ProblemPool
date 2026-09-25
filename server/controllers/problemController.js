const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const Answer = require('../models/Answer');
const AnswerVote = require('../models/AnswerVote');
const Review = require('../models/Review');
const ReviewVote = require('../models/ReviewVote');
const Reply = require('../models/Reply');
const SavedProblem = require('../models/SavedProblem');
const User = require('../models/User');
const { adjustReputation, REPUTATION_RULES } = require('../services/reputationService');

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

/**
 * Helper to clean and normalize tags array
 * - lowercase, trimmed, special character stripped
 * - max 10 tags, 1-30 chars each, deduplicated
 */
const normalizeTags = (tagsInput) => {
  if (!tagsInput) return [];
  let rawList = [];
  if (Array.isArray(tagsInput)) {
    rawList = tagsInput;
  } else if (typeof tagsInput === 'string') {
    rawList = tagsInput.split(/[,#\s]+/);
  }

  const cleaned = rawList
    .map((t) => (typeof t === 'string' ? t.trim().toLowerCase().replace(/[^a-z0-9+#.-]/g, '') : ''))
    .filter((t) => t && t.length >= 1 && t.length <= 30);

  return Array.from(new Set(cleaned)).slice(0, 10);
};

/**
 * @desc    Get / Advanced Search Problems with multi-field queries, status filters, and sorting
 * @route   GET /api/problems or GET /api/problems/search
 * @access  Public (optional JWT for my_problems/saved_problems)
 */
const getProblems = async (req, res) => {
  try {
    const {
      q,
      category,
      tag,
      status, // 'all' | 'unanswered' | 'answered' | 'solved' | 'my_problems' | 'saved_problems'
      sort = 'newest', // 'newest' | 'oldest' | 'most_viewed' | 'most_answered' | 'most_helpful' | 'most_saved'
      page = 1,
      limit = 100,
    } = req.query;

    const query = {};

    // 1. Category Filter
    if (category && category !== 'All' && category.trim() !== '') {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // 2. Tag Filter
    if (tag && tag.trim() !== '') {
      const cleanTag = tag.trim().toLowerCase();
      query.tags = cleanTag;
    }

    // 3. Status Filter (DB level where possible)
    if (status === 'solved') {
      query.bestAnswer = { $ne: null };
    } else if (status === 'my_problems') {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Login required for My Problems filter' });
      }
      query.createdBy = req.user._id;
    } else if (status === 'saved_problems') {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Login required for Saved Problems filter' });
      }
      const savedDocs = await SavedProblem.find({ user: req.user._id }).select('problem').lean();
      const savedIds = savedDocs.map((s) => s.problem);
      query._id = { $in: savedIds };
    }

    // 4. Keyword Search (Across Title, Description, Tags, Category, or Author Username)
    if (q && q.trim() !== '') {
      const term = q.trim();
      const regex = new RegExp(term, 'i');

      // Find any users matching username or name
      const matchingUsers = await User.find({
        $or: [{ name: regex }, { username: regex }],
      }).select('_id').lean();
      const matchingUserIds = matchingUsers.map((u) => u._id);

      const orConditions = [
        { title: regex },
        { description: regex },
        { category: regex },
        { tags: { $in: [term.toLowerCase(), regex] } },
      ];

      if (matchingUserIds.length > 0) {
        orConditions.push({ createdBy: { $in: matchingUserIds } });
      }

      query.$or = orConditions;
    }

    // 5. Initial Sorting (for fields stored directly in Problem document)
    let mongoSort = { createdAt: -1 };
    if (sort === 'oldest') {
      mongoSort = { createdAt: 1 };
    } else if (sort === 'most_viewed') {
      mongoSort = { views: -1, createdAt: -1 };
    }

    // Fetch base problem documents
    const rawProblems = await Problem.find(query)
      .populate('createdBy', 'name username avatar email')
      .populate('bestAnswer')
      .sort(mongoSort)
      .lean();

    // 6. Compute dynamic statistics (answersCount, totalHelpfulVotes, savesCount, status)
    let problemsWithMeta = await Promise.all(
      rawProblems.map(async (p) => {
        const answers = await Answer.find({ problem: p._id }).select('_id').lean();
        const answersCount = answers.length;
        const answerIds = answers.map((a) => a._id);

        const [totalHelpfulVotes, savesCount] = await Promise.all([
          AnswerVote.countDocuments({
            answer: { $in: answerIds },
            voteType: 'helpful',
          }),
          SavedProblem.countDocuments({ problem: p._id }),
        ]);

        const computedStatus = computeProblemStatus(p, answersCount);

        return {
          ...p,
          tags: Array.isArray(p.tags) ? p.tags : [],
          views: p.views || 0,
          answersCount,
          totalHelpfulVotes,
          savesCount,
          status: computedStatus,
        };
      })
    );

    // 7. Post-filter for status that relies on dynamic answers count (Unanswered / Answered)
    if (status === 'unanswered') {
      problemsWithMeta = problemsWithMeta.filter((p) => p.answersCount === 0);
    } else if (status === 'answered') {
      problemsWithMeta = problemsWithMeta.filter((p) => p.answersCount > 0 && !p.bestAnswer);
    }

    // 8. Dynamic Sorting for aggregate metrics
    if (sort === 'most_answered') {
      problemsWithMeta.sort((a, b) => b.answersCount - a.answersCount || new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'most_helpful') {
      problemsWithMeta.sort((a, b) => b.totalHelpfulVotes - a.totalHelpfulVotes || new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'most_saved') {
      problemsWithMeta.sort((a, b) => b.savesCount - a.savesCount || new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json({
      success: true,
      totalCount: problemsWithMeta.length,
      problems: problemsWithMeta,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch problems: ' + error.message,
    });
  }
};

// @desc    Search problems endpoint alias
// @route   GET /api/problems/search
const searchProblems = getProblems;

// @desc    Get single problem by ID with answersCount, helpful votes, views incrementation, and status
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

    // Increment views count atomically
    const problem = await Problem.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('createdBy', 'name username avatar email')
      .populate('bestAnswer')
      .lean();

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    const answers = await Answer.find({ problem: id }).select('_id').lean();
    const answersCount = answers.length;
    const answerIds = answers.map((a) => a._id);

    const [totalHelpfulVotes, savesCount] = await Promise.all([
      AnswerVote.countDocuments({
        answer: { $in: answerIds },
        voteType: 'helpful',
      }),
      SavedProblem.countDocuments({ problem: id }),
    ]);

    const status = computeProblemStatus(problem, answersCount);

    return res.status(200).json({
      success: true,
      problem: {
        ...problem,
        tags: Array.isArray(problem.tags) ? problem.tags : [],
        views: problem.views || 1,
        answersCount,
        totalHelpfulVotes,
        savesCount,
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

// @desc    Create a new problem with tags & category (Protected)
// @route   POST /api/problems
const createProblem = async (req, res) => {
  try {
    const { title, description, category, location, tags } = req.body;

    // Validate required fields
    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, category, and location',
      });
    }

    const normalizedTagList = normalizeTags(tags);

    // Creator comes strictly from req.user._id set by authMiddleware
    const newProblem = await Problem.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      tags: normalizedTagList,
      views: 0,
      createdBy: req.user._id,
      bestAnswer: null,
    });

    // Award reputation points for posting a problem (+2)
    adjustReputation({
      userId: req.user._id,
      points: REPUTATION_RULES.POST_PROBLEM,
      reason: `Posted a problem: "${newProblem.title.slice(0, 50)}"`,
      referenceType: 'problem',
      referenceId: newProblem._id,
    });

    const populatedProblem = await Problem.findById(newProblem._id)
      .populate('createdBy', 'name username avatar email')
      .lean();

    return res.status(201).json({
      success: true,
      problem: {
        ...populatedProblem,
        tags: normalizedTagList,
        views: 0,
        answersCount: 0,
        totalHelpfulVotes: 0,
        savesCount: 0,
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

// @desc    Update an existing problem (Protected - Problem Creator Only)
// @route   PUT /api/problems/:id
const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, location, tags } = req.body;

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

    if (problem.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this problem',
      });
    }

    if (title && title.trim()) problem.title = title.trim();
    if (description && description.trim()) problem.description = description.trim();
    if (category && category.trim()) problem.category = category.trim();
    if (location && location.trim()) problem.location = location.trim();
    if (tags !== undefined) problem.tags = normalizeTags(tags);

    await problem.save();

    const updatedProblem = await Problem.findById(id)
      .populate('createdBy', 'name username avatar email')
      .populate('bestAnswer')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Problem updated successfully',
      problem: updatedProblem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update problem: ' + error.message,
    });
  }
};

// @desc    Delete a problem and cascade delete all associated answers, votes, reviews, replies, and saved records
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

    // Authorization check
    if (problem.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this problem',
      });
    }

    const answers = await Answer.find({ problem: id }).select('_id');
    const answerIds = answers.map((a) => a._id);

    const reviews = await Review.find({ answer: { $in: answerIds } }).select('_id');
    const reviewIds = reviews.map((r) => r._id);

    await Promise.all([
      Problem.findByIdAndDelete(id),
      SavedProblem.deleteMany({ problem: id }),
      Answer.deleteMany({ problem: id }),
      AnswerVote.deleteMany({ answer: { $in: answerIds } }),
      Review.deleteMany({ answer: { $in: answerIds } }),
      ReviewVote.deleteMany({ review: { $in: reviewIds } }),
      Reply.deleteMany({ review: { $in: reviewIds } }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Problem and all related answers/reviews removed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete problem: ' + error.message,
    });
  }
};

// @desc    Get all problems by category
// @route   GET /api/problems/category/:category
const getProblemsByCategory = async (req, res) => {
  req.query.category = req.params.category;
  return getProblems(req, res);
};

// @desc    Get all problems by tag
// @route   GET /api/problems/tag/:tag
const getProblemsByTag = async (req, res) => {
  req.query.tag = req.params.tag;
  return getProblems(req, res);
};

// @desc    Get popular tags across all problems
// @route   GET /api/problems/tags
const getPopularTags = async (req, res) => {
  try {
    const tagsAggregate = await Problem.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 25 },
    ]);

    const tags = tagsAggregate.map((t) => ({
      tag: t._id,
      count: t.count,
    }));

    return res.status(200).json({
      success: true,
      tags,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve popular tags: ' + error.message,
    });
  }
};

// @desc    Mark an answer as Best Answer (Problem Owner Only)
// @route   PUT /api/problems/:problemId/best-answer/:answerId
const setBestAnswer = async (req, res) => {
  try {
    const { problemId, answerId } = req.params;

    if (!problemId || !mongoose.Types.ObjectId.isValid(problemId) || !answerId || !mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid problem or answer ID format',
      });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    if (problem.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the problem owner can select the Best Answer',
      });
    }

    const answer = await Answer.findById(answerId);
    if (!answer || answer.problem.toString() !== problemId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Answer does not belong to this problem',
      });
    }

    if (problem.bestAnswer && problem.bestAnswer.toString() !== answerId.toString()) {
      const oldAnswer = await Answer.findById(problem.bestAnswer);
      if (oldAnswer) {
        adjustReputation({
          userId: oldAnswer.user,
          points: -REPUTATION_RULES.BEST_ANSWER,
          reason: `Best Answer changed on: "${problem.title.slice(0, 45)}..."`,
          referenceType: 'best_answer',
          referenceId: oldAnswer._id,
        });
      }
    }

    if (!problem.bestAnswer || problem.bestAnswer.toString() !== answerId.toString()) {
      adjustReputation({
        userId: answer.user,
        points: REPUTATION_RULES.BEST_ANSWER,
        reason: `Your answer was selected as Best Answer on: "${problem.title.slice(0, 45)}..."`,
        referenceType: 'best_answer',
        referenceId: answer._id,
      });
    }

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

    if (problem.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the problem owner can remove the Best Answer',
      });
    }

    if (problem.bestAnswer) {
      const oldAnswer = await Answer.findById(problem.bestAnswer);
      if (oldAnswer) {
        adjustReputation({
          userId: oldAnswer.user,
          points: -REPUTATION_RULES.BEST_ANSWER,
          reason: `Best Answer designation removed on: "${problem.title.slice(0, 45)}..."`,
          referenceType: 'best_answer',
          referenceId: oldAnswer._id,
        });
      }
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
  searchProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemsByCategory,
  getProblemsByTag,
  getPopularTags,
  setBestAnswer,
  removeBestAnswer,
  normalizeTags,
  computeProblemStatus,
};
