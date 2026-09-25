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
const Follow = require('../models/Follow');
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
 * @access  Public (optional JWT)
 */
const getPublicUserProfile = async (req, res) => {
  try {
    const { idOrUsername } = req.params;

    let user = null;
    if (mongoose.Types.ObjectId.isValid(idOrUsername)) {
      user = await User.findById(idOrUsername).select('name username bio avatar location title reputation interests createdAt').lean();
    }
    if (!user) {
      user = await User.findOne({ username: idOrUsername.toLowerCase() }).select('name username bio avatar location title reputation interests createdAt').lean();
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const statsData = await getUserFullStats(user._id);

    const currentUserId = req.user ? req.user._id.toString() : null;
    const isSelf = currentUserId ? currentUserId === user._id.toString() : false;
    let isFollowing = false;
    if (currentUserId && !isSelf) {
      isFollowing = Boolean(await Follow.exists({ follower: req.user._id, following: user._id }));
    }

    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
    ]);

    // Sanitize for public consumption
    const publicProfile = {
      _id: user._id,
      name: user.name,
      username: user.username || user.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      bio: user.bio || '',
      avatar: user.avatar || '',
      location: user.location || '',
      title: user.title || '',
      interests: Array.isArray(user.interests) ? user.interests : [],
      createdAt: user.createdAt,
      stats: {
        ...statsData.stats,
        followersCount,
        followingCount,
      },
      level: statsData.level,
      achievements: statsData.achievements,
      isFollowing,
      isSelf,
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
 * @desc    Update current user profile info (name, username, bio, location, title, avatar, interests)
 * @route   PUT /api/users/me/profile
 * @access  Private
 */
const updateMyProfile = async (req, res) => {
  try {
    const { name, username, bio, location, title, avatar, interests } = req.body;
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
    if (interests !== undefined && Array.isArray(interests)) {
      user.interests = Array.from(new Set(interests.map((i) => String(i).trim()))).filter(Boolean);
    }

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
 * @desc    Update current user's learning & domain interests
 * @route   PUT /api/users/me/interests
 * @access  Private (JWT)
 */
const updateUserInterests = async (req, res) => {
  try {
    const { interests } = req.body;

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        success: false,
        message: 'Interests must be an array of strings',
      });
    }

    const sanitizedInterests = Array.from(
      new Set(interests.map((item) => String(item).trim()).filter(Boolean))
    ).slice(0, 30);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { interests: sanitizedInterests },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Interests updated successfully',
      interests: user.interests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update interests: ' + error.message,
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

    const existingFollow = await Follow.findOne({
      follower: req.user._id,
      following: targetUserId,
    });

    let isFollowing = false;

    if (existingFollow) {
      // Unfollow
      await Follow.deleteOne({ _id: existingFollow._id });
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: targetUserId },
      });
      isFollowing = false;
    } else {
      // Follow
      try {
        await Follow.create({
          follower: req.user._id,
          following: targetUserId,
        });
      } catch (err) {
        // If unique index race condition
        if (err.code !== 11000) throw err;
      }

      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { following: targetUserId },
      });
      isFollowing = true;

      // Notify target user
      const { createNotification } = require('../services/notificationService');
      const currentUser = await User.findById(req.user._id).select('name username');
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
    }

    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: targetUserId }),
      Follow.countDocuments({ follower: targetUserId }),
    ]);

    return res.status(200).json({
      success: true,
      message: isFollowing ? `Now following ${targetUser.name}` : `Unfollowed ${targetUser.name}`,
      isFollowing,
      followersCount,
      followingCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update follow status: ' + error.message,
    });
  }
};

/**
 * @desc    Get list of followers for a user
 * @route   GET /api/users/:id/followers or /api/users/profile/:idOrUsername/followers
 * @access  Public (optional JWT for isFollowing state)
 */
const getUserFollowers = async (req, res) => {
  try {
    const { id, idOrUsername } = req.params;
    const identifier = id || idOrUsername;

    let targetUser = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      targetUser = await User.findById(identifier).select('_id name username').lean();
    }
    if (!targetUser) {
      targetUser = await User.findOne({ username: identifier.toLowerCase() }).select('_id name username').lean();
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const followDocs = await Follow.find({ following: targetUser._id })
      .populate('follower', 'name username bio avatar location title reputation interests createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const currentUserId = req.user ? req.user._id.toString() : null;

    // Batch get current user's follow status for all listed followers
    let currentUserFollowSet = new Set();
    if (currentUserId) {
      const myFollows = await Follow.find({ follower: currentUserId }).select('following').lean();
      currentUserFollowSet = new Set(myFollows.map((f) => f.following.toString()));
    }

    const followers = followDocs
      .filter((doc) => doc.follower != null)
      .map((doc) => {
        const u = doc.follower;
        const rep = u.reputation || 0;
        const level = getUserLevel(rep);
        const isSelf = currentUserId ? currentUserId === u._id.toString() : false;
        const isFollowing = currentUserId ? currentUserFollowSet.has(u._id.toString()) : false;

        return {
          _id: u._id,
          name: u.name,
          username: u.username || u.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          bio: u.bio || '',
          avatar: u.avatar || '',
          location: u.location || '',
          title: u.title || '',
          reputation: rep,
          level,
          interests: Array.isArray(u.interests) ? u.interests : [],
          isFollowing,
          isSelf,
          followedAt: doc.createdAt,
        };
      });

    return res.status(200).json({
      success: true,
      count: followers.length,
      followers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve followers: ' + error.message,
    });
  }
};

/**
 * @desc    Get list of users followed by a user
 * @route   GET /api/users/:id/following or /api/users/profile/:idOrUsername/following
 * @access  Public (optional JWT for isFollowing state)
 */
const getUserFollowing = async (req, res) => {
  try {
    const { id, idOrUsername } = req.params;
    const identifier = id || idOrUsername;

    let targetUser = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      targetUser = await User.findById(identifier).select('_id name username').lean();
    }
    if (!targetUser) {
      targetUser = await User.findOne({ username: identifier.toLowerCase() }).select('_id name username').lean();
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const followDocs = await Follow.find({ follower: targetUser._id })
      .populate('following', 'name username bio avatar location title reputation interests createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const currentUserId = req.user ? req.user._id.toString() : null;

    let currentUserFollowSet = new Set();
    if (currentUserId) {
      const myFollows = await Follow.find({ follower: currentUserId }).select('following').lean();
      currentUserFollowSet = new Set(myFollows.map((f) => f.following.toString()));
    }

    const following = followDocs
      .filter((doc) => doc.following != null)
      .map((doc) => {
        const u = doc.following;
        const rep = u.reputation || 0;
        const level = getUserLevel(rep);
        const isSelf = currentUserId ? currentUserId === u._id.toString() : false;
        const isFollowing = currentUserId ? currentUserFollowSet.has(u._id.toString()) : false;

        return {
          _id: u._id,
          name: u.name,
          username: u.username || u.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          bio: u.bio || '',
          avatar: u.avatar || '',
          location: u.location || '',
          title: u.title || '',
          reputation: rep,
          level,
          interests: Array.isArray(u.interests) ? u.interests : [],
          isFollowing,
          isSelf,
          followedAt: doc.createdAt,
        };
      });

    return res.status(200).json({
      success: true,
      count: following.length,
      following,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve following list: ' + error.message,
    });
  }
};

module.exports = {
  getMyProfileStats,
  getPublicUserProfile,
  updateMyProfile,
  updateUserInterests,
  getMyReputationHistory,
  getMyActivityTimeline,
  getMyProblems,
  getMyAnswers,
  followUser,
  getUserFollowers,
  getUserFollowing,
};
