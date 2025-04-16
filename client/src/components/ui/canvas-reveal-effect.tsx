"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CanvasRevealEffectProps
  extends React.HTMLAttributes<HTMLCanvasElement> {
  colors?: Array<[number, number, number]>;
  dotSize?: number;
  animationSpeed?: number;
  containerClassName?: string;
}

export function CanvasRevealEffect({
  colors = [
    [255, 0, 128],
    [0, 128, 255],
    [255, 255, 0],
  ],
  dotSize = 3,
  animationSpeed = 2,
  containerClassName,
  className,
  ...props
}: CanvasRevealEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const isPointerDown = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    updateCanvasSize();

    let animationFrame: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      color: [number, number, number];
      vx: number;
      vy: number;
      gravity: number;
      life: number;
      alpha: number;
    }> = [];

    const addParticle = (x: number, y: number) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x,
        y,
        size: dotSize,
        color,
        vx: (Math.random() - 0.5) * animationSpeed,
        vy: (Math.random() - 0.5) * animationSpeed,
        gravity: 0.05,
        life: Math.random() * 50 + 50,
        alpha: 1,
      });
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.life -= 1;
        p.alpha = p.life / 100;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.life <= 0) {
          particles.splice(i, 1);
          i--;
        }
      }

      if (isPointerDown.current) {
        addParticle(mousePosition.current.x, mousePosition.current.y);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      if (isPointerDown.current) {
        addParticle(mousePosition.current.x, mousePosition.current.y);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown.current = true;
      const rect = canvas.getBoundingClientRect();
      mousePosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handlePointerUp = () => {
      isPointerDown.current = false;
    };

    window.addEventListener("resize", updateCanvasSize);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener("resize", updateCanvasSize);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [colors, dotSize, animationSpeed]);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <canvas
        ref={canvasRef}
        className={cn("absolute inset-0 w-full h-full", className)}
        {...props}
      />
    </div>
  );
}