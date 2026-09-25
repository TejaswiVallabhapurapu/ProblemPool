import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Bookmark,
  MessageSquare,
  Trophy,
  Code2,
  Clock,
  ShieldCheck,
  Star,
  Tag,
  Flame,
  Award,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassAiButton from '../components/GlassAiButton';
import AnimatedButton from '../components/AnimatedButton';
import AeroShards from '../components/AeroShards';
import ProblemCard from '../components/ProblemCard';
import ChallengeCard from '../components/ChallengeCard';
import LeaderboardCard from '../components/LeaderboardCard';
import EmptyState3D from '../components/EmptyState3D';

// Realistic Preview Data for Platform Landing Page
const DEMO_EXPLORE_PROBLEMS = [
  {
    _id: 'demo-prob-1',
    title: 'How can I optimize this Java program with large dataset stream processing?',
    description:
      'I am processing large JSON datasets in Java using Streams and facing severe garbage collection pressure and latency spikes. What are the best memory pooling and parallel stream patterns?',
    category: 'Programming',
    tags: ['Java', 'Streams', 'Performance', 'Backend'],
    createdBy: { name: 'Alex Rivera', username: 'alex_dev' },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    location: 'San Francisco, CA',
    answersCount: 4,
    views: 342,
    savesCount: 19,
    totalHelpfulVotes: 18,
    status: 'Solved',
    bestAnswer: 'demo-ans-1',
  },
  {
    _id: 'demo-prob-2',
    title: 'Why is my React component re-rendering infinitely inside useEffect?',
    description:
      'When fetching user data based on dependencies, my React 18 component triggers an infinite re-render loop. How do I properly memoize callbacks and stabilize dependency object references?',
    category: 'Web Development',
    tags: ['React', 'JavaScript', 'Hooks', 'Frontend'],
    createdBy: { name: 'Sarah Chen', username: 'sarah_c' },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    location: 'Austin, TX',
    answersCount: 6,
    views: 580,
    savesCount: 34,
    totalHelpfulVotes: 32,
    status: 'Solved',
    bestAnswer: 'demo-ans-2',
  },
  {
    _id: 'demo-prob-3',
    title: 'How do I fix MongoDB Atlas connection timeout error in production Express app?',
    description:
      'Our Node.js Express service running on AWS ECS frequently drops MongoDB Atlas connections under concurrent load with MongooseServerSelectionError. What connection pool size is recommended?',
    category: 'Database',
    tags: ['MongoDB', 'Node.js', 'Express', 'DevOps'],
    createdBy: { name: 'David Kumar', username: 'david_k' },
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    location: 'Bengaluru, India',
    answersCount: 3,
    views: 210,
    savesCount: 12,
    totalHelpfulVotes: 12,
    status: 'Answered',
  },
  {
    _id: 'demo-prob-4',
    title: 'How does JavaScript event loop handle microtasks vs macrotasks in async/await?',
    description:
      'Seeking a clear visual breakdown of execution order between Promises, process.nextTick, setTimeout, and MutationObservers during heavy I/O operations in V8 engine.',
    category: 'Programming',
    tags: ['JavaScript', 'EventLoop', 'V8', 'Async'],
    createdBy: { name: 'Elena Rostova', username: 'elena_r' },
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    location: 'Berlin, Germany',
    answersCount: 8,
    views: 890,
    savesCount: 52,
    totalHelpfulVotes: 45,
    status: 'Solved',
    bestAnswer: 'demo-ans-4',
  },
];

const DEMO_UNANSWERED_PROBLEMS = [
  {
    _id: 'demo-unans-1',
    title: 'Best practices for zero-downtime database schema migrations in Node.js & PostgreSQL?',
    description:
      'We are refactoring our PostgreSQL table structure with 10M+ rows. How do we rename columns and add non-null constraints without holding exclusive table locks during active API traffic?',
    category: 'Database',
    tags: ['PostgreSQL', 'Node.js', 'Database', 'Architecture'],
    createdBy: { name: 'Marcus Vance', username: 'marcus_v' },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    location: 'London, UK',
    answersCount: 0,
    views: 115,
    savesCount: 8,
    totalHelpfulVotes: 0,
    status: 'Unanswered',
  },
  {
    _id: 'demo-unans-2',
    title: 'How to design a distributed rate limiter using Redis token bucket algorithm?',
    description:
      'Looking for a robust Lua script implementation in Redis cluster that handles race conditions, sliding window precision, and multi-region synchronization without network bottleneck.',
    category: 'Programming',
    tags: ['Redis', 'SystemDesign', 'Distributed', 'Backend'],
    createdBy: { name: 'Priya Sharma', username: 'priya_s' },
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    location: 'Singapore',
    answersCount: 0,
    views: 88,
    savesCount: 5,
    totalHelpfulVotes: 0,
    status: 'Unanswered',
  },
  {
    _id: 'demo-unans-3',
    title: 'Resolving Docker container DNS lookup failures in multi-service bridge network?',
    description:
      'Intermittent connection refused errors between microservices running inside a custom Docker bridge network on Ubuntu 22.04 LTS. Looking for debugging methodology and CoreDNS config.',
    category: 'Technology',
    tags: ['Docker', 'DevOps', 'Networking', 'Linux'],
    createdBy: { name: 'Tobias Meyer', username: 'tobias_m' },
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    location: 'Munich, Germany',
    answersCount: 0,
    views: 64,
    savesCount: 3,
    totalHelpfulVotes: 0,
    status: 'Unanswered',
  },
];

