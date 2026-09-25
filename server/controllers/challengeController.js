const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const Problem = require('../models/Problem');
const Answer = require('../models/Answer');
const User = require('../models/User');
const ReputationHistory = require('../models/ReputationHistory');

/**
 * @desc    Get all challenges (active, upcoming, completed)
 * @route   GET /api/challenges
 * @access  Public
 */
const getChallenges = async (req, res) => {
  try {
    const { status, category, difficulty } = req.query;

    const challenges = await Challenge.find()
      .populate('createdBy', 'name email username avatar role')
      .populate({
        path: 'bestAnswer',
        populate: { path: 'author', select: 'name username avatar reputation' },
      })
      .populate('problem', 'title answersCount views tags category')
      .sort({ startDate: -1 })
      .lean();

    const now = new Date();

    const challengesWithStats = await Promise.all(
      challenges.map(async (c) => {
        let submissionsCount = 0;
        let participantsCount = 0;

        if (c.problem && c.problem._id) {
          const answers = await Answer.find({ problem: c.problem._id })
            .select('author helpfulCount isBestAnswer createdAt')
            .lean();

          submissionsCount = answers.length;
          const uniqueAuthors = new Set(answers.map((a) => a.author.toString()));
          participantsCount = uniqueAuthors.size;
        }

        let computedStatus = 'active';
        if (now < new Date(c.startDate)) {
          computedStatus = 'upcoming';
        } else if (now > new Date(c.endDate)) {
          computedStatus = 'completed';
        }

        return {
          ...c,
          status: computedStatus,
          submissionsCount,
          participantsCount,
        };
      })
    );

    // Filter by status if provided
    let filtered = challengesWithStats;
    if (status && status !== 'all') {
      filtered = filtered.filter((c) => c.status === status.toLowerCase());
    }
    if (category && category !== 'all') {
      filtered = filtered.filter(
        (c) => (c.category || '').toLowerCase() === category.toLowerCase()
      );
    }
    if (difficulty && difficulty !== 'all') {
      filtered = filtered.filter(
        (c) => (c.difficulty || '').toLowerCase() === difficulty.toLowerCase()
      );
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      challenges: filtered,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch challenges: ' + error.message,
    });
  }
};

/**
 * @desc    Get single challenge by ID with submissions
 * @route   GET /api/challenges/:id
 * @access  Public
 */
const getChallengeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid challenge ID format',
      });
    }

    const challenge = await Challenge.findById(id)
      .populate('createdBy', 'name username avatar role')
      .populate({
        path: 'bestAnswer',
        populate: { path: 'author', select: 'name username avatar reputation' },
      })
      .populate('problem')
      .lean();

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
    }

    const now = new Date();
    let computedStatus = 'active';
    if (now < new Date(challenge.startDate)) computedStatus = 'upcoming';
    else if (now > new Date(challenge.endDate)) computedStatus = 'completed';

    // Hydrate answers / submissions if linked to a Problem
    let submissions = [];
    if (challenge.problem && challenge.problem._id) {
      submissions = await Answer.find({ problem: challenge.problem._id })
        .populate('author', 'name username avatar reputation isSuspended')
        .sort({ isBestAnswer: -1, helpfulCount: -1, createdAt: -1 })
        .lean();
    }

    return res.status(200).json({
      success: true,
      challenge: {
        ...challenge,
        status: computedStatus,
        submissionsCount: submissions.length,
        participantsCount: new Set(submissions.map((s) => s.author?._id?.toString() || s.author?.toString())).size,
        submissions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve challenge details: ' + error.message,
    });
  }
};

/**
 * @desc    Create a new Weekly Challenge (Admin only)
 * @route   POST /api/challenges
 * @access  Private (Admin only)
 */
