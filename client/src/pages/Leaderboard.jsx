import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  ThumbsUp,
  Star,
  CheckCircle2,
  Calendar,
  Sparkles,
  Flame,
  TrendingUp,
  Users,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { getLeaderboard } from '../services/api';
import ParticlesBackground from '../components/ParticlesBackground';
import EmptyState3D from '../components/EmptyState3D';
import { LoaderContainer } from '../components/Loader';
import LeaderboardCard from '../components/LeaderboardCard';

const CATEGORIES = [
  { id: 'reputation', label: 'Reputation', icon: Trophy, desc: 'Overall community points' },
  { id: 'helpful', label: 'Helpful Answers', icon: ThumbsUp, desc: 'Most helpful votes received' },
  { id: 'best_answers', label: 'Best Answers', icon: Star, desc: 'Solutions chosen as best answer' },
  { id: 'solved', label: 'Problems Solved', icon: CheckCircle2, desc: 'Questions resolved & closed' },
];

const TIMEFRAMES = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
];

const Leaderboard = () => {
  const [category, setCategory] = useState('reputation');
  const [timeframe, setTimeframe] = useState('all');
  const [leaders, setLeaders] = useState([]);
  const [metricLabel, setMetricLabel] = useState('Reputation Points');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeaderboard({ category, timeframe, limit: 50 });
      if (res && res.success) {
        setLeaders(res.leaders || []);
        if (res.metricLabel) setMetricLabel(res.metricLabel);
      } else {
        setError(res?.message || 'Failed to retrieve rankings');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
  }, [category, timeframe]);

  const topThree = leaders.slice(0, 3);
  const remainingLeaders = leaders.slice(3);

  return (
    <div className="relative min-h-screen">
      <ParticlesBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold mb-3 shadow-xs">
          <Trophy className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>ProblemPool Hall of Fame</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">
          🏆 Community Leaderboard
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Celebrating top problem solvers, insightful answerers, and outstanding contributors.
        </p>
      </div>

      {/* Filter Tabs Section */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto justify-center">
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe === tf.id;

            return (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <LoaderContainer minHeight="40vh" message="Calculating community rankings..." />
      ) : error ? (
        <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center max-w-md mx-auto">
          <p className="text-sm text-rose-600 font-semibold mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchLeaders}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : leaders.length === 0 ? (
        <div className="py-8">
          <EmptyState3D
            type="challenges"
            title="No Activity Yet"
            description="Be the first to answer problems, receive helpful upvotes, and climb the leaderboard this period!"
            actionLabel="Explore Problems"
            actionTo="/problems"
          />
        </div>
      ) : (
        <div className="space-y-10">
          {/* PODIUM: Top 3 Contributors with 3D Flip Cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto pt-4">
              {/* 2nd Place (Silver) */}
              {topThree[1] && (
                <div className="order-2 md:order-1">
                  <LeaderboardCard
                    leader={topThree[1]}
                    metricLabel={metricLabel}
                    isPodium={true}
                    podiumRank={2}
                  />
                </div>
              )}

              {/* 1st Place (Gold Champion) */}
              {topThree[0] && (
                <div className="order-1 md:order-2 md:-translate-y-4">
                  <LeaderboardCard
                    leader={topThree[0]}
                    metricLabel={`👑 Champion • ${metricLabel}`}
                    isPodium={true}
                    podiumRank={1}
                  />
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {topThree[2] && (
                <div className="order-3">
                  <LeaderboardCard
                    leader={topThree[2]}
                    metricLabel={metricLabel}
                    isPodium={true}
                    podiumRank={3}
                  />
                </div>
              )}
            </div>
          )}

          {/* Remaining Leaders (Ranks 4+) in 3D Cards Grid */}
          {remainingLeaders.length > 0 && (
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span>Community Rankings (Ranks 4 – {leaders.length})</span>
                </h3>
                <span className="text-xs font-semibold text-slate-400">
                  Interactive 3D Cards
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingLeaders.map((lead) => (
                  <LeaderboardCard
                    key={lead._id}
                    leader={lead}
                    metricLabel={metricLabel}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default Leaderboard;
