const User = require('../models/User');
const Problem = require('../models/Problem');
const Answer = require('../models/Answer');
const AnswerVote = require('../models/AnswerVote');
const Review = require('../models/Review');
const ReviewVote = require('../models/ReviewVote');
const SavedProblem = require('../models/SavedProblem');
const ReputationHistory = require('../models/ReputationHistory');
const Achievement = require('../models/Achievement');
const Follow = require('../models/Follow');
const { createNotification } = require('./notificationService');

// Reputation Constants
const REPUTATION_RULES = {
  POST_PROBLEM: 2,
  POST_ANSWER: 5,
  HELPFUL_ANSWER_VOTE: 2,
  BEST_ANSWER: 15,
  HELPFUL_REVIEW_VOTE: 2,
};

// All available achievements definitions
const BADGES_DEFINITIONS = [
  {
    type: 'first_question',
    title: 'First Question',
    icon: '🟢',
    description: 'Awarded after posting your first problem.',
    criteria: (stats) => stats.problemsCount >= 1,
  },
  {
    type: 'first_answer',
    title: 'First Answer',
    icon: '🔵',
    description: 'Awarded after answering your first problem.',
    criteria: (stats) => stats.answersCount >= 1,
  },
  {
    type: 'helpful_contributor',
    title: 'Helpful Contributor',
    icon: '🟣',
    description: 'Awarded after receiving 10 helpful votes.',
    criteria: (stats) => stats.helpfulVotesReceived >= 10,
  },
  {
    type: 'problem_solver',
    title: 'Problem Solver',
    icon: '🟡',
    description: 'Awarded after having an answer selected as Best Answer.',
    criteria: (stats) => stats.bestAnswersCount >= 1,
  },
  {
    type: 'active_helper',
    title: 'Active Helper',
    icon: '🟠',
    description: 'Awarded after receiving 25 helpful votes.',
    criteria: (stats) => stats.helpfulVotesReceived >= 25,
  },
  {
    type: 'expert_helper',
    title: 'Expert Helper',
    icon: '🔴',
    description: 'Awarded after receiving 100 helpful votes.',
    criteria: (stats) => stats.helpfulVotesReceived >= 100,
  },
  {
    type: 'community_contributor',
    title: 'Community Contributor',
    icon: '⭐',
    description: 'Awarded after reaching 100 reputation points.',
    criteria: (stats) => stats.reputation >= 100,
  },
  {
    type: 'top_contributor',
    title: 'Top Contributor',
    icon: '🏆',
    description: 'Awarded after reaching 500 reputation points.',
    criteria: (stats) => stats.reputation >= 500,
  },
];

/**
 * Determine user Level based on reputation points
 * 0–49: Beginner
 * 50–149: Contributor
 * 150–299: Helper
 * 300–499: Problem Solver
 * 500–999: Expert
 * 1000+: Community Expert
 */
const getUserLevel = (reputation) => {
  const rep = Math.max(0, reputation || 0);
  if (rep >= 1000) {
    return { name: 'Community Expert', icon: '👑', min: 1000, next: null, progress: 100 };
  }
  if (rep >= 500) {
    return { name: 'Expert', icon: '⚡', min: 500, next: 1000, progress: Math.min(100, Math.round(((rep - 500) / 500) * 100)) };
  }
  if (rep >= 300) {
    return { name: 'Problem Solver', icon: '🧩', min: 300, next: 500, progress: Math.min(100, Math.round(((rep - 300) / 200) * 100)) };
  }
  if (rep >= 150) {
    return { name: 'Helper', icon: '🛠️', min: 150, next: 300, progress: Math.min(100, Math.round(((rep - 150) / 150) * 100)) };
  }
  if (rep >= 50) {
    return { name: 'Contributor', icon: '💡', min: 50, next: 150, progress: Math.min(100, Math.round(((rep - 50) / 100) * 100)) };
  }
  return { name: 'Beginner', icon: '🌱', min: 0, next: 50, progress: Math.min(100, Math.round((rep / 50) * 100)) };
};

