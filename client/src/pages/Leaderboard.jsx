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
  Loader2,
  TrendingUp,
  Users,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { getLeaderboard } from '../services/api';
import ParticlesBackground from '../components/ParticlesBackground';
import EmptyState3D from '../components/EmptyState3D';
import { LoaderContainer } from '../components/Loader';

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
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <span className="text-sm font-semibold">Calculating community rankings...</span>
        </div>
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
          {/* PODIUM: Top 3 Contributors */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-6">
              {/* 2nd Place (Silver) */}
              {topThree[1] && (
                <div className="order-2 md:order-1 bg-white rounded-3xl border-2 border-slate-200 p-6 text-center shadow-md relative hover:shadow-xl transition-all duration-200">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-200 border-2 border-white text-slate-700 flex items-center justify-center font-black text-sm shadow-md">
                    🥈 2
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                    {topThree[1].name?.charAt(0).toUpperCase()}
                  </div>
                  <Link
                    to={`/profile/${topThree[1].username || topThree[1]._id}`}
                    className="font-bold text-slate-900 hover:text-indigo-600 text-base line-clamp-1 mb-0.5 block"
                  >
                    {topThree[1].name}
                  </Link>
                  {topThree[1].title && (
                    <p className="text-xs text-slate-400 line-clamp-1 mb-3">
                      {topThree[1].title}
                    </p>
                  )}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
                    <div className="text-xl font-black text-slate-900">
                      {topThree[1].primaryMetric}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {metricLabel}
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place (Gold Champion) */}
              {topThree[0] && (
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-white to-amber-500/5 rounded-3xl border-2 border-amber-400 p-7 text-center shadow-xl relative scale-105 z-10">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-white text-amber-950 flex items-center justify-center font-black text-base shadow-lg animate-bounce">
                    👑 1
                  </div>
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white font-black text-3xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-amber-200">
                    {topThree[0].name?.charAt(0).toUpperCase()}
                  </div>
                  <Link
                    to={`/profile/${topThree[0].username || topThree[0]._id}`}
                    className="font-black text-slate-900 hover:text-indigo-600 text-lg line-clamp-1 mb-0.5 block"
                  >
                    {topThree[0].name}
                  </Link>
                  {topThree[0].title && (
                    <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                      {topThree[0].title}
                    </p>
                  )}
                  <div className="p-3.5 bg-amber-100/70 rounded-2xl border border-amber-300 mt-2">
                    <div className="text-2xl font-black text-amber-950">
                      {topThree[0].primaryMetric}
                    </div>
                    <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                      🏆 Champion • {metricLabel}
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {topThree[2] && (
                <div className="order-3 bg-white rounded-3xl border-2 border-amber-600/30 p-6 text-center shadow-md relative hover:shadow-xl transition-all duration-200">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-amber-700/20 border-2 border-white text-amber-900 flex items-center justify-center font-black text-sm shadow-md">
                    🥉 3
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                    {topThree[2].name?.charAt(0).toUpperCase()}
                  </div>
                  <Link
                    to={`/profile/${topThree[2].username || topThree[2]._id}`}
                    className="font-bold text-slate-900 hover:text-indigo-600 text-base line-clamp-1 mb-0.5 block"
                  >
                    {topThree[2].name}
                  </Link>
                  {topThree[2].title && (
                    <p className="text-xs text-slate-400 line-clamp-1 mb-3">
                      {topThree[2].title}
                    </p>
                  )}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
                    <div className="text-xl font-black text-slate-900">
                      {topThree[2].primaryMetric}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {metricLabel}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Table (Ranks 4+) */}
          {remainingLeaders.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Community Rankings (Ranks 4 – {leaders.length})</span>
                </h3>
                <span className="text-xs font-semibold text-slate-400">
                  Updated in real-time
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {remainingLeaders.map((lead) => (
                  <div
                    key={lead._id}
                    className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Rank & User Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="w-8 text-center font-black text-sm text-slate-400">
                        #{lead.rank}
                      </span>

                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {lead.name?.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <Link
                          to={`/profile/${lead.username || lead._id}`}
                          className="font-bold text-sm text-slate-900 hover:text-indigo-600 truncate block"
                        >
                          {lead.name}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                          {lead.username && <span>@{lead.username}</span>}
                          {lead.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" />
                                {lead.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metric Highlight */}
                    <div className="text-right shrink-0">
                      <div className="font-black text-base text-slate-900">
                        {lead.primaryMetric}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {metricLabel}
                      </div>
                    </div>
                  </div>
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
