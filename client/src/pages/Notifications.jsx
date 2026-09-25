import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  MessageSquare,
  Star,
  ThumbsUp,
  Award,
  UserPlus,
  AtSign,
  MessageCircle,
  Sparkles,
  Inbox,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../services/api';
import GlassAiButton from '../components/GlassAiButton';
import ParticlesBackground from '../components/ParticlesBackground';
import EmptyState3D from '../components/EmptyState3D';
import { Loader, LoaderContainer } from '../components/Loader';

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
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Notifications = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotificationList = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getNotifications(
        { unreadOnly: filter === 'unread', limit: 50 },
        token
      );
      if (res && res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      } else {
        setError(res?.message || 'Failed to load notifications');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotificationList();
    } else {
      setLoading(false);
    }
  }, [filter, token, isAuthenticated]);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await markNotificationAsRead(id, token);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token || unreadCount === 0) return;
    try {
      setActionLoading(true);
      await markAllNotificationsAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      alert('Failed to mark all as read: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await deleteNotification(id, token);
      const deleted = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deleted && !deleted.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      alert('Failed to delete notification: ' + err.message);
    }
  };

  const handleClearRead = async () => {
    if (!token) return;
    if (!window.confirm('Clear all read notifications?')) return;
    try {
      setActionLoading(true);
      await clearAllNotifications(token);
      setNotifications((prev) => prev.filter((n) => !n.read));
    } catch (err) {
      alert('Failed to clear read notifications: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read && token) {
      try {
        await markNotificationAsRead(notif._id, token);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.warn('Failed to mark as read:', err);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 text-2xl">
          🔒
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In Required</h2>
        <p className="text-sm text-slate-600 mb-6">
          Please sign in to view and manage your ProblemPool notifications.
        </p>
        <Link
          to="/login"
          state={{ from: '/notifications' }}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
        >
          Sign In to Account
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <ParticlesBackground />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Community Updates</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Notification Center
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Stay updated with real-time answers, reviews, helpful votes, and community achievements.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <GlassAiButton
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              loading={actionLoading}
              size="xs"
              variant="glass"
              icon={<CheckCheck className="w-3.5 h-3.5" />}
            >
              Mark All as Read
            </GlassAiButton>
          )}

          <GlassAiButton
            type="button"
            onClick={handleClearRead}
            disabled={actionLoading}
            size="xs"
            variant="glass"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear Read
          </GlassAiButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Notifications
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filter === 'unread' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoaderContainer minHeight="40vh" message="Loading notifications..." />
      ) : error ? (
        <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center max-w-md mx-auto">
          <p className="text-sm text-rose-600 font-semibold mb-4">{error}</p>
          <GlassAiButton
            type="button"
            onClick={fetchNotificationList}
            size="xs"
            variant="primary"
          >
            Try Again
          </GlassAiButton>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            {filter === 'unread'
              ? 'You are all caught up! Check back later for new community activity.'
              : 'When users answer your problems, vote on your answers, or follow you, updates will show up here.'}
          </p>

          <Link
            to="/problems"
            className="inline-flex px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            Explore Problems
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {notifications.map((notif) => {
            const config = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.system;
            const Icon = config.icon;

            return (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50 transition cursor-pointer relative group ${
                  !notif.read ? 'bg-indigo-50/20' : ''
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Notification Icon */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${config.color} shadow-2xs`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Message & Meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {notif.title && (
                        <h4 className="text-sm font-bold text-slate-900">
                          {notif.title}
                        </h4>
                      )}
                      {!notif.read && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          New
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <span>{formatTimeAgo(notif.createdAt)}</span>
                      {notif.link && (
                        <span className="text-indigo-600 group-hover:underline inline-flex items-center gap-1 font-semibold">
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side Item Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(e, notif._id)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, notif._id)}
                    title="Delete notification"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer opacity-0 group-hover:opacity-100 sm:opacity-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};

export default Notifications;
