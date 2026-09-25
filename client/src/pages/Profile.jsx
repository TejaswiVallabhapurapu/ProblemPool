import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Star,
  Award,
  Trophy,
  MessageSquare,
  ThumbsUp,
  Bookmark,
  CheckCircle2,
  Clock,
  MapPin,
  Briefcase,
  User,
  Edit3,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  Loader2,
  FolderSearch,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getMyProfileStats,
  updateMyProfile,
  getMyActivityTimeline,
  getMyReputationHistory,
  getMyProblems,
  getMyAnswers,
  getMySavedProblems,
} from '../services/api';
import ProblemCard from '../components/ProblemCard';

const Profile = () => {
  const { user: authUser, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab state (synced with ?tab= param)
  const currentTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Data states
  const [profileData, setProfileData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [reputationHistory, setReputationHistory] = useState([]);
  const [myProblems, setMyProblems] = useState([]);
  const [myAnswers, setMyAnswers] = useState([]);
  const [savedItems, setSavedItems] = useState([]);

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Profile Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    title: '',
    avatar: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Selected Achievement modal
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Initial Load of Profile Stats
  const fetchProfileOverview = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getMyProfileStats(token);
      if (data && data.success) {
        setProfileData(data);
        setEditForm({
          name: data.user.name || '',
          username: data.user.username || '',
          bio: data.user.bio || '',
          location: data.user.location || '',
          title: data.user.title || '',
          avatar: data.user.avatar || '',
        });
      } else {
        setError(data?.message || 'Failed to load profile');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileOverview();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Load Tab Specific Data on Tab Switch
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const loadTabData = async () => {
      setTabLoading(true);
      try {
        if (currentTab === 'activity' && activities.length === 0) {
          const res = await getMyActivityTimeline(token);
          if (res.success) setActivities(res.activities || []);
        } else if (currentTab === 'problems' && myProblems.length === 0) {
          const res = await getMyProblems(token);
          if (res.success) setMyProblems(res.problems || []);
        } else if (currentTab === 'answers' && myAnswers.length === 0) {
          const res = await getMyAnswers(token);
          if (res.success) setMyAnswers(res.answers || []);
        } else if (currentTab === 'history' && reputationHistory.length === 0) {
          const res = await getMyReputationHistory(token);
          if (res.success) setReputationHistory(res.history || []);
        } else if (currentTab === 'saved' && savedItems.length === 0) {
          const res = await getMySavedProblems(token);
          if (res.success) setSavedItems(res.savedProblems || []);
        }
      } catch (err) {
        console.warn(`Failed to load tab data for ${currentTab}:`, err);
      } finally {
        setTabLoading(false);
      }
    };

    loadTabData();
  }, [currentTab, token, isAuthenticated]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchProfileOverview();
    if (currentTab === 'activity') {
      const res = await getMyActivityTimeline(token);
      if (res.success) setActivities(res.activities || []);
    } else if (currentTab === 'problems') {
      const res = await getMyProblems(token);
      if (res.success) setMyProblems(res.problems || []);
    } else if (currentTab === 'answers') {
      const res = await getMyAnswers(token);
      if (res.success) setMyAnswers(res.answers || []);
    } else if (currentTab === 'history') {
      const res = await getMyReputationHistory(token);
      if (res.success) setReputationHistory(res.history || []);
    }
    setRefreshing(false);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    setSavingProfile(true);

    try {
      const res = await updateMyProfile(editForm, token);
      if (res.success) {
        setProfileData((prev) => ({
          ...prev,
          user: res.user,
          profileCompletion: res.profileCompletion,
        }));
        setEditSuccess('Profile updated successfully!');
        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditSuccess('');
        }, 1200);
      } else {
        setEditError(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setEditError(err.message || 'Error updating profile');
    } finally {
      setSavingProfile(false);
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
          Please log in to view and manage your ProblemPool profile, reputation, and achievements.
        </p>
        <Link
          to="/login"
          state={{ from: '/profile' }}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
        >
          Log In to Account
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 animate-pulse mb-8 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-slate-200" />
            <div className="space-y-3 flex-1">
              <div className="h-6 w-48 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-4 w-64 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Failed to Load Profile</h2>
        <p className="text-sm text-slate-600 mb-6">{error || 'Something went wrong'}</p>
        <button
          onClick={fetchProfileOverview}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const { user, stats, level, achievements, profileCompletion } = profileData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* ========================================================= */}
      {/* 1. PROFILE HEADER CARD */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 mb-8 relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-100/50 via-violet-50/30 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Avatar & User Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative group">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-indigo-200 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-extrabold text-3xl sm:text-4xl shadow-md shadow-indigo-200">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
                <span className="text-base" title={`Level: ${level.name}`}>
                  {level.icon}
                </span>
              </div>
            </div>

            {/* Name, Username, Title & Location */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {user.name}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  @{user.username}
                </span>
              </div>

              {user.title ? (
                <div className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 mb-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{user.title}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic mb-2">Community Problem Solver</div>
              )}

              {/* Bio snippet */}
              {user.bio && (
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl line-clamp-2 leading-relaxed mb-3">
                  {user.bio}
                </p>
              )}

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.location}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Header: Reputation & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            {/* Reputation Highlight Pill */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 sm:px-5 flex items-center gap-4 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center font-black text-xl">
                ⭐
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  {stats.reputation}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800/80 mt-1">
                  ProblemPool Reputation
                </div>
              </div>
            </div>

            {/* Edit Profile & Refresh Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                title="Refresh statistics"
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Completion Bar (if < 100%) */}
        {profileCompletion && profileCompletion.percentage < 100 && (
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-700">
                Profile Completion: {profileCompletion.percentage}%
              </span>
              <span className="text-slate-400">
                (Add {profileCompletion.items.filter((i) => !i.completed).map((i) => i.label).join(', ')} to reach 100%)
              </span>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-700 font-semibold underline shrink-0"
            >
              Complete Profile →
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. NAVIGATION TABS */}
      {/* ========================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-8 no-scrollbar border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: Star },
          { id: 'activity', label: 'Activity', icon: Clock },
          { id: 'problems', label: `My Problems (${stats.problemsCount})`, icon: MessageSquare },
          { id: 'answers', label: `My Answers (${stats.answersCount})`, icon: ThumbsUp },
          { id: 'achievements', label: `Achievements (${achievements.filter((a) => a.isUnlocked).length}/${achievements.length})`, icon: Trophy },
          { id: 'history', label: 'Reputation History', icon: TrendingUp },
          { id: 'saved', label: `Saved (${stats.savedCount})`, icon: Bookmark },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 3. TAB CONTENT VIEWS */}
      {/* ========================================================= */}

      {/* ----------------- TAB: OVERVIEW ----------------- */}
      {currentTab === 'overview' && (
        <div className="space-y-8">
          {/* Reputation & Community Impact Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-indigo-200 transition">
              <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center justify-between">
                <span>Reputation</span>
                <span className="text-amber-500">⭐</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.reputation}</div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-1">{level.name}</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-indigo-200 transition">
              <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center justify-between">
                <span>Problems</span>
                <span>📝</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.problemsCount}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Asked</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-indigo-200 transition">
              <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center justify-between">
                <span>Answers</span>
                <span>💡</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.answersCount}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Contributed</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-indigo-200 transition">
              <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center justify-between">
                <span>Helpful Votes</span>
                <span>👍</span>
              </div>
              <div className="text-2xl font-black text-emerald-700">{stats.helpfulVotesReceived}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">Received</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-indigo-200 transition">
              <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center justify-between">
                <span>Best Answers</span>
                <span>🏆</span>
              </div>
              <div className="text-2xl font-black text-amber-700">{stats.bestAnswersCount}</div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">Accepted</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-indigo-200 transition">
              <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center justify-between">
                <span>Reviews</span>
                <span>⭐</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.reviewsCount}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Written</div>
            </div>
          </div>

          {/* Level Progress Card */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">
                  Community Rank & Progression
                </div>
                <h3 className="text-2xl font-extrabold flex items-center gap-2">
                  <span>{level.icon}</span>
                  <span>{level.name}</span>
                </h3>
              </div>
              {level.next && (
                <div className="text-xs text-indigo-200 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md self-start sm:self-auto font-medium">
                  Next Level at <strong>{level.next} ⭐</strong> ({level.next - stats.reputation} pts remaining)
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {level.next && (
              <div className="w-full bg-indigo-950/60 rounded-full h-3 p-0.5 overflow-hidden border border-indigo-500/30">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${level.progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Key Achievements Grid Preview */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Achievements Showcase</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Milestones unlocked through problem-solving and community contributions.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('achievements')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({achievements.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {achievements.slice(0, 4).map((badge) => (
                <div
                  key={badge.type}
                  onClick={() => setSelectedBadge(badge)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center ${
                    badge.isUnlocked
                      ? 'bg-indigo-50/40 border-indigo-200 hover:shadow-md hover:border-indigo-300'
                      : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="text-xs font-bold text-slate-900 mb-1">{badge.title}</div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                    {badge.description}
                  </p>
                  <div className="mt-3">
                    {badge.isUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: ACTIVITY TIMELINE ----------------- */}
      {currentTab === 'activity' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Activity Timeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time chronological log of your questions, answers, reviews, and community actions.
              </p>
            </div>
          </div>

          {tabLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No recent activity recorded yet. Post a problem or answer to start building your timeline!
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {activities.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-4 border-white shadow-xs" />
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{item.badge}</span>
                        <span>•</span>
                        <span>{item.title}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(item.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">{item.description}</p>
                    {item.link && (
                      <Link
                        to={item.link}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB: MY PROBLEMS ----------------- */}
      {currentTab === 'problems' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Problems Asked by You ({myProblems.length})
            </h3>
            <Link
              to="/create-problem"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
            >
              <span>+ Post a Problem</span>
            </Link>
          </div>

          {tabLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : myProblems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="text-3xl mb-3">📝</div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">No problems posted yet</h4>
              <p className="text-xs text-slate-500 mb-6">
                Have a coding challenge, system issue, or question? Share it with the community!
              </p>
              <Link
                to="/create-problem"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                Post Your First Problem
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProblems.map((prob) => (
                <ProblemCard key={prob._id} problem={prob} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB: MY ANSWERS ----------------- */}
      {currentTab === 'answers' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Answers Given by You ({myAnswers.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Solutions and explanations you've provided for community problems.
              </p>
            </div>
          </div>

          {tabLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : myAnswers.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-3xl mb-2">💡</div>
              <h4 className="text-base font-bold text-slate-900 mb-1">No answers submitted yet</h4>
              <p className="text-xs text-slate-500 mb-4">
                Explore open problems and share your solutions to earn reputation and badges!
              </p>
              <Link
                to="/problems"
                className="inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                Browse Problems to Solve
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myAnswers.map((ans) => (
                <div
                  key={ans._id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <Link
                      to={`/problems/${ans.problem?._id}`}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition"
                    >
                      {ans.problem?.title}
                    </Link>

                    {ans.isBestAnswer && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                        🏆 Best Answer
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3 bg-white p-3 rounded-xl border border-slate-100">
                    {ans.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-3 text-emerald-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{ans.helpfulVotes} Helpful</span>
                      </span>
                    </div>

                    <Link
                      to={`/problems/${ans.problem?._id}`}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold text-[11px]"
                    >
                      View in Thread →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB: ACHIEVEMENTS / BADGES ----------------- */}
      {currentTab === 'achievements' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Community Achievements & Badges</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Unlock badges through active problem solving, helpful answers, and community engagement.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              {achievements.filter((a) => a.isUnlocked).length} / {achievements.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((badge) => (
              <div
                key={badge.type}
                onClick={() => setSelectedBadge(badge)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center relative ${
                  badge.isUnlocked
                    ? 'bg-white border-indigo-200 shadow-sm hover:shadow-md hover:border-indigo-400'
                    : 'bg-slate-50 border-slate-200/80 opacity-60 hover:opacity-90'
                }`}
              >
                <div className="text-4xl mb-3">{badge.icon}</div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{badge.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{badge.description}</p>
                <div className="mt-auto">
                  {badge.isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                      🔒 In Progress
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB: REPUTATION HISTORY ----------------- */}
      {currentTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Reputation Change History</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit log of all points gained or deducted based on real community actions.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
              Total Points: <strong className="text-indigo-600">{stats.reputation}</strong>
            </div>
          </div>

          {tabLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : reputationHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No reputation events recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reputationHistory.map((item) => (
                <div key={item._id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-extrabold ${
                        item.points > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.points > 0 ? `+${item.points}` : item.points}
                    </span>
                    <span className="text-xs font-medium text-slate-800">{item.reason}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB: SAVED PROBLEMS ----------------- */}
      {currentTab === 'saved' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Saved Problems ({savedItems.length})
            </h3>
            <Link
              to="/saved-problems"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              <span>Manage on Full Page →</span>
            </Link>
          </div>

          {tabLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : savedItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="text-3xl mb-3">🔖</div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">No saved problems</h4>
              <p className="text-xs text-slate-500 mb-6">
                Found an interesting question? Click "Save" to bookmark it for later.
              </p>
              <Link
                to="/problems"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                Explore Problems
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItems.map((item) => {
                const prob = item.problem || item;
                return <ProblemCard key={prob._id} problem={prob} isSaved={true} />;
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. EDIT PROFILE MODAL */}
      {/* ========================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Community Profile</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {editError}
              </div>
            )}
            {editSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Username (@handle)
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="e.g. tejas_dev"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Professional Title / Role
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="e.g. Fullstack Engineer, Problem Solver"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="e.g. Hyderabad, India"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bio / About Me (Max 500 chars)
                </label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell the ProblemPool community about your skills and interests..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={editForm.avatar}
                  onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                >
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. ACHIEVEMENT DETAILS MODAL */}
      {/* ========================================================= */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="text-5xl mb-3">{selectedBadge.icon}</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{selectedBadge.title}</h3>
            <p className="text-xs text-slate-600 mb-4">{selectedBadge.description}</p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 mb-6 font-medium">
              {selectedBadge.isUnlocked ? (
                <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Unlocked on {new Date(selectedBadge.unlockedAt).toLocaleDateString()}</span>
                </span>
              ) : (
                <span>Lock status: Not yet unlocked. Keep contributing to earn this badge!</span>
              )}
            </div>
            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
