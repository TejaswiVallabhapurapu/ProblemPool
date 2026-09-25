import React, { useState } from 'react';
import './KnowledgeFlowVisual.css';

/**
 * KnowledgeFlowVisual
 * Text-only, dark glass styled knowledge flow diagram showing the ProblemPool cycle:
 * User Posts Problem -> Discovery -> Collaborative Answers -> Best Answer Awarded -> Problem Solved -> Solver Gains Reputation
 */
const KnowledgeFlowVisual = ({ className = '' }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'ask',
      stepNum: '01',
      title: 'Post Problem',
      role: 'Seeker',
      tag: 'Identify',
      desc: 'Encounter a blocker or technical challenge? Post with code snippets, tags, and environment context.',
      metric: 'Rich Markdown & Code Highlighting',
    },
    {
      id: 'collaborate',
      stepNum: '02',
      title: 'Community Helps',
      role: 'Solvers',
      tag: 'Collaborate',
      desc: 'Developers and domain peers discover your problem via personalized feeds and submit clear solutions.',
      metric: 'Real-time discussions & reviews',
    },
    {
      id: 'evaluate',
      stepNum: '03',
      title: 'Helpful Votes',
      role: 'Community',
      tag: 'Validate',
      desc: 'Answers are voted on and reviewed for clarity, performance, and best practices by the peer group.',
      metric: 'Helpful upvotes & peer feedback',
    },
    {
      id: 'solve',
      stepNum: '04',
      title: 'Best Answer Selected',
      role: 'Seeker',
      tag: 'Resolve',
      desc: 'The question author marks the winning solution as Accepted Best Answer, permanently solving the problem.',
      metric: 'Verified Solution status',
    },
    {
      id: 'reputation',
      stepNum: '05',
      title: 'Earn Reputation',
      role: 'Solver',
      tag: 'Reward',
      desc: 'The solver earns +15 Reputation points, climbs the Community Leaderboard, and gains developer recognition.',
      metric: 'Reputation & Leaderboard rank',
    },
  ];

  return (
    <div className={`knowledge-flow-container ${className}`}>
      {/* Visual Roadmap Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-mono font-semibold mb-3">
          <span>The ProblemPool Knowledge Engine</span>
        </div>
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
          How People Help People Solve Real Problems
        </h3>
        <p className="text-neutral-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
          Every problem post sparks a transparent, reputation-backed cycle of collective knowledge creation.
        </p>
      </div>

      {/* Interactive Step Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
        {steps.map((step, idx) => {
          const isActive = activeStep === idx;

          return (
            <div
              key={step.id}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-white/10 border-white/40 ring-1 ring-white/20'
                  : 'bg-[#141414]/80 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-[#181818]'
              }`}
              onMouseEnter={() => setActiveStep(idx)}
              onClick={() => setActiveStep(idx)}
            >
              {/* Card Step Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-white/50">{step.stepNum}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border border-white/10 bg-white/5 text-neutral-300">
                  {step.tag}
                </span>
              </div>

              {/* Content */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-white mb-1.5">{step.title}</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">{step.desc}</p>
              </div>

              {/* Footer highlight */}
              <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>Role: <strong className="text-white font-sans">{step.role}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Flow Spotlight Summary */}
      <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-[#141414]/80 backdrop-blur-md border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs">
          <div className="w-8 h-8 rounded-lg bg-white text-black font-bold font-mono flex items-center justify-center shrink-0">
            {steps[activeStep].stepNum}
          </div>
          <div>
            <h5 className="font-semibold text-white">
              Stage {activeStep + 1}: {steps[activeStep].title}
            </h5>
            <p className="text-neutral-400 text-xs">{steps[activeStep].metric}</p>
          </div>
        </div>

        <div className="text-xs font-medium text-neutral-300">
          Continuous Peer Verification
        </div>
      </div>
    </div>
  );
};

export default KnowledgeFlowVisual;
