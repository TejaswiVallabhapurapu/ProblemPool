import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './KnowledgeCore3D.css';

/**
 * KnowledgeCore3D
 * Modern 3D central Knowledge Core representing the ProblemPool ecosystem.
 * Features a glowing wireframe/refraction polyhedron core, rotating orbital rings,
 * dynamic glowing knowledge particle clouds, and interactive floating knowledge badges.
 * Built with Three.js with full mouse parallax, lightweight 60fps render loop,
 * off-screen pause via IntersectionObserver, and reduced-motion support.
 */
const KnowledgeCore3D = ({ className = '' }) => {
  const mountRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [activeBadge, setActiveBadge] = useState(null);

  // Orbiting Knowledge node definitions
  const knowledgeNodes = [
    { id: 'problem', label: 'Real Problems', icon: '🧩', color: '#6366f1', angle: 0, radius: 150 },
    { id: 'question', label: 'Questions', icon: '❓', color: '#ec4899', angle: 60, radius: 165 },
    { id: 'community', label: 'Solvers & Experts', icon: '👥', color: '#8b5cf6', angle: 120, radius: 145 },
    { id: 'answers', label: 'Collaborative Answers', icon: '💬', color: '#3b82f6', angle: 180, radius: 160 },
    { id: 'best', label: 'Accepted Best Answer', icon: '⭐', color: '#f59e0b', angle: 240, radius: 155 },
    { id: 'solved', label: 'Verified Solutions', icon: '🎯', color: '#10b981', angle: 300, radius: 170 },
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Detect WebGL support
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('WebGL not available in this environment, using CSS fallback:', e);
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 480;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 32;

    // Group for all core rotating elements
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Central Core - Crystalline Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(6.2, 1);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x4f46e5,
      emissive: 0x1e1b4b,
      specular: 0x818cf8,
      shininess: 90,
      wireframe: false,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // 2. Outer Wireframe Hologram Cage
    const wireGeo = new THREE.IcosahedronGeometry(7.4, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xa5b4fc,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireMesh);

    // 3. Inner Glowing Dodecahedron Core
    const innerGeo = new THREE.DodecahedronGeometry(3.6, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xc7d2fe,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    // 4. Orbital Energy Rings
    const ring1Geo = new THREE.TorusGeometry(10.5, 0.08, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.5,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    coreGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(11.8, 0.06, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.4,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 4;
    coreGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(13.2, 0.05, 16, 100);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 3;
    ring3.rotation.z = -Math.PI / 6;
    coreGroup.add(ring3);

    // 5. Surrounding Knowledge Particles Cloud
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const palette = [
      new THREE.Color('#6366f1'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#10b981'),
      new THREE.Color('#f59e0b'),
    ];

    for (let i = 0; i < particleCount; i++) {
      const radius = 8 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    coreGroup.add(particleSystem);

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6366f1, 2.5, 60);
    pointLight1.position.set(15, 15, 15);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x38bdf8, 2, 60);
    pointLight2.position.set(-15, -10, 15);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xa855f7, 2, 60);
    pointLight3.position.set(0, 20, -10);
    scene.add(pointLight3);

    // Mouse Interaction / Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.4;
      targetY = y * 0.4;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 480;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // IntersectionObserver to pause loop when offscreen
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    // Animation Loop
    let animationId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerping
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      if (!prefersReducedMotion) {
        // Continuous slow rotations
        coreMesh.rotation.x += 0.005;
        coreMesh.rotation.y += 0.008;

        wireMesh.rotation.x -= 0.004;
        wireMesh.rotation.y -= 0.006;

        innerMesh.rotation.x += 0.01;
        innerMesh.rotation.z += 0.008;

        ring1.rotation.z += 0.006;
        ring2.rotation.z -= 0.005;
        ring3.rotation.x += 0.004;

        particleSystem.rotation.y = elapsedTime * 0.04;
        particleSystem.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1;

        // Subtle floating bobbing effect
        coreGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.4;
      }

      // Parallax camera / group tilt
      coreGroup.rotation.y = mouseX + Math.sin(elapsedTime * 0.3) * 0.1;
      coreGroup.rotation.x = -mouseY;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose geometries and materials
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`knowledge-core-container ${className}`}>
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="knowledge-core-canvas" aria-hidden="true" />

      {/* Floating 3D CSS Orbiting Knowledge Badges */}
      <div className="knowledge-orbit-badges" aria-hidden="true">
        {knowledgeNodes.map((node, index) => (
          <div
            key={node.id}
            className={`knowledge-orbit-badge badge-${node.id} ${
              activeBadge === node.id ? 'badge-active' : ''
            }`}
            style={{
              '--orbit-angle': `${node.angle}deg`,
              '--orbit-radius': `${node.radius}px`,
              '--orbit-delay': `${index * 0.7}s`,
              '--badge-color': node.color,
            }}
            onMouseEnter={() => setActiveBadge(node.id)}
            onMouseLeave={() => setActiveBadge(null)}
          >
            <div className="badge-glass-pill">
              <span className="badge-icon">{node.icon}</span>
              <span className="badge-text">{node.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Central Holographic Pulse Aura */}
      <div className="knowledge-core-aura" aria-hidden="true" />
      <div className="knowledge-core-ring" aria-hidden="true" />
    </div>
  );
};

export default KnowledgeCore3D;
