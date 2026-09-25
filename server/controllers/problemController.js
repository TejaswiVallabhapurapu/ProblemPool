const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const Answer = require('../models/Answer');
const AnswerVote = require('../models/AnswerVote');
const Review = require('../models/Review');
const ReviewVote = require('../models/ReviewVote');
const Reply = require('../models/Reply');
const SavedProblem = require('../models/SavedProblem');
const User = require('../models/User');
const Follow = require('../models/Follow');
const { adjustReputation, REPUTATION_RULES } = require('../services/reputationService');
const { createNotification } = require('../services/notificationService');

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

// In-memory cache for view deduplication: clientKey -> lastViewedTimestamp
const viewCooldownCache = new Map();
const VIEW_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes cooldown per user/client per problem

// Periodic garbage collection for view deduplication cache (every 30 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of viewCooldownCache.entries()) {
    if (now - timestamp > VIEW_COOLDOWN_MS) {
      viewCooldownCache.delete(key);
    }
  }
}, 30 * 60 * 1000);

/**
 * Checks if a view from the current request should be counted (deduplication)
 */
const shouldIncrementView = (req, problemId) => {
  const userId = req.user ? req.user._id.toString() : null;
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1';
  const clientId = req.headers['x-client-id'] || req.headers['user-agent'] || 'client';

  const key = userId ? `user:${userId}:${problemId}` : `guest:${ip}:${clientId}:${problemId}`;
  const now = Date.now();
  const lastViewed = viewCooldownCache.get(key);

  if (!lastViewed || now - lastViewed > VIEW_COOLDOWN_MS) {
    viewCooldownCache.set(key, now);
    return true;
  }
  return false;
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

    // Check if view should be incremented (deduplication against refresh spam)
    const isNewView = shouldIncrementView(req, id);

    let problem;
    if (isNewView) {
      problem = await Problem.findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },
        { new: true }
      )
        .populate('createdBy', 'name username avatar email')
        .populate('bestAnswer')
        .lean();
    } else {
      problem = await Problem.findById(id)
        .populate('createdBy', 'name username avatar email')
        .populate('bestAnswer')
        .lean();
    }

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
        views: problem.views || 0,
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

/**
 * @desc    Get Trending Problems based on recent activity & engagement score
 * @route   GET /api/problems/trending
 * @access  Public
 */
