const mongoose = require('mongoose');
const Problem = require('../models/Problem');

// @desc    Get all problems (newest first)
// @route   GET /api/problems
const getProblems = async (req, res) => {
  try {
    const problems = await Problem.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      problems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch problems: ' + error.message,
    });
  }
};

// @desc    Get single problem by ID
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

    const problem = await Problem.findById(id).populate('createdBy', 'name email');

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    return res.status(200).json({
      success: true,
      problem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch problem: ' + error.message,
    });
  }
};

// @desc    Create a new problem (Protected)
// @route   POST /api/problems
const createProblem = async (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    // Validate that all fields are provided
    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, category, and location',
      });
    }

    // Creator comes strictly from req.user._id set by authMiddleware
    const newProblem = await Problem.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      createdBy: req.user._id,
    });

    const populatedProblem = await Problem.findById(newProblem._id).populate(
      'createdBy',
      'name email'
    );

    return res.status(201).json({
      success: true,
      problem: populatedProblem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create problem: ' + error.message,
    });
  }
};

// @desc    Delete a problem
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

    const problem = await Problem.findByIdAndDelete(id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Problem deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete problem: ' + error.message,
    });
  }
};

// @desc    Get problems by category
// @route   GET /api/problems/category/:category
const getProblemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // Case-insensitive category match
    const problems = await Problem.find({
      category: new RegExp(`^${category.trim()}$`, 'i'),
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      problems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch problems for category: ' + error.message,
    });
  }
};

module.exports = {
  getProblems,
  getProblemById,
  createProblem,
  deleteProblem,
  getProblemsByCategory,
};
