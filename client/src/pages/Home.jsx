import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProblems, getPersonalizedFeed, getCollaborativeProblems } from '../services/api';
import ProblemCard from '../components/ProblemCard';
import KnowledgeFlowVisual from '../components/KnowledgeFlowVisual';
import EmptyState3D from '../components/EmptyState3D';
import GlassAiButton from '../components/GlassAiButton';
import { LoaderContainer } from '../components/Loader';
import { WireframeForms } from '@designcodeio/threeui';
import '@designcodeio/threeui/style.css';

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

  // Collaborative problems state for "Help Others / Team Up"
  const [collaborativeProblems, setCollaborativeProblems] = useState([]);
  const [loadingCollab, setLoadingCollab] = useState(true);
  const [collabFilter, setCollabFilter] = useState('recent');

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

    // 3. Fetch Collaborative Problems
    const loadCollaborativeProblems = async () => {
      try {
        setLoadingCollab(true);
        const res = await getCollaborativeProblems({ filter: collabFilter, limit: 6 });
        if (res?.success && isMounted) {
          setCollaborativeProblems(res.problems || []);
        }
      } catch (err) {
        console.warn('Failed to load collaborative problems:', err);
      } finally {
        if (isMounted) setLoadingCollab(false);
      }
    };

    loadGeneralStats();
    loadPersonalizedFeed();
    loadCollaborativeProblems();

    return () => {
      isMounted = false;
    };
  }, [token, isAuthenticated, collabFilter]);

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
      <div className="relative z-10 flex flex-col flex-grow">
        {/* 1. AUTHENTICATED DASHBOARD APPLICATION HEADER */}
        <section className="relative overflow-hidden pt-10 pb-12 md:pt-14 md:pb-16 border-b border-white/10">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Greeting, User Summary & Quick Action Buttons */}
              <div className="lg:col-span-7 text-left">
                <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-4 shadow-xs">
                  <span>Problem Solver Dashboard</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
                  Welcome back,{' '}
                  <span className="shimmer-text">
                    {authUser?.name || 'Problem Solver'}
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-xl mb-6 font-medium leading-relaxed">
                  Track your personalized feed, collaborate with others, and discover community questions matched to your interests.
                </p>

                {/* Dashboard Action Toolbar (Text Only) */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <GlassAiButton
                    to="/create-problem"
                    size="md"
                    variant="primary"
                  >
                    Post a Problem
                  </GlassAiButton>

                  <GlassAiButton
                    to="/problems"
                    size="md"
                    variant="glass"
                  >
                    Browse Problems
                  </GlassAiButton>

                  <GlassAiButton
                    to="/team-up"
                    size="md"
                    variant="glass"
                  >
                    Team Up
                  </GlassAiButton>

                  <GlassAiButton
                    to="/challenges"
                    size="md"
                    variant="glass"
                  >
                    Challenges
                  </GlassAiButton>

                  <GlassAiButton
                    to="/saved-problems"
                    size="md"
                    variant="glass"
                  >
                    Saved
                  </GlassAiButton>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 pt-2 border-t border-white/5">
                  <span>Verified Peer Answers</span>
                  <span>•</span>
                  <span>Squad Collaboration</span>
                  <span>•</span>
                  <span>Reputation Ranking</span>
                </div>
              </div>

              {/* Right Column: WireframeForms Cube */}
              <div className="lg:col-span-5 flex items-center justify-center dashboard-wireframe w-full h-72 sm:h-80 lg:h-96 relative overflow-hidden pointer-events-none bg-transparent border-0 outline-none shadow-none">
                <WireframeForms
                  variant="cube"
                  mode="dark"
                  speed={3.00}
                  size={1.00}
                  length={1.00}
                  density={1.00}
                  opacity={0.35}
                  hue={0}
                  saturation={1.00}
                  brightness={1.00}
                  className="w-full h-full bg-transparent border-0 outline-none shadow-none pointer-events-none"
                  style={{ background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', overflow: 'hidden' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. STATS SECTION (Text Only 3D Glass Cards) */}
        <section className="relative z-10 py-12 bg-[#0d0d0d] backdrop-blur-md border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {/* Stat 1 */}
              <div className="glass-card-3d p-6 rounded-3xl border border-white/10 bg-[#141414] shadow-lg">
                <div className="text-4xl sm:text-5xl font-black text-white mb-2">
                  {stats.problemsCount}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Problems Posted
                </div>
              </div>

              {/* Stat 2 */}
              <div className="glass-card-3d p-6 rounded-3xl border border-white/10 bg-[#141414] shadow-lg">
                <div className="text-4xl sm:text-5xl font-black text-white mb-2">
                  {stats.categoriesCount}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Categories
                </div>
              </div>

              {/* Stat 3 */}
              <div className="glass-card-3d p-6 rounded-3xl border border-white/10 bg-[#141414] shadow-lg">
                <div className="text-4xl sm:text-5xl font-black text-slate-200 mb-2">
                  {stats.communitiesCount}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Communities
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PERSONALIZED COMMUNITY HOME FEED SECTION */}
        <section className="relative z-10 py-16 sm:py-20 bg-[#080808] backdrop-blur-md border-b border-white/10">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Feed Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-2.5">
                  <span>Smart Community Feed</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Personalized Problem Pool
                </h2>
                <p className="text-slate-400 text-sm sm:text-base mt-1.5 max-w-2xl">
                  Discover challenges matched to your technical interests, problem solvers you follow, trending discussions, and unanswered questions.
                </p>
              </div>

              <GlassAiButton
                to="/problems"
                size="sm"
                variant="secondary"
              >
                Explore All Problems
              </GlassAiButton>
            </div>

            {/* Feed Navigation Tabs (Text Only) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar border-b border-white/10">
              {[
                {
                  id: 'recommended',
                  label: 'Recommended for You',
                  badge: feedMeta.hasInterests ? `${feedMeta.userInterests.length} Topics` : null,
                },
                {
                  id: 'following',
                  label: 'People You Follow',
                  badge: feedData.following.length > 0 ? `${feedData.following.length}` : null,
                },
                {
                  id: 'trending',
                  label: 'Trending Problems',
                  badge: feedData.trending.length > 0 ? `${feedData.trending.length}` : null,
                },
                {
                  id: 'unanswered',
                  label: 'Unanswered Problems',
                  badge: feedData.unanswered.length > 0 ? `${feedData.unanswered.length}` : null,
                },
                {
                  id: 'recent',
                  label: 'Recently Asked',
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
                        ? 'bg-[#242424] text-white border border-white/25 shadow-md'
                        : 'text-slate-400 hover:text-white bg-[#141414] border border-[#242424] hover:border-[#444444]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#202020] text-slate-300 border border-white/10'
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
              <div className="mb-6 p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-1.5 text-slate-300">
                  <span className="font-bold text-white">Curated for your interests:</span>
                  {feedMeta.userInterests.slice(0, 5).map((interest) => (
                    <span
                      key={interest}
                      className="px-2 py-0.5 rounded-md bg-[#1c1c1c] border border-white/10 text-slate-300 font-semibold"
                    >
                      {interest}
                    </span>
                  ))}
                  {feedMeta.userInterests.length > 5 && (
                    <span className="text-slate-400">+{feedMeta.userInterests.length - 5} more</span>
                  )}
                </div>
                <Link
                  to="/profile?tab=overview"
                  className="text-slate-300 hover:text-white font-bold underline shrink-0"
                >
                  Manage Interests
                </Link>
              </div>
            )}

            {/* Feed Content Loading */}
            {loadingFeed ? (
              <LoaderContainer minHeight="30vh" message="Loading personalized problem pool..." />
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
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3.5. COLLABORATIVE PROBLEMS (HELP OTHERS / TEAM UP) SECTION */}
        <section className="relative z-10 py-16 sm:py-20 bg-[#0c0c0c] backdrop-blur-md border-b border-white/10">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-2.5">
                  <span>Team Up & Solve Together</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Collaborative Problems
                </h2>
                <p className="text-slate-400 text-sm sm:text-base mt-1.5 max-w-2xl">
                  Form a team with other problem solvers to tackle complex engineering, algorithmic, and domain challenges together.
                </p>
              </div>

              <GlassAiButton
                to="/team-up"
                size="sm"
                variant="primary"
              >
                Browse All Teams
              </GlassAiButton>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
              {[
                { id: 'recent', label: 'Most Recent' },
                { id: 'members_needed', label: 'Most Members Needed' },
                { id: 'unanswered', label: 'Unanswered' },
                { id: 'popular', label: 'Popular' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCollabFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    collabFilter === tab.id
                      ? 'bg-[#242424] text-white border border-white/25 shadow-md'
                      : 'bg-[#141414] text-slate-400 hover:text-white border border-[#242424]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Collaborative Problem Cards Grid */}
            {loadingCollab ? (
              <LoaderContainer minHeight="20vh" message="Loading collaborative problems..." />
            ) : collaborativeProblems.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#141414] border border-white/10">
                <p className="text-slate-400 text-sm mb-4">No collaborative problems found under this filter.</p>
                <GlassAiButton to="/create-problem" size="sm" variant="primary">
                  Post a Problem with Team Up
                </GlassAiButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collaborativeProblems.map((problem) => {
                  const activeTeamCount = problem.activeTeamCount || 0;
                  const totalMemberSlots = activeTeamCount * 5;
                  const currentMembers = problem.totalTeamMembers || 0;
                  const membersNeeded = Math.max(0, totalMemberSlots - currentMembers);

                  return (
                    <div
                      key={problem._id}
                      className="rounded-2xl bg-[#141414] border border-white/10 hover:border-white/25 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl group"
                    >
                      <div>
                        {/* Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1c1c1c] text-slate-300 border border-white/10">
                            {problem.category || 'General'}
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            problem.difficulty === 'hard'
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                              : problem.difficulty === 'medium'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                              : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                          }`}>
                            {problem.difficulty || 'medium'}
                          </span>
                        </div>

                        {/* Title */}
                        <Link
                          to={`/problems/${problem._id}`}
                          className="text-base font-bold text-white group-hover:text-slate-300 line-clamp-2 mb-2 transition"
                        >
                          {problem.title}
                        </Link>

                        <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                          {problem.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                          <span>{activeTeamCount} {activeTeamCount === 1 ? 'Team' : 'Teams'} Active</span>
                          <span className="text-slate-400">
                            {membersNeeded > 0 ? `${membersNeeded} slots available` : 'Form new team'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] text-slate-500 font-medium">
                            By {problem.author?.name || 'Problem Solvers'}
                          </span>
                          <GlassAiButton
                            to={`/problems/${problem._id}`}
                            size="xs"
                            variant="primary"
                          >
                            View Problem
                          </GlassAiButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 4. HOW PROBLEMPOOL WORKS — INTERACTIVE KNOWLEDGE FLOW */}
        <section className="relative z-10 py-20 md:py-24 bg-[#0d0d0d] backdrop-blur-md border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <KnowledgeFlowVisual />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
