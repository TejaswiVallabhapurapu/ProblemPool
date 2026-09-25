const mongoose = require('mongoose');
const User = require('../models/User');
const Problem = require('../models/Problem');
const Answer = require('../models/Answer');
const AnswerVote = require('../models/AnswerVote');
const Review = require('../models/Review');
const ReviewVote = require('../models/ReviewVote');
const Reply = require('../models/Reply');
const SavedProblem = require('../models/SavedProblem');
const ReputationHistory = require('../models/ReputationHistory');
const Achievement = require('../models/Achievement');
const {
  getUserFullStats,
  BADGES_DEFINITIONS,
  getUserLevel,
} = require('../services/reputationService');

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
 * @desc    Get complete stats, level, achievements, counts, and completion for logged-in user
 * @route   GET /api/users/me/stats
 * @access  Private
 */
const getMyProfileStats = async (req, res) => {
  try {
    const statsData = await getUserFullStats(req.user._id);
    if (!statsData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      ...statsData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile statistics: ' + error.message,
    });
  }
};

/**
 * @desc    Get public profile by ID or username
 * @route   GET /api/users/profile/:idOrUsername
 * @access  Public
 */
const getPublicUserProfile = async (req, res) => {
  try {
    const { idOrUsername } = req.params;

    let user = null;
    if (mongoose.Types.ObjectId.isValid(idOrUsername)) {
      user = await User.findById(idOrUsername).select('name username bio avatar location title reputation createdAt').lean();
    }
    if (!user) {
      user = await User.findOne({ username: idOrUsername.toLowerCase() }).select('name username bio avatar location title reputation createdAt').lean();
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const statsData = await getUserFullStats(user._id);

    // Sanitize for public consumption (omit email and private completion metrics)
    const publicProfile = {
      _id: user._id,
      name: user.name,
      username: user.username || user.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      bio: user.bio || '',
      avatar: user.avatar || '',
      location: user.location || '',
      title: user.title || '',
      createdAt: user.createdAt,
      stats: statsData.stats,
      level: statsData.level,
      achievements: statsData.achievements,
    };

    return res.status(200).json({
      success: true,
      profile: publicProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve public profile: ' + error.message,
    });
  }
};

/**
 * @desc    Update current user profile info (name, username, bio, location, title, avatar)
 * @route   PUT /api/users/me/profile
 * @access  Private
 */
const updateMyProfile = async (req, res) => {
  try {
    const { name, username, bio, location, title, avatar } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name && name.trim()) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim().slice(0, 500);
    if (location !== undefined) user.location = location.trim();
    if (title !== undefined) user.title = title.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();

    if (username && username.trim()) {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Username must be at least 3 alphanumeric characters',
        });
      }

      // Check if username is already taken by someone else
      const existingUser = await User.findOne({
        username: cleanUsername,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken by another community member',
        });
      }
      user.username = cleanUsername;
    }

    await user.save();

    const updatedStats = await getUserFullStats(userId);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedStats.user,
      profileCompletion: updatedStats.profileCompletion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile: ' + error.message,
    });
  }
};

/**
 * @desc    Get user's recent reputation history log
 * @route   GET /api/users/me/reputation-history
 * @access  Private
 */
const getMyReputationHistory = async (req, res) => {
  try {
    const history = await ReputationHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reputation history: ' + error.message,
    });
  }
};

/**
 * @desc    Get combined activity timeline for user
 * @route   GET /api/users/me/activity
 * @access  Private
 */
const getMyActivityTimeline = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all user actions in parallel
    const [problems, answers, reviews, savedProblems, reputationEntries] = await Promise.all([
      Problem.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(20).lean(),
      Answer.find({ user: userId }).populate('problem', 'title _id bestAnswer').sort({ createdAt: -1 }).limit(20).lean(),
      Review.find({ user: userId }).populate({ path: 'answer', populate: { path: 'problem', select: 'title _id' } }).sort({ createdAt: -1 }).limit(20).lean(),
      SavedProblem.find({ user: userId }).populate('problem', 'title _id').sort({ createdAt: -1 }).limit(20).lean(),
      ReputationHistory.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean(),
    ]);

    const activityList = [];

    // 1. Problems asked
    problems.forEach((p) => {
      activityList.push({
        id: `problem_${p._id}`,
        type: 'problem_asked',
        title: 'Asked a Problem',
        description: p.title,
        link: `/problems/${p._id}`,
        badge: '📝 Problem',
        timestamp: p.createdAt,
      });
    });

    // 2. Answers given
    answers.forEach((a) => {
      if (a.problem) {
        const isBest = a.problem.bestAnswer && a.problem.bestAnswer.toString() === a._id.toString();
        activityList.push({
          id: `answer_${a._id}`,
          type: 'answer_posted',
          title: isBest ? '🏆 Answer Marked as Best Solution' : '💡 Answered a Problem',
          description: `On: "${a.problem.title}" - ${a.content.slice(0, 120)}...`,
          link: `/problems/${a.problem._id}`,
          badge: isBest ? '⭐ Best Answer' : '💡 Answer',
          timestamp: a.createdAt,
        });
      }
    });

    // 3. Reviews posted
    reviews.forEach((r) => {
      const probId = r.answer?.problem?._id;
      const probTitle = r.answer?.problem?.title || 'Community Answer';
      activityList.push({
        id: `review_${r._id}`,
        type: 'review_posted',
        title: '⭐ Wrote an Answer Review',
        description: `On: "${probTitle}" - "${r.content.slice(0, 100)}..."`,
        link: probId ? `/problems/${probId}` : '/problems',
        badge: '⭐ Review',
        timestamp: r.createdAt,
      });
    });

    // 4. Saved problems
    savedProblems.forEach((sp) => {
      if (sp.problem) {
        activityList.push({
          id: `saved_${sp._id}`,
          type: 'problem_saved',
          title: '🔖 Bookmarked a Problem for Later',
          description: sp.problem.title,
          link: `/problems/${sp.problem._id}`,
          badge: '🔖 Saved',
          timestamp: sp.createdAt,
        });
      }
    });

    // 5. Reputation milestones
    reputationEntries.forEach((rh) => {
      if (rh.points >= 5) {
        activityList.push({
          id: `rep_${rh._id}`,
          type: 'reputation_gain',
          title: `+${rh.points} Reputation Earned`,
          description: rh.reason,
          link: null,
          badge: `+${rh.points} Rep`,
          timestamp: rh.createdAt,
        });
      }
    });

    // Sort by timestamp newest first
    activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.status(200).json({
      success: true,
      count: activityList.length,
      activities: activityList.slice(0, 40),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity timeline: ' + error.message,
    });
  }
};