const createChallenge = async (req, res) => {
  try {
    const {
      title,
      description,
      category = 'Programming',
      tags = [],
      difficulty = 'Medium',
      startDate,
      endDate,
      pointsReward = 50,
    } = req.body;

    if (!title || !description || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and end date are required',
      });
    }

    const parsedStart = startDate ? new Date(startDate) : new Date();
    const parsedEnd = new Date(endDate);

    if (parsedEnd <= parsedStart) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    // Clean tags array
    const cleanTags = Array.isArray(tags)
      ? tags.map((t) => t.trim().toLowerCase().replace(/[^a-z0-9+#.-]/g, '')).filter(Boolean)
      : [];

    // Create an associated Problem entity so all standard answering & voting flows work seamlessly
    const problem = await Problem.create({
      title: `🧩 [Weekly Challenge] ${title.trim()}`,
      description: description.trim(),
      category,
      tags: [...new Set(['weekly-challenge', 'challenge', ...cleanTags])],
      location: 'Global / Community Challenge',
      createdBy: req.user._id,
    });

    const challenge = await Challenge.create({
      title: title.trim(),
      description: description.trim(),
      category,
      tags: cleanTags,
      difficulty,
      startDate: parsedStart,
      endDate: parsedEnd,
      pointsReward: Number(pointsReward) || 50,
      createdBy: req.user._id,
      problem: problem._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Weekly coding challenge created successfully',
      challenge,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create challenge: ' + error.message,
    });
  }
};

/**
 * @desc    Update a challenge (Admin only)
 * @route   PUT /api/challenges/:id
 * @access  Private (Admin only)
 */
const updateChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags, difficulty, startDate, endDate, pointsReward } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid challenge ID format',
      });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
    }

    if (title) challenge.title = title.trim();
    if (description) challenge.description = description.trim();
    if (category) challenge.category = category;
    if (tags && Array.isArray(tags)) challenge.tags = tags;
    if (difficulty) challenge.difficulty = difficulty;
    if (startDate) challenge.startDate = new Date(startDate);
    if (endDate) challenge.endDate = new Date(endDate);
    if (pointsReward !== undefined) challenge.pointsReward = Number(pointsReward);

    await challenge.save();

    // Also update associated problem title & description
    if (challenge.problem) {
      await Problem.findByIdAndUpdate(challenge.problem, {
        title: `🧩 [Weekly Challenge] ${challenge.title}`,
        description: challenge.description,
        category: challenge.category,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Challenge updated successfully',
      challenge,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update challenge: ' + error.message,
    });
  }
};

/**
 * @desc    Delete a challenge (Admin only)
 * @route   DELETE /api/challenges/:id
 * @access  Private (Admin only)
 */
const deleteChallenge = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid challenge ID format',
      });
    }

    const challenge = await Challenge.findByIdAndDelete(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Challenge deleted successfully',
      challengeId: id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete challenge: ' + error.message,
    });
  }
};

/**
 * @desc    Submit solution / answer to a challenge
 * @route   POST /api/challenges/:id/submit
 * @access  Private (JWT Protected, Not Suspended)
 */
const submitChallengeSolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Submission content is required',
      });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
    }

    const now = new Date();
    if (now < new Date(challenge.startDate)) {
      return res.status(400).json({
        success: false,
        message: 'This challenge has not started yet',
      });
    }
    if (now > new Date(challenge.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'This challenge has ended. Submissions are closed.',
      });
    }

    let problemId = challenge.problem;
    if (!problemId) {
      const p = await Problem.create({
        title: `🧩 [Weekly Challenge] ${challenge.title}`,
        description: challenge.description,
        category: challenge.category,
        createdBy: challenge.createdBy,
      });
      challenge.problem = p._id;
      await challenge.save();
      problemId = p._id;
    }

    // Create answer
    const answer = await Answer.create({
      problem: problemId,
      author: req.user._id,
      content: content.trim(),
    });

    // Increment answers count on problem
    const count = await Answer.countDocuments({ problem: problemId });
    await Problem.findByIdAndUpdate(problemId, { answersCount: count });

    // Award +5 reputation for challenge participation
    await User.findByIdAndUpdate(req.user._id, { $inc: { reputation: 5 } });
    await ReputationHistory.create({
      user: req.user._id,
      points: 5,
      reason: `Participated in Weekly Challenge: "${challenge.title}"`,
      referenceType: 'answer',
      referenceId: answer._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Your challenge solution has been submitted! +5 reputation points earned.',
      answer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit solution: ' + error.message,
    });
  }
};

/**
 * @desc    Award Best Answer for a Challenge (Admin only)
 * @route   PUT /api/challenges/:id/best-answer/:answerId
 * @access  Private (Admin only)
 */
const selectChallengeBestAnswer = async (req, res) => {
  try {
    const { id, answerId } = req.params;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    const answer = await Answer.findById(answerId).populate('author');
    if (!answer) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    challenge.bestAnswer = answerId;
    await challenge.save();

    // Mark best answer on problem & answer
    await Answer.updateMany({ problem: challenge.problem }, { isBestAnswer: false });
    answer.isBestAnswer = true;
    await answer.save();

    if (challenge.problem) {
      await Problem.findByIdAndUpdate(challenge.problem, {
        bestAnswer: answerId,
        status: 'Solved',
      });
    }

    // Award challenge pointsReward to the winner
    const rewardPoints = challenge.pointsReward || 50;
    if (answer.author && answer.author._id) {
      await User.findByIdAndUpdate(answer.author._id, {
        $inc: { reputation: rewardPoints },
      });
      await ReputationHistory.create({
        user: answer.author._id,
        points: rewardPoints,
        reason: `Won Best Answer in Weekly Challenge: "${challenge.title}"`,
        referenceType: 'best_answer',
        referenceId: answer._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Best answer awarded to ${answer.author?.name || 'author'} with +${rewardPoints} bonus reputation!`,
      challenge,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to award best answer: ' + error.message,
    });
  }
};

module.exports = {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  submitChallengeSolution,
  selectChallengeBestAnswer,
};
