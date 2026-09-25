import React from 'react';
import Particles from './Particles';

/**
 * Reusable ParticlesBackground Component
 * Renders a full-screen, non-blocking animated white particle background
 * behind page content with dark aesthetic and pointer interaction.
 */
const ParticlesBackground = ({
  particleColors = ['#ffffff', '#f8fafc', '#e2e8f0'],
  particleCount = 200,
  particleSpread = 10,
  speed = 0.1,
  particleBaseSize = 100,
  moveParticlesOnHover = true,
  alphaParticles = false,
  disableRotation = false,
  pixelRatio = 1,
  className = '',
}) => {
  return (
    <div
      className={`fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0a0d14] ${className}`}
      aria-hidden="true"
    >
      {/* Subtle deep ambient radial gradient for premium dark tech depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,rgba(99,102,241,0.12),rgba(255,255,255,0))]" />

      <Particles
        particleColors={particleColors}
        particleCount={particleCount}
        particleSpread={particleSpread}
        speed={speed}
        particleBaseSize={particleBaseSize}
        moveParticlesOnHover={moveParticlesOnHover}
        alphaParticles={alphaParticles}
        disableRotation={disableRotation}
        pixelRatio={pixelRatio}
      />
    </div>
  );
};

export default ParticlesBackground;