/**
 * @desc    Get all problems posted by current user
 * @route   GET /api/users/me/problems
 * @access  Private
 */
const getMyProblems = async (req, res) => {
  try {
    const rawProblems = await Problem.find({ createdBy: req.user._id })
      .populate('bestAnswer')
      .sort({ createdAt: -1 })
      .lean();

    const problemsWithStats = await Promise.all(
      rawProblems.map(async (p) => {
        const answers = await Answer.find({ problem: p._id }).select('_id').lean();
        const answersCount = answers.length;
        const answerIds = answers.map((a) => a._id);

        const totalHelpfulVotes = await AnswerVote.countDocuments({
          answer: { $in: answerIds },
          voteType: 'helpful',
        });

        return {
          ...p,
          createdBy: { _id: req.user._id, name: req.user.name },
          answersCount,
          totalHelpfulVotes,
          status: computeProblemStatus(p, answersCount),
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: problemsWithStats.length,
      problems: problemsWithStats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user problems: ' + error.message,
    });
  }
};

/**
 * @desc    Get all answers posted by current user with helpful votes and Best Answer status
 * @route   GET /api/users/me/answers
 * @access  Private
 */
const getMyAnswers = async (req, res) => {
  try {
    const answers = await Answer.find({ user: req.user._id })
      .populate({
        path: 'problem',
        select: 'title category location bestAnswer createdAt',
      })
      .sort({ createdAt: -1 })
      .lean();

    const validAnswers = answers.filter((a) => a.problem != null);

    const answersWithMeta = await Promise.all(
      validAnswers.map(async (a) => {
        const helpfulVotes = await AnswerVote.countDocuments({
          answer: a._id,
          voteType: 'helpful',
        });
        const notHelpfulVotes = await AnswerVote.countDocuments({
          answer: a._id,
          voteType: 'not_helpful',
        });

        const isBestAnswer = Boolean(
          a.problem.bestAnswer && a.problem.bestAnswer.toString() === a._id.toString()
        );

        return {
          _id: a._id,
          content: a.content,
          createdAt: a.createdAt,
          problem: a.problem,
          helpfulVotes,
          notHelpfulVotes,
          isBestAnswer,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: answersWithMeta.length,
      answers: answersWithMeta,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user answers: ' + error.message,
    });
  }
};

/**
 * @desc    Follow or Unfollow a user
 * @route   POST /api/users/:id/follow
 * @access  Private (JWT)
 */
const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    if (targetUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const currentUser = await User.findById(req.user._id);
    const followingList = currentUser.following || [];
    const isFollowing = followingList.some((id) => id.toString() === targetUserId.toString());

    if (isFollowing) {
      // Unfollow
      currentUser.following = followingList.filter((id) => id.toString() !== targetUserId.toString());
      await currentUser.save();

      return res.status(200).json({
        success: true,
        message: `Unfollowed ${targetUser.name}`,
        isFollowing: false,
      });
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      await currentUser.save();

      // Notify target user
      const { createNotification } = require('../services/notificationService');
      createNotification({
        recipient: targetUser._id,
        sender: currentUser._id,
        type: 'follow',
        title: 'New Follower',
        message: `${currentUser.name} started following your problem-solving activity`,
        referenceType: 'user',
        referenceId: currentUser._id,
        link: `/profile/${currentUser.username || currentUser._id}`,
      });

      return res.status(200).json({
        success: true,
        message: `Now following ${targetUser.name}`,
        isFollowing: true,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update follow status: ' + error.message,
    });
  }
};

module.exports = {
  getMyProfileStats,
  getPublicUserProfile,
  updateMyProfile,
  getMyReputationHistory,
  getMyActivityTimeline,
  getMyProblems,
  getMyAnswers,
  followUser,
};
