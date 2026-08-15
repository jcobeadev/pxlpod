import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Canvas, Circle, Path, Skia } from "@shopify/react-native-skia";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

export interface CountdownRingProps {
  /** Diameter in px. */
  size?: number;
  /** Total countdown length. */
  durationMs: number;
  /**
   * Change this to (re)start the countdown — e.g. the shot index. Restarting on
   * a value change rather than on mount lets one mounted ring serve every shot.
   */
  runKey: number | string;
  /** Fired once when the ring completes. */
  onComplete: () => void;
}

/**
 * The capture countdown (08). A background ring plus an amber arc that sweeps
 * clockwise from the top as the timer runs, with the whole-second count in the
 * centre — the shutter beat from the reference video.
 *
 * Driven by requestAnimationFrame and a Skia arc rather than the Skia/reanimated
 * bridge: the animation is a few seconds long and a small Canvas redraws
 * cheaply, so the simpler loop is the safer choice on a stack we can't unit-test
 * against a device here.
 */
const STROKE = 6;

export function CountdownRing({ size = 132, durationMs, runKey, onComplete }: CountdownRingProps) {
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState(Math.ceil(durationMs / 1000));
  const completed = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    completed.current = false;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / durationMs);
      setProgress(p);
      setRemaining(Math.max(0, Math.ceil((durationMs - elapsed) / 1000)));

      if (p >= 1) {
        if (!completed.current) {
          completed.current = true;
          onComplete();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // onComplete intentionally excluded — a fresh closure each render would
    // restart the countdown mid-run. runKey is the deliberate restart signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, durationMs]);

  const r = (size - STROKE) / 2;
  const cx = size / 2;

  const arc = Skia.Path.Make();
  // Sweep clockwise from 12 o'clock.
  arc.addArc({ x: STROKE / 2, y: STROKE / 2, width: size - STROKE, height: size - STROKE }, -90, progress * 360);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Canvas style={{ position: "absolute", width: size, height: size }}>
        <Circle cx={cx} cy={cx} r={r} style="stroke" strokeWidth={STROKE} color="rgba(255,255,255,0.28)" />
        <Path path={arc} style="stroke" strokeWidth={STROKE} strokeCap="round" color={colors.amber} />
      </Canvas>
      <Text variant="display" style={{ fontSize: 52, color: colors.surface.DEFAULT, lineHeight: 56 }}>
        {remaining}
      </Text>
    </View>
  );
}
