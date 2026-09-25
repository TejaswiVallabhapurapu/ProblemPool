import React, { useState, useEffect } from 'react';
import { GlobeCollection } from '@designcodeio/threeui';
import '@designcodeio/threeui/style.css';
import './AnimatedBackground.css';

/**
 * AnimatedBackground
 * Modern 3D Animated Energy Orb / Globe background using DesignCode ThreeUI GlobeCollection.
 * Placed behind content with z-index, pointer-events: none, and smooth viewport responsiveness.
 */
class ThreeUIErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('ThreeUI GlobeCollection fallback active:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="animated-bg-fallback" aria-hidden="true" />;
    }
    return this.props.children;
  }
}

const AnimatedBackground = ({
  variant = 'energy-orb',
  speed = 1.0,
  scale = 1.0,
  smokeScale = 1.0,
  smokeStrength = 1.0,
  smokeSpeed = 1.0,
  hue = 0,
  saturation = 1.0,
  glow = 1.0,
  starDensity = 1.0,
  starSpeed = 1.0,
  starSize = 1.0,
  brightness = 1.0,
  opacity = 1.0,
  className = '',
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className={`animated-bg-container ${className}`} aria-hidden="true">
      {/* 3D WebGL Canvas Layer */}
      <div className="animated-bg-canvas-wrapper">
        {isMounted ? (
          <ThreeUIErrorBoundary>
            <div className="shader-frame">
              <GlobeCollection
                variant={variant}
                speed={speed}
                scale={scale}
                smokeScale={smokeScale}
                smokeStrength={smokeStrength}
                smokeSpeed={smokeSpeed}
                hue={hue}
                saturation={saturation}
                glow={glow}
                starDensity={starDensity}
                starSpeed={starSpeed}
                starSize={starSize}
                brightness={brightness}
                opacity={opacity}
              />
            </div>
          </ThreeUIErrorBoundary>
        ) : (
          <div className="animated-bg-fallback" />
        )}
      </div>

      {/* Radial soft-light ambient blend overlay for readability */}
      <div className="animated-bg-vignette" />

      {/* Bottom fade into subsequent page sections */}
      <div className="animated-bg-bottom-fade" />
    </div>
  );
};

export default AnimatedBackground;
