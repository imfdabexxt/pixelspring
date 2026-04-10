
// ─── SVG icon definitions for trust / community / loyalty / money ─────────
const BG_ICONS = {
  trust: (color) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width:"100%", height:"100%" }}>
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  community: (color) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width:"100%", height:"100%" }}>
      <circle cx="9"  cy="7"  r="3"/>
      <circle cx="15" cy="7"  r="3"/>
      <path d="M3 20c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6"/>
      <path d="M12 14v6"/>
    </svg>
  ),
  loyalty: (color) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width:"100%", height:"100%" }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      <polyline points="12 8 12 13 15 15"/>
    </svg>
  ),
  money: (color) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width:"100%", height:"100%" }}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v12"/>
      <path d="M15 9.5a3 3 0 0 0-6 0c0 1.66 1.34 3 3 3s3 1.34 3 3a3 3 0 0 1-6 0"/>
    </svg>
  ),
};

// ─── All background floating items (logos + icons) ────────────────────────
const REPEL_ITEMS = [
  // Logo clones
  { type:"logo", size:115, pos:{ top:"5%",    left:"3%"    }, anim:"ztDrift1 22s ease-in-out infinite", delay:"0s"   },
  { type:"logo", size: 72, pos:{ top:"10%",   right:"5%"   }, anim:"ztDrift2 16s ease-in-out infinite", delay:"-4s"  },
  { type:"logo", size: 58, pos:{ top:"58%",   left:"1%"    }, anim:"ztFloat  12s ease-in-out infinite", delay:"-7s"  },
  { type:"logo", size:100, pos:{ bottom:"7%", right:"3%"   }, anim:"ztDrift1 28s ease-in-out infinite", delay:"-11s" },
  { type:"logo", size: 46, pos:{ top:"40%",   right:"9%"   }, anim:"ztPulse   9s ease-in-out infinite", delay:"-2s"  },
  { type:"logo", size: 68, pos:{ bottom:"20%",left:"7%"    }, anim:"ztDrift2 18s ease-in-out infinite", delay:"-6s"  },
  { type:"logo", size: 84, pos:{ bottom:"32%",right:"16%"  }, anim:"ztFloat  14s ease-in-out infinite", delay:"-9s"  },
  { type:"logo", size: 42, pos:{ top:"25%",   left:"14%"   }, anim:"ztDrift1 13s ease-in-out infinite", delay:"-3s"  },
  { type:"logo", size: 38, pos:{ top:"72%",   left:"28%"   }, anim:"ztFloat   9s ease-in-out infinite", delay:"-1s"  },
  { type:"logo", size: 62, pos:{ top:"48%",   left:"22%"   }, anim:"ztDrift1 17s ease-in-out infinite", delay:"-10s" },
  { type:"logo", size: 44, pos:{ bottom:"42%",right:"30%"  }, anim:"ztDrift2 12s ease-in-out infinite", delay:"-4s"  },
  // Trust icons
  { type:"trust",     size:52, pos:{ top:"15%",   left:"28%"   }, anim:"ztFloat  11s ease-in-out infinite", delay:"-3s"  },
  { type:"trust",     size:36, pos:{ bottom:"18%",right:"22%"  }, anim:"ztDrift1 19s ease-in-out infinite", delay:"-7s"  },
  { type:"trust",     size:44, pos:{ top:"68%",   right:"12%"  }, anim:"ztDrift2 14s ease-in-out infinite", delay:"-5s"  },
  // Community icons
  { type:"community", size:48, pos:{ top:"32%",   left:"36%"   }, anim:"ztDrift2 15s ease-in-out infinite", delay:"-6s"  },
  { type:"community", size:38, pos:{ bottom:"28%",left:"32%"   }, anim:"ztFloat   10s ease-in-out infinite",delay:"-9s"  },
  { type:"community", size:56, pos:{ top:"8%",    right:"22%"  }, anim:"ztDrift1 21s ease-in-out infinite", delay:"-2s"  },
  // Loyalty icons
  { type:"loyalty",   size:44, pos:{ top:"55%",   right:"24%"  }, anim:"ztPulse  13s ease-in-out infinite", delay:"-4s"  },
  { type:"loyalty",   size:34, pos:{ top:"78%",   left:"16%"   }, anim:"ztFloat   8s ease-in-out infinite", delay:"-8s"  },
  { type:"loyalty",   size:50, pos:{ bottom:"8%", left:"20%"   }, anim:"ztDrift2 16s ease-in-out infinite", delay:"-1s"  },
  // Money icons
  { type:"money",     size:46, pos:{ top:"20%",   right:"36%"  }, anim:"ztFloat  12s ease-in-out infinite", delay:"-5s"  },
  { type:"money",     size:40, pos:{ bottom:"50%",left:"44%"   }, anim:"ztDrift1 18s ease-in-out infinite", delay:"-12s" },
  { type:"money",     size:58, pos:{ top:"88%",   right:"8%"   }, anim:"ztDrift2 23s ease-in-out infinite", delay:"-6s"  },
];

const RepelBackground = React.memo(function RepelBackground({ isDark }) {
  const outerRefs = useRef([]);
  const cursor    = useRef({ x: -9999, y: -9999 });
  const offsets   = useRef(REPEL_ITEMS.map(() => ({ x: 0, y: 0 })));
  const vels      = useRef(REPEL_ITEMS.map(() => ({ vx: 0, vy: 0 })));
  const rafRef    = useRef(null);

  useEffect(() => {
    const onMove = (e) => { cursor.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);

    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      REPEL_ITEMS.forEach((c, i) => {
        const el = outerRefs.current[i];
        if (!el) return;

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
        const maxD = 200;

        let fx = 0, fy = 0;
        if (dist < maxD) {
          // Softer, smoother repel — lower exponent + lower max force
          const power = Math.pow(1 - dist / maxD, 1.6) * 55;
          fx = (dx / dist) * power;
          fy = (dy / dist) * power;
        }

        // Higher damping + lower stiffness = slower, floatier return
        const stiff = 0.028;
        const damp  = 0.92;
        v.vx = v.vx * damp + (fx - p.x * stiff);
        v.vy = v.vy * damp + (fy - p.y * stiff);
        p.x += v.vx;
        p.y += v.vy;

        el.style.transform = `translate(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px)`;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const logoFilter = isDark
    ? "none"
    : "brightness(0) saturate(100%) invert(22%) sepia(78%) saturate(600%) hue-rotate(210deg) brightness(0.85)";
  const logoOp  = isDark ? 0.10 : 0.28;
  const iconOp  = isDark ? 0.12 : 0.30;
  const glowClr = isDark ? "rgba(59,130,246,0.4)" : "rgba(39,80,200,0.3)";
  const iconClr = isDark ? "#60a5fa" : "#3b52c0";

  return (
    <>
      {REPEL_ITEMS.map((c, i) => (
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
            opacity: c.type === "logo" ? logoOp : iconOp,
            filter: `drop-shadow(0 0 ${Math.round(c.size * 0.2)}px ${glowClr})`,
            transition: "opacity 0.4s, filter 0.4s",
          }}>
            {c.type === "logo" ? (
              <img
                src={LOGO_SRC} alt=""
                style={{ width:"100%", height:"100%", objectFit:"contain", filter: logoFilter, transition:"filter 0.4s" }}
                onError={e => { e.target.style.display = "none"; }}
              />
            ) : (
              BG_ICONS[c.type](iconClr)
            )}
          </div>
        </div>
      ))}
    </>
  );
});

