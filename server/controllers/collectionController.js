const mongoose = require('mongoose');
const Collection = require('../models/Collection');
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
 * @desc    Get all collections for the logged-in user
 * @route   GET /api/users/me/collections
 * @access  Private (JWT Protected)
 */
const getMyCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const collectionsWithCount = collections.map((col) => ({
      _id: col._id,
      name: col.name,
      description: col.description || '',
      color: col.color || 'indigo',
      problemCount: Array.isArray(col.problems) ? col.problems.length : 0,
      createdAt: col.createdAt,
      updatedAt: col.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: collectionsWithCount.length,
      collections: collectionsWithCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch collections: ' + error.message,
    });
  }
};

/**
 * @desc    Get a single collection by ID with full problem details
 * @route   GET /api/users/me/collections/:id
 * @access  Private (JWT Protected)
 */
const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection ID format',
      });
    }

    const collection = await Collection.findOne({
      _id: id,
      user: req.user._id,
    })
      .populate({
        path: 'problems',
        populate: [
          { path: 'createdBy', select: 'name email' },
          { path: 'bestAnswer' },
        ],
      })
      .lean();

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found or access denied',
      });
    }

    // Filter out any deleted/null problems
    const validProblems = (collection.problems || []).filter((p) => p != null && p._id);

    // Compute meta (answersCount, votes, status) for each problem
    const problemsWithMeta = await Promise.all(
      validProblems.map(async (prob) => {
        const probId = prob._id;
        const answers = await Answer.find({ problem: probId }).select('_id').lean();
        const answersCount = answers.length;
        const answerIds = answers.map((a) => a._id);

        const totalHelpfulVotes = await AnswerVote.countDocuments({
          answer: { $in: answerIds },
          voteType: 'helpful',
        });

        const status = computeProblemStatus(prob, answersCount);

        return {
          ...prob,
          answersCount,
          totalHelpfulVotes,
          status,
          isSaved: true,
        };
      })
    );

    return res.status(200).json({
      success: true,
      collection: {
        _id: collection._id,
        name: collection.name,
        description: collection.description || '',
        color: collection.color || 'indigo',
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        problemCount: problemsWithMeta.length,
        problems: problemsWithMeta,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch collection: ' + error.message,
    });
  }
};

/**
 * @desc    Create a new collection
 * @route   POST /api/users/me/collections
 * @access  Private (JWT Protected)
 */
const createCollection = async (req, res) => {
  try {
    const { name, description = '', color = 'indigo' } = req.body;

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Collection name is required',
      });
    }

    if (trimmedName.length > 80) {
      return res.status(400).json({
        success: false,
        message: 'Collection name cannot exceed 80 characters',
      });
    }

    // Case-insensitive duplicate check for current user
    const existing = await Collection.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A collection with this name already exists',
      });
    }

    const newCollection = await Collection.create({
      user: req.user._id,
      name: trimmedName,
      description: (description || '').trim(),
      color: color || 'indigo',
      problems: [],
    });

    return res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      collection: {
        _id: newCollection._id,
        name: newCollection.name,
        description: newCollection.description,
        color: newCollection.color,
        problemCount: 0,
        createdAt: newCollection.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A collection with this name already exists',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create collection: ' + error.message,
    });
  }
};

/**
 * @desc    Update/rename collection
 * @route   PUT /api/users/me/collections/:id
 * @access  Private (JWT Protected)
 */
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection ID format',
      });
    }

    const collection = await Collection.findOne({ _id: id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found or access denied',
      });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: 'Collection name cannot be empty',
        });
      }

      // Check name uniqueness if name is changed
      if (trimmedName.toLowerCase() !== collection.name.toLowerCase()) {
        const existing = await Collection.findOne({
          user: req.user._id,
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'Another collection with this name already exists',
          });
        }
      }
      collection.name = trimmedName;
    }

    if (description !== undefined) {
      collection.description = description.trim();
    }

    if (color !== undefined) {
      collection.color = color;
    }

    await collection.save();

    return res.status(200).json({
      success: true,
      message: 'Collection updated successfully',
      collection: {
        _id: collection._id,
        name: collection.name,
        description: collection.description,
        color: collection.color,
        problemCount: collection.problems.length,
        updatedAt: collection.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update collection: ' + error.message,
    });
  }
};

/**
 * @desc    Delete collection (Note: does NOT delete saved problem records)
 * @route   DELETE /api/users/me/collections/:id
 * @access  Private (JWT Protected)
 */
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection ID format',
      });
    }

    const deleted = await Collection.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Collection deleted successfully. Saved problems were retained.',
      collectionId: id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete collection: ' + error.message,
    });
  }
};

/**
 * @desc    Add a saved problem to a collection
 * @route   POST /api/users/me/collections/:id/problems/:problemId
 * @access  Private (JWT Protected)
 */
const addProblemToCollection = async (req, res) => {
  try {
    const { id: collectionId, problemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(collectionId) || !mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection or problem ID format',
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

    // Ensure problem is in user's SavedProblem list
    await SavedProblem.findOneAndUpdate(
      { user: req.user._id, problem: problemId },
      { user: req.user._id, problem: problemId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Add problem to the collection's problems array
    const collection = await Collection.findOneAndUpdate(
      { _id: collectionId, user: req.user._id },
      { $addToSet: { problems: problemId } },
      { new: true }
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Problem added to collection "${collection.name}"`,
      collectionId,
      problemId,
      problemCount: collection.problems.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add problem to collection: ' + error.message,
    });
  }
};

/**
 * @desc    Remove a problem from a collection
 * @route   DELETE /api/users/me/collections/:id/problems/:problemId
 * @access  Private (JWT Protected)
 */
const removeProblemFromCollection = async (req, res) => {
  try {
    const { id: collectionId, problemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(collectionId) || !mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection or problem ID format',
      });
    }

    const collection = await Collection.findOneAndUpdate(
      { _id: collectionId, user: req.user._id },
      { $pull: { problems: problemId } },
      { new: true }
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Problem removed from collection "${collection.name}"`,
      collectionId,
      problemId,
      problemCount: collection.problems.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to remove problem from collection: ' + error.message,
    });
  }
};

/**
 * @desc    Get which collections of the user contain a specific problem
 * @route   GET /api/users/me/problems/:problemId/collections
 * @access  Private (JWT Protected)
 */
const getProblemCollections = async (req, res) => {
  try {
    const { problemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid problem ID format',
      });
    }

    const allCollections = await Collection.find({ user: req.user._id })
      .select('name description color problems')
      .lean();

    const collectionsStatus = allCollections.map((col) => {
      const isIncluded = (col.problems || []).some((p) => p.toString() === problemId.toString());
      return {
        _id: col._id,
        name: col.name,
        description: col.description || '',
        color: col.color || 'indigo',
        containsProblem: isIncluded,
      };
    });

    return res.status(200).json({
      success: true,
      collections: collectionsStatus,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to check problem collections: ' + error.message,
    });
  }
};

module.exports = {
  getMyCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addProblemToCollection,
  removeProblemFromCollection,
  getProblemCollections,
};
