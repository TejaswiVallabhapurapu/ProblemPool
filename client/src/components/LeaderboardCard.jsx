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
        circleColor1: 'rgba(255, 255, 255, 0.09)',
        circleColor2: 'rgba(200, 200, 200, 0.07)',
        circleColor3: 'rgba(120, 120, 120, 0.25)',
      }
    : isSilver
    ? {
        circleColor1: 'rgba(255, 255, 255, 0.06)',
        circleColor2: 'rgba(180, 180, 180, 0.05)',
        circleColor3: 'rgba(90, 90, 90, 0.22)',
      }
    : {
        circleColor1: 'rgba(255, 255, 255, 0.04)',
        circleColor2: 'rgba(150, 150, 150, 0.04)',
        circleColor3: 'rgba(70, 70, 70, 0.2)',
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
                ? 'bg-[#2a2a2a] text-white border border-white/30 shadow-md'
                : isSilver
                ? 'bg-[#222222] text-slate-200 border border-white/20'
                : isBronze
                ? 'bg-[#1a1a1a] text-slate-300 border border-white/15'
                : 'bg-[#181818] text-slate-400 border border-white/10'
            }`}
          >
            {isGold ? '👑 #1 Champion' : isSilver ? '🥈 #2 Runner Up' : isBronze ? '🥉 #3 Contributor' : `#${rank}`}
          </div>

          <span
            className="uiverse-3d-flip-hint"
            title="Flip card for user metrics"
          >
            <RotateCw className="w-2.5 h-2.5" />
            <span>3D</span>
          </span>
        </div>

        {/* User Avatar */}
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl mx-auto mb-3 flex items-center justify-center font-black text-2xl sm:text-3xl text-white shadow-lg ${
            isGold
              ? 'bg-[#242424] border-2 border-white/30 text-white shadow-black/60'
              : isSilver
              ? 'bg-[#1e1e1e] border border-white/20 text-slate-200'
              : isBronze
              ? 'bg-[#181818] border border-white/15 text-slate-300'
              : 'bg-[#141414] border border-white/10 text-slate-400'
          }`}
        >
          {initial}
        </div>

        {/* Name & Title */}
        <Link
          to={`/profile/${leader.username || leader._id}`}
          className="font-extrabold text-white hover:text-slate-300 text-base sm:text-lg line-clamp-1 mb-0.5 block"
          data-no-flip="true"
        >
          {leader.name}
        </Link>
        {leader.title ? (
          <p className="text-xs text-slate-400 line-clamp-1 mb-3">
            {leader.title}
          </p>
        ) : leader.username ? (
          <p className="text-xs text-slate-400 font-semibold line-clamp-1 mb-3">
            @{leader.username}
          </p>
        ) : null}

        {/* Primary Metric Display */}
        <div className="p-3 rounded-2xl border border-white/10 bg-[#121212] text-center">
          <div className="text-2xl font-black text-white">
            {leader.primaryMetric}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {metricLabel}
          </div>
        </div>
      </div>

      {/* Front Action Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
        <span className="text-[11px] text-slate-500 font-medium truncate">
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1e1e1e] text-slate-200 border border-white/15">
            <Trophy className="w-3 h-3 text-slate-300" />
            <span>Rank #{rank}</span>
          </span>

          <span
            className="uiverse-3d-flip-hint"
            title="Flip back to front view"
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
          <p className="text-xs text-slate-400 mt-0.5">
            {leader.username ? `@${leader.username}` : 'Community Contributor'}
          </p>
        </div>

        {/* 3D Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-[#121212] border border-white/10 text-center">
            <div className="text-sm font-black text-white">{leader.reputation || leader.primaryMetric || 0}</div>
            <div className="text-[10px] text-slate-400 font-medium">🏆 Reputation</div>
          </div>
          <div className="p-2 rounded-xl bg-[#121212] border border-white/10 text-center">
            <div className="text-sm font-black text-slate-200">{leader.helpfulVotes || 0}</div>
            <div className="text-[10px] text-slate-400 font-medium">👍 Helpful Votes</div>
          </div>
          <div className="p-2 rounded-xl bg-[#121212] border border-white/10 text-center">
            <div className="text-sm font-black text-slate-200">{leader.problemsSolved || leader.solvedCount || 0}</div>
            <div className="text-[10px] text-slate-400 font-medium">✓ Solved</div>
          </div>
          <div className="p-2 rounded-xl bg-[#121212] border border-white/10 text-center">
            <div className="text-sm font-black text-slate-200">{leader.bestAnswersCount || 0}</div>
            <div className="text-[10px] text-slate-400 font-medium">⭐ Best Answers</div>
          </div>
        </div>

        {/* Community Standing Indicator */}
        <div className="p-2.5 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Community Status</span>
          <span className="font-bold text-white flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-slate-300" />
            <span>Top Tier Solver</span>
          </span>
        </div>
      </div>

      {/* Back Actions Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
        <span className="text-[11px] text-slate-500 font-medium truncate">
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
