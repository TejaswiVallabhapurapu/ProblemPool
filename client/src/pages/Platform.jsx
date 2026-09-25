import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassAiButton from '../components/GlassAiButton';
import AnimatedButton from '../components/AnimatedButton';
import AeroShards from '../components/AeroShards';
import KnowledgeCore3D from '../components/KnowledgeCore3D';
import ChallengeCard from '../components/ChallengeCard';
import LeaderboardCard from '../components/LeaderboardCard';

// Static Challenge Preview Data for Platform Landing Page (No DB query / No private data)
const STATIC_CHALLENGES = [
  {
    id: 'java-fundamentals-preview',
    title: 'Java Concurrency & OOP Track',
    description:
      'Master core Java object-oriented architecture, stream pipelines, custom thread pools, and lock-free concurrent data structures.',
    category: 'Java',
    difficulty: 'Beginner',
    duration: '7 Days',
    problemsCount: 10,
    rewardPoints: 50,
  },
  {
    id: 'python-problem-solving-preview',
    title: 'Python Algorithmic Optimization',
    description:
      'Sharpen problem-solving intuition using clean Pythonic patterns, memoization, generator pipelines, and computational complexity analysis.',
    category: 'Python',
    difficulty: 'Intermediate',
    duration: '14 Days',
    problemsCount: 15,
    rewardPoints: 100,
  },
  {
    id: '30-day-sprint-preview',
    title: '30-Day Problem Solving Marathon',
    description:
      'Solve one community problem every day to build a rock-solid engineering habit and earn recognition on the platform leaderboard.',
    category: 'Algorithms',
    difficulty: 'Mixed',
    duration: '30 Days',
    problemsCount: 30,
    rewardPoints: 200,
  },
];

// Static Top Contributors Preview (No private data)
const STATIC_TOP_SOLVERS = [
  {
    _id: 'top-solver-1',
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
    _id: 'top-solver-2',
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
    _id: 'top-solver-3',
    name: 'David Kumar',
    username: 'david_k',
    title: 'Distributed Systems & DB Lead',
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
  },
  {
    step: '02',
    title: 'Discover Problems',
    desc: 'Browse challenging questions across tech stacks, domain tags, difficulty levels, and personalized interest feeds.',
  },
  {
    step: '03',
    title: 'Help Others',
    desc: 'Share verified solutions, code improvements, and architectural guidance to earn helpful community votes.',
  },
  {
    step: '04',
    title: 'Collaborate & Team Up',
    desc: 'Form small squads of up to 5 developers to tackle complex multi-step problems together in private workspaces.',
  },
  {
    step: '05',
    title: 'Accepted Solution',
    desc: 'The problem owner selects the Best Answer, marking the problem Solved and awarding reputation to the solver or team.',
  },
];

const KEY_PILLARS = [
  {
    title: 'Problem-First Innovation',
    description:
      'A structured environment centered on real technical blockers, system design challenges, and verified code solutions.',
  },
  {
    title: 'Team Up Collaboration',
    description:
      'Voluntarily form small teams of up to 5 problem solvers to brainstorm, assign tasks, and co-author joint solutions.',
  },
  {
    title: 'Peer-Reviewed Accuracy',
    description:
      'Every answer is subject to community helpful voting and problem owner verification, ensuring high-signal code quality.',
  },
  {
    title: 'Reputation & Growth',
    description:
      'Climb the community leaderboard, showcase verified contributions, and earn recognition for solving real-world challenges.',
  },
];