/**
 * Award or adjust reputation points for a user, log to history, and evaluate badges
 */
const adjustReputation = async ({
  userId,
  points,
  reason,
  referenceType = 'system',
  referenceId = null,
}) => {
  try {
    if (!userId || points === 0) return null;

    // 1. Record Reputation History entry
    const historyEntry = await ReputationHistory.create({
      user: userId,
      points,
      reason,
      referenceType,
      referenceId,
    });

    // 2. Update User reputation in DB (ensuring it never drops below 0)
    const user = await User.findById(userId);
    if (user) {
      user.reputation = Math.max(0, (user.reputation || 0) + points);
      await user.save();
    }

    // 3. Notify user of positive reputation gains
    if (points > 0) {
      createNotification({
        recipient: userId,
        sender: null,
        type: 'reputation',
        title: '⭐ Reputation Earned',
        message: `You earned +${points} reputation: ${reason}`,
        referenceType: 'reputation',
        link: '/profile?tab=history',
      });
    }

    // 4. Check and award any newly qualified achievements
    await checkAndAwardAchievements(userId);

    return historyEntry;
  } catch (err) {
    console.error(`Error adjusting reputation for user ${userId}:`, err);
    return null;
  }
};

/**
 * Calculate user counts, stats, dynamic reputation, level, achievements, and profile completion
 */
const getUserFullStats = async (userId) => {
  const user = await User.findById(userId).select('-password').lean();
  if (!user) return null;

  // 1. Fetch direct counts
  const problemsCount = await Problem.countDocuments({ createdBy: userId });
  const answersCount = await Answer.countDocuments({ user: userId });
  const reviewsCount = await Review.countDocuments({ user: userId });
  const savedCount = await SavedProblem.countDocuments({ user: userId });
  const followersCount = await Follow.countDocuments({ following: userId });
  const followingCount = await Follow.countDocuments({ follower: userId });

  // 2. Fetch answer IDs created by this user
  const userAnswers = await Answer.find({ user: userId }).select('_id').lean();
  const userAnswerIds = userAnswers.map((a) => a._id);

  // 3. Count helpful votes received on answers
  const answerHelpfulVotes = await AnswerVote.countDocuments({
    answer: { $in: userAnswerIds },
    voteType: 'helpful',
  });

  // 4. Count helpful votes received on reviews
  const userReviews = await Review.find({ user: userId }).select('_id').lean();
  const userReviewIds = userReviews.map((r) => r._id);
  const reviewHelpfulVotes = await ReviewVote.countDocuments({
    review: { $in: userReviewIds },
  });

  const helpfulVotesReceived = answerHelpfulVotes + reviewHelpfulVotes;

  // 5. Count Best Answers
  const bestAnswersCount = await Problem.countDocuments({
    bestAnswer: { $in: userAnswerIds },
  });

  // 6. Calculate baseline reputation from real activity
  const calculatedReputation =
    problemsCount * REPUTATION_RULES.POST_PROBLEM +
    answersCount * REPUTATION_RULES.POST_ANSWER +
    answerHelpfulVotes * REPUTATION_RULES.HELPFUL_ANSWER_VOTE +
    bestAnswersCount * REPUTATION_RULES.BEST_ANSWER +
    reviewHelpfulVotes * REPUTATION_RULES.HELPFUL_REVIEW_VOTE;

  // Sync user reputation in database if different
  const finalReputation = Math.max(calculatedReputation, user.reputation || 0);
  if (user.reputation !== finalReputation) {
    await User.findByIdAndUpdate(userId, { reputation: finalReputation });
  }

  const level = getUserLevel(finalReputation);

  const stats = {
    reputation: finalReputation,
    problemsCount,
    answersCount,
    helpfulVotesReceived,
    bestAnswersCount,
    reviewsCount,
    savedCount,
    followersCount,
    followingCount,
  };

  // 7. Calculate Profile Completion
  const completionItems = [
    { key: 'name', label: 'Full Name', completed: Boolean(user.name && user.name.trim()) },
    { key: 'username', label: 'Username', completed: Boolean(user.username && user.username.trim()) },
    { key: 'bio', label: 'Bio / About', completed: Boolean(user.bio && user.bio.trim()) },
    { key: 'location', label: 'Location', completed: Boolean(user.location && user.location.trim()) },
    { key: 'avatar', label: 'Profile Picture', completed: Boolean(user.avatar && user.avatar.trim()) },
  ];
  const completedCount = completionItems.filter((i) => i.completed).length;
  const profileCompletionPercentage = Math.round((completedCount / completionItems.length) * 100);

  // 8. Evaluate and fetch unlocked achievements
  await checkAndAwardAchievements(userId, stats);
  const unlockedBadges = await Achievement.find({ user: userId }).lean();
  const unlockedMap = new Map(unlockedBadges.map((b) => [b.achievementType, b]));

  const achievementsList = BADGES_DEFINITIONS.map((badgeDef) => {
    const unlocked = unlockedMap.get(badgeDef.type);
    return {
      type: badgeDef.type,
      title: badgeDef.title,
      icon: badgeDef.icon,
      description: badgeDef.description,
      isUnlocked: Boolean(unlocked),
      unlockedAt: unlocked ? unlocked.unlockedAt : null,
    };
  });

  return {
    user: {
      _id: user._id,
      name: user.name,
      username: user.username || user.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      email: user.email,
      bio: user.bio || '',
      avatar: user.avatar || '',
      location: user.location || '',
      title: user.title || '',
      interests: Array.isArray(user.interests) ? user.interests : [],
      createdAt: user.createdAt,
    },
    stats,
    level,
    profileCompletion: {
      percentage: profileCompletionPercentage,
      items: completionItems,
    },
    achievements: achievementsList,
  };
};

