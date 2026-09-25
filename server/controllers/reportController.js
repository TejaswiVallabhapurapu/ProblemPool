const mongoose = require('mongoose');
const Report = require('../models/Report');
const Problem = require('../models/Problem');
const Answer = require('../models/Answer');
const Review = require('../models/Review');
const User = require('../models/User');

const VALID_REASONS = [
  'Spam',
  'Duplicate',
  'Offensive content',
  'Incorrect/inappropriate content',
  'Personal information',
  'Other',
];

/**
 * @desc    Submit a content or user report
 * @route   POST /api/reports
 * @access  Private (JWT Protected, Not Suspended)
 */
const createReport = async (req, res) => {
  try {
    const { contentType, contentId, reason, description = '' } = req.body;

    if (!contentType || !contentId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Content type, content ID, and reason are required',
      });
    }

    const cleanContentType = contentType.toLowerCase().trim();
    if (!['problem', 'answer', 'review', 'user'].includes(cleanContentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type. Must be problem, answer, review, or user',
      });
    }

    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report reason',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content ID format',
      });
    }

    // Verify target content exists
    let contentAuthorId = null;
    if (cleanContentType === 'problem') {
      const p = await Problem.findById(contentId).select('createdBy');
      if (!p) {
        return res.status(404).json({ success: false, message: 'Reported problem not found' });
      }
      contentAuthorId = p.createdBy;
    } else if (cleanContentType === 'answer') {
      const a = await Answer.findById(contentId).select('author');
      if (!a) {
        return res.status(404).json({ success: false, message: 'Reported answer not found' });
      }
      contentAuthorId = a.author;
    } else if (cleanContentType === 'review') {
      const r = await Review.findById(contentId).select('reviewer');
      if (!r) {
        return res.status(404).json({ success: false, message: 'Reported review not found' });
      }
      contentAuthorId = r.reviewer;
    } else if (cleanContentType === 'user') {
      const u = await User.findById(contentId).select('_id');
      if (!u) {
        return res.status(404).json({ success: false, message: 'Reported user profile not found' });
      }
      contentAuthorId = u._id;
    }

    // Check for existing pending report by this user for the same content
    const existingReport = await Report.findOne({
      reportedBy: req.user._id,
      contentType: cleanContentType,
      contentId,
      status: 'Pending',
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a pending report for this item. Our moderation team is reviewing it.',
      });
    }

    const report = await Report.create({
      reportedBy: req.user._id,
      contentType: cleanContentType,
      contentId,
      reason,
      description: (description || '').trim(),
      status: 'Pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for helping keep ProblemPool safe. Your report has been submitted to moderators.',
      reportId: report._id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit report: ' + error.message,
    });
  }
};

module.exports = {
  createReport,
};
