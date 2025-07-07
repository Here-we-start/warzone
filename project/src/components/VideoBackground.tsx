import React, { useEffect, useRef, useState } from 'react';

export default function VideoBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 3D Ice elements and weapon silhouettes
    const elements: Array<{
      x: number;
      y: number;
      z: number;
      size: number;
      speed: number;
      opacity: number;
      color: string;
      type: 'ice_crystal' | 'weapon' | 'smoke' | 'ember';
      rotation: number;
      rotationSpeed: number;
    }> = [];

    const weaponShapes = [
      // Assault rifle silhouette points
      [[0, -2], [8, -2], [10, -1], [12, -1], [12, 1], [8, 1], [6, 2], [0, 2]],
      // SMG silhouette points  
      [[0, -1.5], [6, -1.5], [8, -1], [8, 1], [6, 1.5], [0, 1.5]],
      // Sniper rifle silhouette points
      [[0, -1], [15, -1], [16, -0.5], [16, 0.5], [15, 1], [0, 1]]
    ];

    const createElements = () => {
      const iceColors = [
        'rgba(161, 224, 255, 0.3)', 
        'rgba(200, 240, 255, 0.2)', 
        'rgba(180, 230, 255, 0.25)',
        'rgba(220, 245, 255, 0.15)'
      ];

      for (let i = 0; i < 80; i++) {
        const type = Math.random() > 0.7 ? 'weapon' : 
                    Math.random() > 0.5 ? 'ice_crystal' : 
                    Math.random() > 0.3 ? 'smoke' : 'ember';
        
        elements.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 100,
          size: type === 'weapon' ? Math.random() * 40 + 20 : Math.random() * 30 + 10,
          speed: Math.random() * 0.5 + 0.1,
          opacity: type === 'weapon' ? Math.random() * 0.15 + 0.05 : Math.random() * 0.3 + 0.1,
          color: type === 'weapon' ? 'rgba(161, 224, 255, 0.1)' : iceColors[Math.floor(Math.random() * iceColors.length)],
          type,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02
        });
      }
    };

    createElements();

    const drawIceCrystal = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Draw 3D ice crystal
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.5, -size * 0.3);
      ctx.lineTo(size * 0.8, 0);
      ctx.lineTo(size * 0.5, size * 0.3);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.5, size * 0.3);
      ctx.lineTo(-size * 0.8, 0);
      ctx.lineTo(-size * 0.5, -size * 0.3);
      ctx.closePath();
      ctx.fill();
      
      // Add inner glow
      ctx.strokeStyle = 'rgba(161, 224, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.restore();
    };

    const drawWeapon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, shapeIndex: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(size / 10, size / 10);
      
      const shape = weaponShapes[shapeIndex % weaponShapes.length];
      ctx.beginPath();
      ctx.moveTo(shape[0][0], shape[0][1]);
      for (let i = 1; i < shape.length; i++) {
        ctx.lineTo(shape[i][0], shape[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ice blue gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(10, 25, 40, 0.8)');
      gradient.addColorStop(0.3, 'rgba(20, 40, 60, 0.6)');
      gradient.addColorStop(0.7, 'rgba(30, 60, 90, 0.4)');
      gradient.addColorStop(1, 'rgba(15, 30, 45, 0.9)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animate elements
      elements.forEach((element, index) => {
        ctx.save();
        
        // 3D perspective effect
        const perspective = 1 + element.z / 100;
        const adjustedSize = element.size * perspective;
        const adjustedOpacity = element.opacity * (1 - element.z / 200);
        
        ctx.globalAlpha = adjustedOpacity;
        ctx.fillStyle = element.color;
        
        if (element.type === 'ice_crystal') {
          ctx.shadowColor = 'rgba(161, 224, 255, 0.5)';
          ctx.shadowBlur = 15;
          drawIceCrystal(ctx, element.x, element.y, adjustedSize, element.rotation);
        } else if (element.type === 'weapon') {
          ctx.shadowColor = 'rgba(161, 224, 255, 0.3)';
          ctx.shadowBlur = 10;
          drawWeapon(ctx, element.x, element.y, adjustedSize, element.rotation, index % 3);
        } else if (element.type === 'smoke') {
          ctx.shadowColor = element.color;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(element.x, element.y, adjustedSize, 0, Math.PI * 2);
          ctx.fill();
        } else if (element.type === 'ember') {
          ctx.shadowColor = 'rgba(161, 224, 255, 0.8)';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(element.x, element.y, adjustedSize / 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();

        // Update position and rotation
        element.y -= element.speed * perspective;
        element.x += Math.sin(Date.now() * 0.001 + index) * 0.3;
        element.rotation += element.rotationSpeed;
        element.z += element.speed * 0.1;

        // Reset if out of bounds
        if (element.y < -element.size || element.z > 100) {
          element.y = canvas.height + element.size;
          element.x = Math.random() * canvas.width;
          element.z = 0;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 w-full h-full object-cover z-0"
      />
      {/* Enhanced ice blue overlay with 3D depth */}
      <div className="fixed inset-0 bg-gradient-to-br from-ice-blue/15 via-transparent to-ice-blue-dark/10 z-0 animate-pulse" 
           style={{ animationDuration: '6s' }} />
      {/* Tactical grid overlay with ice theme */}
      <div className="fixed inset-0 opacity-10 z-0"
           style={{
             backgroundImage: `
               linear-gradient(rgba(161, 224, 255, 0.15) 1px, transparent 1px),
               linear-gradient(90deg, rgba(161, 224, 255, 0.15) 1px, transparent 1px)
             `,
             backgroundSize: '60px 60px',
             animation: 'grid-float 25s ease-in-out infinite'
           }} />
      {/* Ice crystal overlay pattern */}
      <div className="fixed inset-0 opacity-5 z-0"
           style={{
             backgroundImage: `radial-gradient(circle at 25% 25%, rgba(161, 224, 255, 0.2) 2px, transparent 2px),
                              radial-gradient(circle at 75% 75%, rgba(200, 240, 255, 0.15) 1px, transparent 1px)`,
             backgroundSize: '100px 100px, 150px 150px',
             animation: 'ice-sparkle 8s ease-in-out infinite alternate'
           }} />
    </>
  );
}