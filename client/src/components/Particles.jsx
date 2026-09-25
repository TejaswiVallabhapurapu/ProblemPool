import React, { useEffect, useRef } from 'react';

/**
 * Particles Component
 * GPU-accelerated interactive particle system with 3D depth,
 * hover movement/repulsion physics, rotation, and configurable spread/size/speed.
 */
const Particles = ({
  particleColors = ['#ffffff'],
  particleCount = 200,
  particleSpread = 10,
  speed = 0.1,
  particleBaseSize = 100,
  moveParticlesOnHover = true,
  alphaParticles = false,
  disableRotation = false,
  pixelRatio = 1,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animId = 0;
    const pr = pixelRatio || (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1);

    let width = (canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.parentElement?.clientHeight || window.innerHeight);

    canvas.width = width * pr;
    canvas.height = height * pr;
    ctx.scale(pr, pr);

    // Parse colors
    const colors = Array.isArray(particleColors) && particleColors.length > 0 ? particleColors : ['#ffffff'];

    // Mouse pointer state
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
      radius: 140,
    };

    // Initialize particles with 3D coordinates & velocities
    const particles = [];
    const count = Math.min(Math.max(particleCount, 20), 400);

    for (let i = 0; i < count; i++) {
      const depth = Math.random(); // 0 (near) to 1 (far)
      const sizeFactor = (particleBaseSize / 100) * (0.8 + (1 - depth) * 1.6);
      const angle = Math.random() * Math.PI * 2;
      const velocity = (0.2 + Math.random() * 0.6) * (speed * 10);

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        originX: Math.random() * width,
        originY: Math.random() * height,
        z: depth,
        vx: Math.cos(angle) * velocity * (0.5 + Math.random() * 0.5),
        vy: Math.sin(angle) * velocity * (0.5 + Math.random() * 0.5),
        baseSize: sizeFactor * (1.2 + Math.random() * 1.8),
        size: sizeFactor * (1.2 + Math.random() * 1.8),
        alpha: alphaParticles ? 0.2 + Math.random() * 0.7 : 0.6 + (1 - depth) * 0.4,
        color: colors[i % colors.length],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02 * (disableRotation ? 0 : 1),
        spreadOffset: (Math.random() - 0.5) * particleSpread * 4,
      });
    }

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;
      canvas.width = width * pr;
      canvas.height = height * pr;
      ctx.scale(pr, pr);
    };

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', resize);

    const handlePointerMove = (e) => {
      if (!moveParticlesOnHover) return;
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.active = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);

    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx * (1 - p.z * 0.4);
          p.y += p.vy * (1 - p.z * 0.4);

          if (!disableRotation) {
            p.rotation += p.rotSpeed;
          }

          // Screen wrap with soft margin
          const margin = 20;
          if (p.x < -margin) p.x = width + margin;
          if (p.x > width + margin) p.x = -margin;
          if (p.y < -margin) p.y = height + margin;
          if (p.y > height + margin) p.y = -margin;

          // Mouse hover repulsion physics
          if (moveParticlesOnHover && mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < mouse.radius && dist > 0.1) {
              const force = (1 - dist / mouse.radius) * 2.5;
              const angle = Math.atan2(dy, dx);
              p.x += Math.cos(angle) * force * 3;
              p.y += Math.sin(angle) * force * 3;
            }
          }
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        if (!disableRotation) {
          ctx.rotate(p.rotation);
        }

        // Soft glow halo
        const currentRadius = p.size;
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Extra subtle sparkle glow for foreground particles
        if (p.z < 0.35) {
          ctx.beginPath();
          ctx.arc(0, 0, currentRadius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * 0.2;
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [
    particleColors,
    particleCount,
    particleSpread,
    speed,
    particleBaseSize,
    moveParticlesOnHover,
    alphaParticles,
    disableRotation,
    pixelRatio,
  ]);

  return (
    <div
      ref={containerRef}
      className={`particles-container relative w-full h-full overflow-hidden ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative', ...style }}
    >
      <canvas
        ref={canvasRef}
        className="particles-canvas absolute inset-0 w-full h-full block"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

export default Particles;
