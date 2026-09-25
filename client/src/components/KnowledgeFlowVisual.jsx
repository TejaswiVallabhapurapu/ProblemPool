import React, { useState } from 'react';
import {
  User,
  HelpCircle,
  MessageSquare,
  Star,
  CheckCircle2,
  Award,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import './KnowledgeFlowVisual.css';

/**
 * KnowledgeFlowVisual
 * Interactive, 3D-styled knowledge flow diagram showing the ProblemPool cycle:
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
      icon: HelpCircle,
      color: '#6366f1',
      tag: 'Identify',
      desc: 'Encounter a blocker or technical challenge? Post with code snippets, tags, and environment context.',
      metric: 'Rich Markdown & Code Highlighting',
    },
    {
      id: 'collaborate',
      stepNum: '02',
      title: 'Community Helps',
      role: 'Solvers',
      icon: MessageSquare,
      color: '#38bdf8',
      tag: 'Collaborate',
      desc: 'Developers and domain peers discover your problem via personalized feeds and submit clear solutions.',
      metric: 'Real-time discussions & reviews',
    },
    {
      id: 'evaluate',
      stepNum: '03',
      title: 'Helpful Votes',
      role: 'Community',
      icon: Star,
      color: '#ec4899',
      tag: 'Validate',
      desc: 'Answers are voted on and reviewed for clarity, performance, and best practices by the peer group.',
      metric: 'Helpful upvotes & peer feedback',
    },
    {
      id: 'solve',
      stepNum: '04',
      title: 'Best Answer Selected',
      role: 'Seeker',
      icon: CheckCircle2,
      color: '#10b981',
      tag: 'Resolve',
      desc: 'The question author marks the winning solution as Accepted Best Answer, permanently solving the problem.',
      metric: 'Verified Solution status',
    },
    {
      id: 'reputation',
      stepNum: '05',
      title: 'Earn Reputation',
      role: 'Solver',
      icon: Award,
      color: '#f59e0b',
      tag: 'Reward',
      desc: 'The solver earns +15 Reputation points, climbs the Community Leaderboard, and gains developer recognition.',
      metric: 'Reputation & Leaderboard rank',
    },
  ];

  return (
    <div className={`knowledge-flow-container ${className}`}>
      {/* Visual Roadmap Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span>The ProblemPool Knowledge Engine</span>
        </div>
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          How People Help People Solve Real Problems
        </h3>
        <p className="text-slate-600 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
          Every problem post sparks a transparent, reputation-backed cycle of collective knowledge creation.
        </p>
      </div>

      {/* Interactive Step Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
        {/* Animated Connecting Pathway (Desktop only) */}
        <div className="knowledge-flow-track hidden lg:block" aria-hidden="true">
          <div
            className="knowledge-flow-progress"
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStep === idx;

          return (
            <div
              key={step.id}
              className={`knowledge-flow-card ${isActive ? 'card-active' : ''}`}
              style={{ '--step-color': step.color }}
              onMouseEnter={() => setActiveStep(idx)}
              onClick={() => setActiveStep(idx)}
            >
              {/* Card Step Badge & Glow */}
              <div className="flex items-center justify-between mb-4">
                <span className="step-number">{step.stepNum}</span>
                <span
                  className="step-tag"
                  style={{
                    backgroundColor: `${step.color}15`,
                    color: step.color,
                    borderColor: `${step.color}35`,
                  }}
                >
                  {step.tag}
                </span>
              </div>

              {/* 3D Icon Node */}
              <div
                className="step-icon-node"
                style={{
                  backgroundColor: `${step.color}15`,
                  borderColor: `${step.color}30`,
                  color: step.color,
                }}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <h4 className="text-sm font-bold text-slate-900 mb-1">{step.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{step.desc}</p>

              {/* Footer highlight */}
              <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <span>Role: <strong className="text-slate-700">{step.role}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Flow Spotlight Summary */}
      <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/70 border border-indigo-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-xs"
            style={{ backgroundColor: steps[activeStep].color }}
          >
            {steps[activeStep].stepNum}
          </div>
          <div>
            <h5 className="font-bold text-slate-900">
              Stage {activeStep + 1}: {steps[activeStep].title}
            </h5>
            <p className="text-slate-500 text-[11px]">{steps[activeStep].metric}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
          <span>Continuous Peer Verification</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeFlowVisual;
