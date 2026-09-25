import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import './ThreeDFlipCard.css';

/**
 * ThreeDFlipCard - Uiverse.io ElSombrero2 Inspired 3D Flip Card Component
 *
 * Implements smooth 3D perspective rotation, floating animated blurred circles,
 * and responsive dual-sided interaction with accessible touch & keyboard support.
 */
export const ThreeDFlipCard = ({
  frontContent,
  backContent,
  className = '',
  style = {},
  hoverFlip = true,
  showFlipHint = true,
  frontBadge = null,
  backBadge = null,
  circleColor1,
  circleColor2,
  circleColor3,
  ariaLabel = 'Interactive 3D card',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = (e) => {
    // If the click originated from an interactive element (button, link, input, etc.), don't flip
    if (e.target.closest('button, a, input, select, textarea, [data-no-flip="true"]')) {
      return;
    }
    // On touch / click, toggle flip
    setIsFlipped((prev) => !prev);
  };

  const handleFlipHintClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFlipped((prev) => !prev);
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
      className={`uiverse-3d-card ${hoverFlip ? 'hover-flip' : ''} ${isFlipped ? 'is-flipped' : ''} ${className}`}
      style={style}
      onClick={handleCardClick}
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