/**
 * Check and insert any unlocked achievements into the database
 */
const checkAndAwardAchievements = async (userId, customStats = null) => {
  try {
    let stats = customStats;
    if (!stats) {
      const user = await User.findById(userId).select('reputation').lean();
      const problemsCount = await Problem.countDocuments({ createdBy: userId });
      const answersCount = await Answer.countDocuments({ user: userId });
      const userAnswers = await Answer.find({ user: userId }).select('_id').lean();
      const userAnswerIds = userAnswers.map((a) => a._id);
      const answerHelpfulVotes = await AnswerVote.countDocuments({
        answer: { $in: userAnswerIds },
        voteType: 'helpful',
      });
      const bestAnswersCount = await Problem.countDocuments({
        bestAnswer: { $in: userAnswerIds },
      });

      stats = {
        reputation: user?.reputation || 0,
        problemsCount,
        answersCount,
        helpfulVotesReceived: answerHelpfulVotes,
        bestAnswersCount,
      };
    }

    const existingBadges = await Achievement.find({ user: userId }).select('achievementType').lean();
    const existingSet = new Set(existingBadges.map((b) => b.achievementType));

    for (const badgeDef of BADGES_DEFINITIONS) {
      if (!existingSet.has(badgeDef.type) && badgeDef.criteria(stats)) {
        await Achievement.findOneAndUpdate(
          { user: userId, achievementType: badgeDef.type },
          {
            user: userId,
            achievementType: badgeDef.type,
            title: badgeDef.title,
            description: badgeDef.description,
            icon: badgeDef.icon,
            unlockedAt: new Date(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Notify user of newly unlocked achievement
        createNotification({
          recipient: userId,
          sender: null,
          type: 'badge',
          title: `🏆 Achievement Unlocked: ${badgeDef.title}`,
          message: `Congratulations! You unlocked the "${badgeDef.title}" badge: ${badgeDef.description}`,
          referenceType: 'badge',
          link: '/profile?tab=achievements',
        });
      }
    }
  } catch (err) {
    console.error(`Error checking achievements for user ${userId}:`, err);
  }
};

module.exports = {
  REPUTATION_RULES,
  BADGES_DEFINITIONS,
  getUserLevel,
  adjustReputation,
  getUserFullStats,
  checkAndAwardAchievements,
};
