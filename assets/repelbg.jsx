
// ─── Cursor-Repel Animated Background ───────────────────────────────────────
const REPEL_CLONES = [
  { size: 115, pos: { top: "5%",    left: "3%"    }, anim: "ztDrift1 22s ease-in-out infinite", delay: "0s"   },
  { size:  72, pos: { top: "10%",   right: "5%"   }, anim: "ztDrift2 16s ease-in-out infinite", delay: "-4s"  },
  { size:  58, pos: { top: "58%",   left: "1%"    }, anim: "ztFloat  12s ease-in-out infinite", delay: "-7s"  },
  { size: 100, pos: { bottom: "7%", right: "3%"   }, anim: "ztDrift1 28s ease-in-out infinite", delay: "-11s" },
  { size:  46, pos: { top: "40%",   right: "9%"   }, anim: "ztPulse   9s ease-in-out infinite", delay: "-2s"  },
  { size:  68, pos: { bottom: "20%",left: "7%"    }, anim: "ztDrift2 18s ease-in-out infinite", delay: "-6s"  },
  { size:  84, pos: { bottom: "32%",right: "16%"  }, anim: "ztFloat  14s ease-in-out infinite", delay: "-9s"  },
  { size:  42, pos: { top: "25%",   left: "14%"   }, anim: "ztDrift1 13s ease-in-out infinite", delay: "-3s"  },
  { size:  38, pos: { top: "72%",   left: "28%"   }, anim: "ztFloat   9s ease-in-out infinite", delay: "-1s"  },
  { size:  55, pos: { top: "18%",   left: "42%"   }, anim: "ztDrift2 20s ease-in-out infinite", delay: "-5s"  },
  { size:  48, pos: { bottom: "12%",left: "52%"   }, anim: "ztPulse  11s ease-in-out infinite", delay: "-8s"  },
  { size:  33, pos: { top: "83%",   right: "28%"  }, anim: "ztFloat   8s ease-in-out infinite", delay: "-3s"  },
  { size:  62, pos: { top: "48%",   left: "22%"   }, anim: "ztDrift1 17s ease-in-out infinite", delay: "-10s" },
  { size:  44, pos: { bottom: "42%",right: "30%"  }, anim: "ztDrift2 12s ease-in-out infinite", delay: "-4s"  },
];

const RepelBackground = React.memo(function RepelBackground({ isDark }) {
  const outerRefs = useRef([]);
  const cursor    = useRef({ x: -9999, y: -9999 });
  const offsets   = useRef(REPEL_CLONES.map(() => ({ x: 0, y: 0 })));
  const vels      = useRef(REPEL_CLONES.map(() => ({ vx: 0, vy: 0 })));
  const rafRef    = useRef(null);

  useEffect(() => {
    const onMove = (e) => { cursor.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);

    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      REPEL_CLONES.forEach((c, i) => {
        const el = outerRefs.current[i];
        if (!el) return;

        // Approximate base center from CSS position
        let bx, by;
        if ("left"   in c.pos) bx = parseFloat(c.pos.left)   / 100 * vw + c.size / 2;
        else                   bx = vw - parseFloat(c.pos.right)  / 100 * vw - c.size / 2;
        if ("top"    in c.pos) by = parseFloat(c.pos.top)    / 100 * vh + c.size / 2;
        else                   by = vh - parseFloat(c.pos.bottom) / 100 * vh - c.size / 2;

        const p  = offsets.current[i];
        const v  = vels.current[i];
        const cx = bx + p.x;
        const cy = by + p.y;

        const dx   = cx - cursor.current.x;
        const dy   = cy - cursor.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const maxD = 230;

        let fx = 0, fy = 0;
        if (dist < maxD) {
          const power = Math.pow(1 - dist / maxD, 2.2) * 140;
          fx = (dx / dist) * power;
          fy = (dy / dist) * power;
        }

        // Spring physics — pull back to rest + repel
        const stiff  = 0.055;
        const damp   = 0.80;
        v.vx = v.vx * damp + (fx - p.x * stiff);
        v.vy = v.vy * damp + (fy - p.y * stiff);
        p.x += v.vx;
        p.y += v.vy;

        el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Light mode: blue filter + higher opacity so logo is visible on white bg
  const imgFilter = isDark
    ? "none"
    : "brightness(0) saturate(100%) invert(22%) sepia(78%) saturate(600%) hue-rotate(210deg) brightness(0.85)";
  const opacity   = isDark ? 0.10 : 0.28;
  const glowClr   = isDark ? "rgba(59,130,246,0.45)" : "rgba(39,80,200,0.35)";

  return (
    <>
      {REPEL_CLONES.map((c, i) => (
        <div
          key={i}
          ref={el => { outerRefs.current[i] = el; }}
          aria-hidden="true"
          style={{
            position: "fixed", zIndex: 0, pointerEvents: "none",
            width: c.size, height: c.size,
            ...c.pos,
            willChange: "transform",
          }}
        >
          <div style={{
            width: "100%", height: "100%",
            animation: c.anim,
            animationDelay: c.delay,
            opacity,
            filter: `drop-shadow(0 0 ${Math.round(c.size * 0.22)}px ${glowClr})`,
            transition: "opacity 0.4s, filter 0.4s",
          }}>
            <img
              src={LOGO_SRC} alt=""
              style={{
                width: "100%", height: "100%", objectFit: "contain",
                filter: imgFilter,
                transition: "filter 0.4s",
              }}
              onError={e => { e.target.style.display = "none"; }}
            />
          </div>
        </div>
      ))}
    </>
  );
});