const getTrendingProblems = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    // Fetch active problems
    const problems = await Problem.find()
      .populate('createdBy', 'name username avatar email')
      .populate('bestAnswer')
      .lean();

    if (!problems.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        totalCount: 0,
        page,
        limit,
        problems: [],
      });
    }

    const problemIds = problems.map((p) => p._id);

    // Aggregate answers count
    const answersGroup = await Answer.aggregate([
      { $match: { problem: { $in: problemIds } } },
      { $group: { _id: '$problem', count: { $sum: 1 }, answerIds: { $push: '$_id' } } },
    ]);
    const answersCountMap = new Map();
    const allAnswerIds = [];
    const problemAnswerIdsMap = new Map();

    answersGroup.forEach((ag) => {
      answersCountMap.set(ag._id.toString(), ag.count);
      problemAnswerIdsMap.set(ag._id.toString(), ag.answerIds);
      allAnswerIds.push(...ag.answerIds);
    });

    // Aggregate helpful votes
    const helpfulVotesGroup = await AnswerVote.aggregate([
      { $match: { answer: { $in: allAnswerIds }, voteType: 'helpful' } },
      { $group: { _id: '$answer', count: { $sum: 1 } } },
    ]);
    const helpfulVotesMap = new Map();
    helpfulVotesGroup.forEach((hg) => {
      helpfulVotesMap.set(hg._id.toString(), hg.count);
    });

    // Aggregate saves count
    const savesGroup = await SavedProblem.aggregate([
      { $match: { problem: { $in: problemIds } } },
      { $group: { _id: '$problem', count: { $sum: 1 } } },
    ]);
    const savesCountMap = new Map();
    savesGroup.forEach((sg) => {
      savesCountMap.set(sg._id.toString(), sg.count);
    });

    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // Calculate Trending Score for each problem
    const trendingProblems = problems.map((p) => {
      const pid = p._id.toString();
      const answersCount = answersCountMap.get(pid) || 0;
      const savesCount = savesCountMap.get(pid) || 0;
      const ansIds = problemAnswerIdsMap.get(pid) || [];
      const totalHelpfulVotes = ansIds.reduce(
        (sum, aId) => sum + (helpfulVotesMap.get(aId.toString()) || 0),
        0
      );
      const views = p.views || 0;
      const status = computeProblemStatus(p, answersCount);

      // Recency bonus (in days)
      const ageInDays = (now - new Date(p.createdAt).getTime()) / ONE_DAY_MS;
      let recencyBonus = 0;
      if (ageInDays <= 1) {
        recencyBonus = 50;
      } else if (ageInDays <= 3) {
        recencyBonus = 35;
      } else if (ageInDays <= 7) {
        recencyBonus = 20;
      } else if (ageInDays <= 30) {
        recencyBonus = 10;
      } else {
        recencyBonus = Math.max(0, 5 - Math.floor(ageInDays / 30));
      }

      // Explainable scoring formula:
      // Views (1 pt) + Answers (6 pts) + Saves (4 pts) + Helpful Votes (3 pts) + Recency Bonus
      const trendingScore =
        views * 1 +
        answersCount * 6 +
        savesCount * 4 +
        totalHelpfulVotes * 3 +
        recencyBonus;

      return {
        ...p,
        tags: Array.isArray(p.tags) ? p.tags : [],
        views,
        answersCount,
        savesCount,
        totalHelpfulVotes,
        status,
        trendingScore: Math.round(trendingScore * 10) / 10,
      };
    });

    // Sort by trending score descending
    trendingProblems.sort(
      (a, b) => b.trendingScore - a.trendingScore || new Date(b.createdAt) - new Date(a.createdAt)
    );

    const startIndex = (page - 1) * limit;
    const paginatedProblems = trendingProblems.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      count: paginatedProblems.length,
      totalCount: trendingProblems.length,
      page,
      limit,
      problems: paginatedProblems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch trending problems: ' + error.message,
    });
  }
};

/**
 * @desc    Get Popular Problems based on all-time views & answers
 * @route   GET /api/problems/popular
 * @access  Public
 */
