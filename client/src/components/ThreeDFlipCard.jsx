import React, { useState } from 'react';
import './ThreeDFlipCard.css';

/**
 * ThreeDFlipCard - Uiverse.io ElSombrero2 Inspired 3D Flip Card Component
 *
 * Implements smooth two-way 3D perspective rotation:
 * - Desktop: Hover over card flips FRONT → BACK, Mouse leave flips BACK → FRONT
 * - Mobile / Click: Tapping the card or flip hint toggles FRONT ↔ BACK
 * - Interactive elements (buttons, links, inputs) remain fully functional without unintended flipping.
 */
export const ThreeDFlipCard = ({
  frontContent,
  backContent,
  className = '',
  style = {},
  hoverFlip = true,
  frontBadge = null,
  backBadge = null,
  circleColor1 = 'rgba(255, 255, 255, 0.05)',
  circleColor2 = 'rgba(255, 255, 255, 0.04)',
  circleColor3 = 'rgba(80, 80, 80, 0.25)',
  ariaLabel = 'Interactive 3D card',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Toggle flip on card click / tap
  const handleCardClick = (e) => {
    // If the click originated from an interactive element (button, link, input, etc.), don't flip
    if (e.target.closest('button, a, input, select, textarea, [data-no-flip="true"]')) {
      return;
    }
    setIsFlipped((prev) => !prev);
  };

  const handleMouseEnter = () => {
    if (hoverFlip) {
      setIsFlipped(true);
    }
  };

  const handleMouseLeave = () => {
    if (hoverFlip) {
      setIsFlipped(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target === e.currentTarget) {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    }
  };

  return (
    <div
      className={`uiverse-3d-card ${isFlipped ? 'is-flipped' : ''} ${className}`}
      style={style}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={ariaLabel}
    >
      <div className="uiverse-3d-content">
        {/* ================= FRONT SIDE ================= */}
        <div className="uiverse-3d-front">
          {/* Animated Glow Circles */}
          <div className="uiverse-3d-img" aria-hidden="true">
            <div
              className="uiverse-3d-circle"
              style={circleColor1 ? { backgroundColor: circleColor1 } : undefined}
            />
            <div
              className="uiverse-3d-circle right"
              id="uiverse-circle-right"
              style={circleColor2 ? { backgroundColor: circleColor2 } : undefined}
            />
            <div
              className="uiverse-3d-circle bottom"
              id="uiverse-circle-bottom"
              style={circleColor3 ? { backgroundColor: circleColor3 } : undefined}
            />
          </div>

          {/* Front Content */}
          <div className="uiverse-3d-front-content">
            {frontContent}
          </div>
        </div>

        {/* ================= BACK SIDE ================= */}
        <div className="uiverse-3d-back">
          {/* Animated Glow Circles */}
          <div className="uiverse-3d-img" aria-hidden="true">
            <div
              className="uiverse-3d-circle"
              style={circleColor1 ? { backgroundColor: circleColor1 } : undefined}
            />
            <div
              className="uiverse-3d-circle right"
              id="uiverse-circle-right"
              style={circleColor2 ? { backgroundColor: circleColor2 } : undefined}
            />
            <div
              className="uiverse-3d-circle bottom"
              id="uiverse-circle-bottom"
              style={circleColor3 ? { backgroundColor: circleColor3 } : undefined}
            />
          </div>

          {/* Back Content */}
          <div className="uiverse-3d-back-content">
            {backContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDFlipCard;

