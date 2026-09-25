import React from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  ThumbsUp,
  Star,
  CheckCircle2,
  Sparkles,
  RotateCw,
  ArrowRight,
  MapPin,
  User,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import GlassAiButton from './GlassAiButton';
import ThreeDFlipCard from './ThreeDFlipCard';

export const LeaderboardCard = ({
  leader,
  metricLabel,
  isPodium = false,
  podiumRank = 1,
}) => {
  if (!leader) return null;

  const rank = leader.rank || podiumRank;
  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;

  const initial = leader.name?.charAt(0).toUpperCase() || 'U';

  const circleColors = isGold
    ? {
        circleColor1: 'rgba(245, 158, 11, 0.45)',
        circleColor2: 'rgba(234, 179, 8, 0.5)',
        circleColor3: 'rgba(251, 191, 36, 0.35)',
      }
    : isSilver
    ? {
        circleColor1: 'rgba(148, 163, 184, 0.45)',
        circleColor2: 'rgba(99, 102, 241, 0.5)',
        circleColor3: 'rgba(203, 213, 225, 0.35)',
      }
    : isBronze
    ? {
        circleColor1: 'rgba(217, 119, 6, 0.45)',
        circleColor2: 'rgba(180, 83, 9, 0.5)',
        circleColor3: 'rgba(245, 158, 11, 0.35)',
      }
    : {
        circleColor1: 'rgba(99, 102, 241, 0.45)',
        circleColor2: 'rgba(168, 85, 247, 0.5)',
        circleColor3: 'rgba(236, 72, 153, 0.35)',
      };

  // ================= 3D FRONT CONTENT =================
  const frontContent = (
    <>
      <div className="text-center">
        {/* Top Rank Badge & 3D Hint */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black shadow-xs ${
              isGold
                ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 border border-amber-300'
                : isSilver
                ? 'bg-slate-200 text-slate-800 border border-slate-300'
                : isBronze
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            {isGold ? '👑 #1 Champion' : isSilver ? '🥈 #2 Runner Up' : isBronze ? '🥉 #3 Contributor' : `#${rank}`}
          </div>

          <span
            className="uiverse-3d-flip-hint"
            title="Flip card for user metrics"
            data-no-flip="true"
          >
            <RotateCw className="w-2.5 h-2.5" />
            <span>3D</span>
          </span>
        </div>

        {/* User Avatar */}
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl mx-auto mb-3 flex items-center justify-center font-black text-2xl sm:text-3xl text-white shadow-lg ${
            isGold
              ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-amber-300/50'
              : isSilver
              ? 'bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-800 shadow-slate-300/50'
              : isBronze
              ? 'bg-gradient-to-tr from-amber-700 to-amber-500 shadow-amber-600/30'
              : 'bg-gradient-to-tr from-indigo-600 to-purple-500 shadow-indigo-300/40'
          }`}
        >
          {initial}
        </div>

        {/* Name & Title */}
        <Link
          to={`/profile/${leader.username || leader._id}`}
          className="font-extrabold text-slate-900 hover:text-indigo-600 text-base sm:text-lg line-clamp-1 mb-0.5 block"
          data-no-flip="true"
        >
          {leader.name}
        </Link>
        {leader.title ? (
          <p className="text-xs text-slate-500 line-clamp-1 mb-3">
            {leader.title}
          </p>
        ) : leader.username ? (
          <p className="text-xs text-indigo-600 font-semibold line-clamp-1 mb-3">
            @{leader.username}
          </p>
        ) : null}

        {/* Primary Metric Display */}
        <div
          className={`p-3 rounded-2xl border text-center ${
            isGold
              ? 'bg-amber-50/80 border-amber-200'
              : isSilver
              ? 'bg-slate-50/80 border-slate-200'
              : 'bg-indigo-50/60 border-indigo-100'
          }`}
        >
          <div
            className={`text-2xl font-black ${
              isGold ? 'text-amber-950' : 'text-slate-900'
            }`}
          >
            {leader.primaryMetric}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {metricLabel}
          </div>
        </div>
      </div>

      {/* Front Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        <span className="text-[11px] text-slate-400 font-medium truncate">
          {leader.location ? `📍 ${leader.location}` : 'ProblemPool Member'}
        </span>

        <div data-no-flip="true">
          <GlassAiButton
            to={`/profile/${leader.username || leader._id}`}
            size="xs"
            variant={isGold ? "primary" : "secondary"}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            Profile
          </GlassAiButton>
        </div>
      </div>
    </>
  );

  // ================= 3D BACK CONTENT =================
  const backContent = (
    <>
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>Rank #{rank}</span>
          </span>

          <span
            className="uiverse-3d-flip-hint"
            title="Flip back to front view"
            data-no-flip="true"
          >
            <RotateCw className="w-2.5 h-2.5" />
            <span>Flip Back</span>
          </span>
        </div>

        {/* Center Visual Badge */}
        <div className="text-center py-1">
          <h4 className="text-base font-bold text-white line-clamp-1">
            {leader.name}
          </h4>
          <p className="text-xs text-purple-200/70 mt-0.5">
            {leader.username ? `@${leader.username}` : 'Community Contributor'}
          </p>
        </div>

        {/* 3D Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-900/80 border border-purple-500/20 text-center">
            <div className="text-sm font-black text-amber-400">{leader.reputation || leader.primaryMetric || 0}</div>
            <div className="text-[10px] text-purple-300/80 font-medium">🏆 Reputation</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-purple-500/20 text-center">
            <div className="text-sm font-black text-emerald-400">{leader.helpfulVotes || 0}</div>
            <div className="text-[10px] text-purple-300/80 font-medium">👍 Helpful Votes</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-purple-500/20 text-center">
            <div className="text-sm font-black text-indigo-300">{leader.problemsSolved || leader.solvedCount || 0}</div>
            <div className="text-[10px] text-purple-300/80 font-medium">✓ Solved</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-purple-500/20 text-center">
            <div className="text-sm font-black text-purple-300">{leader.bestAnswersCount || 0}</div>
            <div className="text-[10px] text-purple-300/80 font-medium">⭐ Best Answers</div>
          </div>
        </div>

        {/* Community Standing Indicator */}
        <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-between text-xs">
          <span className="text-purple-200 font-medium">Community Status</span>
          <span className="font-bold text-amber-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Top Tier Solver</span>
          </span>
        </div>
      </div>

      {/* Back Actions Footer */}
      <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between gap-2 mt-auto">
        <span className="text-[11px] text-purple-300/80 font-medium truncate">
          {leader.location ? `📍 ${leader.location}` : 'Active Member'}
        </span>

        <div data-no-flip="true">
          <GlassAiButton
            to={`/profile/${leader.username || leader._id}`}
            size="xs"
            variant="primary"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            View Full Profile
          </GlassAiButton>
        </div>
      </div>
    </>
  );

  return (
    <div className={`relative w-full ${isGold ? 'scale-102 z-10' : ''}`}>
      <ThreeDFlipCard
        frontContent={frontContent}
        backContent={backContent}
        {...circleColors}
        ariaLabel={`Leaderboard rank ${rank}: ${leader.name}`}
      />
    </div>
  );
};

export default LeaderboardCard;
