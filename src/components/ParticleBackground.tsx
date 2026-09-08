import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleGroup({ count, color, radius, speed }: { count: number, color: string, radius: number, speed: number }) {
  const points = useRef<THREE.Points>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const baseRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    return positions;
  }, [count, radius]);

  useFrame((state, delta) => {
    if (!points.current) return;
    
    // Update base rotation slowly
    baseRotation.current.x -= delta * speed;
    baseRotation.current.y -= delta * speed * 1.2;

    // Calculate target rotation incorporating mouse position
    const targetX = baseRotation.current.x + mouse.y * 0.2;
    const targetY = baseRotation.current.y + mouse.x * 0.2;

    // Smoothly interpolate to target
    points.current.rotation.x = THREE.MathUtils.lerp(points.current.rotation.x, targetX, 0.05);
    points.current.rotation.y = THREE.MathUtils.lerp(points.current.rotation.y, targetY, 0.05);
  });

  return (
    <Points ref={points} positions={particlesPosition} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.04}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

export default function ParticleBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-80 dark:opacity-100 mix-blend-multiply dark:mix-blend-screen">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ParticleGroup count={2500} color="#3b82f6" radius={6} speed={0.03} />
        <ParticleGroup count={2000} color="#06b6d4" radius={7} speed={0.02} />
        <ParticleGroup count={1500} color="#14b8a6" radius={8} speed={0.04} />
      </Canvas>
    </div>
  );
}
