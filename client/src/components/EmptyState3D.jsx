import React from 'react';
import {
  Bookmark,
  HelpCircle,
  Bell,
  Trophy,
  Lightbulb,
  Users,
  Compass,
  Sparkles,
} from 'lucide-react';
import GlassAiButton from './GlassAiButton';
import './EmptyState3D.css';

/**
 * EmptyState3D
 * Modern, 3D animated procedural empty state cards.
 * Replaces generic static empty states with floating 3D holographic symbols,
 * soft radial glowing auras, and clear call-to-action buttons.
 */
const EmptyState3D = ({
  type = 'problems', // 'saved' | 'unanswered' | 'notifications' | 'challenges' | 'problems' | 'following'
  title,
  description,
  actionLabel,
  actionTo,
  actionOnClick,
  actionIcon,
  className = '',
}) => {
  const getVisual = () => {
    switch (type) {
      case 'saved':
        return (
          <div className="empty-state-3d-symbol symbol-saved">
            <div className="symbol-floating-core">
              <Bookmark className="w-10 h-10 text-indigo-600 fill-indigo-100" />
            </div>
            <div className="symbol-orbit-ring ring-indigo" />
            <div className="symbol-particle-dot dot-1" />
            <div className="symbol-particle-dot dot-2" />
          </div>
        );

      case 'unanswered':
        return (
          <div className="empty-state-3d-symbol symbol-unanswered">
            <div className="symbol-floating-core">
              <HelpCircle className="w-10 h-10 text-amber-500 fill-amber-50" />
            </div>
            <div className="symbol-orbit-ring ring-amber" />
            <div className="symbol-particle-dot dot-1" />
            <div className="symbol-particle-dot dot-2" />
          </div>
        );

      case 'notifications':
        return (
          <div className="empty-state-3d-symbol symbol-notifications">
            <div className="symbol-floating-core">
              <Bell className="w-10 h-10 text-violet-600 fill-violet-100" />
            </div>
            <div className="symbol-pulse-wave wave-1" />
            <div className="symbol-pulse-wave wave-2" />
          </div>
        );

      case 'challenges':
        return (
          <div className="empty-state-3d-symbol symbol-challenges">
            <div className="symbol-floating-core">
              <Trophy className="w-10 h-10 text-amber-500 fill-amber-100" />
            </div>
            <div className="symbol-orbit-ring ring-gold" />
            <div className="symbol-particle-dot dot-1" />
            <div className="symbol-particle-dot dot-2" />
          </div>
        );

      case 'following':
        return (
          <div className="empty-state-3d-symbol symbol-following">
            <div className="symbol-floating-core">
              <Users className="w-10 h-10 text-sky-600 fill-sky-100" />
            </div>
            <div className="symbol-orbit-ring ring-sky" />
            <div className="symbol-particle-dot dot-1" />
            <div className="symbol-particle-dot dot-2" />
          </div>
        );

      case 'problems':
      default:
        return (
          <div className="empty-state-3d-symbol symbol-problems">
            <div className="symbol-floating-core">
              <Lightbulb className="w-10 h-10 text-indigo-600 fill-indigo-100" />
            </div>
            <div className="symbol-orbit-ring ring-indigo" />
            <div className="symbol-particle-dot dot-1" />
            <div className="symbol-particle-dot dot-2" />
          </div>
        );
    }
  };

  return (
    <div className={`empty-state-3d-card ${className}`}>
      {/* 3D Floating Procedural Symbol */}
      <div className="empty-state-visual-wrapper" aria-hidden="true">
        {getVisual()}
      </div>

      {/* Typography */}
      <h3 className="empty-state-title">{title || 'No items found'}</h3>
      <p className="empty-state-desc">
        {description || 'There is nothing to display here right now.'}
      </p>

      {/* Action Button */}
      {(actionLabel || actionTo || actionOnClick) && (
        <div className="empty-state-action">
          <GlassAiButton
            to={actionTo}
            onClick={actionOnClick}
            variant="primary"
            size="sm"
            icon={actionIcon}
          >
            {actionLabel || 'Get Started'}
          </GlassAiButton>
        </div>
      )}
    </div>
  );
};

export default EmptyState3D;
