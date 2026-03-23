function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function setAriaCurrent() {
  const hash = (location.hash || "#home").toLowerCase();
  qsa('a[data-nav="true"]').forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href.startsWith("#") && href === hash) a.setAttribute("aria-current", "page");
    else if (hash === "#home" && href === "#home") a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function initMobileNav() {
  const btn = qs('[data-mobile-toggle="true"]');
  const panel = qs('[data-mobile-panel="true"]');
  if (!btn || !panel) return;

  const setOpen = (open) => {
    btn.setAttribute("aria-expanded", String(open));
    panel.classList.toggle("show", open);
  };

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  qsa("a", panel).forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

function initReveal() {
  const els = qsa(".reveal");
  if (!els.length) return;

  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }

  // Stagger reveals for a premium "flow" feel.
  els.forEach((el, idx) => {
    const custom = el.getAttribute("data-delay");
    const delay = custom != null ? Number(custom) : Math.min(idx * 55, 420);
    if (!Number.isNaN(delay)) el.style.transitionDelay = `${delay}ms`;
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { root: null, threshold: 0.12, rootMargin: "40px 0px -10% 0px" }
  );

  els.forEach((el) => io.observe(el));
}

let toastTimer = null;
function showToast(message) {
  let toast = qs('[data-toast="true"]');
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("data-toast", "true");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3400);
}

function initContactForm() {
  const form = qs('form[data-contact-form="true"]');
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const message = String(fd.get("message") || "").trim();

    if (!name || !email || !message) {
      showToast("Please fill in Name, Email, and Message.");
      return;
    }

    showToast("Thanks — we’ll reach out within 1 business day.");
    form.reset();
  });
}

function animateCount(el, to) {
  const suffix = el.getAttribute("data-suffix") || "%";
  const prefix = el.getAttribute("data-prefix") || "";
  const duration = 20100;
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const v = Math.round(to * eased);
    el.textContent = `${prefix}${v}${suffix}`;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initLandingDemo() {
  const bars = qsa("[data-auto-fill]");
  const statNums = qsa("[data-count]");
  const hero = qs(".saas-hero");
  if (!hero || !bars.length) return;

  bars.forEach((b) => {
    const fill = Number(b.getAttribute("data-auto-fill") || "60");
    b.style.setProperty("--fill", String(fill));
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        statNums.forEach((n) => animateCount(n, Number(n.getAttribute("data-count") || "0")));
        io.disconnect();
      });
    },
    { threshold: 0.35 }
  );
  io.observe(hero);
}

function initScrollSpy() {
  const sections = qsa("[data-section]");
  if (!sections.length) return;
  const sectionById = new Map(sections.map((s) => [s.id, s]));
  qsa('a[data-nav="true"]').forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#")) return;
    a.addEventListener("click", (e) => {
      const target = sectionById.get(href.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", href);
      setAriaCurrent();
    });
  });

  const io = new IntersectionObserver(
    (entries) => {
      const inView = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!inView || !inView.target.id) return;
      const id = `#${inView.target.id}`;
      qsa('a[data-nav="true"]').forEach((a) => {
        if ((a.getAttribute("href") || "") === id) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-35% 0px -45% 0px", threshold: [0.15, 0.35, 0.6] }
  );
  sections.forEach((s) => io.observe(s));
}

document.addEventListener("DOMContentLoaded", () => {
  setAriaCurrent();
  initMobileNav();
  initReveal();
  initContactForm();
  initLandingDemo();
  initScrollSpy();
});



