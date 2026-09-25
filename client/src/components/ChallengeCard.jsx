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
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-[#181818] text-slate-300 border border-white/10">
              {challenge.category}
            </span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${diffStyle}`}>
              {challenge.difficulty}
            </span>
          </div>

          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10">
            3D
          </span>
        </div>

        {/* Title & Description */}
        <div className="mb-3.5">
          <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-slate-300 transition-colors leading-snug mb-1.5 line-clamp-2">
            {challenge.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 line-clamp-3 leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Challenge Specs */}
        <div className="py-2 flex items-center justify-between text-xs font-semibold text-slate-400 border-t border-white/10 mb-3">
          <span>{challenge.problemsCount} Problems</span>
          <span>{challenge.duration}</span>
        </div>

        {/* Real User Progress Bar (When Started) */}
        {stats.status !== 'Not Started' ? (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">
                {stats.status}
              </span>
              <span className="font-extrabold text-white">
                {stats.completedCount} / {stats.total} ({stats.percent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#222222] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 bg-white"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="pt-1 text-xs text-slate-500 font-medium">
            Status: Ready to Start
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
        <span className="text-xs font-bold text-slate-300">
          +{challenge.rewardPoints} Rep
        </span>

        <div data-no-flip="true">
          <GlassAiButton
            type="button"
            onClick={() => onOpenDetails(challenge)}
            size="xs"
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1e1e1e] text-slate-200 border border-white/15">
            +{challenge.rewardPoints} Points
          </span>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10">
            Flip Back
          </span>
        </div>

        {/* Center Title */}
        <div className="text-center py-2">
          <h4 className="text-sm font-bold text-white line-clamp-1">
            {challenge.title}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {challenge.category} • {challenge.difficulty} Track
          </p>
        </div>

        {/* 3D Specs Matrix */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#121212] border border-white/10 text-center">
            <div className="text-base font-black text-white">{challenge.problemsCount}</div>
            <div className="text-[10px] text-slate-400 font-medium">Problems</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#121212] border border-white/10 text-center">
            <div className="text-base font-black text-white">{challenge.duration}</div>
            <div className="text-[10px] text-slate-400 font-medium">Timeframe</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#121212] border border-white/10 text-center">
            <div className="text-base font-black text-white">{stats.completedCount}</div>
            <div className="text-[10px] text-slate-400 font-medium">Solved</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#121212] border border-white/10 text-center">
            <div className="text-base font-black text-slate-200">{stats.percent}%</div>
            <div className="text-[10px] text-slate-400 font-medium">Progress</div>
          </div>
        </div>

        {/* Challenge Milestone Overview */}
        <div className="p-2.5 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Habit Track</span>
          <span className="font-bold text-white">
            Daily Problem Series
          </span>
        </div>
      </div>

      {/* Back Actions Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
        <span className="text-[11px] text-slate-400 font-medium">
          {stats.completedCount} of {stats.total} completed
        </span>

        <div data-no-flip="true">
          <GlassAiButton
            type="button"
            onClick={() => onOpenDetails(challenge)}
            size="xs"
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
