import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  ArrowRight,
  Lightbulb,
  Compass,
  Sparkles,
  Flame,
  TrendingUp,
  Clock,
  Layers,
  Users,
  HelpCircle,
  Tag,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProblems, getPersonalizedFeed } from '../services/api';
import ProblemCard from '../components/ProblemCard';
import AnimatedBackground from '../components/AnimatedBackground';

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
      {/* 1. HERO SECTION WITH 3D ANIMATED ENERGY ORB */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 bg-gradient-to-b from-indigo-50/40 via-white/80 to-slate-50 min-h-[580px] flex items-center justify-center">
        {/* Dynamic 3D Energy Orb Globe Background */}
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

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-indigo-200/80 text-indigo-700 text-xs sm:text-sm font-semibold mb-8 shadow-xs animate-fadeIn">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>Problem-First Innovation Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6 drop-shadow-xs">
            Turn Real Problems Into{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700">
              Real Solutions
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Discover real-world problems, share challenges, follow expert solvers, and collaborate on meaningful solutions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/problems"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Search className="w-5 h-5" />
              <span>Explore Problems</span>
            </Link>

            <Link
              to="/create-problem"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-semibold text-slate-800 bg-white/90 hover:bg-white backdrop-blur-md border border-slate-300 shadow-md hover:border-slate-400 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              <span>Post a Problem</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. STATS SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-12 bg-white/95 backdrop-blur-sm border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="pt-4 md:pt-0">
              <div className="text-4xl sm:text-5xl font-extrabold text-indigo-600 mb-2">
                {stats.problemsCount}
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Problems Posted
              </div>
            </div>

            <div className="pt-6 md:pt-0">
              <div className="text-4xl sm:text-5xl font-extrabold text-violet-600 mb-2">
                {stats.categoriesCount}
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Categories
              </div>
            </div>

            <div className="pt-6 md:pt-0">
              <div className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-2">
                {stats.communitiesCount}
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Communities
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. PERSONALIZED COMMUNITY HOME FEED SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-16 sm:py-20 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

            <Link
              to="/problems"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors self-start md:self-auto shrink-0"
            >
              <span>Explore All Problems</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
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
                  className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 animate-pulse shadow-xs"
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
            /* Empty State */
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
              {activeFeedTab === 'following' ? (
                <>
                  <div className="text-4xl mb-3">👥</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    No problems from followed solvers yet
                  </h3>
                  <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
                    Follow other problem solvers and developers to see their latest challenges right here in your stream.
                  </p>
                  <Link
                    to="/problems"
                    className="inline-flex px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
                  >
                    Discover People & Problems
                  </Link>
                </>
              ) : activeFeedTab === 'unanswered' ? (
                <>
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    All questions currently have answers!
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Check out recent submissions or post a new challenging problem for the community.
                  </p>
                  <Link
                    to="/create-problem"
                    className="inline-flex px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
                  >
                    Post a Problem
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">💡</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No problems found</h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Be the pioneer to post a problem in this category and kick off the solution process!
                  </p>
                  <Link
                    to="/create-problem"
                    className="inline-flex px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
                  >
                    Post a Problem
                  </Link>
                </>
              )}
            </div>
          ) : (
            /* Problem Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProblems.map((problem) => (
                <ProblemCard key={problem._id} problem={problem} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. HOW PROBLEMMPOOL WORKS */}
      {/* ========================================================= */}
      <section className="relative z-10 py-20 md:py-24 bg-white backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              How ProblemPool Works
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              A transparent, community-centric pathway to identify authentic pain points and spark impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Identify */}
            <div className="bg-slate-50/70 rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Compass className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
                Step 1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Identify & Ask</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Share real problems, specify technical tags and problem categories experienced in work, projects, or daily life.
              </p>
            </div>

            {/* Card 2: Discover */}
            <div className="bg-slate-50/70 rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center font-bold text-lg mb-6 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Search className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-2">
                Step 2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Discover & Connect</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Follow top contributors, customize your domain interests, and explore curated feeds matching your focus.
              </p>
            </div>

            {/* Card 3: Solve */}
            <div className="bg-slate-50/70 rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
                Step 3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Solve & Earn Reputation</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Provide helpful solutions, get awarded Accepted Best Answer, unlock badges, and grow your developer reputation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
