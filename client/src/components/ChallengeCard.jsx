import React from 'react';
import {
  Sparkles,
  Trophy,
  Clock,
  CheckCircle2,
  Code2,
  ArrowRight,
  RotateCw,
  Flame,
  Award,
} from 'lucide-react';
import GlassAiButton from './GlassAiButton';
import ThreeDFlipCard from './ThreeDFlipCard';

const DIFFICULTY_STYLES = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-rose-50 text-rose-700 border-rose-200',
  Mixed: 'bg-purple-50 text-purple-700 border-purple-200',
  Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-rose-50 text-rose-700 border-rose-200',
  Expert: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const ChallengeCard = ({
  challenge,
  stats,
  onOpenDetails,
}) => {
  if (!challenge) return null;

  const diffStyle =
    DIFFICULTY_STYLES[challenge.difficulty] ||
    'bg-slate-50 text-slate-700 border-slate-200';

  // ================= 3D FRONT CONTENT =================
  const frontContent = (
    <>
      <div>
        {/* Top Metadata: Category, Difficulty & 3D Flip Hint */}
        <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {challenge.category}
            </span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${diffStyle}`}>
              {challenge.difficulty}
            </span>
          </div>

          <span
            className="uiverse-3d-flip-hint"
            title="Flip card for challenge roadmap"
            data-no-flip="true"
          >
            <RotateCw className="w-2.5 h-2.5" />
            <span>3D</span>
          </span>
        </div>

        {/* Title & Description */}
        <div className="mb-3.5">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-1.5 line-clamp-2">
            {challenge.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Challenge Specs */}
        <div className="py-2 flex items-center justify-between text-xs font-semibold text-slate-500 border-t border-slate-100 mb-3">
          <span className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>{challenge.problemsCount} Problems</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{challenge.duration}</span>
          </span>
        </div>

        {/* Real User Progress Bar (When Started) */}
        {stats.status !== 'Not Started' ? (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                {stats.status === 'Completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>{stats.status}</span>
              </span>
              <span className="font-extrabold text-slate-900">
                {stats.completedCount} / {stats.total} ({stats.percent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  stats.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span>Status: Ready to Start</span>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>+{challenge.rewardPoints} Rep</span>
        </span>

        <div data-no-flip="true">
          <GlassAiButton
            type="button"
            onClick={() => onOpenDetails(challenge)}
            size="xs"
            variant={stats.status === 'Completed' ? "success" : "primary"}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
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

  // ================= 3D BACK CONTENT =================
  const backContent = (
    <>
      <div className="space-y-4">
        {/* Top Header of Back */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>+{challenge.rewardPoints} Points</span>
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
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center mx-auto mb-2 shadow-lg shadow-indigo-950/60">
            <Award className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white line-clamp-1">
            {challenge.title}
          </h4>
          <p className="text-[11px] text-purple-200/70 mt-0.5">
            {challenge.category} • {challenge.difficulty} Track
          </p>
        </div>

        {/* 3D Specs Matrix */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 text-center">
            <div className="text-base font-black text-white">{challenge.problemsCount}</div>
            <div className="text-[10px] text-purple-300/80 font-medium">🧩 Problems</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 text-center">
            <div className="text-base font-black text-white">{challenge.duration}</div>
            <div className="text-[10px] text-purple-300/80 font-medium">⏱ Timeframe</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 text-center">
            <div className="text-base font-black text-emerald-400">{stats.completedCount}</div>
            <div className="text-[10px] text-purple-300/80 font-medium">✓ Solved</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 text-center">
            <div className="text-base font-black text-amber-300">{stats.percent}%</div>
            <div className="text-[10px] text-purple-300/80 font-medium">📊 Progress</div>
          </div>
        </div>

        {/* Challenge Milestone Overview */}
        <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-between text-xs">
          <span className="text-purple-200 font-medium">Habit Track</span>
          <span className="font-bold text-white flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily Problem Series</span>
          </span>
        </div>
      </div>

      {/* Back Actions Footer */}
      <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between gap-2 mt-auto">
        <span className="text-[11px] text-purple-300/80 font-medium">
          {stats.completedCount} of {stats.total} completed
        </span>

        <div data-no-flip="true">
          <GlassAiButton
            type="button"
            onClick={() => onOpenDetails(challenge)}
            size="xs"
            variant="primary"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
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
