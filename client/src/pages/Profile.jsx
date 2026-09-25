import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ReportModal from '../components/ReportModal';
import GlassAiButton from '../components/GlassAiButton';
import { Loader, LoaderContainer } from '../components/Loader';
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
          const raw = data.profile || data;
          const normalized = {
            success: true,
            user: {
              _id: raw.user?._id || raw._id,
              name: raw.user?.name || raw.name || '',
              username: raw.user?.username || raw.username || '',
              bio: raw.user?.bio || raw.bio || '',
              location: raw.user?.location || raw.location || '',
              title: raw.user?.title || raw.title || '',
              avatar: raw.user?.avatar || raw.avatar || '',
              interests: Array.isArray(raw.user?.interests) ? raw.user.interests : (Array.isArray(raw.interests) ? raw.interests : []),
              createdAt: raw.user?.createdAt || raw.createdAt,
            },
            stats: raw.stats || {
              reputation: raw.user?.reputation || raw.reputation || 0,
              problemsCount: 0,
              answersCount: 0,
              helpfulVotesReceived: 0,
              bestAnswersCount: 0,
              reviewsCount: 0,
              savedCount: 0,
              followersCount: raw.followersCount || 0,
              followingCount: raw.followingCount || 0,
            },
            level: raw.level || { name: 'Initiate', minRep: 0, next: 50, progress: 0 },
            achievements: raw.achievements || [],
            profileCompletion: raw.profileCompletion || { percentage: 100, completedTasks: [], pendingTasks: [] },
            isFollowing: Boolean(raw.isFollowing ?? data.isFollowing),
            isSelf: true,
          };
          setProfileData(normalized);
          setEditForm({
            name: normalized.user.name,
            username: normalized.user.username,
            bio: normalized.user.bio,
            location: normalized.user.location,
            title: normalized.user.title,
            avatar: normalized.user.avatar,
            interests: normalized.user.interests,
          });
        } else {
          setError(data?.message || 'Failed to load profile');
        }
      } else {
        // Public profile lookup
        const data = await getPublicUserProfile(idOrUsername, token);
        if (data && data.success) {
          const raw = data.profile || data;
          const normalized = {
            success: true,
            user: {
              _id: raw.user?._id || raw._id,
              name: raw.user?.name || raw.name || '',
              username: raw.user?.username || raw.username || '',
              bio: raw.user?.bio || raw.bio || '',
              location: raw.user?.location || raw.location || '',
              title: raw.user?.title || raw.title || '',
              avatar: raw.user?.avatar || raw.avatar || '',
              interests: Array.isArray(raw.user?.interests) ? raw.user.interests : (Array.isArray(raw.interests) ? raw.interests : []),
              createdAt: raw.user?.createdAt || raw.createdAt,
            },
            stats: raw.stats || {
              reputation: raw.user?.reputation || raw.reputation || 0,
              problemsCount: 0,
              answersCount: 0,
              helpfulVotesReceived: 0,
              bestAnswersCount: 0,
              reviewsCount: 0,
              savedCount: 0,
              followersCount: raw.followersCount || 0,
              followingCount: raw.followingCount || 0,
            },
            level: raw.level || { name: 'Initiate', minRep: 0, next: 50, progress: 0 },
            achievements: raw.achievements || [],
            profileCompletion: raw.profileCompletion || { percentage: 100, completedTasks: [], pendingTasks: [] },
            isFollowing: Boolean(raw.isFollowing ?? data.isFollowing),
            isSelf: Boolean(raw.isSelf ?? data.isSelf),
          };
          setProfileData(normalized);
          setIsFollowing(!!normalized.isFollowing);
        } else {
          setError(data?.message || 'User profile not found');
        }
      }
    } catch (err) {
      console.error('Error fetching profile overview:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Load Tab-specific data on-demand
  const fetchTabData = async () => {
    if (!profileData?.user?._id) return;
    try {
      setTabLoading(true);
      const userId = profileData.user._id;

      if (currentTab === 'activity' && isViewingSelf) {
        const res = await getMyActivityTimeline(token);
        if (res && res.success) setActivities(res.activities || []);
      } else if (currentTab === 'history' && isViewingSelf) {
        const res = await getMyReputationHistory(token);
        if (res && res.success) setReputationHistory(res.history || []);
      } else if (currentTab === 'problems') {
        const res = await getMyProblems(isViewingSelf ? null : userId, token);
        if (res && res.success) setMyProblems(res.problems || []);
      } else if (currentTab === 'answers' && isViewingSelf) {
        const res = await getMyAnswers(token);
        if (res && res.success) setMyAnswers(res.answers || []);
      } else if (currentTab === 'saved' && isViewingSelf) {
        const res = await getMySavedProblems(token);
        if (res && res.success) setSavedItems(res.savedProblems || []);
      } else if (currentTab === 'followers') {
        const res = await getUserFollowers(userId, token);
        if (res && res.success) setFollowersList(res.followers || []);
      } else if (currentTab === 'following') {
        const res = await getUserFollowing(userId, token);
        if (res && res.success) setFollowingList(res.following || []);
      }
    } catch (err) {
      console.warn('Tab data fetch error:', err);
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileOverview();
  }, [idOrUsername, token, isViewingSelf]);

  useEffect(() => {
    fetchTabData();
  }, [currentTab, profileData?.user?._id]);

  // Handle follow / unfollow toggle
  const handleFollowToggle = async (targetUserId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    try {
      setFollowLoading(true);
      const res = await followUser(targetUserId, token);
      if (res && res.success) {
        setIsFollowing(res.isFollowing);
        setProfileData((prev) => {
          if (!prev) return prev;
          const currentFollowers = prev.stats.followersCount || 0;
          return {
            ...prev,
            stats: {
              ...prev.stats,
              followersCount: res.isFollowing
                ? currentFollowers + 1
                : Math.max(0, currentFollowers - 1),
            },
          };
        });
      }
    } catch (err) {
      console.error('Failed to toggle follow status:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchProfileOverview();
    await fetchTabData();
    setRefreshing(false);
  };

  const handleInterestToggle = (interest) => {
    setEditForm((prev) => {
      const current = prev.interests || [];
      if (current.includes(interest)) {
        return { ...prev, interests: current.filter((i) => i !== interest) };
      } else {
        return { ...prev, interests: [...current, interest] };
      }
    });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setEditError('');
    setEditSuccess('');

    try {
      const res = await updateMyProfile(editForm, token);
      if (res && res.success) {
        setEditSuccess('Profile and interests updated successfully!');
        setProfileData((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            ...res.user,
          },
        }));
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
        <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
        <p className="text-sm text-slate-400 mb-6">
          Please sign in to view and manage your ProblemPool profile, reputation, followers, and interests.
        </p>
        <Link
          to="/login"
          state={{ from: '/profile' }}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-black bg-white hover:bg-slate-200 shadow-sm transition"
        >
          Sign In to Account
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <LoaderContainer minHeight="70vh" message="Loading profile..." />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Profile Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error || 'Something went wrong'}</p>
        <button
          onClick={() => navigate('/problems')}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-black bg-white hover:bg-slate-200 cursor-pointer"
        >
          Back to Problems
        </button>
      </div>
    );
  }

  const user = profileData?.user || {};
  const stats = profileData?.stats || { reputation: 0, problemsCount: 0, answersCount: 0, helpfulVotesReceived: 0, bestAnswersCount: 0, reviewsCount: 0, savedCount: 0, followersCount: 0, followingCount: 0 };
  const level = profileData?.level || { name: 'Initiate', progress: 0 };
  const achievements = profileData?.achievements || [];
  const profileCompletion = profileData?.profileCompletion || { percentage: 0, completedTasks: [], pendingTasks: [] };

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ========================================================= */}
        {/* 1. PROFILE HEADER CARD (Dark Glass - Text Only) */}
        {/* ========================================================= */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#121212]/80 backdrop-blur-md border border-white/10 shadow-xl mb-8 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* User Info Left */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
              {/* Avatar Initial or Picture */}
              <div className="relative group shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || user.username || 'User'}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-white/15 border border-white/10 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#1c1c1c] border border-white/15 text-white flex items-center justify-center text-3xl font-extrabold shadow-md ring-2 ring-white/10">
                    {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-[#181818] rounded-xl shadow-xs border border-white/15 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                  {level.name || 'Initiate'}
                </div>
              </div>

              {/* Details */}
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {user.name || user.username || 'Problem Solver'}
                  </h1>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15">
                    @{user.username || 'solver'}
                  </span>
                </div>

                {user.title ? (
                  <div className="text-sm font-medium text-slate-300 mb-2">
                    {user.title}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic mb-2">Community Problem Solver</div>
                )}

                {/* Bio */}
                {user.bio && (
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl line-clamp-2 leading-relaxed mb-3 font-medium">
                    {user.bio}
                  </p>
                )}

                {/* Meta & Followers Counts */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                  {user.location && (
                    <span>{user.location}</span>
                  )}
                  <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>

                  {/* Followers / Following Clickable Pills */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('followers')}
                    className="hover:text-white transition cursor-pointer font-semibold"
                  >
                    <strong className="text-white">{stats.followersCount || 0}</strong> Followers
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('following')}
                    className="hover:text-white transition cursor-pointer font-semibold"
                  >
                    <strong className="text-white">{stats.followingCount || 0}</strong> Following
                  </button>
                </div>
              </div>
            </div>

            {/* Right Header: Reputation & Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10">
              {/* Reputation Highlight Pill (Text Only) */}
              <div className="bg-[#181818]/90 border border-white/15 rounded-2xl p-3.5 sm:px-5 flex flex-col items-start sm:items-end shadow-md backdrop-blur-md">
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                  {stats.reputation}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Reputation Points
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
                    >
                      Edit Profile & Interests
                    </GlassAiButton>

                    <button
                      type="button"
                      onClick={handleManualRefresh}
                      disabled={refreshing}
                      className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#181818] text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#222222] transition cursor-pointer"
                    >
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <GlassAiButton
                      type="button"
                      onClick={() => handleFollowToggle(user._id)}
                      disabled={followLoading}
                      loading={followLoading}
                      size="sm"
                      variant={isFollowing ? "glass" : "primary"}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </GlassAiButton>

                    <GlassAiButton
                      type="button"
                      onClick={() => setShowReportUserModal(true)}
                      size="xs"
                      variant="glass"
                    >
                      Report
                    </GlassAiButton>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Completion Bar */}
          {isViewingSelf && profileCompletion && profileCompletion.percentage < 100 && (
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">
                  Profile Completion: {profileCompletion.percentage}%
                </span>
                <span className="text-slate-400">
                  (Add {profileCompletion.items.filter((i) => !i.completed).map((i) => i.label).join(', ')} to reach 100%)
                </span>
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-white hover:text-slate-300 font-semibold underline shrink-0 cursor-pointer"
              >
                Complete Profile
              </button>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 2. NAVIGATION TABS (Text Only) */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-8 no-scrollbar border-b border-white/10">
          {[
            { id: 'overview', label: 'Overview', show: true },
            { id: 'activity', label: 'Activity', show: isViewingSelf },
            { id: 'problems', label: `Problems (${stats.problemsCount || 0})`, show: true },
            { id: 'answers', label: `Answers (${stats.answersCount || 0})`, show: isViewingSelf },
            { id: 'achievements', label: `Achievements (${achievements.filter((a) => a.isUnlocked).length}/${achievements.length})`, show: true },
            { id: 'followers', label: `Followers (${stats.followersCount || 0})`, show: true },
            { id: 'following', label: `Following (${stats.followingCount || 0})`, show: true },
            { id: 'history', label: 'Reputation History', show: isViewingSelf },
            { id: 'saved', label: `Saved (${stats.savedCount || 0})`, show: isViewingSelf },
          ]
            .filter((t) => t.show)
            .map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/20 font-bold shadow-xs'
                      : 'text-[#D1D5DB] hover:text-white hover:bg-white/5'
                  }`}
                >
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
            {/* Reputation & Community Impact Overview Grid (Text Only) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-[#141414]/80 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-sm hover:border-white/20 transition">
                <div className="text-slate-400 text-xs font-semibold mb-1">
                  Reputation
                </div>
                <div className="text-2xl font-black text-white">{stats.reputation || 0}</div>
                <div className="text-[11px] text-slate-300 font-semibold mt-1">{level?.name || 'Initiate'}</div>
              </div>

              <div className="bg-[#141414]/80 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-sm hover:border-white/20 transition">
                <div className="text-slate-400 text-xs font-semibold mb-1">
                  Problems
                </div>
                <div className="text-2xl font-black text-white">{stats.problemsCount}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">Asked</div>
              </div>

              <div className="bg-[#141414]/80 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-sm hover:border-white/20 transition">
                <div className="text-slate-400 text-xs font-semibold mb-1">
                  Answers
                </div>
                <div className="text-2xl font-black text-white">{stats.answersCount}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">Contributed</div>
              </div>

              <div className="bg-[#141414]/80 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-sm hover:border-white/20 transition">
                <div className="text-slate-400 text-xs font-semibold mb-1">
                  Helpful Votes
                </div>
                <div className="text-2xl font-black text-white">{stats.helpfulVotesReceived}</div>
                <div className="text-[11px] text-emerald-400 font-medium mt-1">Received</div>
              </div>

              <div className="bg-[#141414]/80 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-sm hover:border-white/20 transition">
                <div className="text-slate-400 text-xs font-semibold mb-1">
                  Best Answers
                </div>
                <div className="text-2xl font-black text-white">{stats.bestAnswersCount}</div>
                <div className="text-[11px] text-amber-400 font-medium mt-1">Accepted</div>
              </div>

              <div className="bg-[#141414]/80 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-sm hover:border-white/20 transition">
                <div className="text-slate-400 text-xs font-semibold mb-1">
                  Community
                </div>
                <div className="text-2xl font-black text-white">{stats.followersCount || 0}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">Followers</div>
              </div>
            </div>

            {/* User Learning & Problem Interests Card */}
            <div className="bg-[#141414]/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Focus Areas & Interests
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selected technical topics and problem domains shaping recommendations and community feeds.
                  </p>
                </div>
                {isViewingSelf && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center cursor-pointer"
                  >
                    Edit Interests
                  </button>
                )}
              </div>

              {user.interests && user.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {user.interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#1c1c1c] border border-white/10 text-slate-200 text-xs font-semibold shadow-xs hover:border-white/20 transition"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-[#181818]/60 rounded-2xl border border-dashed border-white/10 text-center">
                  <p className="text-xs text-slate-400 mb-3">
                    {isViewingSelf
                      ? 'You have not selected any technical interests yet. Choose your favorite topics to receive personalized problem recommendations!'
                      : 'This user has not listed specific technical interests yet.'}
                  </p>
                  {isViewingSelf && (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-black bg-white hover:bg-slate-200 cursor-pointer transition shadow-xs"
                    >
                      Choose Topics & Interests
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Level Progress Card */}
            <div className="bg-[#161616] border border-white/10 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                    Community Rank & Progression
                  </div>
                  <h3 className="text-2xl font-extrabold">
                    {level?.name || 'Initiate'}
                  </h3>
                </div>
                {level?.next && (
                  <div className="text-xs text-slate-300 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md self-start sm:self-auto font-medium">
                    Next Level at <strong className="text-white">{level.next} pts</strong> ({level.next - (stats.reputation || 0)} pts remaining)
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {level?.next && (
                <div className="w-full bg-[#0e0e0e] rounded-full h-3 p-0.5 overflow-hidden border border-white/10">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${level.progress || 0}%` }}
                  />
                </div>
              )}
            </div>

            {/* Key Achievements Grid Preview (Text Only) */}
            <div className="bg-[#141414]/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Achievements Showcase</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Milestones unlocked through problem-solving and community contributions.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('achievements')}
                  className="text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  View All ({achievements.length})
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {achievements.slice(0, 4).map((badge) => (
                  <div
                    key={badge.type}
                    onClick={() => setSelectedBadge(badge)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center ${
                      badge.isUnlocked
                        ? 'bg-[#181818] border-white/15 shadow-xs hover:border-white/30 hover:scale-[1.02]'
                        : 'bg-[#121212]/60 border-white/5 opacity-50 grayscale hover:opacity-75'
                    }`}
                  >
                    <div className="font-bold text-xs text-white mb-1">{badge.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {badge.description}
                    </div>
                    {badge.isUnlocked ? (
                      <span className="mt-2 text-[10px] font-bold text-white bg-white/10 border border-white/15 px-2 py-0.5 rounded-md">
                        Unlocked
                      </span>
                    ) : (
                      <span className="mt-2 text-[10px] font-medium text-slate-500">Locked</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB: FOLLOWERS ----------------- */}
        {currentTab === 'followers' && (
          <div className="bg-[#141414]/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Followers ({followersList.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Community members following {isViewingSelf ? 'your' : `${user?.name || user?.username || 'this user'}'s`} problem-solving journey.
                </p>
              </div>
            </div>

            {tabLoading ? (
              <div className="py-12 flex justify-center">
                <Loader size="md" />
              </div>
            ) : followersList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <p>No followers yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followersList.map((f) => (
                  <div
                    key={f._id}
                    className="p-4 rounded-2xl border border-white/10 bg-[#181818] hover:border-white/20 transition-all shadow-xs flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Link to={`/profile/${f.username || f._id}`} className="shrink-0">
                        {f.avatar ? (
                          <img
                            src={f.avatar}
                            alt={f.name || f.username || 'Follower'}
                            className="w-12 h-12 rounded-xl object-cover border border-white/10 ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#202020] border border-white/15 text-white flex items-center justify-center font-bold text-lg">
                            {f.name?.charAt(0)?.toUpperCase() || f.username?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </Link>
                      <div className="min-w-0">
                        <Link
                          to={`/profile/${f.username || f._id}`}
                          className="font-bold text-sm text-white hover:text-slate-300 transition truncate block"
                        >
                          {f.name || f.username || 'Community Solver'}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span>@{f.username || 'solver'}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">{f.reputation || 0} pts</span>
                        </div>
                        {f.title && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{f.title}</div>
                        )}
                      </div>
                    </div>

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
          <div className="bg-[#141414]/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Following ({followingList.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Community members and problem solvers {isViewingSelf ? 'you follow' : `${user?.name || user?.username || 'this user'} follows`}.
                </p>
              </div>
            </div>

            {tabLoading ? (
              <div className="py-12 flex justify-center">
                <Loader size="md" />
              </div>
            ) : followingList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <p>Not following anyone yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followingList.map((f) => (
                  <div
                    key={f._id}
                    className="p-4 rounded-2xl border border-white/10 bg-[#181818] hover:border-white/20 transition-all shadow-xs flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Link to={`/profile/${f.username || f._id}`} className="shrink-0">
                        {f.avatar ? (
                          <img
                            src={f.avatar}
                            alt={f.name || f.username || 'User'}
                            className="w-12 h-12 rounded-xl object-cover border border-white/10 ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#202020] border border-white/15 text-white flex items-center justify-center font-bold text-lg">
                            {f.name?.charAt(0)?.toUpperCase() || f.username?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </Link>
                      <div className="min-w-0">
                        <Link
                          to={`/profile/${f.username || f._id}`}
                          className="font-bold text-sm text-white hover:text-slate-300 transition truncate block"
                        >
                          {f.name || f.username || 'Community Solver'}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span>@{f.username || 'solver'}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">{f.reputation || 0} pts</span>
                        </div>
                        {f.title && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{f.title}</div>
                        )}
                      </div>
                    </div>

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
          <div className="bg-[#141414]/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">Community Activity Log</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Timeline of problems asked, solutions posted, and reviews written.
                </p>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {activities.length} Recorded Actions
              </div>
            </div>

            {tabLoading ? (
              <div className="py-12 flex justify-center">
                <Loader size="md" />
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
                    className="p-4 rounded-2xl border border-white/10 bg-[#181818] hover:border-white/20 transition shadow-xs flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/15">
                          {act.type || 'Action'}
                        </span>
                        <span className="text-xs font-bold text-white">{act.title}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-1">{act.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-slate-400">
                        {new Date(act.timestamp).toLocaleDateString()}
                      </span>
                      {act.link && (
                        <Link
                          to={act.link}
                          className="text-white hover:text-slate-300 text-xs font-semibold inline-flex items-center"
                        >
                          View
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
              <h3 className="text-lg font-bold text-white">
                Problems Asked ({myProblems.length})
              </h3>
              {isViewingSelf && (
                <Link
                  to="/create-problem"
                  className="text-xs font-semibold px-4 py-2 rounded-xl text-black bg-white hover:bg-slate-200 transition"
                >
                  Ask New Problem
                </Link>
              )}
            </div>

            {tabLoading ? (
              <div className="py-12 flex justify-center">
                <Loader size="md" />
              </div>
            ) : myProblems.length === 0 ? (
              <div className="bg-[#141414]/80 backdrop-blur-md rounded-3xl border border-white/10 p-12 text-center max-w-lg mx-auto shadow-sm">
                <h4 className="text-lg font-bold text-white mb-1">No problems submitted yet</h4>
                <p className="text-xs text-slate-400 mb-6">
                  Encountering a challenge or looking for collaborative answers?
                </p>
                {isViewingSelf && (
                  <Link
                    to="/create-problem"
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-black bg-white hover:bg-slate-200 transition inline-block"
                  >
                    Post Your First Problem
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProblems.map((prob) => (
                  <ProblemCard
                    key={prob._id}
                    problem={prob}
                    onDelete={(deletedId) => setMyProblems((prev) => prev.filter((p) => p._id !== deletedId))}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: ANSWERS ----------------- */}
        {currentTab === 'answers' && isViewingSelf && (
          <div className="bg-[#141414]/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">Answers Given ({myAnswers.length})</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Solutions provided to community questions and challenges.
                </p>
              </div>
            </div>

            {tabLoading ? (
              <div className="py-12 flex justify-center">
                <Loader size="md" />
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
                    className="p-5 rounded-2xl border border-white/10 bg-[#181818] hover:border-white/20 transition shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {ans.isBestAnswer && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white text-black shadow-xs">
                              Accepted Best Answer
                            </span>
                          )}
                          <span className="text-xs font-semibold text-slate-400">
                            Answered on {new Date(ans.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Link
                          to={`/problems/${ans.problem._id}`}
                          className="font-bold text-white hover:text-slate-300 text-sm line-clamp-1"
                        >
                          {ans.problem.title}
                        </Link>
                      </div>

                      <div className="flex items-center gap-2 text-xs shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 font-bold">
                          {ans.helpfulVotes} Helpful Votes
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 bg-[#121212] p-3 rounded-xl border border-white/10 font-mono text-[11px]">
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
          <div className="bg-[#141414]/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">Community Badges & Milestones</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Earn recognition for helpful answers, solved challenges, and community support.
                </p>
              </div>
              <div className="text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
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
                      ? 'bg-[#181818] border-white/15 shadow-xs hover:border-white/30 hover:shadow-md hover:scale-[1.02]'
                      : 'bg-[#121212]/60 border-white/5 opacity-50 grayscale hover:opacity-75'
                  }`}
                >
                  <div className="font-extrabold text-sm text-white mb-1">{badge.title}</div>
                  <div className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {badge.description}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-center">
                    {badge.isUnlocked ? (
                      <span className="text-xs font-bold text-emerald-400">
                        Unlocked {badge.unlockedAt ? new Date(badge.unlockedAt).toLocaleDateString() : ''}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">
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
          <div className="bg-[#141414]/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">Reputation Change History</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Audit log of all points gained or deducted based on real community actions.
                </p>
              </div>
              <div className="text-xs font-bold text-slate-300 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl">
                Total Points: <strong className="text-white">{stats.reputation}</strong>
              </div>
            </div>

            {tabLoading ? (
              <div className="py-12 flex justify-center">
                <Loader size="md" />
              </div>
            ) : reputationHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No reputation events recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {reputationHistory.map((item) => (
                  <div key={item._id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-extrabold ${
                          item.points > 0
                            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20'
                            : 'bg-rose-950/40 text-rose-300 border border-rose-500/20'
                        }`}
                      >
                        {item.points > 0 ? `+${item.points}` : item.points}
                      </span>
                      <span className="text-xs font-medium text-slate-200">{item.reason}</span>
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
              <h3 className="text-lg font-bold text-white">
                Saved Problems ({savedItems.length})
              </h3>
              <Link
                to="/saved-problems"
                className="text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center"
              >
                Manage on Full Page
              </Link>
            </div>

            {tabLoading ? (
              <div className="py-12 flex justify-center">
                <Loader size="md" />
              </div>
            ) : savedItems.length === 0 ? (
              <div className="bg-[#141414]/80 backdrop-blur-md rounded-3xl border border-white/10 p-12 text-center max-w-lg mx-auto shadow-sm">
                <h4 className="text-lg font-bold text-white mb-1">No saved problems</h4>
                <p className="text-xs text-slate-400 mb-6">
                  Found an interesting question? Click "Save" to bookmark it for later.
                </p>
                <Link
                  to="/problems"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-black bg-white hover:bg-slate-200 transition inline-block"
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
        {/* 4. EDIT PROFILE & INTERESTS MODAL (Dark Theme - Text Only) */}
        {/* ========================================================= */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#121212] rounded-3xl border border-white/15 max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto text-white">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Edit Profile & Interests</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer border border-white/10"
                >
                  Close
                </button>
              </div>

              {editError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                  {editSuccess}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#1a1a1a] text-sm text-white placeholder-slate-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Username (@handle)
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    placeholder="e.g. tejas_dev"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#1a1a1a] text-sm text-white placeholder-slate-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Professional Title / Role
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="e.g. Fullstack Engineer, Problem Solver"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#1a1a1a] text-sm text-white placeholder-slate-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
                  />
                </div>

                {/* Interests Multi-Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Technical Interests & Topics (Multiple Selection)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2.5">
                    Select topics you are passionate about to personalize your problem recommendations feed.
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-3 bg-[#181818] rounded-2xl border border-white/10">
                    {AVAILABLE_INTERESTS.map((topic) => {
                      const isSelected = editForm.interests.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => handleInterestToggle(topic)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'bg-white text-black font-bold shadow-xs'
                              : 'bg-[#222222] text-slate-300 border border-white/10 hover:border-white/25'
                          }`}
                        >
                          <span>{topic}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="e.g. Hyderabad, India"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#1a1a1a] text-sm text-white placeholder-slate-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Bio / About Me (Max 500 chars)
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell the ProblemPool community about your skills and problem-solving focus..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#1a1a1a] text-sm text-white placeholder-slate-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={editForm.avatar}
                    onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#1a1a1a] text-sm text-white placeholder-slate-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
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
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#121212] rounded-3xl border border-white/15 max-w-sm w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-150 text-white">
              <h3 className="text-lg font-bold text-white mb-1">{selectedBadge.title}</h3>
              <p className="text-xs text-slate-300 mb-4">{selectedBadge.description}</p>
              <div className="p-3 bg-[#181818] border border-white/10 rounded-xl text-xs text-slate-400 mb-6 font-medium">
                {selectedBadge.isUnlocked ? (
                  <span className="text-emerald-400 font-bold">
                    Unlocked on {new Date(selectedBadge.unlockedAt).toLocaleDateString()}
                  </span>
                ) : (
                  <span>Lock status: Not yet unlocked. Keep contributing to earn this badge!</span>
                )}
              </div>
              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#202020] hover:bg-[#282828] border border-white/10 transition cursor-pointer"
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
            contentTitle={`User Profile: ${user?.name || user?.username || 'User'}`}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
