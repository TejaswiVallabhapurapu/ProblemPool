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
} from 'lucide-react';
import { getProblems, getTrendingProblems } from '../services/api';
import ProblemCard from '../components/ProblemCard';
import AnimatedBackground from '../components/AnimatedBackground';

const Home = () => {
  const [stats, setStats] = useState({
    problemsCount: 0,
    categoriesCount: 0,
    communitiesCount: 0,
  });
  const [trendingProblems, setTrendingProblems] = useState([]);
  const [recentProblems, setRecentProblems] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Fetch Stats & Recent Problems
    const loadGeneralData = async () => {
      try {
        const response = await getProblems({ sort: 'newest', limit: 3 });
        if (response?.success && isMounted) {
          const list = response.problems || [];
          const uniqueCategories = new Set(list.map((p) => p.category?.trim()).filter(Boolean));
          const uniqueLocations = new Set(list.map((p) => p.location?.trim()).filter(Boolean));

          setStats({
            problemsCount: response.totalCount || list.length,
            categoriesCount: uniqueCategories.size || 8,
            communitiesCount: uniqueLocations.size || 5,
          });
          setRecentProblems(list.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load home page statistics:', err);
      } finally {
        if (isMounted) setLoadingRecent(false);
      }
    };

    // Fetch Trending Problems
    const loadTrendingData = async () => {
      try {
        setLoadingTrending(true);
        const trendingRes = await getTrendingProblems({ limit: 6 });
        if (trendingRes?.success && isMounted) {
          setTrendingProblems(trendingRes.problems || []);
        }
      } catch (err) {
        console.error('Failed to load trending problems:', err);
      } finally {
        if (isMounted) setLoadingTrending(false);
      }
    };

    loadGeneralData();
    loadTrendingData();

    return () => {
      isMounted = false;
    };
  }, []);

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

        {/* Hero Content positioned above background */}
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
            Discover real-world problems, share challenges and create opportunities for meaningful solutions.
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
      {/* 3. 🔥 TRENDING PROBLEMS SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-16 sm:py-20 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-2">
                <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>Hot Activity</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>🔥 Trending Problems</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-1.5 max-w-xl">
                High-engagement challenges sparking active community discussions, answers, views, and saves.
              </p>
            </div>

            <Link
              to="/problems?sort=most_viewed"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 transition-colors self-start sm:self-auto shrink-0"
            >
              <span>View All Trending</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingTrending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
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
          ) : trendingProblems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center max-w-md mx-auto">
              <div className="text-3xl mb-3">🔥</div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No trending problems yet</h3>
              <p className="text-xs text-slate-500 mb-4">
                Be the first to post a problem and start solving real-world challenges!
              </p>
              <Link
                to="/create-problem"
                className="inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Post a Problem
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingProblems.map((problem) => (
                <ProblemCard key={problem._id} problem={problem} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. HOW PROBLEMMPOOL WORKS */}
      {/* ========================================================= */}
      <section className="relative z-10 py-20 md:py-24 bg-slate-50/90 backdrop-blur-sm">
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
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Compass className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
                Step 1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Identify</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Share real problems that people experience in everyday life.
              </p>
            </div>

            {/* Card 2: Discover */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center font-bold text-lg mb-6 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Search className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-2">
                Step 2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Discover</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Explore problems shared by people from different communities and domains.
              </p>
            </div>

            {/* Card 3: Solve */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
                Step 3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Solve</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Find opportunities to build ideas and solutions around meaningful problems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. RECENT PROBLEMS PREVIEW */}
      {/* ========================================================= */}
      {recentProblems.length > 0 && (
        <section className="relative z-10 py-16 bg-white border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold mb-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Fresh Additions</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Recent Problems
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Check out the latest challenges submitted by the community.
                </p>
              </div>
              <Link
                to="/problems?sort=newest"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>View all problems</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentProblems.map((problem) => (
                <ProblemCard key={problem._id} problem={problem} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
