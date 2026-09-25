import React, { useEffect, useRef } from 'react';
import './KnowledgeNetworkBackground.css';

/**
 * KnowledgeNetworkBackground
 * Lightweight, high-performance dark interactive constellation & grid background.
 * Optimized for ProblemPool Dark Premium Aesthetic.
 * 
 * Features:
 * - Floating interconnected knowledge nodes in monochrome silver, white, and charcoal.
 * - Dynamic mouse attraction / gentle ripple.
 * - Proximity-based connection lines.
 * - Soft ambient radial glow and faint tech grid.
 * - Auto-throttles offscreen.
 * - pointer-events: none to prevent any UI blocking.
 */
const KnowledgeNetworkBackground = ({
  variant = 'constellation', // 'constellation' | 'particles' | 'subtle'
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
    const maxNodes = nodeCount || (isMobile ? 22 : variant === 'subtle' ? 32 : 48);
    const maxDistance = isMobile ? 85 : 125;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Initialize Monochrome Nodes
    const nodes = [];
    const colors = [
      'rgba(255, 255, 255, ',   // pure white
      'rgba(215, 215, 215, ',   // silver
      'rgba(165, 165, 165, ',   // medium gray
      'rgba(110, 110, 110, ',   // charcoal
    ];

    for (let i = 0; i < maxNodes; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (prefersReducedMotion ? 0.05 : 0.35),
        vy: (Math.random() - 0.5) * (prefersReducedMotion ? 0.05 : 0.35),
        radius: Math.random() * 1.8 + 1.0,
        baseColor: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.35 + 0.25,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    // Mouse Tracking
    let mouse = { x: -1000, y: -1000, radius: 130 };

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
            node.x -= (dx / dist) * force * 1.2;
            node.y -= (dy / dist) * force * 1.2;
          }
        }

        // Draw node
        const currentAlpha = node.alpha + Math.sin(time * node.pulseSpeed + node.pulseOffset) * 0.12;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${node.baseColor}${Math.max(0.08, currentAlpha)})`;
        ctx.fill();

        // 2. Draw Connection Lines
        if (variant !== 'particles') {
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeB = nodes[j];
            const dx = node.x - nodeB.x;
            const dy = node.y - nodeB.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDistance) {
              const lineAlpha = (1 - dist / maxDistance) * 0.15;
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(nodeB.x, nodeB.y);
              ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
              ctx.lineWidth = 0.65;
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
      <div className="knowledge-network-grid" />
      <div className="knowledge-network-glow" />
      <canvas ref={canvasRef} className="knowledge-network-canvas" />
      <div className="knowledge-network-vignette" />
    </div>
  );
};

export default KnowledgeNetworkBackground;