const DEMO_CHALLENGES = [
  {
    id: 'java-fundamentals-demo',
    title: 'Java Fundamentals Challenge',
    description:
      'Master core Java object-oriented principles, stream pipelines, generics, and concurrent collections with hands-on community problems.',
    category: 'Java',
    difficulty: 'Beginner',
    duration: '7 Days',
    problemsCount: 10,
    rewardPoints: 50,
  },
  {
    id: 'python-problem-solving-demo',
    title: 'Python Problem Solving Track',
    description:
      'Sharpen problem-solving intuition using clean Pythonic patterns, list comprehensions, generator functions, and algorithmic complexity.',
    category: 'Python',
    difficulty: 'Intermediate',
    duration: '14 Days',
    problemsCount: 15,
    rewardPoints: 100,
  },
  {
    id: '30-day-coding-challenge-demo',
    title: '30-Day Problem Solving Sprint',
    description:
      'Solve one community problem every day to build a rock-solid coding habit and earn recognition on the community leaderboard.',
    category: 'Programming',
    difficulty: 'Mixed',
    duration: '30 Days',
    problemsCount: 30,
    rewardPoints: 200,
  },
];

const DEMO_LEADERS = [
  {
    _id: 'lead-1',
    name: 'Sarah Chen',
    username: 'sarah_c',
    title: 'Fullstack Architect',
    location: 'Austin, TX',
    rank: 1,
    primaryMetric: '2,450',
    reputation: 2450,
    helpfulVotes: 112,
    solvedCount: 48,
    bestAnswersCount: 24,
  },
  {
    _id: 'lead-2',
    name: 'Alex Rivera',
    username: 'alex_dev',
    title: 'Senior Systems Engineer',
    location: 'San Francisco, CA',
    rank: 2,
    primaryMetric: '1,890',
    reputation: 1890,
    helpfulVotes: 84,
    solvedCount: 36,
    bestAnswersCount: 18,
  },
  {
    _id: 'lead-3',
    name: 'David Kumar',
    username: 'david_k',
    title: 'Cloud & Database Specialist',
    location: 'Bengaluru, India',
    rank: 3,
    primaryMetric: '1,420',
    reputation: 1420,
    helpfulVotes: 62,
    solvedCount: 28,
    bestAnswersCount: 14,
  },
];

const PLATFORM_STEPS = [
  {
    step: '01',
    title: 'Ask a Problem',
    desc: 'Describe the programming obstacle, architectural dilemma, or bug you are facing with code snippets and context.',
    icon: '📝',
  },
  {
    step: '02',
    title: 'Community Discovery',
    desc: 'Other developers and problem solvers discover your question through category filters, tags, and personalized feeds.',
    icon: '🔍',
  },
  {
    step: '03',
    title: 'Collaborative Answers',
    desc: 'Passionate contributors provide structured solutions, code improvements, and architectural guidance.',
    icon: '💡',
  },
  {
    step: '04',
    title: 'Helpful Recognition',
    desc: 'The community votes on answers that provide genuine value, surfacing the most insightful explanations.',
    icon: '👍',
  },
  {
    step: '05',
    title: 'Accepted Solution',
    desc: 'The problem creator marks the accepted Best Answer, resolving the thread for future developers searching the same issue.',
    icon: '🏆',
  },
  {
    step: '06',
    title: 'Reputation & Growth',
    desc: 'Helpful contributors gain reputation points, unlock milestone badges, and climb the platform leaderboard.',
    icon: '📈',
  },
];