const Platform = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleSignIn = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#080808] text-slate-100 selection:bg-white selection:text-black overflow-hidden">
      {/* ========================================================= */}
      {/* 1. HERO SECTION WITH AEROSHARDS 3D BACKGROUND */}
      {/* ========================================================= */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-white/10">
        {/* AeroShards Interactive 3D Background */}
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
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center flex flex-col items-center">
          {/* Public Platform Badge */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs sm:text-sm font-bold mb-6 shadow-lg">
            <span>ProblemPool • Collaborative Problem-Solving Platform</span>
          </div>

          {/* Large Hero Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight mb-4 max-w-4xl text-balance">
            Turn Problems Into{' '}
            <span className="shimmer-text">
              Solutions.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Ask questions, share knowledge, collaborate with others, and solve real problems together.
          </p>

          {/* 3D Knowledge Core Globe Visualization */}
          <div className="w-full flex items-center justify-center my-4">
            <KnowledgeCore3D />
          </div>

          {/* Static Interactive Concept Banner */}
          <div className="w-full max-w-4xl p-4 sm:p-5 rounded-3xl bg-[#111111]/90 border border-white/10 backdrop-blur-md shadow-2xl mt-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 text-center">
              The Problem-Solving Lifecycle
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              {[
                { step: '01', label: 'Ask Problem' },
                { step: '02', label: 'Discover' },
                { step: '03', label: 'Help Others' },
                { step: '04', label: 'Team Up' },
                { step: '05', label: 'Solved' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#161616] border border-white/5 flex flex-col items-center justify-center gap-1 hover:border-white/20 transition"
                >
                  <span className="text-xs font-mono text-slate-500 font-bold">{item.step}</span>
                  <span className="text-xs font-extrabold text-slate-200">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. WHAT IS PROBLEMPOOL — KEY PILLARS */}
      {/* ========================================================= */}
      <section className="relative z-10 py-20 bg-[#0d0d0d] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-2.5">
              <span>Core Foundations</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              A Platform Engineered for Problem Solvers
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              ProblemPool bridges the gap between encountering complex bugs and crafting robust, verified solutions with peer collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {KEY_PILLARS.map((pillar, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#141414] border border-white/10 hover:border-white/25 transition-all duration-300 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider mb-3">
                    0{idx + 1}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-slate-200 transition">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. HOW PROBLEMPOOL WORKS */}
      {/* ========================================================= */}
      <section id="how-it-works" className="relative z-10 py-24 bg-[#080808] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-3">
              <span>Step-By-Step Flow</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              How ProblemPool Works
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              From asking your first technical question to forming collaborative teams and earning community reputation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_STEPS.map((step) => (
              <div
                key={step.step}
                className="p-6 sm:p-7 rounded-3xl bg-[#141414] border border-white/10 hover:border-white/25 transition-all duration-300 group shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
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

            {/* Extra CTA step card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#181818] to-[#121212] border border-white/20 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider mb-2 block">Next Step</span>
                <h3 className="text-lg font-bold text-white mb-2">Ready to Get Started?</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                  Create your free account to access all problems, join teams, and solve coding challenges.
                </p>
              </div>
              <GlassAiButton
                onClick={handleGetStarted}
                size="sm"
                variant="primary"
              >
                Join ProblemPool
              </GlassAiButton>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. COLLABORATIVE PROBLEM SOLVING (TEAM UP PREVIEW) */}
      {/* ========================================================= */}
      <section className="relative z-10 py-24 bg-[#0d0d0d] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Description */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-3">
                <span>Feature Spotlight</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
                Collaborative Problem Solving
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                Some engineering hurdles are too complex to solve alone. ProblemPool allows users to voluntarily team up in small squads of up to 5 developers.
              </p>

              <div className="space-y-3.5 mb-8">
                {[
                  {
                    title: 'Private Team Workspace',
                    desc: 'A dedicated workspace with real-time discussion, member roles, and task assignment.',
                  },
                  {
                    title: 'Action Item Task Board',
                    desc: 'Break down complex challenges into assignable subtasks and track member contributions.',
                  },
                  {
                    title: 'Shared Solution Draft & Leader Submit',
                    desc: 'Collaboratively draft code and markdown explanations, submitted jointly by the Team Leader.',
                  },
                  {
                    title: 'Distributed Reputation Credit',
                    desc: 'When a Team Answer is chosen as Best Answer, every team member earns reputation.',
                  },
                ].map((feat, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[#141414] border border-white/10">
                    <h4 className="text-xs font-bold text-white mb-0.5">{feat.title}</h4>
                    <p className="text-[11px] text-slate-400">{feat.desc}</p>
                  </div>
                ))}
              </div>

              <GlassAiButton
                onClick={handleGetStarted}
                size="md"
                variant="primary"
              >
                Experience Team Collaboration
              </GlassAiButton>
            </div>

            {/* Right: Static Workspace Mockup Preview */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl bg-[#141414] border border-white/15 p-6 shadow-2xl space-y-4">
                {/* Team Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold text-white">ML Model Optimization Squad</h3>
                    <span className="text-[11px] text-slate-400 font-medium">3 / 5 Members Active</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-[10px] font-extrabold uppercase">
                    Active Team
                  </span>
                </div>

                {/* Team Members Strip */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#1e1e1e] border border-white/10 text-xs text-white font-bold">
                    Alex Rivera (Leader)
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#181818] border border-white/10 text-xs text-slate-300 font-semibold">
                    Sarah Chen
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#181818] border border-white/10 text-xs text-slate-300 font-semibold">
                    David Kumar
                  </span>
                </div>

                {/* Task Checklist Mockup */}
                <div className="p-3.5 rounded-2xl bg-[#0f0f0f] border border-white/10 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Team Action Items
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Analyze memory profiling trace</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Completed</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Implement batch stream pooling</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Completed</span>
                    </div>
                    <div className="flex items-center justify-between text-white font-medium">
                      <span>Benchmark throughput & verify solution</span>
                      <span className="text-[10px] text-amber-400 font-bold">In Progress</span>
                    </div>
                  </div>
                </div>

                {/* Shared Code Solution Preview */}
                <div className="p-3.5 rounded-2xl bg-[#0a0a0a] border border-white/10 font-mono text-[11px] text-slate-300 space-y-1">
                  <div className="text-[10px] text-slate-500 font-sans font-bold uppercase mb-1">
                    Shared Solution Draft
                  </div>
                  <p className="text-slate-400">// Parallel tensor worker queue</p>
                  <p className="text-slate-200">const workerPool = new TensorWorkerPool({'{'} concurrency: 8 {'}'});</p>
                  <p className="text-slate-200">await workerPool.processBatches(datasetStream);</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. CHALLENGES PREVIEW SECTION (STATIC DEMO CARDS) */}
      {/* ========================================================= */}
      <section className="relative z-10 py-20 bg-[#080808] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-2">
                <span>Coding Tracks</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Curated Problem-Solving Tracks
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1.5 max-w-2xl">
                Structured multi-day coding challenges designed to sharpen your engineering problem-solving skills.
              </p>
            </div>

            <GlassAiButton
              onClick={handleGetStarted}
              size="sm"
              variant="secondary"
            >
              Explore Challenges
            </GlassAiButton>
          </div>

          {/* 3D Challenge Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-4">
            {STATIC_CHALLENGES.map((ch) => (
              <div key={ch.id} className="h-full">
                <ChallengeCard
                  challenge={ch}
                  stats={{
                    status: 'Ready to Start',
                    completedCount: 0,
                    total: ch.problemsCount,
                    percent: 0,
                  }}
                  onOpenDetails={handleGetStarted}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. LEADERBOARD PREVIEW SECTION (STATIC DEMO CARDS) */}
      {/* ========================================================= */}
      <section className="relative z-10 py-20 bg-[#0d0d0d] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-2">
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
                leader={STATIC_TOP_SOLVERS[1]}
                metricLabel="Reputation Points"
                isPodium={true}
                podiumRank={2}
              />
            </div>

            {/* #1 Champion */}
            <div className="order-1 md:order-2 md:-translate-y-4">
              <LeaderboardCard
                leader={STATIC_TOP_SOLVERS[0]}
                metricLabel="Champion • Reputation"
                isPodium={true}
                podiumRank={1}
              />
            </div>

            {/* #3 Contributor */}
            <div className="order-3">
              <LeaderboardCard
                leader={STATIC_TOP_SOLVERS[2]}
                metricLabel="Reputation Points"
                isPodium={true}
                podiumRank={3}
              />
            </div>
          </div>

          <div className="text-center">
            <GlassAiButton
              onClick={handleGetStarted}
              size="sm"
              variant="glass"
            >
              Join to Climb Leaderboard
            </GlassAiButton>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. WHY PROBLEMPOOL? */}
      {/* ========================================================= */}
      <section className="relative z-10 py-20 bg-[#080808] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#181818] border border-white/15 text-slate-300 text-xs font-bold mb-3">
            <span>Why Developers Choose ProblemPool</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-8">
            Built for Serious Technical Problem Solvers
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-3xl bg-[#141414] border border-white/10">
              <div className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider mb-2">Focus</div>
              <h3 className="text-sm font-bold text-white mb-1.5">No Trivial Noise</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Focused technical discussion with clean code syntax formatting and problem-first categorization.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#141414] border border-white/10">
              <div className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider mb-2">Teamwork</div>
              <h3 className="text-sm font-bold text-white mb-1.5">Team Collaboration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Voluntarily create squads to tackle tough multi-file bugs or large-scale architectural design questions.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#141414] border border-white/10">
              <div className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider mb-2">Signal</div>
              <h3 className="text-sm font-bold text-white mb-1.5">Verified Knowledge</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Accepted Best Answers resolve threads, creating an open library of verified solutions for future developers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. FINAL CALL TO ACTION SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-24 bg-[#0d0d0d] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs font-mono text-slate-500 font-bold uppercase tracking-widest mb-4">
            Join the Community
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Ready to solve problems together?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Join problem solvers turning tricky bugs and architectural hurdles into resolved community knowledge.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <AnimatedButton
              onClick={handleGetStarted}
              variant="signup"
              size="lg"
            >
              Join ProblemPool
            </AnimatedButton>

            <AnimatedButton
              onClick={handleSignIn}
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
