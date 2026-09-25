import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader } from './Loader';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/api';

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const NotificationBell = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Fetch unread count periodically
  const fetchUnreadCount = async () => {
    if (!token || !isAuthenticated) return;
    try {
      const res = await getUnreadNotificationCount(token);
      if (res && res.success) {
        setUnreadCount(res.count || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch unread count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [token, isAuthenticated]);

  // 2. Load recent notifications when dropdown opens
  const loadNotifications = async () => {
    if (!token || !isAuthenticated) return;
    try {
      setLoading(true);
      const res = await getNotifications({ limit: 6 }, token);
      if (res && res.success) {
        setNotifications(res.notifications || []);
        if (typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      }
    } catch (err) {
      console.warn('Failed to load notifications list:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.read && token) {
      try {
        await markNotificationAsRead(notif._id, token);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.warn('Failed to mark notification read:', err);
      }
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    if (!token || unreadCount === 0) return;
    try {
      await markAllNotificationsAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button - Text Only */}
      <button
        type="button"
        onClick={toggleDropdown}
        title="Notifications"
        aria-label="Open notifications menu"
        className="relative px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer focus:outline-none"
      >
        <span>Alerts</span>
        {unreadCount > 0 && (
          <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-white text-black text-[10px] font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#121212]/95 backdrop-blur-xl shadow-2xl border border-white/10 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-black">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-neutral-300 hover:text-white transition cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-neutral-400 gap-3">
                <Loader size="sm" />
                <span className="text-xs font-medium">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <p className="text-xs font-semibold text-white mb-1">No notifications yet</p>
                <p className="text-[11px] text-neutral-400">
                  You'll be notified when community members interact with your problems, answers, and reviews.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const typeLabel = notif.type ? notif.type.replace('_', ' ').toUpperCase() : 'ALERT';

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-white/5 transition cursor-pointer relative ${
                      !notif.read ? 'bg-white/[0.04]' : ''
                    }`}
                  >
                    {/* Notification Type Badge - Text Only */}
                    <div className="px-2 py-1 rounded text-[9px] font-mono tracking-wider font-semibold uppercase shrink-0 border border-white/10 bg-white/5 text-neutral-300">
                      {typeLabel}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      {notif.title && (
                        <h4 className="text-xs font-semibold text-white truncate mb-0.5">
                          {notif.title}
                        </h4>
                      )}
                      <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-neutral-400 font-mono mt-1 inline-block">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    {/* Unread indicator */}
                    {!notif.read && (
                      <span className="absolute top-4 right-3.5 w-2 h-2 rounded-full bg-white ring-2 ring-white/20" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-white/10 bg-white/5 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-neutral-300 hover:text-white"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
