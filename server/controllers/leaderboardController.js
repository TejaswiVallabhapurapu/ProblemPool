const mongoose = require('mongoose');
const User = require('../models/User');
const Answer = require('../models/Answer');
const AnswerVote = require('../models/AnswerVote');
const Problem = require('../models/Problem');
const ReputationHistory = require('../models/ReputationHistory');

/**
 * Helper to compute start of timeframe
 */
const getTimeframeDate = (timeframe) => {
  const now = new Date();
  if (timeframe === 'week') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (timeframe === 'month') {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return null; // all time
};

/**
 * @desc    Get community leaderboard rankings
 * @route   GET /api/leaderboard
 * @access  Public
 */
const getLeaderboard = async (req, res) => {
  try {
    const { category = 'reputation', timeframe = 'all', limit = 50 } = req.query;

    const startDate = getTimeframeDate(timeframe);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    let leaders = [];
    let metricLabel = 'Reputation';

    if (category === 'reputation') {
      metricLabel = 'Reputation Points';

      if (!startDate) {
        // All-Time Top Reputation
        const users = await User.find({ isSuspended: { $ne: true } })
          .select('name username avatar reputation title location createdAt')
          .sort({ reputation: -1, createdAt: 1 })
          .limit(take)
          .lean();

        leaders = users.map((u, idx) => ({
          rank: idx + 1,
          _id: u._id,
          name: u.name,
          username: u.username || '',
          avatar: u.avatar || '',
          title: u.title || '',
          location: u.location || '',
          reputation: u.reputation || 0,
          primaryMetric: u.reputation || 0,
          metricLabel,
        }));
      } else {
        // Reputation Gained in Timeframe
        const repAgg = await ReputationHistory.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: '$user', pointsGained: { $sum: '$points' } } },
          { $sort: { pointsGained: -1 } },
          { $limit: take },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'userInfo',
            },
          },
          { $unwind: '$userInfo' },
          { $match: { 'userInfo.isSuspended': { $ne: true } } },
          {
            $project: {
              _id: 1,
              pointsGained: 1,
              name: '$userInfo.name',
              username: '$userInfo.username',
              avatar: '$userInfo.avatar',
              title: '$userInfo.title',
              location: '$userInfo.location',
              reputation: '$userInfo.reputation',
            },
          },
        ]);

        if (repAgg.length > 0) {
          leaders = repAgg.map((r, idx) => ({
            rank: idx + 1,
            _id: r._id,
            name: r.name,
            username: r.username || '',
            avatar: r.avatar || '',
            title: r.title || '',
            location: r.location || '',
            reputation: r.reputation || 0,
            primaryMetric: r.pointsGained,
            metricLabel: 'Points This Period',
          }));
        } else {
          // Fallback to all-time if no history recorded yet for timeframe
          const users = await User.find({ isSuspended: { $ne: true } })
            .select('name username avatar reputation title location createdAt')
            .sort({ reputation: -1, createdAt: 1 })
            .limit(take)
            .lean();

          leaders = users.map((u, idx) => ({
            rank: idx + 1,
            _id: u._id,
            name: u.name,
            username: u.username || '',
            avatar: u.avatar || '',
            title: u.title || '',
            location: u.location || '',
            reputation: u.reputation || 0,
            primaryMetric: u.reputation || 0,
            metricLabel: 'Total Reputation',
          }));
        }
      }
    } else if (category === 'helpful') {
      metricLabel = 'Helpful Votes Received';

      const matchStage = { voteType: 'helpful' };
      if (startDate) {
        matchStage.createdAt = { $gte: startDate };
      }

      const helpfulAgg = await AnswerVote.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'answers',
            localField: 'answer',
            foreignField: '_id',
            as: 'ans',
          },
        },
        { $unwind: '$ans' },
        {
          $group: {
            _id: '$ans.author',
            helpfulVotesCount: { $sum: 1 },
          },
        },
        { $sort: { helpfulVotesCount: -1 } },
        { $limit: take },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        { $unwind: '$userInfo' },
        { $match: { 'userInfo.isSuspended': { $ne: true } } },
        {
          $project: {
            _id: 1,
            helpfulVotesCount: 1,
            name: '$userInfo.name',
            username: '$userInfo.username',
            avatar: '$userInfo.avatar',
            title: '$userInfo.title',
            location: '$userInfo.location',
            reputation: '$userInfo.reputation',
          },
        },
      ]);

      if (helpfulAgg.length > 0) {
        leaders = helpfulAgg.map((h, idx) => ({
          rank: idx + 1,
          _id: h._id,
          name: h.name,
          username: h.username || '',
          avatar: h.avatar || '',
          title: h.title || '',
          location: h.location || '',
          reputation: h.reputation || 0,
          primaryMetric: h.helpfulVotesCount,
          metricLabel,
        }));
      } else {
        // Fallback to active users
        const users = await User.find({ isSuspended: { $ne: true } })
          .select('name username avatar reputation title location createdAt')
          .sort({ reputation: -1 })
          .limit(take)
          .lean();

        leaders = users.map((u, idx) => ({
          rank: idx + 1,
          _id: u._id,
          name: u.name,
          username: u.username || '',
          avatar: u.avatar || '',
          title: u.title || '',
          location: u.location || '',
          reputation: u.reputation || 0,
          primaryMetric: 0,
          metricLabel,
        }));
      }
    } else if (category === 'best_answers') {
      metricLabel = 'Best Answers Awarded';

      const matchStage = { isBestAnswer: true };
      if (startDate) {
        matchStage.updatedAt = { $gte: startDate };
      }

      const bestAnsAgg = await Answer.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$author',
            bestAnswersCount: { $sum: 1 },
          },
        },
        { $sort: { bestAnswersCount: -1 } },
        { $limit: take },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        { $unwind: '$userInfo' },
        { $match: { 'userInfo.isSuspended': { $ne: true } } },
        {
          $project: {
            _id: 1,
            bestAnswersCount: 1,
            name: '$userInfo.name',
            username: '$userInfo.username',
            avatar: '$userInfo.avatar',
            title: '$userInfo.title',
            location: '$userInfo.location',
            reputation: '$userInfo.reputation',
          },
        },
      ]);

      if (bestAnsAgg.length > 0) {
        leaders = bestAnsAgg.map((b, idx) => ({
          rank: idx + 1,
          _id: b._id,
          name: b.name,
          username: b.username || '',
          avatar: b.avatar || '',
          title: b.title || '',
          location: b.location || '',
          reputation: b.reputation || 0,
          primaryMetric: b.bestAnswersCount,
          metricLabel,
        }));
      } else {
        const users = await User.find({ isSuspended: { $ne: true } })
          .select('name username avatar reputation title location createdAt')
          .sort({ reputation: -1 })
          .limit(take)
          .lean();

        leaders = users.map((u, idx) => ({
          rank: idx + 1,
          _id: u._id,
          name: u.name,
          username: u.username || '',
          avatar: u.avatar || '',
          title: u.title || '',
          location: u.location || '',
          reputation: u.reputation || 0,
          primaryMetric: 0,
          metricLabel,
        }));
      }
    } else if (category === 'solved') {
      metricLabel = 'Problems Solved';

      const matchStage = {
        $or: [{ status: 'Solved' }, { bestAnswer: { $exists: true, $ne: null } }],
      };
      if (startDate) {
        matchStage.updatedAt = { $gte: startDate };
      }

      const solvedAgg = await Problem.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$createdBy',
            solvedCount: { $sum: 1 },
          },
        },
        { $sort: { solvedCount: -1 } },
        { $limit: take },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        { $unwind: '$userInfo' },
        { $match: { 'userInfo.isSuspended': { $ne: true } } },
        {
          $project: {
            _id: 1,
            solvedCount: 1,
            name: '$userInfo.name',
            username: '$userInfo.username',
            avatar: '$userInfo.avatar',
            title: '$userInfo.title',
            location: '$userInfo.location',
            reputation: '$userInfo.reputation',
          },
        },
      ]);

      if (solvedAgg.length > 0) {
        leaders = solvedAgg.map((s, idx) => ({
          rank: idx + 1,
          _id: s._id,
          name: s.name,
          username: s.username || '',
          avatar: s.avatar || '',
          title: s.title || '',
          location: s.location || '',
          reputation: s.reputation || 0,
          primaryMetric: s.solvedCount,
          metricLabel,
        }));
      } else {
        const users = await User.find({ isSuspended: { $ne: true } })
          .select('name username avatar reputation title location createdAt')
          .sort({ reputation: -1 })
          .limit(take)
          .lean();

        leaders = users.map((u, idx) => ({
          rank: idx + 1,
          _id: u._id,
          name: u.name,
          username: u.username || '',
          avatar: u.avatar || '',
          title: u.title || '',
          location: u.location || '',
          reputation: u.reputation || 0,
          primaryMetric: 0,
          metricLabel,
        }));
      }
    }

    return res.status(200).json({
      success: true,
      category,
      timeframe,
      metricLabel,
      count: leaders.length,
      leaders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve leaderboard rankings: ' + error.message,
    });
  }
};

module.exports = {
  getLeaderboard,
};
