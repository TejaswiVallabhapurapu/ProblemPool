import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  MessageSquare,
  Star,
  ThumbsUp,
  Award,
  UserPlus,
  AtSign,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Loader } from './Loader';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/api';

const NOTIFICATION_ICONS = {
  answer: { icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  best_answer: { icon: Star, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  review: { icon: MessageCircle, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  reply: { icon: MessageSquare, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  vote: { icon: ThumbsUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  mention: { icon: AtSign, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  follow: { icon: UserPlus, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  badge: { icon: Award, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  reputation: { icon: Sparkles, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  system: { icon: Bell, color: 'text-slate-600 bg-slate-50 border-slate-200' },
};

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
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        title="Notifications"
        aria-label="Open notifications menu"
        className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader size="sm" />
                <span className="text-xs font-medium">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2 text-base">
                  🔔
                </div>
                <p className="text-xs font-bold text-slate-700 mb-0.5">No notifications yet</p>
                <p className="text-[11px] text-slate-400">
                  You'll be notified when community members interact with your problems, answers, and reviews.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.system;
                const Icon = config.icon;

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition cursor-pointer relative ${
                      !notif.read ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    {/* Notification Type Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${config.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      {notif.title && (
                        <h4 className="text-xs font-bold text-slate-900 truncate mb-0.5">
                          {notif.title}
                        </h4>
                      )}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    {/* Unread indicator */}
                    {!notif.read && (
                      <span className="absolute top-4 right-3.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-200" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/80 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              <span>View all notifications</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
