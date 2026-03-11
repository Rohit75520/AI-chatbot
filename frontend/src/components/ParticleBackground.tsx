"use client";

import { useEffect, useRef } from "react";

class Particle {
  angle: number;
  radiusBase: number;
  angularVelocity: number;
  x: number;
  y: number;
  size: number;
  colorPhase: number;
  blinkOffset: number;
  blinkSpeed: number;
  wiggleOffsetX: number;
  wiggleOffsetY: number;
  wiggleSpeed: number;
  targetRadiusRadius: number;

  constructor(startX: number, startY: number) {
    // Random distribution that forms a loose cluster
    this.radiusBase = 30 + Math.pow(Math.random(), 1.5) * 400; 
    
    this.targetRadiusRadius = this.radiusBase;
    this.angle = Math.random() * Math.PI * 2;
    
    // Varying speeds, some clockwise, some counter-clockwise
    this.angularVelocity = (Math.random() - 0.5) * 0.005;
    
    this.x = startX + Math.cos(this.angle) * this.radiusBase;
    this.y = startY + Math.sin(this.angle) * this.radiusBase;
    
    // Varying base sizes
    this.size = Math.random() * 1.5 + 0.5;
    
    this.colorPhase = Math.random() * Math.PI * 2;
    this.blinkOffset = Math.random() * Math.PI * 2;
    this.blinkSpeed = 0.03 + Math.random() * 0.05;
    
    this.wiggleOffsetX = Math.random() * Math.PI * 2;
    this.wiggleOffsetY = Math.random() * Math.PI * 2;
    this.wiggleSpeed = 0.02 + Math.random() * 0.03;
  }

  update(mouseX: number, mouseY: number, time: number) {
    this.angle += this.angularVelocity;
    
    // Slight breathing in the radius to break perfectly fixed orbits
    this.targetRadiusRadius = this.radiusBase + Math.sin(time * 0.01 + this.wiggleOffsetX) * 30;

    const targetX = mouseX + Math.cos(this.angle) * this.targetRadiusRadius;
    const targetY = mouseY + Math.sin(this.angle) * this.targetRadiusRadius;
    
    // Wiggle: random local drifting
    const wiggleX = Math.sin(time * this.wiggleSpeed + this.wiggleOffsetX) * 15;
    const wiggleY = Math.cos(time * this.wiggleSpeed + this.wiggleOffsetY) * 15;
    
    // Easing towards the target + wiggle
    this.x += (targetX + wiggleX - this.x) * 0.04;
    this.y += (targetY + wiggleY - this.y) * 0.04;
  }

  draw(ctx: CanvasRenderingContext2D, time: number, mouseX: number, mouseY: number) {
    // Cycle hue: 240 (blue) to 390 (orange)
    const t = (Math.sin(time * 0.01 + this.colorPhase) + 1) / 2;
    const hue = (240 + t * 150) % 360;
    
    // Blinking effect
    const alpha = 0.15 + (Math.sin(time * this.blinkSpeed + this.blinkOffset) + 1) / 2 * 0.85;
    
    // Slight size pulse
    const currentSize = Math.max(0.1, this.size + Math.sin(time * this.blinkSpeed + this.blinkOffset) * 0.5);

    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Instead of drawing a dot, draw an elongated ellipse tangent to the radius
    // Angle from center to the particle:
    const angleFromCenter = Math.atan2(this.y - mouseY, this.x - mouseX);
    // Add 90 degrees (Math.PI/2) to orient it along the orbit trajectory like antigravity dashes
    const drawAngle = angleFromCenter + Math.PI / 2;

    ctx.translate(this.x, this.y);
    ctx.rotate(drawAngle);
    
    ctx.beginPath();
    ctx.ellipse(0, 0, currentSize * 0.8, currentSize * 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
    ctx.fill();
    ctx.restore();
  }
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    // Smoothed mouse position so the whole cluster drags smoothly
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;
    
    let time = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const totalParticles = 250; 
      particles = [];
      for (let i = 0; i < totalParticles; i++) {
        particles.push(new Particle(mouseX, mouseY));
      }
    };

    window.addEventListener("resize", resize);
    resize();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      time += 1;
      
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      particles.forEach((particle) => {
        particle.update(mouseX, mouseY, time);
        particle.draw(ctx, time, mouseX, mouseY);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-80"
    />
  );
}
