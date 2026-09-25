import React from 'react';
import GlassAiButton from './GlassAiButton';
import './EmptyState3D.css';

/**
 * EmptyState3D
 * Modern, clean procedural empty state cards with typography and subtle indicators.
 * Clean, text-only minimal styling.
 */
const EmptyState3D = ({
  type = 'problems',
  title,
  description,
  actionLabel,
  actionTo,
  actionOnClick,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center rounded-3xl bg-[#121212]/80 backdrop-blur-md border border-white/10 ${className}`}>
      {/* Type pill */}
      <div className="inline-block px-3 py-1 mb-4 rounded-full border border-white/10 bg-white/5 text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
        {type}
      </div>

      {/* Typography */}
      <h3 className="text-base font-bold text-white mb-2">{title || 'No items found'}</h3>
      <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed mb-6">
        {description || 'There is nothing to display here right now.'}
      </p>

      {/* Action Button */}
      {(actionLabel || actionTo || actionOnClick) && (
        <div>
          <GlassAiButton
            to={actionTo}
            onClick={actionOnClick}
            variant="primary"
            size="sm"
          >
            {actionLabel || 'Get Started'}
          </GlassAiButton>
        </div>
      )}
    </div>
  );
};

export default EmptyState3D;
