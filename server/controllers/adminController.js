const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
const Problem = require('../models/Problem');
const Answer = require('../models/Answer');
const Review = require('../models/Review');
const Reply = require('../models/Reply');
const AnswerVote = require('../models/AnswerVote');
const ReviewVote = require('../models/ReviewVote');
const SavedProblem = require('../models/SavedProblem');
const Notification = require('../models/Notification');

/**
 * @desc    Get system metrics & statistics for Admin Dashboard
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProblems,
      totalAnswers,
      solvedProblems,
      totalReports,
      pendingReports,
      resolvedReports,
      suspendedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Problem.countDocuments(),
      Answer.countDocuments(),
      Problem.countDocuments({
        $or: [{ status: 'Solved' }, { bestAnswer: { $exists: true, $ne: null } }],
      }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'Pending' }),
      Report.countDocuments({ status: 'Resolved' }),
      User.countDocuments({ isSuspended: true }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProblems,
        totalAnswers,
        solvedProblems,
        totalReports,
        pendingReports,
        resolvedReports,
        suspendedUsers,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics: ' + error.message,
    });
  }
};

/**
 * @desc    Get list of reports with filters & hydrated content preview
 * @route   GET /api/admin/reports
 * @access  Private (Admin only)
 */
const getAdminReports = async (req, res) => {
  try {
    const { status, contentType, reason, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (contentType && contentType !== 'All') {
      query.contentType = contentType.toLowerCase();
    }

    if (reason && reason !== 'All') {
      query.reason = reason;
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [reports, totalCount] = await Promise.all([
      Report.find(query)
        .populate('reportedBy', 'name email username avatar role isSuspended')
        .populate('resolvedBy', 'name email username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Report.countDocuments(query),
    ]);

    // Hydrate target content for each report
    const hydratedReports = await Promise.all(
      reports.map(async (rep) => {
        let contentDetails = null;
        let targetAuthor = null;
        let isContentDeleted = false;

        try {
          if (rep.contentType === 'problem') {
            const prob = await Problem.findById(rep.contentId)
              .populate('createdBy', 'name email username avatar isSuspended')
              .lean();
            if (prob) {
              contentDetails = {
                title: prob.title,
                snippet: (prob.description || '').slice(0, 200),
                category: prob.category,
                tags: prob.tags,
                views: prob.views,
                answersCount: prob.answersCount,
                url: `/problems/${prob._id}`,
              };
              targetAuthor = prob.createdBy;
            } else {
              isContentDeleted = true;
            }
          } else if (rep.contentType === 'answer') {
            const ans = await Answer.findById(rep.contentId)
              .populate('author', 'name email username avatar isSuspended')
              .lean();
            if (ans) {
              contentDetails = {
                snippet: (ans.content || '').slice(0, 250),
                problemId: ans.problem,
                url: `/problems/${ans.problem}`,
              };
              targetAuthor = ans.author;
            } else {
              isContentDeleted = true;
            }
          } else if (rep.contentType === 'review') {
            const rev = await Review.findById(rep.contentId)
              .populate('reviewer', 'name email username avatar isSuspended')
              .lean();
            if (rev) {
              contentDetails = {
                snippet: (rev.content || '').slice(0, 250),
                rating: rev.rating,
                answerId: rev.answer,
                problemId: rev.problem,
                url: `/problems/${rev.problem}`,
              };
              targetAuthor = rev.reviewer;
            } else {
              isContentDeleted = true;
            }
          } else if (rep.contentType === 'user') {
            const usr = await User.findById(rep.contentId)
              .select('name email username avatar reputation isSuspended createdAt bio')
              .lean();
            if (usr) {
              contentDetails = {
                name: usr.name,
                username: usr.username,
                email: usr.email,
                reputation: usr.reputation,
                bio: usr.bio,
                url: `/profile/${usr.username || usr._id}`,
              };
              targetAuthor = usr;
            } else {
              isContentDeleted = true;
            }
          }
        } catch (err) {
          console.warn('Failed to hydrate report content:', err);
        }

        return {
          ...rep,
          contentDetails,
          targetAuthor,
          isContentDeleted,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: hydratedReports.length,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / take),
      reports: hydratedReports,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports: ' + error.message,
    });
  }
};

/**
 * @desc    Update report status (Reviewed, Dismissed, Resolved)
 * @route   PUT /api/admin/reports/:id/status
 * @access  Private (Admin only)
 */
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionTaken = '' } = req.body;

    if (!['Pending', 'Reviewed', 'Dismissed', 'Resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    report.status = status;
    if (actionTaken) {
      report.actionTaken = actionTaken.trim();
    }
    if (status === 'Resolved' || status === 'Dismissed') {
      report.resolvedBy = req.user._id;
      report.resolvedAt = new Date();
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: `Report status updated to "${status}"`,
      report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update report status: ' + error.message,
    });
  }
};

/**
 * @desc    Remove reported content (Problem, Answer, or Review) and resolve report
 * @route   DELETE /api/admin/reports/:id/content
 * @access  Private (Admin only)
 */
const removeReportedContent = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    const { contentType, contentId } = report;

    if (contentType === 'problem') {
      const prob = await Problem.findById(contentId);
      if (prob) {
        // Cascade remove related items
        const answers = await Answer.find({ problem: contentId }).select('_id').lean();
        const answerIds = answers.map((a) => a._id);

        await Promise.all([
          Answer.deleteMany({ problem: contentId }),
          Review.deleteMany({ problem: contentId }),
          Reply.deleteMany({ answer: { $in: answerIds } }),
          AnswerVote.deleteMany({ answer: { $in: answerIds } }),
          SavedProblem.deleteMany({ problem: contentId }),
          Notification.deleteMany({
            $or: [{ referenceId: contentId }, { referenceId: { $in: answerIds } }],
          }),
          Problem.findByIdAndDelete(contentId),
        ]);
      }
    } else if (contentType === 'answer') {
      const ans = await Answer.findById(contentId);
      if (ans) {
        const probId = ans.problem;
        await Promise.all([
          Review.deleteMany({ answer: contentId }),
          Reply.deleteMany({ answer: contentId }),
          AnswerVote.deleteMany({ answer: contentId }),
          Notification.deleteMany({ referenceId: contentId }),
          Answer.findByIdAndDelete(contentId),
        ]);

        if (probId) {
          const remainingCount = await Answer.countDocuments({ problem: probId });
          await Problem.findByIdAndUpdate(probId, { answersCount: remainingCount });
        }
      }
    } else if (contentType === 'review') {
      await Promise.all([
        Reply.deleteMany({ review: contentId }),
        ReviewVote.deleteMany({ review: contentId }),
        Notification.deleteMany({ referenceId: contentId }),
        Review.findByIdAndDelete(contentId),
      ]);
    }

    // Mark all pending reports for this content as Resolved
    await Report.updateMany(
      { contentType, contentId },
      {
        status: 'Resolved',
        actionTaken: 'Content permanently removed by administrator',
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Reported content has been permanently removed and related reports resolved.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to remove content: ' + error.message,
    });
  }
};

