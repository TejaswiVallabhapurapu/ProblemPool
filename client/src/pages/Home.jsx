import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Layers,
  Users,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProblems, getPersonalizedFeed } from '../services/api';
import ProblemCard from '../components/ProblemCard';
import AeroShards from '../components/AeroShards';
import KnowledgeCore3D from '../components/KnowledgeCore3D';
import KnowledgeFlowVisual from '../components/KnowledgeFlowVisual';
import EmptyState3D from '../components/EmptyState3D';
import GlassAiButton from '../components/GlassAiButton';

const Home = () => {
  const { user: authUser, token, isAuthenticated } = useAuth();

  const [stats, setStats] = useState({
    problemsCount: 0,
    categoriesCount: 0,
    communitiesCount: 0,
  });

  // Feed states
  const [feedData, setFeedData] = useState({
    recommended: [],
    following: [],
    trending: [],
    unanswered: [],
    recent: [],
  });
  const [feedMeta, setFeedMeta] = useState({
    isPersonalized: false,
    hasInterests: false,
    hasFollowing: false,
    userInterests: [],
  });
  const [activeFeedTab, setActiveFeedTab] = useState('recommended');
  const [loadingFeed, setLoadingFeed] = useState(true);

  useEffect(() => {
    document.title = isAuthenticated
      ? 'Dashboard - ProblemPool'
      : 'ProblemPool - Turn Real Problems Into Real Solutions';
    let isMounted = true;

    // 1. Fetch Platform General Stats
    const loadGeneralStats = async () => {
      try {
        const response = await getProblems({ sort: 'newest', limit: 30 });
        if (response?.success && isMounted) {
          const list = response.problems || [];
          const uniqueCategories = new Set(list.map((p) => p.category?.trim()).filter(Boolean));
          const uniqueLocations = new Set(list.map((p) => p.location?.trim()).filter(Boolean));

          setStats({
            problemsCount: response.totalCount || list.length,
            categoriesCount: uniqueCategories.size || 8,
            communitiesCount: uniqueLocations.size || 5,
          });
        }
      } catch (err) {
        console.warn('Failed to load home page statistics:', err);
      }
    };

    // 2. Fetch Complete Personalized Feed
    const loadPersonalizedFeed = async () => {
      try {
        setLoadingFeed(true);
        const res = await getPersonalizedFeed(token);
        if (res?.success && isMounted) {
          setFeedData(res.feed || {});
          setFeedMeta({
            isPersonalized: res.isPersonalized,
            hasInterests: res.hasInterests,
            hasFollowing: res.hasFollowing,
            userInterests: res.userInterests || [],
          });
        }
      } catch (err) {
        console.warn('Failed to load feed:', err);
      } finally {
        if (isMounted) setLoadingFeed(false);
      }
    };

    loadGeneralStats();
    loadPersonalizedFeed();

    return () => {
      isMounted = false;
    };
  }, [token, isAuthenticated]);

  const activeProblems =
    activeFeedTab === 'recommended'
      ? feedData.recommended
      : activeFeedTab === 'following'
      ? feedData.following
      : activeFeedTab === 'trending'
      ? feedData.trending
      : activeFeedTab === 'unanswered'
      ? feedData.unanswered
      : feedData.recent;

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">
      {/* ========================================================= */}
      {/* 1. HERO SECTION WITH 3D KNOWLEDGE CORE & ENERGY ORB */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 bg-gradient-to-b from-indigo-50/50 via-white/80 to-slate-50 min-h-[640px] flex items-center justify-center">
        {/* Dynamic 3D Energy Orb Canvas Background */}
        <AnimatedBackground
          variant="energy-orb"
          speed={1.00}
          scale={1.00}
          smokeScale={1.00}
          smokeStrength={1.00}
          smokeSpeed={1.00}
          hue={0}
          saturation={1.00}
          glow={1.00}
          starDensity={1.00}
          starSpeed={1.00}
          starSize={1.00}
          brightness={1.00}
          opacity={1.00}
        />

        {/* Interactive Constellation Nodes Background */}
        <KnowledgeNetworkBackground variant="constellation" />

        {/* Hero Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Typography & CTAs */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-indigo-200/90 text-indigo-700 text-xs sm:text-sm font-bold mb-6 shadow-xs">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>Problem-First Innovation Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] mb-6">
                Turn Real Problems Into{' '}
                <span className="shimmer-text">
                  Real Solutions
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-slate-700 max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed font-medium">
                Discover authentic challenges, collaborate with expert solvers, exchange code and insights, and build verified solutions together.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-6">
                <GlassAiButton
                  to="/problems"
                  size="lg"
                  variant="primary"
                  icon={<Search className="w-5 h-5" />}
                >
                  Explore Problems
                </GlassAiButton>

                <GlassAiButton
                  to="/create-problem"
                  size="lg"
                  variant="glass"
                  icon={<PlusCircle className="w-5 h-5 text-indigo-600" />}
                >
                  Post a Problem
                </GlassAiButton>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Verified Solutions</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Reputation-Backed</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-violet-500" />
                  <span>Open Community</span>
                </span>
              </div>
            </div>

            {/* Right Column: Floating 3D Knowledge Core */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <KnowledgeCore3D />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. STATS SECTION (3D Glass Cards) */}
      {/* ========================================================= */}
      <section className="relative z-10 py-12 bg-white/95 backdrop-blur-sm border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {/* Stat 1 */}
            <div className="glass-card-3d p-6 rounded-3xl border border-slate-200/80">
              <div className="text-4xl sm:text-5xl font-black text-indigo-600 mb-2">
                {stats.problemsCount}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                <span>Problems Posted</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="glass-card-3d p-6 rounded-3xl border border-slate-200/80">
              <div className="text-4xl sm:text-5xl font-black text-violet-600 mb-2">
                {stats.categoriesCount}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
                <Layers className="w-4 h-4 text-violet-500" />
                <span>Categories</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="glass-card-3d p-6 rounded-3xl border border-slate-200/80">
              <div className="text-4xl sm:text-5xl font-black text-slate-800 mb-2">
                {stats.communitiesCount}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4 text-sky-500" />
                <span>Communities</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. PERSONALIZED COMMUNITY HOME FEED SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-16 sm:py-20 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 border-b border-slate-200/70">
        {/* Subtle Constellation Background */}
        <KnowledgeNetworkBackground variant="subtle" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Feed Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Smart Community Feed</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Personalized Problem Pool
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-1.5 max-w-2xl">
                Discover challenges matched to your technical interests, problem solvers you follow, trending discussions, and unanswered questions.
              </p>
            </div>

            <GlassAiButton
              to="/problems"
              size="sm"
              variant="secondary"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Explore All Problems
            </GlassAiButton>
          </div>

          {/* Feed Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar border-b border-slate-200">
            {[
              {
                id: 'recommended',
                label: '✨ Recommended for You',
                badge: feedMeta.hasInterests ? `${feedMeta.userInterests.length} Topics` : null,
              },
              {
                id: 'following',
                label: '👥 People You Follow',
                badge: feedData.following.length > 0 ? `${feedData.following.length}` : null,
              },
              {
                id: 'trending',
                label: '🔥 Trending Problems',
                badge: feedData.trending.length > 0 ? `${feedData.trending.length}` : null,
              },
              {
                id: 'unanswered',
                label: '❓ Unanswered Problems',
                badge: feedData.unanswered.length > 0 ? `${feedData.unanswered.length}` : null,
              },
              {
                id: 'recent',
                label: '🕒 Recently Asked',
                badge: feedData.recent.length > 0 ? `${feedData.recent.length}` : null,
              },
            ].map((tab) => {
              const isActive = activeFeedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeedTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Context Banner: Recommendations based on user interests */}
          {activeFeedTab === 'recommended' && feedMeta.hasInterests && (
            <div className="mb-6 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5 text-indigo-900">
                <span className="font-bold">🎯 Curated for your interests:</span>
                {feedMeta.userInterests.slice(0, 5).map((interest) => (
                  <span
                    key={interest}
                    className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 font-semibold"
                  >
                    {interest}
                  </span>
                ))}
                {feedMeta.userInterests.length > 5 && (
                  <span className="text-slate-500">+{feedMeta.userInterests.length - 5} more</span>
                )}
              </div>
              <Link
                to="/profile?tab=overview"
                className="text-indigo-600 hover:text-indigo-800 font-bold underline shrink-0"
              >
                Manage Interests →
              </Link>
            </div>
          )}

          {/* Feed Content Loading */}
          {loadingFeed ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="glass-card-3d rounded-3xl border border-slate-200 p-6 space-y-4 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-24 bg-slate-200 rounded-full" />
                    <div className="h-4 w-16 bg-slate-100 rounded" />
                  </div>
                  <div className="h-6 w-3/4 bg-slate-200 rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-100 rounded" />
                    <div className="h-4 w-5/6 bg-slate-100 rounded" />
                  </div>
                  <div className="h-8 w-full bg-slate-50 rounded-xl" />
                </div>
              ))}
            </div>
          ) : activeProblems.length === 0 ? (
            /* 3D Animated Empty State */
            <div className="py-8">
              {activeFeedTab === 'following' ? (
                <EmptyState3D
                  type="following"
                  title="No problems from followed solvers yet"
                  description="Follow other problem solvers and developers to see their latest challenges right here in your stream."
                  actionLabel="Discover People & Problems"
                  actionTo="/problems"
                />
              ) : activeFeedTab === 'unanswered' ? (
                <EmptyState3D
                  type="unanswered"
                  title="All questions currently have answers!"
                  description="Check out recent submissions or post a new challenging problem for the community."
                  actionLabel="Post a Problem"
                  actionTo="/create-problem"
                />
              ) : (
                <EmptyState3D
                  type="problems"
                  title="No problems found in this feed"
                  description="Be the pioneer to post a problem in this category and kick off the solution process!"
                  actionLabel="Post a Problem"
                  actionTo="/create-problem"
                />
              )}
            </div>
          ) : (
            /* Problem Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProblems.map((problem) => (
                <ProblemCard
                  key={problem._id}
                  problem={problem}
                  onDelete={(deletedId) => {
                    setRecentProblems((prev) => prev.filter((p) => p._id !== deletedId));
                    setTrendingProblems((prev) => prev.filter((p) => p._id !== deletedId));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. HOW PROBLEMMPOOL WORKS — INTERACTIVE KNOWLEDGE FLOW */}
      {/* ========================================================= */}
      <section className="relative z-10 py-20 md:py-24 bg-white backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <KnowledgeFlowVisual />
        </div>
      </section>
    </div>
  );
};

export default Home;
