"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { SpinSegment } from "@/lib/gamification/engine";

interface SpinWheelProps {
  segments: SpinSegment[];
  onSpin: () => Promise<{ segment: SpinSegment }>;
  disabled?: boolean;
}

const WHEEL_SIZE = 320;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE / 2 - 10;

export function SpinWheel({ segments, onSpin, disabled }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinSegment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const animRef = useRef<number>(0);

  // Draw the wheel
  const drawWheel = useCallback(
    (ctx: CanvasRenderingContext2D, currentRotation: number) => {
      ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

      // Draw segments
      let startAngle = (currentRotation * Math.PI) / 180;
      for (const seg of segments) {
        const sweepAngle = seg.probability * 2 * Math.PI;
        const endAngle = startAngle + sweepAngle;

        // Segment fill
        ctx.beginPath();
        ctx.moveTo(CENTER, CENTER);
        ctx.arc(CENTER, CENTER, RADIUS, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();

        // Segment border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        const midAngle = startAngle + sweepAngle / 2;
        const labelRadius = RADIUS * 0.65;
        const lx = CENTER + labelRadius * Math.cos(midAngle);
        const ly = CENTER + labelRadius * Math.sin(midAngle);

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(midAngle + Math.PI / 2);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Text shadow for readability
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 3;
        ctx.fillText(seg.label, 0, 0);
        ctx.restore();

        startAngle = endAngle;
      }

      // Outer ring
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, RADIUS + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Center hub
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();

      // Pointer (top)
      ctx.beginPath();
      ctx.moveTo(CENTER - 12, 8);
      ctx.lineTo(CENTER + 12, 8);
      ctx.lineTo(CENTER, 30);
      ctx.closePath();
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "#991b1b";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [segments]
  );

  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawWheel(ctx, rotation);
  }, [drawWheel, rotation]);

  // Animate spin
  const animateSpin = useCallback(
    (targetRotation: number) => {
      const startRotation = rotation;
      const totalDelta = targetRotation - startRotation;
      const duration = 4000;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startRotation + totalDelta * eased;

        setRotation(current);

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) drawWheel(ctx, current);
        }

        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        }
      };

      animRef.current = requestAnimationFrame(animate);
    },
    [rotation, drawWheel]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Handle spin
  const handleSpin = async () => {
    if (spinning || disabled) return;
    setSpinning(true);
    setError(null);
    setResult(null);

    try {
      const res = await onSpin();
      const winSeg = res.segment;

      // Calculate target rotation to land on this segment
      let angleAccum = 0;
      let targetAngle = 0;
      for (const seg of segments) {
        const sweep = seg.probability * 360;
        if (seg.label === winSeg.label && seg.type === winSeg.type) {
          // Land in the middle of this segment
          targetAngle = angleAccum + sweep / 2;
          break;
        }
        angleAccum += sweep;
      }

      // Pointer is at top (270 degrees), so we rotate to align
      const targetRotation = rotation + 1440 + (360 - targetAngle + 270);
      animateSpin(targetRotation);

      // Wait for animation to finish
      await new Promise((resolve) => setTimeout(resolve, 4200));
      setResult(winSeg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to spin");
    } finally {
      setSpinning(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          className="rounded-full shadow-xl"
        />
      </div>

      <Button
        onClick={handleSpin}
        disabled={spinning || disabled}
        className="px-8 py-3 text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:opacity-50"
      >
        {spinning ? "Spinning..." : "Spin the Wheel!"}
      </Button>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</div>
      )}

      {result && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center shadow-lg max-w-sm w-full">
          <div className="text-3xl mb-2">
            {result.type === "TRY_AGAIN" ? "😔" : "🎉"}
          </div>
          <h3 className="text-lg font-bold text-green-800">
            {result.type === "TRY_AGAIN" ? "Better Luck Next Time!" : "Congratulations!"}
          </h3>
          {result.type !== "TRY_AGAIN" && (
            <p className="text-green-700 mt-1 font-semibold text-xl">{result.label}</p>
          )}
        </div>
      )}
    </div>
  );
}