const getPopularProblems = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    req.query.sort = 'most_viewed';
    req.query.limit = limit;
    req.query.page = page;
    return getProblems(req, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch popular problems: ' + error.message,
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

      // Notify answer author
      createNotification({
        recipient: answer.user,
        sender: req.user._id,
        type: 'best_answer',
        title: '⭐ Best Answer Awarded!',
        message: `Your answer was selected as Best Answer on "${problem.title.slice(0, 50)}..." (+15 rep)`,
        referenceType: 'problem',
        referenceId: problem._id,
        link: `/problems/${problem._id}`,
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

/**
 * Batch formatter for problems list to prevent N+1 queries
 */
const batchFormatProblems = async (rawProblems) => {
  if (!rawProblems || rawProblems.length === 0) return [];

  const problemIds = rawProblems.map((p) => p._id);

  // 1. Batch answers lookup
  const answers = await Answer.find({ problem: { $in: problemIds } })
    .select('_id problem')
    .lean();

  const answersCountMap = new Map();
  const problemAnswerIdsMap = new Map();

  answers.forEach((a) => {
    const pId = a.problem.toString();
    answersCountMap.set(pId, (answersCountMap.get(pId) || 0) + 1);
    if (!problemAnswerIdsMap.has(pId)) {
      problemAnswerIdsMap.set(pId, []);
    }
    problemAnswerIdsMap.get(pId).push(a._id);
  });

  const allAnswerIds = answers.map((a) => a._id);

  // 2. Batch helpful votes
  const helpfulVotes = await AnswerVote.find({
    answer: { $in: allAnswerIds },
    voteType: 'helpful',
  })
    .select('answer')
    .lean();

  const answerToHelpfulCountMap = new Map();
  helpfulVotes.forEach((v) => {
    const aId = v.answer.toString();
    answerToHelpfulCountMap.set(aId, (answerToHelpfulCountMap.get(aId) || 0) + 1);
  });

  // 3. Batch saves count
  const saves = await SavedProblem.find({ problem: { $in: problemIds } })
    .select('problem')
    .lean();

  const savesCountMap = new Map();
  saves.forEach((s) => {
    const pId = s.problem.toString();
    savesCountMap.set(pId, (savesCountMap.get(pId) || 0) + 1);
  });

  return rawProblems.map((p) => {
    const pId = p._id.toString();
    const answersCount = answersCountMap.get(pId) || 0;
    const answerIds = problemAnswerIdsMap.get(pId) || [];
    let totalHelpfulVotes = 0;
    answerIds.forEach((aId) => {
      totalHelpfulVotes += answerToHelpfulCountMap.get(aId.toString()) || 0;
    });
    const savesCount = savesCountMap.get(pId) || 0;
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
  });
};

/**
 * @desc    Get Personalized Home Feed
 *          Sections: Recommended, Following, Trending, Unanswered, Recent
 * @route   GET /api/problems/feed
 * @access  Public (optional JWT for personalized recommendations and following feed)
 */
const getPersonalizedFeed = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    let userInterests = [];
    let followedUserIds = [];

    if (userId) {
      // Reload user interests to get most up to date preferences
      const currentUser = await User.findById(userId).select('interests').lean();
      if (currentUser && Array.isArray(currentUser.interests)) {
        userInterests = currentUser.interests
          .map((i) => String(i).trim().toLowerCase())
          .filter(Boolean);
      }

      // Get user's following list from Follow model
      const follows = await Follow.find({ follower: userId }).select('following').lean();
      followedUserIds = follows.map((f) => f.following);
    }

    // 1. Fetch Recommended Problems
    let recommendedQuery = {};
    if (userInterests.length > 0) {
      // Find problems matching any of user's interests (tags or category)
      const interestRegexes = userInterests.map((i) => new RegExp(`^${i}$`, 'i'));
      recommendedQuery = {
        $or: [
          { tags: { $in: userInterests } },
          { category: { $in: interestRegexes } },
        ],
      };
      if (userId) {
        recommendedQuery.createdBy = { $ne: userId };
      }
    }

    const rawRecommended = await Problem.find(recommendedQuery)
      .populate('createdBy', 'name username avatar email')
      .populate('bestAnswer')
      .sort({ views: -1, createdAt: -1 })
      .limit(9)
      .lean();

    // If no interests or not enough recommended items, fill with top viewed / active
    let recommendedProblems = rawRecommended;
    if (recommendedProblems.length < 3) {
      const existingIds = new Set(recommendedProblems.map((p) => p._id.toString()));
      const fallbackProblems = await Problem.find({ _id: { $nin: Array.from(existingIds) } })
        .populate('createdBy', 'name username avatar email')
        .populate('bestAnswer')
        .sort({ views: -1, createdAt: -1 })
        .limit(9 - recommendedProblems.length)
        .lean();
      recommendedProblems = [...recommendedProblems, ...fallbackProblems];
    }

    // 2. Fetch Problems from People You Follow
    let rawFollowing = [];
    if (followedUserIds.length > 0) {
      rawFollowing = await Problem.find({ createdBy: { $in: followedUserIds } })
        .populate('createdBy', 'name username avatar email')
        .populate('bestAnswer')
        .sort({ createdAt: -1 })
        .limit(9)
        .lean();
    }

    // 3. Fetch Trending Problems
    const rawTrending = await Problem.find()
      .populate('createdBy', 'name username avatar email')
      .populate('bestAnswer')
      .sort({ views: -1, createdAt: -1 })
      .limit(6)
      .lean();

    // 4. Fetch Unanswered Problems Candidate List
    const rawUnansweredCandidates = await Problem.find({ bestAnswer: null })
      .populate('createdBy', 'name username avatar email')
      .populate('bestAnswer')
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    // 5. Fetch Recently Asked Problems
    const rawRecent = await Problem.find()
      .populate('createdBy', 'name username avatar email')
      .populate('bestAnswer')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    // Format all in parallel batch
    const [
      formattedRecommended,
      formattedFollowing,
      formattedTrending,
      formattedUnansweredAll,
      formattedRecent,
    ] = await Promise.all([
      batchFormatProblems(recommendedProblems),
      batchFormatProblems(rawFollowing),
      batchFormatProblems(rawTrending),
      batchFormatProblems(rawUnansweredCandidates),
      batchFormatProblems(rawRecent),
    ]);

    const formattedUnanswered = formattedUnansweredAll
      .filter((p) => p.answersCount === 0)
      .slice(0, 6);

    return res.status(200).json({
      success: true,
      isPersonalized: Boolean(userId),
      hasInterests: userInterests.length > 0,
      hasFollowing: followedUserIds.length > 0,
      userInterests: req.user?.interests || [],
      feed: {
        recommended: formattedRecommended,
        following: formattedFollowing,
        trending: formattedTrending,
        unanswered: formattedUnanswered,
        recent: formattedRecent,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate personalized feed: ' + error.message,
    });
  }
};

// Common stopwords to exclude from keyword extraction
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'to', 'of', 'in', 'for', 'with', 'on', 'at', 'by', 'from', 'up', 'about', 'into',
  'over', 'after', 'how', 'what', 'why', 'when', 'where', 'who', 'which', 'can',
  'could', 'should', 'would', 'do', 'does', 'did', 'not', 'no', 'my', 'your', 'his',
  'her', 'their', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
  'it', 'we', 'they', 'me', 'him', 'us', 'them', 'if', 'so', 'then', 'than', 'as',
  'using', 'getting', 'having', 'working', 'help', 'need', 'error', 'issue', 'problem',
]);

