import React, { useEffect, useRef } from 'react';

/**
 * WebThreads Component
 * High-performance GPU-accelerated animated harmonic glowing threads canvas
 * with multi-color gradients, fan dispersion, interactive mouse physics, and grain texture.
 */
const WebThreads = ({
  color1 = '#5227FF',
  color2 = '#FF9FFC',
  color3 = '#FFFFFF',
  speed = 0.2,
  threadCount = 6,
  frequency = 5,
  spread = 0.18,
  taper = 1,
  position = 0.5,
  fanMode = 'center',
  glow = 0.02,
  falloff = 0.6,
  thickness = 1.1,
  brightness = 0.6,
  opacity = 1,
  mirror = true,
  shimmer = false,
  grain = true,
  grainIntensity = 0.05,
  mouseInteraction = true,
  mouseStrength = 0.3,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Helper to parse hex colors to RGB
  const hexToRgb = (hex, fallback = [82, 39, 255]) => {
    if (!hex || typeof hex !== 'string') return fallback;
    const clean = hex.replace('#', '');
    if (clean.length === 3) {
      return [
        parseInt(clean[0] + clean[0], 16),
        parseInt(clean[1] + clean[1], 16),
        parseInt(clean[2] + clean[2], 16),
      ];
    }
    if (clean.length >= 6) {
      return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16),
      ];
    }
    return fallback;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Mouse tracking with smooth spring inertia
    const mouse = {
      x: width * 0.5,
      y: height * 0.5,
      targetX: width * 0.5,
      targetY: height * 0.5,
      active: false,
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.active = true;
      }
    };

    const handleMouseLeave = () => {
      mouse.targetX = width * 0.5;
      mouse.targetY = height * 0.5;
      mouse.active = false;
    };

    if (mouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('mouseleave', handleMouseLeave);
    }

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const rgb1 = hexToRgb(color1, [82, 39, 255]);
    const rgb2 = hexToRgb(color2, [255, 159, 252]);
    const rgb3 = hexToRgb(color3, [255, 255, 255]);

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveSpeed = prefersReducedMotion ? 0.02 : speed;

    let time = 0;

    // Cached Grain Pattern Canvas to prevent per-frame CPU allocation & fillRect calls
    let grainPattern = null;
    const updateGrainPattern = () => {
      if (!grain || grainIntensity <= 0) {
        grainPattern = null;
        return;
      }
      const patternCanvas = document.createElement('canvas');
      const pSize = 128;
      patternCanvas.width = pSize;
      patternCanvas.height = pSize;
      const pCtx = patternCanvas.getContext('2d');
      if (pCtx) {
        pCtx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.2, grainIntensity * 0.25)})`;
        const count = Math.floor((pSize * pSize) / 35);
        for (let i = 0; i < count; i++) {
          pCtx.fillRect(Math.random() * pSize, Math.random() * pSize, 1, 1);
        }
        grainPattern = ctx.createPattern(patternCanvas, 'repeat');
      }
    };
    updateGrainPattern();

    const render = () => {
      time += 0.015 * effectiveSpeed;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerY = height * position;
      const numThreads = Math.max(1, threadCount);
      const points = 60; // optimized resolution of curve points across screen width

      // Render each thread with its harmonic wave function
      for (let i = 0; i < numThreads; i++) {
        const tRatio = numThreads > 1 ? i / (numThreads - 1) : 0.5;
        // Fan dispersion
        let fanOffset = 0;
        if (fanMode === 'center') {
          fanOffset = (tRatio - 0.5) * spread * height;
        } else if (fanMode === 'top') {
          fanOffset = tRatio * spread * height;
        } else {
          fanOffset = -tRatio * spread * height;
        }

        // Color interpolation across color1 -> color2 -> color3
        let r, g, b;
        if (tRatio < 0.5) {
          const k = tRatio * 2;
          r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * k);
          g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * k);
          b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * k);
        } else {
          const k = (tRatio - 0.5) * 2;
          r = Math.round(rgb2[0] + (rgb3[0] - rgb2[0]) * k);
          g = Math.round(rgb2[1] + (rgb3[1] - rgb2[1]) * k);
          b = Math.round(rgb2[2] + (rgb3[2] - rgb2[2]) * k);
        }

        const threadOpacity = Math.max(0, Math.min(1, opacity * brightness));

        const drawWave = (isMirrored = false) => {
          ctx.beginPath();

          const mirrorSign = isMirrored ? -1 : 1;
          const phaseOffset = i * 0.45 + (isMirrored ? Math.PI * 0.5 : 0);

          for (let p = 0; p <= points; p++) {
            const x = (p / points) * width;
            const progress = p / points; // 0 to 1

            // Taper multiplier at edges (0 at edges, 1 at center)
            const taperFactor =
              taper > 0
                ? Math.pow(Math.sin(progress * Math.PI), taper)
                : 1;

            // Wave harmonic formula
            const wave1 = Math.sin(progress * frequency * Math.PI + time * 2 + phaseOffset);
            const wave2 = Math.cos(progress * (frequency * 0.6) * Math.PI - time * 1.5 + phaseOffset * 0.7);
            const harmonic = (wave1 * 0.7 + wave2 * 0.3);

            // Base displacement
            let y = centerY + mirrorSign * (fanOffset + harmonic * (height * 0.12) * taperFactor);

            // Mouse interaction displacement
            if (mouseInteraction) {
              const dx = x - mouse.x;
              const dy = y - mouse.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const maxDist = width * 0.35;
              if (dist < maxDist) {
                const force = (1 - dist / maxDist) * mouseStrength * 120 * taperFactor;
                y += (dy / (dist || 1)) * force * mirrorSign;
              }
            }

            if (p === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          // Thread stroke with glow & luminescence
          const baseStrokeWidth = thickness * (1 + (shimmer ? Math.sin(time * 4 + i) * 0.2 : 0));

          // Outer Glow
          if (glow > 0) {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${threadOpacity * glow * 10})`;
            ctx.lineWidth = baseStrokeWidth * 6;
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          // Core Thread
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${threadOpacity * (1 - falloff * 0.3)})`;
          ctx.lineWidth = baseStrokeWidth * 1.5;
          ctx.lineCap = 'round';
          ctx.stroke();

          // High-brightness center line
          ctx.strokeStyle = `rgba(255, 255, 255, ${threadOpacity * 0.8})`;
          ctx.lineWidth = Math.max(0.5, baseStrokeWidth * 0.5);
          ctx.stroke();
        };

        drawWave(false);
        if (mirror) {
          drawWave(true);
        }
      }

      // High-performance Grain Layer
      if (grainPattern) {
        ctx.fillStyle = grainPattern;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [
    color1,
    color2,
    color3,
    speed,
    threadCount,
    frequency,
    spread,
    taper,
    position,
    fanMode,
    glow,
    falloff,
    thickness,
    brightness,
    opacity,
    mirror,
    shimmer,
    grain,
    grainIntensity,
    mouseInteraction,
    mouseStrength,
  ]);

  return (
    <div
      ref={containerRef}
      className={`webthreads-container relative w-full h-full overflow-hidden ${className}`}
      style={{ minHeight: '100%', ...style }}
    >
      <canvas
        ref={canvasRef}
        className="webthreads-canvas block absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};

export default WebThreads;
