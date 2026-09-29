import { useEffect, useRef, useState } from "react";
import { defaultSetting } from "./components/theme/default";

/* ─────────────────────────────────────────────────────────────
   TUNING   (unchanged)
   ───────────────────────────────────────────────────────────── */

const EDGE_GAP_PX          = 16;
const WALK_SPEED_PX        = 0.5;
const WALK_FRAME_MS        = 260;
const WALK_FRAME_INDICES   = [0, 1, 2, 3];
const SIT_FRAME_INDEX      = 4;
const SIT_MS_MIN           = 2000;
const SIT_MS_MAX           = 5000;
const WALK_MS_MIN          = 3000;
const WALK_MS_MAX          = 6000;
const DIRECTION_RIGHT_BIAS = 0.5;
const WALL_ESCAPE_MARGIN_PX = 4;
const CAT_WIDTH_PX         = 34;
const CAT_HEIGHT_PX        = 34;
const FLIP_WHEN_FACING_LEFT = true;

/* ─────────────────────────────────────────────────────────────
   Pure helper — hoisted out of the component so it can never
   hit a temporal-dead-zone error if it's ever refactored.
   ───────────────────────────────────────────────────────────── */
function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export default function Cat() {
  const [x, setX]             = useState(EDGE_GAP_PX);
  const [frame, setFrame]     = useState(SIT_FRAME_INDEX);
  const [dir, setDir]         = useState(1);
  const [sitting, setSitting] = useState(true);

  const xRef       = useRef(x);
  const dirRef     = useRef(dir);
  const sittingRef = useRef(sitting);

  useEffect(() => { xRef.current = x; }, [x]);
  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { sittingRef.current = sitting; }, [sitting]);

  useEffect(() => {
    let raf;
    let last       = performance.now();
    let frameAcc   = 0;
    let walkIdx    = 0;

    let phaseUntil = performance.now() + randomBetween(SIT_MS_MIN, SIT_MS_MAX);

    const maxX = () =>
      Math.max(
        EDGE_GAP_PX,
        window.innerWidth - CAT_WIDTH_PX - EDGE_GAP_PX
      );

    function pickDirection(currentX) {
      const left  = EDGE_GAP_PX;
      const right = maxX();

      if (currentX <= left + WALL_ESCAPE_MARGIN_PX)  return 1;
      if (currentX >= right - WALL_ESCAPE_MARGIN_PX) return -1;

      return Math.random() < DIRECTION_RIGHT_BIAS ? 1 : -1;
    }

    function tick(now) {
      // ── FIX: clamp dt so a backgrounded tab can't teleport the
      //         animation state on focus. ────────────────────────
      const dt = Math.min(now - last, WALK_FRAME_MS);
      last = now;

      if (sittingRef.current) {
        if (now >= phaseUntil) {
          const nextDir = pickDirection(xRef.current);
          dirRef.current = nextDir;
          setDir(nextDir);

          walkIdx = 0;
          frameAcc = 0;               // ← FIX: reset walk frame accumulator
          setFrame(WALK_FRAME_INDICES[0]);
          setSitting(false);
          sittingRef.current = false;

          phaseUntil = now + randomBetween(WALK_MS_MIN, WALK_MS_MAX);
        }
      } else {
        const left  = EDGE_GAP_PX;
        const right = maxX();

        // ── FIX: degenerate viewport (left === right) can't walk.
        //         Stay sitting instead of flickering sit↔walk. ──
        if (right <= left) {
          setSitting(true);
          sittingRef.current = true;
          setFrame(SIT_FRAME_INDEX);
          phaseUntil = now + randomBetween(SIT_MS_MIN, SIT_MS_MAX);
          raf = requestAnimationFrame(tick);
          return;
        }

        let nx = xRef.current + dirRef.current * WALK_SPEED_PX;

        let hitWall = false;
        if (nx <= left)  { nx = left;  hitWall = true; }
        if (nx >= right) { nx = right; hitWall = true; }

        xRef.current = nx;
        setX(nx);

        frameAcc += dt;
        if (frameAcc >= WALK_FRAME_MS) {
          frameAcc = 0;
          walkIdx = (walkIdx + 1) % WALK_FRAME_INDICES.length;
          setFrame(WALK_FRAME_INDICES[walkIdx]);
        }

        if (now >= phaseUntil || hitWall) {
          setSitting(true);
          sittingRef.current = true;
          setFrame(SIT_FRAME_INDEX);
          phaseUntil = now + randomBetween(SIT_MS_MIN, SIT_MS_MAX);
        }
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const flip = FLIP_WHEN_FACING_LEFT ? dir : 1;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        bottom: 0,
        transform: `translateX(${x}px)`,
        pointerEvents: "none",
        zIndex: 9999,
        width: CAT_WIDTH_PX,
        height: CAT_HEIGHT_PX,
      }}
    >
      <img
        src={`${defaultSetting.base_imgs}gato/${frame}.png`}
        width={CAT_WIDTH_PX}
        height={CAT_HEIGHT_PX}
        alt=""
        style={{
          transform: `scaleX(${flip})`,
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}