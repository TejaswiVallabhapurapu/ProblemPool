import React from 'react';
import WebThreads from './WebThreads';

/**
 * Global WebThreadsBackground Component
 * Reusable full-viewport fixed background layer for all ProblemPool application pages.
 * Stays strictly behind all UI content with pointer-events-none so all cards, buttons,
 * forms, and navbar elements remain fully interactive.
 */
const WebThreadsBackground = ({ className = '' }) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      <WebThreads
        color1="#5227FF"
        color2="#FF9FFC"
        color3="#FFFFFF"
        speed={0.2}
        threadCount={6}
        frequency={5}
        spread={0.18}
        taper={1}
        position={0.5}
        fanMode="center"
        glow={0.02}
        falloff={0.6}
        thickness={1.1}
        brightness={0.6}
        opacity={1}
        mirror
        shimmer={false}
        grain
        grainIntensity={0.05}
        mouseInteraction
        mouseStrength={0.3}
      />
    </div>
  );
};

export default WebThreadsBackground;
