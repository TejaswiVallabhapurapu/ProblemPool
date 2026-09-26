import React from 'react';
import GlassAiButton from './GlassAiButton';
import ThreeDFlipCard from './ThreeDFlipCard';

const DIFFICULTY_STYLES = {
  Beginner: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  Intermediate: 'bg-[#222222] text-slate-200 border-[#383838]',
  Advanced: 'bg-[#2a2a2a] text-white border-[#444444]',
  Mixed: 'bg-[#1e1e1e] text-slate-200 border-[#333333]',
  Easy: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  Medium: 'bg-[#222222] text-slate-200 border-[#383838]',
  Hard: 'bg-[#2a2a2a] text-white border-[#444444]',
  Expert: 'bg-[#2e2e2e] text-white border-white/20',
};

export const ChallengeCard = ({
  challenge,
  stats,
  onOpenDetails,
}) => {
  if (!challenge) return null;

  const diffStyle =
    DIFFICULTY_STYLES[challenge.difficulty] ||
    'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]';

  // ================= 3D FRONT CONTENT (Text Only) =================
  const frontContent = (
    <>
      <div>
        {/* Top Metadata: Category, Difficulty & 3D Flip Hint */}
        <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#181818] text-slate-200 border border-white/15">
              {challenge.category}
            </span>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${diffStyle}`}>
              {challenge.difficulty}
            </span>
          </div>

          <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/15">
            3D
          </span>
        </div>

        {/* Title & Description */}
        <div className="mb-3.5">
          <h3 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-slate-300 transition-colors leading-snug mb-2 line-clamp-2">
            {challenge.title}
          </h3>
          <p className="text-sm sm:text-[15px] text-slate-300 line-clamp-3 leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Challenge Specs */}
        <div className="py-2.5 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-300 border-t border-white/10 mb-3">
          <span>{challenge.problemsCount} Problems</span>
          <span>{challenge.duration}</span>
        </div>

        {/* Real User Progress Bar (When Started) */}
        {stats.status !== 'Not Started' ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-slate-200">
                {stats.status}
              </span>
              <span className="font-extrabold text-white">
                {stats.completedCount} / {stats.total} ({stats.percent}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#222222] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 bg-white"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="pt-1 text-xs sm:text-sm text-slate-400 font-medium">
            Status: Ready to Start
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
        <span className="text-sm font-bold text-slate-200">
          +{challenge.rewardPoints} Rep
        </span>

        <div data-no-flip="true">
          <GlassAiButton
            type="button"
            onClick={() => onOpenDetails(challenge)}
            size="sm"
            variant={stats.status === 'Completed' ? "success" : "primary"}
          >
            {stats.status === 'Completed'
              ? 'Review'
              : stats.status === 'In Progress'
              ? 'Continue'
              : 'Start'}
          </GlassAiButton>
        </div>
      </div>
    </>
  );

  // ================= 3D BACK CONTENT (Text Only) =================
  const backContent = (
    <>
      <div className="space-y-4">
        {/* Top Header of Back */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#1e1e1e] text-slate-200 border border-white/15">
            +{challenge.rewardPoints} Points
          </span>

          <span className="text-xs font-bold px-2.5 py-1 rounded bg-white/10 text-slate-200 border border-white/15">
            Flip Back
          </span>
        </div>

        {/* Center Title */}
        <div className="text-center py-2">
          <h4 className="text-base font-bold text-white line-clamp-1">
            {challenge.title}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {challenge.category} • {challenge.difficulty} Track
          </p>
        </div>

        {/* 3D Specs Matrix */}
        <div className="grid grid-cols-2 gap-2.5 text-xs sm:text-sm">
          <div className="p-3 rounded-xl bg-[#121212] border border-white/10 text-center">
            <div className="text-lg font-black text-white">{challenge.problemsCount}</div>
            <div className="text-xs text-slate-400 font-medium">Problems</div>
          </div>
          <div className="p-3 rounded-xl bg-[#121212] border border-white/10 text-center">
            <div className="text-lg font-black text-white">{challenge.duration}</div>
            <div className="text-xs text-slate-400 font-medium">Timeframe</div>
          </div>
          <div className="p-3 rounded-xl bg-[#121212] border border-white/10 text-center">
            <div className="text-lg font-black text-white">{stats.completedCount}</div>
            <div className="text-xs text-slate-400 font-medium">Solved</div>
          </div>
          <div className="p-3 rounded-xl bg-[#121212] border border-white/10 text-center">
            <div className="text-lg font-black text-slate-200">{stats.percent}%</div>
            <div className="text-xs text-slate-400 font-medium">Progress</div>
          </div>
        </div>

        {/* Challenge Milestone Overview */}
        <div className="p-3 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-slate-400 font-medium">Habit Track</span>
          <span className="font-bold text-white">
            Daily Problem Series
          </span>
        </div>
      </div>

      {/* Back Actions Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
        <span className="text-xs sm:text-sm text-slate-300 font-medium">
          {stats.completedCount} of {stats.total} completed
        </span>

        <div data-no-flip="true">
          <GlassAiButton
            type="button"
            onClick={() => onOpenDetails(challenge)}
            size="sm"
            variant="primary"
          >
            Open Roadmap
          </GlassAiButton>
        </div>
      </div>
    </>
  );

  return (
    <ThreeDFlipCard
      frontContent={frontContent}
      backContent={backContent}
      ariaLabel={`Challenge: ${challenge.title}`}
    />
  );
};

export default ChallengeCard;