const extractKeywords = (text) => {
  if (!text || typeof text !== 'string') return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  return Array.from(new Set(words)).slice(0, 10);
};

/**
 * @desc    Get related problems for a given problem
 *          Uses shared tags, category, and relevant keywords
 * @route   GET /api/problems/:id/related
 * @access  Public
 */
const getRelatedProblems = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 10);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid problem ID format' });
    }

    const currentProblem = await Problem.findById(id).select('title tags category description').lean();
    if (!currentProblem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const tags = Array.isArray(currentProblem.tags) ? currentProblem.tags : [];
    const keywords = extractKeywords(currentProblem.title);

    const orConditions = [];

    if (tags.length > 0) {
      orConditions.push({ tags: { $in: tags } });
    }

    if (currentProblem.category && currentProblem.category !== 'General') {
      orConditions.push({ category: currentProblem.category });
    }

    if (keywords.length > 0) {
      const keywordRegexes = keywords.map((kw) => new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      orConditions.push({ title: { $in: keywordRegexes } });
    }

    let candidates = [];
    if (orConditions.length > 0) {
      candidates = await Problem.find({
        _id: { $ne: currentProblem._id },
        $or: orConditions,
      })
        .populate('createdBy', 'name username avatar')
        .populate('bestAnswer')
        .limit(20)
        .lean();
    }

    // Score candidates by relevance
    const scoredCandidates = candidates.map((p) => {
      let score = 0;
      const pTags = Array.isArray(p.tags) ? p.tags : [];

      // 1. Tag overlap (+3 per common tag)
      tags.forEach((t) => {
        if (pTags.includes(t)) score += 3;
      });

      // 2. Category match (+2)
      if (p.category === currentProblem.category) score += 2;

      // 3. Title keyword matches (+2 per word)
      const pTitleLower = (p.title || '').toLowerCase();
      keywords.forEach((kw) => {
        if (pTitleLower.includes(kw)) score += 2;
      });

      // 4. Slight view popularity weight
      score += Math.min((p.views || 0) * 0.05, 2);

      return { problem: p, score };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);

    let selectedProblems = scoredCandidates.slice(0, limit).map((sc) => sc.problem);

    // If not enough related candidates, fill with category or popular
    if (selectedProblems.length < limit) {
      const existingIds = new Set([
        currentProblem._id.toString(),
        ...selectedProblems.map((p) => p._id.toString()),
      ]);
      const fallback = await Problem.find({
        _id: { $nin: Array.from(existingIds) },
        ...(currentProblem.category ? { category: currentProblem.category } : {}),
      })
        .populate('createdBy', 'name username avatar')
        .populate('bestAnswer')
        .sort({ views: -1, createdAt: -1 })
        .limit(limit - selectedProblems.length)
        .lean();

      selectedProblems = [...selectedProblems, ...fallback];
    }

    const formattedProblems = await batchFormatProblems(selectedProblems);

    return res.status(200).json({
      success: true,
      count: formattedProblems.length,
      problems: formattedProblems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch related problems: ' + error.message,
    });
  }
};

/**
 * @desc    Check for potential duplicate / similar problems before posting
 * @route   POST /api/problems/similar or GET /api/problems/similar
 * @access  Public
 */
const checkSimilarProblems = async (req, res) => {
  try {
    const title = req.body.title || req.query.title || '';
    const description = req.body.description || req.query.description || '';
    const category = req.body.category || req.query.category || '';
    const tags = req.body.tags || req.query.tags || [];

    const cleanTitle = typeof title === 'string' ? title.trim() : '';

    if (!cleanTitle || cleanTitle.length < 3) {
      return res.status(200).json({
        success: true,
        count: 0,
        similarProblems: [],
      });
    }

    const keywords = extractKeywords(cleanTitle);
    const normalizedTagList = normalizeTags(tags);

    const orConditions = [];

    // 1. Direct title regex match
    if (cleanTitle.length >= 4) {
      orConditions.push({
        title: new RegExp(cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      });
    }

    // 2. Keyword regexes in title
    if (keywords.length > 0) {
      const kwRegexes = keywords.map(
        (kw) => new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      );
      orConditions.push({ title: { $in: kwRegexes } });
    }

    // 3. Tag matches
    if (normalizedTagList.length > 0) {
      orConditions.push({ tags: { $in: normalizedTagList } });
    }

    if (orConditions.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        similarProblems: [],
      });
    }

    const candidates = await Problem.find({ $or: orConditions })
      .populate('createdBy', 'name username avatar')
      .populate('bestAnswer')
      .sort({ views: -1, createdAt: -1 })
      .limit(15)
      .lean();

    // Score and rank matches
    const scored = candidates.map((p) => {
      let score = 0;
      const pTitleLower = (p.title || '').toLowerCase();
      const inputTitleLower = cleanTitle.toLowerCase();

      // Full substring match (+10)
      if (pTitleLower.includes(inputTitleLower) || inputTitleLower.includes(pTitleLower)) {
        score += 10;
      }

      // Keyword matches (+3 per word)
      keywords.forEach((kw) => {
        if (pTitleLower.includes(kw)) score += 3;
      });

      // Tag overlap (+2 per tag)
      const pTags = Array.isArray(p.tags) ? p.tags : [];
      normalizedTagList.forEach((t) => {
        if (pTags.includes(t)) score += 2;
      });

      // Category match (+1.5)
      if (category && p.category && p.category.toLowerCase() === category.toLowerCase()) {
        score += 1.5;
      }

      return { problem: p, score };
    });

    // Keep candidates with significant similarity (score >= 3)
    const filtered = scored.filter((item) => item.score >= 3);
    filtered.sort((a, b) => b.score - a.score);

    const topMatches = filtered.slice(0, 4).map((item) => item.problem);
    const formattedMatches = await batchFormatProblems(topMatches);

    return res.status(200).json({
      success: true,
      count: formattedMatches.length,
      similarProblems: formattedMatches,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to search similar problems: ' + error.message,
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
  getTrendingProblems,
  getPopularProblems,
  getPersonalizedFeed,
  getRelatedProblems,
  checkSimilarProblems,
  setBestAnswer,
  removeBestAnswer,
  normalizeTags,
  computeProblemStatus,
  batchFormatProblems,
};