const Platform = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Handle CTA button clicks leading to authentication
  const handleAuthRedirect = (destination = '/signup') => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate(destination);
    }
  };

  // Filter demo explore problems based on search and category
  const filteredProblems = DEMO_EXPLORE_PROBLEMS.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative min-h-screen bg-[#080808] text-slate-100 selection:bg-white selection:text-black overflow-hidden">
      {/* ========================================================= */}
      {/* 1. HERO SECTION WITH AEROSHARDS 3D BACKGROUND */}
      {/* ========================================================= */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-white/10">
        {/* AeroShards Interactive 3D Background - Monochrome Silver & Charcoal */}
        <div className="absolute inset-0 z-0">
          <AeroShards
            backgroundColor="#080808"
            shardColor="#2e2e2e"
            accentColor="#666666"
            placement="full"
            flow="stream"
            material="pearl"
            detail="balanced"
            effect="none"
            scale={1}
            spread={1}
            depth={1}
            speed={0.9}
            spin={0.8}
            interaction="repel"
          />
        </div>

        {/* Ambient Dark Gradient Overlay */}
        <div className="absolute inset-0 z-1 bg-gradient-to-b from-[#080808]/40 via-[#080808]/70 to-[#080808] pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
          {/* Public Platform Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs sm:text-sm font-bold mb-6 shadow-lg animate-in fade-in zoom-in duration-300">
            <Sparkles className="w-4 h-4 text-slate-400" />
            <span>ProblemPool Community Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </div>

          {/* Large Hero Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight mb-6 max-w-4xl text-balance">
            Turn Real Problems Into{' '}
            <span className="shimmer-text">
              Real Solutions
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Ask challenging technical questions, share verified solutions, solve curated coding challenges, and build verified reputation with problem solvers worldwide.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <AnimatedButton
              to={isAuthenticated ? "/dashboard" : "/signup"}
              variant="signup"
              size="lg"
            >
              Get Started Free →
            </AnimatedButton>

            <GlassAiButton
              to={isAuthenticated ? "/dashboard" : "/login"}
              size="lg"
              variant="glass"
              icon={<Users className="w-4 h-4" />}
            >
              Sign In to Platform
            </GlassAiButton>
          </div>

          {/* Platform Flow Concept Ribbon */}
          <div className="w-full max-w-4xl p-4 sm:p-6 rounded-3xl bg-[#111111]/90 border border-white/10 backdrop-blur-md shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">
              The Problem-Solving Lifecycle
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              {[
                { label: '1. Post Problem', icon: '📝' },
                { label: '2. Community Feed', icon: '🌐' },
                { label: '3. Real Answers', icon: '💡' },
                { label: '4. Helpful Votes', icon: '👍' },
                { label: '5. Solved State', icon: '🏆' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#161616] border border-white/5 flex flex-col items-center justify-center gap-1.5 hover:border-white/20 transition"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-extrabold text-slate-200">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. PROBLEM DISCOVERY PREVIEW SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-20 bg-[#0d0d0d] border-b border-white/10 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Public Problem Explorer</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Explore Community Problems
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1.5 max-w-2xl">
                Browse real questions asked by engineers across Java, React, Node.js, Databases, and Algorithm design.
              </p>
            </div>

            <GlassAiButton
              onClick={() => handleAuthRedirect('/login')}
              size="sm"
              variant="primary"
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Ask a Problem
            </GlassAiButton>
          </div>

          {/* Interactive Search Bar Preview */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#121212] border border-white/10 mb-8 space-y-4 shadow-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search problems, topics, or solutions (e.g. Java, React, MongoDB)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#181818] border border-[#2e2e2e] text-white placeholder-[#777777] text-sm sm:text-base focus:outline-none focus:border-[#555555] transition"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'Programming', 'Web Development', 'Database', 'AI & ML', 'DSA'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#2a2a2a] text-white border border-white/20 shadow-md'
                      : 'bg-[#181818] text-slate-400 border border-[#2a2a2a] hover:border-[#444444] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Problem Cards Grid Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8 mb-10">
            {filteredProblems.map((prob) => (
              <div key={prob._id} className="h-full">
                <ProblemCard
                  problem={prob}
                  onToggleSave={() => handleAuthRedirect('/login')}
                  onManageCollections={() => handleAuthRedirect('/login')}
                />
              </div>
            ))}
          </div>

          {/* Get Started Prompt */}
          <div className="p-6 rounded-3xl bg-[#141414] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg">
            <div>
              <h3 className="text-base font-bold text-white">Looking for answers to your specific bug?</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Join ProblemPool to post code snippets, receive verified peer answers, and bookmark solutions.
              </p>
            </div>
            <GlassAiButton
              onClick={() => handleAuthRedirect('/signup')}
              size="sm"
              variant="primary"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Join Platform
            </GlassAiButton>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. HELP OTHERS / UNANSWERED QUESTIONS SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-20 bg-[#080808] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Knowledge Sharing</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Help Others & Share Solutions
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1.5 max-w-2xl">
                Find newly posted, unanswered engineering challenges. Share your expertise to earn community recognition and helpful reputation votes.
              </p>
            </div>

            <GlassAiButton
              onClick={() => handleAuthRedirect('/login')}
              size="sm"
              variant="primary"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Start Helping
            </GlassAiButton>
          </div>

          {/* Unanswered Problem Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {DEMO_UNANSWERED_PROBLEMS.map((prob) => (
              <div key={prob._id} className="h-full">
                <ProblemCard
                  problem={prob}
                  onToggleSave={() => handleAuthRedirect('/login')}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. CHALLENGES PREVIEW SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-20 bg-[#0d0d0d] border-b border-white/10 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-2">
                <Code2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Coding Challenges</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Level Up Problem-Solving Intuition
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1.5 max-w-2xl">
                Tackle structured multi-day coding tracks across Java, Python, SQL, and System Design to build a daily solving habit.
              </p>
            </div>

            <GlassAiButton
              onClick={() => handleAuthRedirect('/login')}
              size="sm"
              variant="secondary"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Explore Challenges
            </GlassAiButton>
          </div>

          {/* 3D Challenge Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10">
            {DEMO_CHALLENGES.map((ch) => (
              <div key={ch.id} className="h-full">
                <ChallengeCard
                  challenge={ch}
                  stats={{
                    status: 'Ready to Start',
                    completedCount: 0,
                    total: ch.problemsCount,
                    percent: 0,
                  }}
                  onOpenDetails={() => handleAuthRedirect('/login')}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. LEADERBOARD PREVIEW SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-20 bg-[#080808] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-2">
              <Trophy className="w-3.5 h-3.5 text-slate-400" />
              <span>Leaderboard & Reputation</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              Community Top Contributors
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Every helpful answer, verified solution, and completed challenge earns reputation points. See who leads the ProblemPool community.
            </p>
          </div>

          {/* 3D Leaderboard Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto mb-10">
            {/* #2 Runner Up */}
            <div className="order-2 md:order-1">
              <LeaderboardCard
                leader={DEMO_LEADERS[1]}
                metricLabel="Reputation Points"
                isPodium={true}
                podiumRank={2}
              />
            </div>

            {/* #1 Champion */}
            <div className="order-1 md:order-2 md:-translate-y-4">
              <LeaderboardCard
                leader={DEMO_LEADERS[0]}
                metricLabel="👑 Champion • Reputation"
                isPodium={true}
                podiumRank={1}
              />
            </div>

            {/* #3 Contributor */}
            <div className="order-3">
              <LeaderboardCard
                leader={DEMO_LEADERS[2]}
                metricLabel="Reputation Points"
                isPodium={true}
                podiumRank={3}
              />
            </div>
          </div>

          <div className="text-center">
            <GlassAiButton
              onClick={() => handleAuthRedirect('/login')}
              size="sm"
              variant="glass"
              icon={<Trophy className="w-4 h-4" />}
            >
              View Full Leaderboard Rankings
            </GlassAiButton>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. HOW PROBLEMPOOL WORKS SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-24 bg-[#0d0d0d] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              <span>Platform Workflow</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              How ProblemPool Works
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              From asking your first question to accepting the best solution and earning community standing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_STEPS.map((step) => (
              <div
                key={step.step}
                className="p-6 sm:p-7 rounded-3xl bg-[#141414] border border-white/10 hover:border-white/25 transition-all duration-300 group shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[#202020] border border-white/10 text-slate-300">
                    STEP {step.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-slate-300 transition-colors">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. FINAL CALL TO ACTION SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-24 bg-[#080808] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-16 h-16 rounded-3xl bg-[#181818] border border-white/15 text-white flex items-center justify-center mx-auto mb-6 shadow-xl text-2xl">
            🚀
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Ready to Be Part of the Community?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Join thousands of developers turning tricky coding bugs and architectural hurdles into resolved community knowledge.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <AnimatedButton
              to={isAuthenticated ? "/dashboard" : "/signup"}
              variant="signup"
              size="lg"
            >
              Get Started Free →
            </AnimatedButton>

            <AnimatedButton
              to={isAuthenticated ? "/dashboard" : "/login"}
              variant="login"
              size="lg"
            >
              Sign In
            </AnimatedButton>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Platform;
