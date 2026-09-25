const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Creates a notification safely
 * - Ensures recipient != sender (never notifies about own action)
 * - Prevents duplicate notifications within 60 seconds
 */
const createNotification = async ({
  recipient,
  sender = null,
  type,
  title = '',
  message,
  referenceType = 'system',
  referenceId = null,
  link = '',
}) => {
  try {
    if (!recipient) return null;

    // Do not notify a user about their own action
    if (sender && recipient.toString() === sender.toString()) {
      return null;
    }

    // Anti-duplicate check: if an identical notification was created in the last 30 seconds, skip
    const recentDuplicate = await Notification.findOne({
      recipient,
      sender,
      type,
      referenceType,
      referenceId,
      createdAt: { $gte: new Date(Date.now() - 30 * 1000) },
    });

    if (recentDuplicate) {
      return recentDuplicate;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      referenceType,
      referenceId,
      link,
      read: false,
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Parses @username mentions in text and sends mention notifications
 */
const parseAndNotifyMentions = async ({
  text,
  senderUser,
  referenceType = 'problem',
  referenceId = null,
  link = '',
  contextTitle = '',
}) => {
  try {
    if (!text || typeof text !== 'string' || !senderUser) return;

    // Match all @username patterns
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const matches = Array.from(text.matchAll(mentionRegex), (m) => m[1].toLowerCase());

    if (!matches.length) return;

    const uniqueUsernames = Array.from(new Set(matches));

    // Find mentioned users
    const mentionedUsers = await User.find({
      username: { $in: uniqueUsernames },
      _id: { $ne: senderUser._id },
    }).select('_id username name');

    for (const user of mentionedUsers) {
      const senderName = senderUser.name || `@${senderUser.username}`;
      const msg = contextTitle
        ? `${senderName} mentioned you in "${contextTitle.slice(0, 50)}"`
        : `${senderName} mentioned you in a discussion`;

      await createNotification({
        recipient: user._id,
        sender: senderUser._id,
        type: 'mention',
        title: 'Mentioned You',
        message: msg,
        referenceType,
        referenceId,
        link,
      });
    }
  } catch (error) {
    console.error('Error parsing mentions:', error);
  }
};

module.exports = {
  createNotification,
  parseAndNotifyMentions,
};