/**
 * @desc    Toggle user suspension status
 * @route   PUT /api/admin/users/:userId/suspend
 * @access  Private (Admin only)
 */
const toggleUserSuspension = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isSuspended, reason = '' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Prevent admin from suspending themselves
    if (req.user._id.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend your own administrator account',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const nextState = isSuspended !== undefined ? Boolean(isSuspended) : !targetUser.isSuspended;

    targetUser.isSuspended = nextState;
    if (nextState) {
      targetUser.suspendedAt = new Date();
      targetUser.suspendedReason = (reason || 'Violation of community guidelines').trim();
    } else {
      targetUser.suspendedAt = null;
      targetUser.suspendedReason = '';
    }

    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `User "${targetUser.name}" has been ${nextState ? 'suspended' : 'unsuspended'}`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isSuspended: targetUser.isSuspended,
        suspendedAt: targetUser.suspendedAt,
        suspendedReason: targetUser.suspendedReason,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user suspension status: ' + error.message,
    });
  }
};

/**
 * @desc    Get all users for Admin Management
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
const getAdminUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 50 } = req.query;

    const query = {};

    if (role && role !== 'All') {
      query.role = role.toLowerCase();
    }

    if (status === 'Suspended') {
      query.isSuspended = true;
    } else if (status === 'Active') {
      query.isSuspended = { $ne: true };
    }

    if (search) {
      const cleanSearch = search.trim();
      query.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { email: { $regex: cleanSearch, $options: 'i' } },
        { username: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      User.countDocuments(query),
    ]);

    // Populate problem and answer counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const [problemsCount, answersCount] = await Promise.all([
          Problem.countDocuments({ createdBy: u._id }),
          Answer.countDocuments({ author: u._id }),
        ]);

        return {
          ...u,
          problemsCount,
          answersCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: usersWithCounts.length,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / take),
      users: usersWithCounts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users: ' + error.message,
    });
  }
};

module.exports = {
  getAdminStats,
  getAdminReports,
  updateReportStatus,
  removeReportedContent,
  toggleUserSuspension,
  getAdminUsers,
};
