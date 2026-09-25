import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  User as UserIcon,
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
  Users,
  UserPlus,
  UserCheck,
  Heart,
  Tag,
  BookOpen,
  Flag,
} from 'lucide-react';
import ReportModal from '../components/ReportModal';
import GlassAiButton from '../components/GlassAiButton';
import { useAuth } from '../context/AuthContext';
import {
  getMyProfileStats,
  getPublicUserProfile,
  updateMyProfile,
  updateUserInterests,
  getMyActivityTimeline,
  getMyReputationHistory,
  getMyProblems,
  getMyAnswers,
  getMySavedProblems,
  getUserFollowers,
  getUserFollowing,
  followUser,
} from '../services/api';
import ProblemCard from '../components/ProblemCard';
import KnowledgeNetworkBackground from '../components/KnowledgeNetworkBackground';
import EmptyState3D from '../components/EmptyState3D';

// Available pre-defined interests list
export const AVAILABLE_INTERESTS = [
  'Java',
  'Python',
  'JavaScript',
  'React',
  'Node.js',
  'MongoDB',
  'SQL',
  'DSA',
  'AI/ML',
  'Web Development',
  'Career',
  'College',
  'System Design',
  'DevOps',
  'General',
];

const Profile = () => {
  const { user: authUser, token, isAuthenticated } = useAuth();
  const { idOrUsername } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine if viewing own profile or someone else's public profile
  const isViewingSelf =
    !idOrUsername ||
    (authUser &&
      (authUser._id === idOrUsername ||
        authUser.username?.toLowerCase() === idOrUsername.toLowerCase()));

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
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  // Follow states
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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
    interests: [],
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Selected Achievement modal
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showReportUserModal, setShowReportUserModal] = useState(false);

  // Fetch Profile Overview (Self vs Public)
  const fetchProfileOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isViewingSelf) {
        if (!token) {
          setLoading(false);
          return;
        }
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
            interests: data.user.interests || [],
          });
        } else {
          setError(data?.message || 'Failed to load profile');
        }
      } else {
        // Public profile lookup
        const data = await getPublicUserProfile(idOrUsername, token);
        if (data && data.success && data.profile) {
          setProfileData({
            user: {
              _id: data.profile._id,
              name: data.profile.name,
              username: data.profile.username,
              bio: data.profile.bio,
              avatar: data.profile.avatar,
              location: data.profile.location,
              title: data.profile.title,
              interests: data.profile.interests || [],
              createdAt: data.profile.createdAt,
            },
            stats: data.profile.stats,
            level: data.profile.level,
            achievements: data.profile.achievements || [],
            isFollowing: data.profile.isFollowing,
            isSelf: data.profile.isSelf,
          });
          setIsFollowing(Boolean(data.profile.isFollowing));
        } else {
          setError(data?.message || 'User not found');
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileOverview();
  }, [idOrUsername, token, isAuthenticated]);

  // Load Tab Specific Data on Tab Switch
  useEffect(() => {
    if (!profileData?.user?._id) return;
    const targetUserId = profileData.user._id;

    const loadTabData = async () => {
      setTabLoading(true);
      try {
        if (currentTab === 'activity' && isViewingSelf && activities.length === 0) {
          const res = await getMyActivityTimeline(token);
          if (res.success) setActivities(res.activities || []);
        } else if (currentTab === 'problems' && myProblems.length === 0) {
          if (isViewingSelf) {
            const res = await getMyProblems(token);
            if (res.success) setMyProblems(res.problems || []);
          } else {
            // Fetch public problems by this user
            const res = await getMyProblems(token);
            if (res.success) {
              setMyProblems(res.problems || []);
            }
          }
        } else if (currentTab === 'answers' && isViewingSelf && myAnswers.length === 0) {
          const res = await getMyAnswers(token);
          if (res.success) setMyAnswers(res.answers || []);
        } else if (currentTab === 'history' && isViewingSelf && reputationHistory.length === 0) {
          const res = await getMyReputationHistory(token);
          if (res.success) setReputationHistory(res.history || []);
        } else if (currentTab === 'saved' && isViewingSelf && savedItems.length === 0) {
          const res = await getMySavedProblems(token);
          if (res.success) setSavedItems(res.savedProblems || []);
        } else if (currentTab === 'followers') {
          const res = await getUserFollowers(targetUserId, token);
          if (res.success) setFollowersList(res.followers || []);
        } else if (currentTab === 'following') {
          const res = await getUserFollowing(targetUserId, token);
          if (res.success) setFollowingList(res.following || []);
        }
      } catch (err) {
        console.warn(`Failed to load tab data for ${currentTab}:`, err);
      } finally {
        setTabLoading(false);
      }
    };

    loadTabData();
  }, [currentTab, profileData?.user?._id, token, isViewingSelf]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchProfileOverview();
    if (currentTab === 'followers' && profileData?.user?._id) {
      const res = await getUserFollowers(profileData.user._id, token);
      if (res.success) setFollowersList(res.followers || []);
    } else if (currentTab === 'following' && profileData?.user?._id) {
      const res = await getUserFollowing(profileData.user._id, token);
      if (res.success) setFollowingList(res.following || []);
    }
    setRefreshing(false);
  };

  // Follow / Unfollow user (for header button or follower card)
  const handleFollowToggle = async (targetUserId) => {
    if (!isAuthenticated || !token) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    setFollowLoading(true);
    try {
      const res = await followUser(targetUserId, token);
      if (res.success) {
        if (!isViewingSelf && profileData?.user?._id === targetUserId) {
          setIsFollowing(res.isFollowing);
          setProfileData((prev) => ({
            ...prev,
            stats: {
              ...prev.stats,
              followersCount: res.followersCount,
            },
          }));
        }

        // Update list items if in followers/following tab
        setFollowersList((prev) =>
          prev.map((u) => (u._id === targetUserId ? { ...u, isFollowing: res.isFollowing } : u))
        );
        setFollowingList((prev) =>
          prev.map((u) => (u._id === targetUserId ? { ...u, isFollowing: res.isFollowing } : u))
        );
      }
    } catch (err) {
      console.error('Follow action failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  // Toggle interest selection in edit form
  const handleInterestToggle = (interest) => {
    setEditForm((prev) => {
      const exists = prev.interests.includes(interest);
      const updated = exists
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: updated };
    });
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
        setEditSuccess('Profile and interests updated successfully!');
        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditSuccess('');
        }, 1000);
      } else {
        setEditError(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setEditError(err.message || 'Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!isAuthenticated && isViewingSelf) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 text-2xl">
          🔒
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In Required</h2>
        <p className="text-sm text-slate-600 mb-6">
          Please log in to view and manage your ProblemPool profile, reputation, followers, and interests.
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
        <h2 className="text-lg font-bold text-slate-900 mb-2">Profile Not Found</h2>
        <p className="text-sm text-slate-600 mb-6">{error || 'Something went wrong'}</p>
        <button
          onClick={() => navigate('/problems')}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
        >
          Back to Problems
        </button>
      </div>
    );
  }

  const { user, stats, level, achievements, profileCompletion } = profileData;

  return (
    <div className="relative min-h-screen">
      <KnowledgeNetworkBackground variant="constellation" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* ========================================================= */}
      {/* 1. PROFILE HEADER CARD */}
      {/* ========================================================= */}
      <div className="glass-card-3d rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 mb-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* User Info Left */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="relative group shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-indigo-50 border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-md ring-4 ring-indigo-50">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-white rounded-xl shadow-xs border border-slate-200 px-2 py-0.5 text-xs font-bold flex items-center gap-1">
                <span>{level.icon}</span>
                <span className="text-[11px] text-slate-700 hidden sm:inline">{level.name}</span>
              </div>
            </div>

            {/* Details */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
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

              {/* Bio */}
              {user.bio && (
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl line-clamp-2 leading-relaxed mb-3">
                  {user.bio}
                </p>
              )}

              {/* Meta & Followers Counts */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
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

                {/* Followers / Following Clickable Pills */}
                <button
                  type="button"
                  onClick={() => setActiveTab('followers')}
                  className="flex items-center gap-1 hover:text-indigo-600 transition cursor-pointer font-semibold"
                >
                  <strong className="text-slate-900">{stats.followersCount || 0}</strong> Followers
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('following')}
                  className="flex items-center gap-1 hover:text-indigo-600 transition cursor-pointer font-semibold"
                >
                  <strong className="text-slate-900">{stats.followingCount || 0}</strong> Following
                </button>
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

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isViewingSelf ? (
                <>
                  <GlassAiButton
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    size="xs"
                    variant="glass"
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    Edit Profile & Interests
                  </GlassAiButton>

                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    title="Refresh statistics"
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
                  </button>
                </>
              ) : (
                /* Public Follow / Following Button & Report User */
                <div className="flex items-center gap-2">
                  <GlassAiButton
                    type="button"
                    onClick={() => handleFollowToggle(user._id)}
                    disabled={followLoading}
                    loading={followLoading}
                    size="sm"
                    variant={isFollowing ? "glass" : "primary"}
                    icon={
                      isFollowing ? (
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )
                    }
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </GlassAiButton>

                  <GlassAiButton
                    type="button"
                    onClick={() => setShowReportUserModal(true)}
                    size="xs"
                    variant="glass"
                    title="Report user profile"
                    icon={<Flag className="w-4 h-4 text-rose-500" />}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completion Bar (for own profile if < 100%) */}
        {isViewingSelf && profileCompletion && profileCompletion.percentage < 100 && (
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
              className="text-indigo-600 hover:text-indigo-700 font-semibold underline shrink-0 cursor-pointer"
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
          { id: 'overview', label: 'Overview', icon: Star, show: true },
          { id: 'activity', label: 'Activity', icon: Clock, show: isViewingSelf },
          { id: 'problems', label: `Problems (${stats.problemsCount || 0})`, icon: MessageSquare, show: true },
          { id: 'answers', label: `Answers (${stats.answersCount || 0})`, icon: ThumbsUp, show: isViewingSelf },
          { id: 'achievements', label: `Achievements (${achievements.filter((a) => a.isUnlocked).length}/${achievements.length})`, icon: Trophy, show: true },
          { id: 'followers', label: `Followers (${stats.followersCount || 0})`, icon: Users, show: true },
          { id: 'following', label: `Following (${stats.followingCount || 0})`, icon: UserCheck, show: true },
          { id: 'history', label: 'Reputation History', icon: TrendingUp, show: isViewingSelf },
          { id: 'saved', label: `Saved (${stats.savedCount || 0})`, icon: Bookmark, show: isViewingSelf },
        ]
          .filter((t) => t.show)
          .map((tab) => {
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
                <span>Community</span>
                <span>👥</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.followersCount || 0}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Followers</div>
            </div>
          </div>

          {/* User Learning & Problem Interests Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>🎯 Focus Areas & Interests</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selected technical topics and problem domains shaping recommendations and community feeds.
                </p>
              </div>
              {isViewingSelf && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Interests</span>
                </button>
              )}
            </div>

            {user.interests && user.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-xs hover:bg-indigo-100/80 transition"
                  >
                    <Tag className="w-3 h-3 text-indigo-500" />
                    <span>{interest}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-500 mb-3">
                  {isViewingSelf
                    ? 'You have not selected any technical interests yet. Choose your favorite topics to receive personalized problem recommendations!'
                    : 'This user has not listed specific technical interests yet.'}
                </p>
                {isViewingSelf && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Choose Topics & Interests</span>
                  </button>
                )}
              </div>
            )}
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
                      ? 'bg-gradient-to-b from-indigo-50/50 to-white border-indigo-200 shadow-xs hover:border-indigo-300 hover:scale-[1.02]'
                      : 'bg-slate-50/60 border-slate-200/80 opacity-60 grayscale hover:opacity-80'
                  }`}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="font-bold text-xs text-slate-900">{badge.title}</div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {badge.description}
                  </div>
                  {badge.isUnlocked ? (
                    <span className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Unlocked
                    </span>
                  ) : (
                    <span className="mt-2 text-[10px] font-medium text-slate-400">Locked</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: FOLLOWERS ----------------- */}
      {currentTab === 'followers' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Followers ({followersList.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Community members following {isViewingSelf ? 'your' : `${user.name}'s`} problem-solving journey.
              </p>
            </div>
          </div>

          {tabLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : followersList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>No followers yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followersList.map((f) => (
                <div
                  key={f._id}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-indigo-200 transition-all shadow-xs flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Link to={`/profile/${f.username || f._id}`} className="shrink-0">
                      {f.avatar ? (
                        <img
                          src={f.avatar}
                          alt={f.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 ring-2 ring-indigo-50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                          {f.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0">
                      <Link
                        to={`/profile/${f.username || f._id}`}
                        className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition truncate block"
                      >
                        {f.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>@{f.username}</span>
                        <span>•</span>
                        <span className="text-amber-600 font-semibold">⭐ {f.reputation}</span>
                      </div>
                      {f.title && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{f.title}</div>
                      )}
                    </div>
                  </div>

                  {/* Follow / Unfollow button if not self */}
                  {!f.isSelf && isAuthenticated && (
                    <GlassAiButton
                      type="button"
                      onClick={() => handleFollowToggle(f._id)}
                      size="xs"
                      variant={f.isFollowing ? "glass" : "primary"}
                    >
                      {f.isFollowing ? 'Following' : 'Follow'}
                    </GlassAiButton>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB: FOLLOWING ----------------- */}
      {currentTab === 'following' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Following ({followingList.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Community members and problem solvers {isViewingSelf ? 'you follow' : `${user.name} follows`}.
              </p>
            </div>
          </div>

          {tabLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : followingList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>Not following anyone yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followingList.map((f) => (
                <div
                  key={f._id}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-indigo-200 transition-all shadow-xs flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Link to={`/profile/${f.username || f._id}`} className="shrink-0">
                      {f.avatar ? (
                        <img
                          src={f.avatar}
                          alt={f.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 ring-2 ring-indigo-50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                          {f.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0">
                      <Link
                        to={`/profile/${f.username || f._id}`}
                        className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition truncate block"
                      >
                        {f.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>@{f.username}</span>
                        <span>•</span>
                        <span className="text-amber-600 font-semibold">⭐ {f.reputation}</span>
                      </div>
                      {f.title && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{f.title}</div>
                      )}
                    </div>
                  </div>

                  {/* Follow / Unfollow button if not self */}
                  {!f.isSelf && isAuthenticated && (
                    <GlassAiButton
                      type="button"
                      onClick={() => handleFollowToggle(f._id)}
                      size="xs"
                      variant={f.isFollowing ? "glass" : "primary"}
                    >
                      {f.isFollowing ? 'Following' : 'Follow'}
                    </GlassAiButton>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB: ACTIVITY ----------------- */}
      {currentTab === 'activity' && isViewingSelf && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Community Activity Log</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Timeline of problems asked, solutions posted, and reviews written.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {activities.length} Recorded Actions
            </div>
          </div>

          {tabLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No recent community activity yet. Post a problem or answer one to start!
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 transition shadow-xs flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {act.badge}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{act.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{act.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-400">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                    {act.link && (
                      <Link
                        to={act.link}
                        className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold inline-flex items-center gap-0.5"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB: PROBLEMS ----------------- */}
      {currentTab === 'problems' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Problems Asked ({myProblems.length})
            </h3>
            {isViewingSelf && (
              <Link
                to="/create-problem"
                className="text-xs font-semibold px-4 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                + Ask New Problem
              </Link>
            )}
          </div>

          {tabLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : myProblems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="text-3xl mb-3">📝</div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">No problems submitted yet</h4>
              <p className="text-xs text-slate-500 mb-6">
                Encountering a challenge or looking for collaborative answers?
              </p>
              {isViewingSelf && (
                <Link
                  to="/create-problem"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  Post Your First Problem
                </Link>
              )}
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

      {/* ----------------- TAB: ANSWERS ----------------- */}
      {currentTab === 'answers' && isViewingSelf && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Answers Given ({myAnswers.length})</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Solutions provided to community questions and challenges.
              </p>
            </div>
          </div>

          {tabLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : myAnswers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              You haven't contributed any answers yet. Browse open problems to help others!
            </div>
          ) : (
            <div className="space-y-4">
              {myAnswers.map((ans) => (
                <div
                  key={ans._id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-100 transition shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {ans.isBestAnswer && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-xs">
                            🏆 Accepted Best Answer
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-500">
                          Answered on {new Date(ans.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Link
                        to={`/problems/${ans.problem._id}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 text-sm line-clamp-1"
                      >
                        {ans.problem.title}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">
                        👍 {ans.helpfulVotes} Helpful
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 bg-white p-3 rounded-xl border border-slate-100 font-mono text-[11px]">
                    {ans.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB: ACHIEVEMENTS ----------------- */}
      {currentTab === 'achievements' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Community Badges & Milestones</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Earn recognition for helpful answers, solved challenges, and community support.
              </p>
            </div>
            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
              {achievements.filter((a) => a.isUnlocked).length} / {achievements.length} Unlocked
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((badge) => (
              <div
                key={badge.type}
                onClick={() => setSelectedBadge(badge)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center ${
                  badge.isUnlocked
                    ? 'bg-gradient-to-b from-indigo-50/40 to-white border-indigo-200 shadow-xs hover:border-indigo-300 hover:shadow-md'
                    : 'bg-slate-50/80 border-slate-200/80 opacity-60 grayscale hover:opacity-80'
                }`}
              >
                <div className="text-4xl mb-3">{badge.icon}</div>
                <div className="font-extrabold text-sm text-slate-900 mb-1">{badge.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {badge.description}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center">
                  {badge.isUnlocked ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Unlocked {badge.unlockedAt ? new Date(badge.unlockedAt).toLocaleDateString() : ''}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">
                      Locked • Click for criteria
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB: REPUTATION HISTORY ----------------- */}
      {currentTab === 'history' && isViewingSelf && (
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
      {currentTab === 'saved' && isViewingSelf && (
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
      {/* 4. EDIT PROFILE & INTERESTS MODAL */}
      {/* ========================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Profile & Interests</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
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

              {/* Interests Multi-Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Technical Interests & Topics (Multiple Selection)
                </label>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Select topics you are passionate about to personalize your problem recommendations feed.
                </p>
                <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-3 bg-slate-50/80 rounded-2xl border border-slate-200">
                  {AVAILABLE_INTERESTS.map((topic) => {
                    const isSelected = editForm.interests.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handleInterestToggle(topic)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : <Tag className="w-3 h-3 text-slate-400" />}
                        <span>{topic}</span>
                      </button>
                    );
                  })}
                </div>
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
                  placeholder="Tell the ProblemPool community about your skills and problem-solving focus..."
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
                <GlassAiButton
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  size="xs"
                  variant="glass"
                >
                  Cancel
                </GlassAiButton>
                <GlassAiButton
                  type="submit"
                  disabled={savingProfile}
                  loading={savingProfile}
                  size="xs"
                  variant="primary"
                >
                  Save Changes
                </GlassAiButton>
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

      {/* Report User Modal */}
      {showReportUserModal && user && (
        <ReportModal
          isOpen={showReportUserModal}
          onClose={() => setShowReportUserModal(false)}
          contentType="user"
          contentId={user._id}
          contentTitle={`User Profile: ${user.name}`}
        />
      )}
      </div>
    </div>
  );
};

export default Profile;
