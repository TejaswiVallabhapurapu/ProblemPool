const mongoose = require('mongoose');
const Notification = require('../models/Notification');

/**
 * @desc    Get paginated notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private (JWT)
 */
const getNotifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const unreadOnly = req.query.unreadOnly === 'true' || req.query.unread === 'true';

    const query = { recipient: req.user._id };
    if (unreadOnly) {
      query.read = false;
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'name username avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, read: false }),
    ]);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      totalCount,
      unreadCount,
      page,
      limit,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications: ' + error.message,
    });
  }
};

/**
 * @desc    Get count of unread notifications for logged-in user
 * @route   GET /api/notifications/unread-count
 * @access  Private (JWT)
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get unread count: ' + error.message,
    });
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (JWT)
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized',
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read: ' + error.message,
    });
  }
};

/**
 * @desc    Mark all notifications as read for logged-in user
 * @route   PUT /api/notifications/read-all
 * @access  Private (JWT)
 */
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all as read: ' + error.message,
    });
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (JWT)
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized',
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification: ' + error.message,
    });
  }
};

/**
 * @desc    Clear all read notifications
 * @route   DELETE /api/notifications/clear-read
 * @access  Private (JWT)
 */
const clearReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
      read: true,
    });

    return res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} read notifications`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to clear read notifications: ' + error.message,
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
};
