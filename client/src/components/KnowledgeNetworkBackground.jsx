import React, { useEffect, useRef } from 'react';
import './KnowledgeNetworkBackground.css';

/**
 * KnowledgeNetworkBackground
 * Lightweight, high-performance interactive constellation / knowledge network background.
 * Inspired by Vanta.js & ReactBits.
 * 
 * Features:
 * - Floating interconnected knowledge nodes representing ProblemPool threads.
 * - Dynamic mouse attraction / ripple effect.
 * - Dynamic line opacity based on node proximity.
 * - Auto-throttles and pauses offscreen.
 * - Reduced density on mobile screens (max 28 nodes on mobile vs 60 on desktop).
 * - Full prefers-reduced-motion support.
 * - pointer-events: none so it never obstructs UI clicks or form inputs.
 */
const KnowledgeNetworkBackground = ({
  variant = 'constellation', // 'constellation' | 'particles' | 'subtle'
  color = '#6366f1',
  nodeCount,
  className = '',
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    // Node count defaults
    const maxNodes = nodeCount || (isMobile ? 24 : variant === 'subtle' ? 36 : 54);
    const maxDistance = isMobile ? 90 : 130;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Initialize Nodes
    const nodes = [];
    const colors = [
      'rgba(99, 102, 241, ', // indigo
      'rgba(139, 92, 246, ', // violet
      'rgba(56, 189, 248, ', // sky
      'rgba(16, 185, 129, ', // emerald
    ];

    for (let i = 0; i < maxNodes; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (prefersReducedMotion ? 0.05 : 0.4),
        vy: (Math.random() - 0.5) * (prefersReducedMotion ? 0.05 : 0.4),
        radius: Math.random() * 2 + 1.2,
        baseColor: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.4 + 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    // Mouse Tracking
    let mouse = { x: -1000, y: -1000, radius: 140 };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Resize Handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // IntersectionObserver to pause loop when offscreen
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    // Render Loop
    let animationId;
    let time = 0;

    const render = () => {
      animationId = requestAnimationFrame(render);

      if (!isVisible) return;

      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // 1. Update and Draw Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          // Bounce off boundaries
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;

          // Mouse gentle repel/attraction
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            const force = (mouse.radius - dist) / mouse.radius;
            node.x -= (dx / dist) * force * 1.5;
            node.y -= (dy / dist) * force * 1.5;
          }
        }

        // Draw node
        const currentAlpha = node.alpha + Math.sin(time * node.pulseSpeed + node.pulseOffset) * 0.15;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${node.baseColor}${Math.max(0.1, currentAlpha)})`;
        ctx.fill();

        // 2. Draw Connection Lines
        if (variant !== 'particles') {
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeB = nodes[j];
            const dx = node.x - nodeB.x;
            const dy = node.y - nodeB.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDistance) {
              const lineAlpha = (1 - dist / maxDistance) * 0.18;
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(nodeB.x, nodeB.y);
              ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
              ctx.lineWidth = 0.75;
              ctx.stroke();
            }
          }
        }
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [variant, nodeCount]);

  return (
    <div className={`knowledge-network-bg-wrapper ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="knowledge-network-canvas" />
      <div className="knowledge-network-vignette" />
    </div>
  );
};

export default KnowledgeNetworkBackground;
