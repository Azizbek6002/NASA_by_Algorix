"use client";

import { useEffect, useRef } from "react";

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  thickness: number;
  color: string;
  headRadius: number;
}

const METEOR_COLORS = [
  { head: "#FFFFFF", trail: "rgba(0, 240, 255, ", glow: "#00F0FF" }, // Neon Cyan
  { head: "#FFFFFF", trail: "rgba(112, 214, 255, ", glow: "#70D6FF" }, // Electric Blue
  { head: "#FFF5EA", trail: "rgba(255, 170, 64, ", glow: "#FFAA40" }, // Fiery Amber
  { head: "#FFFFFF", trail: "rgba(176, 38, 255, ", glow: "#B026FF" }, // Neon Violet
];

export function MeteorRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Angle of meteor fall: ~38 degrees downwards to the left
    const angle = (38 * Math.PI) / 180;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    // Adjust meteor count based on screen size for optimal performance
    const meteorCount = Math.min(28, Math.max(14, Math.floor(width / 75)));

    const createMeteor = (initialSpawn = false): Meteor => {
      // Spawn meteors above or to the right of the visible canvas
      const x = initialSpawn
        ? Math.random() * (width + 300) - 150
        : Math.random() * (width + 500) - 100;
      const y = initialSpawn
        ? Math.random() * (height + 200) - 100
        : -Math.random() * 200 - 50;

      const colorData =
        METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)];

      return {
        x,
        y,
        length: 80 + Math.random() * 110,
        speed: 12 + Math.random() * 14,
        opacity: 0.4 + Math.random() * 0.55,
        thickness: 1.2 + Math.random() * 1.5,
        color: colorData.glow,
        headRadius: 1.2 + Math.random() * 1.3,
      };
    };

    const meteors: Meteor[] = Array.from({ length: meteorCount }, () =>
      createMeteor(true),
    );

    // Background twinkling cosmic stars
    const starCount = Math.min(70, Math.floor(width / 25));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.4,
      baseAlpha: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.03,
      color:
        Math.random() > 0.6
          ? "rgba(0, 240, 255, "
          : Math.random() > 0.3
          ? "rgba(176, 38, 255, "
          : "rgba(255, 255, 255, ",
    }));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Render subtle twinkling cosmic background stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.phase += star.speed;
        const currentAlpha =
          star.baseAlpha + Math.sin(star.phase) * (star.baseAlpha * 0.5);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${Math.max(0.1, currentAlpha)})`;
        ctx.fill();
      }

      // 2. Render falling meteor shower
      for (let i = 0; i < meteors.length; i++) {
        const m = meteors[i];

        // Move meteor along angle
        m.x -= m.speed * cosAngle;
        m.y += m.speed * sinAngle;

        // Tail coordinate
        const tailX = m.x + m.length * cosAngle;
        const tailY = m.y - m.length * sinAngle;

        // Draw meteor trail with linear gradient
        const gradient = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        gradient.addColorStop(0, "rgba(0, 240, 255, 0)");
        gradient.addColorStop(0.6, `${m.color}33`);
        gradient.addColorStop(0.9, `${m.color}CC`);
        gradient.addColorStop(1, "#FFFFFF");

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = m.thickness;
        ctx.lineCap = "round";
        ctx.shadowBlur = 10;
        ctx.shadowColor = m.color;
        ctx.stroke();

        // Draw glowing bright head
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.headRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowBlur = 14;
        ctx.shadowColor = m.color;
        ctx.fill();
        ctx.restore();

        // Check if meteor left the screen
        if (m.y > height + 100 || m.x < -200) {
          meteors[i] = createMeteor(false);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
