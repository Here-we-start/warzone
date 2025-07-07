import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  color: string;
  life: number;
  maxLife: number;
  isSpark: boolean;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
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

    const createParticle = (): Particle => {
      const isSpark = Math.random() > 0.85;
      const life = isSpark ? 30 + Math.random() * 20 : 120 + Math.random() * 80;
      
      return {
        x: Math.random() * canvas.width,
        y: isSpark ? canvas.height - 30 : canvas.height * (0.2 + Math.random() * 0.7),
        radius: isSpark ? 1 + Math.random() * 2 : 3 + Math.random() * 8,
        dx: isSpark ? (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 0.2,
        dy: isSpark ? -2 - Math.random() * 2 : -0.1 - Math.random() * 0.2,
        color: isSpark 
          ? `rgba(161, 224, 255, ${0.6 + Math.random() * 0.4})` 
          : `rgba(80, 80, 80, ${0.08 + Math.random() * 0.08})`,
        life,
        maxLife: life,
        isSpark
      };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add new particles
      if (particlesRef.current.length < 100) {
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push(createParticle());
        }
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        const alpha = particle.life / particle.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (particle.isSpark) {
          ctx.shadowColor = '#a1e0ff';
          ctx.shadowBlur = 12;
          ctx.fillStyle = particle.color;
        } else {
          ctx.shadowColor = '#444';
          ctx.shadowBlur = 4;
          ctx.fillStyle = particle.color;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Update position
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life--;

        // Remove dead particles
        return particle.life > 0 && 
               particle.y > -30 && 
               particle.x > -30 && 
               particle.x < canvas.width + 30;
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
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'linear-gradient(135deg, #0a0e13 0%, #1a1f25 50%, #0f1419 100%)' }}
    />
  );
}