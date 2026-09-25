import React, { useEffect, useRef, useState } from 'react';

/**
 * AeroShards Component
 * GPU-accelerated interactive 3D wind sculpture of folded foil shards
 * with dynamic lighting, pointer repulsion, flow morphing, and ripple wave physics.
 */
const AeroShards = ({
  backgroundColor = '#080808',
  shardColor = '#333333',
  accentColor = '#777777',
  placement = 'full',
  flow = 'stream',
  material = 'pearl',
  detail = 'balanced',
  effect = 'none',
  scale = 1,
  spread = 1,
  depth = 1,
  speed = 1,
  spin = 1,
  interaction = 'repel',
  density = 1.5,
  shardSize = 1.1,
  stretch = 1,
  turbulence = 1,
  glow = 1,
  edgeSoftness = 2,
  bloom = 0.5,
  grain = 0.05,
  chromaticAberration = 0.0075,
  transitionDuration = 1,
  interactionRadius = 1.5,
  interactionStrength = 0.5,
  rippleIntensity = 1,
  holdToGather = true,
  paused = false,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const parseHex = (hex, fallback = [137, 106, 189]) => {
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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isPaused = paused || prefersReducedMotion;

    let animId = 0;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const baseRGB = parseHex(shardColor, [137, 106, 189]);
    const accentRGB = parseHex(accentColor, [168, 85, 247]);

    // Shard count based on detail and density
    const countMultiplier = detail === 'bold' ? 0.65 : detail === 'fine' ? 1.35 : 1.0;
    const baseCount = Math.floor(180 * density * countMultiplier);
    const shards = [];

    // Pointer & interaction state
    const pointer = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
      isHolding: false,
      holdTime: 0,
      gatherAmount: 0,
    };

    const ripples = [];

    // Initialize shards
    for (let i = 0; i < baseCount; i++) {
      shards.push({
        id: i,
        progress: Math.random(),
        lane: (Math.random() - 0.5) * 2 * spread,
        depth: Math.random() * depth,
        scaleSeed: 0.5 + Math.random() * 0.9,
        roll: Math.random() * Math.PI * 2,
        rollSpeed: (Math.random() - 0.5) * 1.8 * spin,
        lengthMult: 0.7 + Math.random() * 0.6,
        vx: 0,
        vy: 0,
        vz: 0,
        facetSeed: Math.random(),
      });
    }

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width || window.innerWidth;
      height = canvas.height = rect.height || window.innerHeight;
    };

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', resize);

    // Interaction listeners
    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.targetX = e.clientX - rect.left;
      pointer.targetY = e.clientY - rect.top;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.isHolding = false;
      pointer.targetX = -1000;
      pointer.targetY = -1000;
    };

    const handlePointerDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      pointer.targetX = px;
      pointer.targetY = py;
      pointer.active = true;
      if (holdToGather) {
        pointer.isHolding = true;
      }

      // Spawn ripple wave
      ripples.push({
        x: px,
        y: py,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.8,
        strength: rippleIntensity,
        age: 0,
      });
    };

    const handlePointerUp = () => {
      pointer.isHolding = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    let lastTime = performance.now();

    // Procedural Path generator according to placement and flow
    const getPathPosition = (t, flowType, placementType, aspect) => {
      const p = ((t % 1) + 1) % 1;
      let x = 0;
      let y = 0;
      let z = 0;

      if (flowType === 'vortex') {
        const radius = (0.15 + Math.sqrt(p) * 0.6) * Math.min(width, height);
        const angle = p * Math.PI * 4;
        x = width * 0.5 + Math.cos(angle) * radius;
        y = height * 0.5 + Math.sin(angle) * radius * 0.75;
        z = Math.sin(p * Math.PI * 2) * 0.4;
      } else if (flowType === 'ribbon') {
        const angle = p * Math.PI * 2;
        x = (p * 1.4 - 0.2) * width;
        y = height * 0.5 + Math.sin(angle) * height * 0.3 + Math.cos(angle * 2) * 40;
        z = Math.cos(angle) * 0.5;
      } else {
        // Stream formation (default)
        if (placementType === 'left') {
          x = (1 - p) * width * 0.7 - width * 0.1;
          y = (p * 1.4 - 0.2) * height + Math.sin(p * Math.PI * 2) * 60;
        } else if (placementType === 'right') {
          x = (p * 0.8 + 0.3) * width;
          y = (p * 1.4 - 0.2) * height + Math.sin(p * Math.PI * 2) * 60;
        } else {
          // Full / Center stream
          x = (p * 1.3 - 0.15) * width;
          y =
            height * 0.5 +
            Math.sin((p * 1.8 - 0.3) * Math.PI) * height * 0.35 +
            Math.sin(p * Math.PI * 3) * 30 * turbulence;
        }
        z = Math.cos(p * Math.PI * 2 - 0.7) * 0.3;
      }

      return { x, y, z };
    };

    // Render loop
    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Clear & fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Smooth pointer interpolation
      pointer.x += (pointer.targetX - pointer.x) * 0.12;
      pointer.y += (pointer.targetY - pointer.y) * 0.12;

      // Hold to gather physics
      if (pointer.isHolding) {
        pointer.holdTime += dt;
        pointer.gatherAmount = Math.min(pointer.gatherAmount + dt * 2.2, 1);
      } else {
        pointer.holdTime = 0;
        pointer.gatherAmount = Math.max(pointer.gatherAmount - dt * 2.5, 0);
      }

      // Advance ripples
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rip = ripples[r];
        rip.age += dt;
        rip.radius += dt * 520;
        rip.strength *= 0.96;
        if (rip.radius > rip.maxRadius || rip.strength < 0.01) {
          ripples.splice(r, 1);
        }
      }

      // Ambient radial gradient glow
      const glowGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        width * 0.05,
        width * 0.5,
        height * 0.5,
        width * 0.7
      );
      glowGrad.addColorStop(0, `rgba(${accentRGB[0]}, ${accentRGB[1]}, ${accentRGB[2]}, ${0.12 * glow})`);
      glowGrad.addColorStop(0.6, `rgba(${baseRGB[0]}, ${baseRGB[1]}, ${baseRGB[2]}, ${0.05 * glow})`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // Sort shards by depth for realistic 3D occlusion
      shards.sort((a, b) => b.depth - a.depth);

      const aspect = width / Math.max(height, 1);

      // Render each folded diamond shard
      for (let i = 0; i < shards.length; i++) {
        const shard = shards[i];

        if (!isPaused) {
          // Progress motion along flow
          shard.progress += dt * 0.08 * speed;
          if (shard.progress > 1) shard.progress -= 1;
          shard.roll += dt * shard.rollSpeed;
        }

        // Compute path base
        const pathPos = getPathPosition(shard.progress, flow, placement, aspect);

        // Compute lateral normal offset
        const normalOffset = shard.lane * 85 * spread;
        let sx = pathPos.x + normalOffset;
        let sy = pathPos.y + Math.sin(shard.progress * Math.PI * 6 + shard.depth * 10) * 18 * turbulence;
        let sz = pathPos.z + (shard.depth - 0.5) * 0.6;

        // Pointer Repulsion / Attraction
        if (pointer.active && interaction !== 'none') {
          const dx = sx - pointer.x;
          const dy = sy - pointer.y;
          const dist = Math.hypot(dx, dy);
          const maxDist = 220 * interactionRadius;

          if (dist < maxDist && dist > 0.1) {
            const force = (1 - dist / maxDist) * 120 * interactionStrength;
            const dirX = dx / dist;
            const dirY = dy / dist;

            if (interaction === 'repel') {
              sx += dirX * force;
              sy += dirY * force;
            } else if (interaction === 'attract') {
              sx -= dirX * force * 0.6;
              sy -= dirY * force * 0.6;
            }
          }
        }

        // Hold to Gather vortex pull
        if (pointer.gatherAmount > 0.01 && pointer.active) {
          const gdx = pointer.x - sx;
          const gdy = pointer.y - sy;
          const gdist = Math.hypot(gdx, gdy);
          const gatherFactor = Math.pow(pointer.gatherAmount, 1.5);
          const orbitAngle = shard.progress * Math.PI * 4 + time * 0.002;
          const orbitRadius = 60 + shard.depth * 90;

          const targetX = pointer.x + Math.cos(orbitAngle) * orbitRadius;
          const targetY = pointer.y + Math.sin(orbitAngle) * orbitRadius * 0.65;

          sx += (targetX - sx) * gatherFactor * 0.65;
          sy += (targetY - sy) * gatherFactor * 0.65;
        }

        // Ripple wave displacement
        for (let r = 0; r < ripples.length; r++) {
          const rip = ripples[r];
          const rdx = sx - rip.x;
          const rdy = sy - rip.y;
          const rdist = Math.hypot(rdx, rdy);
          const delta = Math.abs(rdist - rip.radius);

          if (delta < 80) {
            const wave = Math.sin((delta / 80) * Math.PI) * rip.strength * 24;
            sx += (rdx / (rdist || 1)) * wave;
            sy += (rdy / (rdist || 1)) * wave;
          }
        }

        // Shard sizing and 3D perspective
        const depthScale = 0.6 + (1 - shard.depth) * 0.8;
        const currentSize = 14 * shardSize * scale * shard.scaleSeed * depthScale;
        const currentLength = currentSize * 2.2 * stretch * shard.lengthMult;
        const halfW = currentSize * 0.7;

        // 3D rotation projection
        const cosR = Math.cos(shard.roll);
        const sinR = Math.sin(shard.roll);

        // Folded 3D Foil Diamond geometry points: Top, Bottom, Left facet, Right facet
        const top = { x: sx, y: sy - currentLength * 0.5 };
        const bottom = { x: sx, y: sy + currentLength * 0.5 };
        const left = {
          x: sx - halfW * cosR - halfW * 0.25 * sinR,
          y: sy + halfW * sinR * 0.4,
        };
        const right = {
          x: sx + halfW * cosR + halfW * 0.25 * sinR,
          y: sy - halfW * sinR * 0.4,
        };
        const spine = { x: sx, y: sy };

        // Shard Color interpolation & Material Specular Shading
        const mixRatio = (Math.sin(shard.progress * Math.PI * 2 + shard.facetSeed * 4) + 1) * 0.5;
        const rVal = Math.round(baseRGB[0] + (accentRGB[0] - baseRGB[0]) * mixRatio);
        const gVal = Math.round(baseRGB[1] + (accentRGB[1] - baseRGB[1]) * mixRatio);
        const bVal = Math.round(baseRGB[2] + (accentRGB[2] - baseRGB[2]) * mixRatio);

        const alpha = Math.max(0.2, Math.min(0.95, (1 - shard.depth * 0.5) * 0.9));

        // Facet A (Left half of folded diamond)
        const lightIntensityA = Math.max(0.4, Math.min(1.2, 0.7 + cosR * 0.5));
        ctx.fillStyle = `rgba(${Math.min(255, Math.round(rVal * lightIntensityA))}, ${Math.min(
          255,
          Math.round(gVal * lightIntensityA)
        )}, ${Math.min(255, Math.round(bVal * lightIntensityA))}, ${alpha})`;

        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(bottom.x, bottom.y);
        ctx.lineTo(spine.x, spine.y);
        ctx.closePath();
        ctx.fill();

        // Facet B (Right half of folded diamond)
        const lightIntensityB = Math.max(0.3, Math.min(1.4, 0.9 - cosR * 0.5));
        ctx.fillStyle = `rgba(${Math.min(255, Math.round(rVal * lightIntensityB))}, ${Math.min(
          255,
          Math.round(gVal * lightIntensityB)
        )}, ${Math.min(255, Math.round(bVal * lightIntensityB))}, ${alpha})`;

        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(right.x, right.y);
        ctx.lineTo(bottom.x, bottom.y);
        ctx.lineTo(spine.x, spine.y);
        ctx.closePath();
        ctx.fill();

        // Pearlescent/Chrome Spine Highlight Stroke
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.45 * glow})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(bottom.x, bottom.y);
        ctx.stroke();
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
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    backgroundColor,
    shardColor,
    accentColor,
    placement,
    flow,
    material,
    detail,
    effect,
    scale,
    spread,
    depth,
    speed,
    spin,
    interaction,
    density,
    shardSize,
    stretch,
    turbulence,
    glow,
    edgeSoftness,
    bloom,
    grain,
    chromaticAberration,
    transitionDuration,
    interactionRadius,
    interactionStrength,
    rippleIntensity,
    holdToGather,
    paused,
  ]);

  return (
    <div
      ref={containerRef}
      className={`aeroshards-wrapper relative w-full h-full overflow-hidden ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative', ...style }}
    >
      <canvas
        ref={canvasRef}
        className="aeroshards-canvas absolute inset-0 w-full h-full block"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

export default AeroShards;
