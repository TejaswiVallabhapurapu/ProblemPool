import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { getLeaderboard } from '../services/api';
import EmptyState3D from '../components/EmptyState3D';
import { LoaderContainer } from '../components/Loader';
import LeaderboardCard from '../components/LeaderboardCard';

const CATEGORIES = [
  { id: 'reputation', label: 'Reputation', desc: 'Overall community points' },
  { id: 'helpful', label: 'Helpful Answers', desc: 'Most helpful votes received' },
  { id: 'best_answers', label: 'Best Answers', desc: 'Solutions chosen as best answer' },
  { id: 'solved', label: 'Problems Solved', desc: 'Questions resolved & closed' },
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-bold mb-3 shadow-xs">
          <span>ProblemPool Hall of Fame</span>
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-3">
          Community Leaderboard
        </h1>
        <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
          Celebrating top problem solvers, insightful answerers, and outstanding contributors.
        </p>
      </div>

      {/* Filter Tabs Section */}
      <div className="bg-[#141414]/90 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-white/10 shadow-sm mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-extrabold shadow-md'
                    : 'bg-[#181818] hover:bg-[#202020] text-slate-200 border border-white/10'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1.5 bg-[#202020] p-1.5 rounded-2xl w-full md:w-auto justify-center">
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe === tf.id;

            return (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
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
        <div className="bg-[#141414]/90 backdrop-blur-md rounded-3xl border border-rose-500/20 p-8 text-center max-w-md mx-auto">
          <p className="text-sm text-rose-400 font-semibold mb-4">{error}</p>
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
                    metricLabel={` Champion • ${metricLabel}`}
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
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  
                  <span>Community Rankings (Ranks 4 – {leaders.length})</span>
                </h3>
                <span className="text-xs font-semibold text-neutral-400">
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
