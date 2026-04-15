import { gsap } from "gsap";
import {
  SHOWCASE_SLIDES,
  type ShowcaseSlide,
} from "../../data/showcase-slides";

const DURATION = 1.15;
/** Luxury glide — close to cubic-bezier(0.22, 1, 0.36, 1) */
const EASE = "power3.out";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mediaMarkup(slideId: string, media: ShowcaseSlide["media"]): string {
  const src = media.kind === "image" ? media.src : media.posterSrc;
  const alt = media.kind === "image" ? media.alt : slideId;
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" draggable="false" />`;
}

function slideHtml(s: ShowcaseSlide): string {
  const media = mediaMarkup(s.id, s.media);
  return `
    <div class="showcase-slide" data-slide-id="${escapeHtml(s.id)}">
      <div class="showcase-media-wrap">
        <div class="showcase-media-inner">
          ${media}
        </div>
      </div>
    </div>`;
}

function dotsHtml(): string {
  return SHOWCASE_SLIDES.map((_, i) => {
    const active = i === 0 ? ' class="showcase-dot is-active"' : ' class="showcase-dot"';
    return `<button type="button"${active} data-slide-index="${i}" aria-label="Project ${i + 1}" aria-current="${i === 0 ? "true" : "false"}"></button>`;
  }).join("");
}

function categoriesHtml(cats: string[]): string {
  return cats.map((c) => `<li>${escapeHtml(c)}</li>`).join("");
}

export function renderShowcaseSlider(): string {
  const slidesHtml = SHOWCASE_SLIDES.map(slideHtml).join("");
  const first = SHOWCASE_SLIDES[0];

  return `
    <section id="showcase-slider" class="showcase" aria-label="Featured projects">
      <div class="showcase-fixed" id="showcase-fixed-ui" aria-hidden="true">
        <div class="showcase-fixed-left">
          <div class="showcase-fixed-rail" aria-hidden="false">
            <div class="showcase-dots" id="showcase-dots" role="tablist" aria-label="Slides">
              ${dotsHtml()}
            </div>
          </div>
          <div class="showcase-fixed-copy">
            <span class="showcase-fixed-label" id="showcase-ui-label">${escapeHtml(first.label)}</span>
            <h2 class="showcase-fixed-title" id="showcase-ui-title">${escapeHtml(first.titleLine)}</h2>
            <ul class="showcase-fixed-cats" id="showcase-ui-cats">${categoriesHtml(first.categories)}</ul>
          </div>
        </div>
        <button type="button" class="showcase-pause" id="showcase-pause" aria-label="Pause slideshow">
          <span class="showcase-pause-bar" aria-hidden="true"></span>
          <span class="showcase-pause-bar" aria-hidden="true"></span>
        </button>
        <a href="${escapeHtml(first.visitUrl)}" id="showcase-visit-link" class="showcase-discover" target="_blank" rel="noopener noreferrer">Visit ↗</a>
      </div>
      <div class="showcase-shell">
        <div class="showcase-frame" id="showcase-frame" tabindex="0">
          <div class="showcase-track" id="showcase-track">${slidesHtml}</div>
        </div>
      </div>
    </section>`;
}

export function initShowcaseSlider(): void {
  const root = document.getElementById("showcase-slider");
  const frame = document.getElementById("showcase-frame");
  const track = document.getElementById("showcase-track");
  const fixedUi = document.getElementById("showcase-fixed-ui");
  const labelEl = document.getElementById("showcase-ui-label");
  const titleEl = document.getElementById("showcase-ui-title");
  const catsEl = document.getElementById("showcase-ui-cats");
  const pauseBtn = document.getElementById("showcase-pause");
  const dotsEl = document.getElementById("showcase-dots");
  const visitLinkEl = document.getElementById("showcase-visit-link");

  if (
    !root ||
    !frame ||
    !track ||
    !fixedUi ||
    !labelEl ||
    !titleEl ||
    !catsEl ||
    !pauseBtn ||
    !dotsEl ||
    !visitLinkEl
  ) {
    return;
  }

  const rootEl = root;
  const heroEl = document.getElementById("hero");
  const frameEl = frame;
  const trackEl = track;
  const fixedUiEl = fixedUi;
  const labelUi = labelEl;
  const titleUi = titleEl;
  const catsUi = catsEl;
  const pauseEl = pauseBtn;
  const visitLink = visitLinkEl as HTMLAnchorElement;
  const dotButtons = dotsEl.querySelectorAll<HTMLButtonElement>(".showcase-dot");

  const n = SHOWCASE_SLIDES.length;
  if (n === 0) return;

  const slideEls = trackEl.querySelectorAll<HTMLElement>(".showcase-slide");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let index = 0;
  /** One slide = frame height; track moves on Y */
  let slideStep = 0;
  let isDragging = false;
  let dragStartY = 0;
  let dragStartIndexY = 0;

  /** Vertical-only parallax — horizontal motion reads as “horizontal scroll” on the image */
  const parallaxStrength = 0.04;

  function applySlideSizes(): void {
    slideStep = frameEl.offsetHeight;
    slideEls.forEach((el) => {
      el.style.height = `${slideStep}px`;
      el.style.width = "100%";
    });
  }

  /** Clear legacy horizontal transform from GSAP */
  function setTrackY(yPx: number): void {
    gsap.set(trackEl, { x: 0, y: yPx });
  }

  function logicalIndex(): number {
    return index;
  }

  function updateFixedUi(): void {
    const s = SHOWCASE_SLIDES[logicalIndex()];
    labelUi.textContent = s.label;
    titleUi.textContent = s.titleLine;
    catsUi.innerHTML = s.categories
      .map((c) => `<li>${escapeHtml(c)}</li>`)
      .join("");
    visitLink.href = s.visitUrl;
  }

  function updateDots(): void {
    const li = logicalIndex();
    dotButtons.forEach((dot, i) => {
      const on = i === li;
      dot.classList.toggle("is-active", on);
      dot.setAttribute("aria-current", on ? "true" : "false");
    });
  }

  function goToLogicalIndex(L: number): void {
    if (L < 0 || L >= n || L === logicalIndex()) return;
    applySlideSizes();
    if (reduceMotion) {
      index = L;
      setTrackY(-index * slideStep);
      finishTransition();
      return;
    }
    gsap.to(trackEl, {
      x: 0,
      y: -L * slideStep,
      duration: DURATION,
      ease: EASE,
      onComplete: () => {
        index = L;
        finishTransition();
      },
    });
  }

  function syncVideos(): void {
    slideEls.forEach((el, i) => {
      const v = el.querySelector("video");
      if (!v) return;
      if (i === index) {
        void v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }

  function animateSlideEntrance(): void {
    const active = slideEls[index];
    const inner = active?.querySelector<HTMLElement>(".showcase-media-inner");
    if (!inner) return;
    gsap.set(inner, { scale: 1, x: 0, y: 0 });
  }

  function finishTransition(): void {
    updateFixedUi();
    updateDots();
    syncVideos();
    animateSlideEntrance();
  }

  function goNext(): void {
    applySlideSizes();
    if (index >= n - 1) {
      finishTransition();
      return;
    }
    const target = index + 1;
    if (reduceMotion) {
      let next = target;
      if (next === n) {
        next = 0;
        setTrackY(0);
      } else {
        setTrackY(-next * slideStep);
      }
      index = next;
      finishTransition();
      return;
    }
    gsap.to(trackEl, {
      x: 0,
      y: -target * slideStep,
      duration: DURATION,
      ease: EASE,
      onComplete: () => {
        index = target;
        finishTransition();
      },
    });
  }

  function goPrev(): void {
    applySlideSizes();
    if (index === 0) {
      finishTransition();
      return;
    }
    const target = index - 1;
    if (reduceMotion) {
      index = target;
      setTrackY(-index * slideStep);
      finishTransition();
      return;
    }
    gsap.to(trackEl, {
      x: 0,
      y: -target * slideStep,
      duration: DURATION,
      ease: EASE,
      onComplete: () => {
        index = target;
        finishTransition();
      },
    });
  }

  /** Vertical wheel only — scroll down = next slide; horizontal wheel passes through (no slide hijack) */
  function onWheel(e: WheelEvent): void {
    const r = rootEl.getBoundingClientRect();
    const inside =
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom;
    if (!inside) return;
    const sectionPinnedToTop = r.top <= 1;
    if (!sectionPinnedToTop) return;
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
      return;
    }
    const atFirst = index === 0;
    const atLast = index === n - 1;
    const scrollingUp = e.deltaY < 0;
    const scrollingDown = e.deltaY > 0;
    if ((atFirst && scrollingUp) || (atLast && scrollingDown)) {
      return;
    }
    e.preventDefault();
    if (e.deltaY > 0) goNext();
    else if (e.deltaY < 0) goPrev();
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    isDragging = true;
    frameEl.classList.add("is-dragging");
    dragStartY = e.clientY;
    dragStartIndexY = Number(gsap.getProperty(trackEl, "y"));
    try {
      frameEl.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onPointerMove(e: PointerEvent): void {
    if (!isDragging) return;
    const dy = e.clientY - dragStartY;
    gsap.set(trackEl, { x: 0, y: dragStartIndexY + dy });
  }

  function snapTrackToNearest(): void {
    applySlideSizes();
    const y = Number(gsap.getProperty(trackEl, "y"));
    let nearest = Math.round(-y / slideStep);
    const max = n - 1;
    nearest = Math.max(0, Math.min(max, nearest));
    gsap.to(trackEl, {
      x: 0,
      y: -nearest * slideStep,
      duration: 0.5,
      ease: EASE,
      onComplete: () => {
        index = nearest;
        finishTransition();
      },
    });
  }

  function onPointerUp(e: PointerEvent): void {
    if (!isDragging) return;
    isDragging = false;
    frameEl.classList.remove("is-dragging");
    applySlideSizes();
    const dy = e.clientY - dragStartY;
    const threshold = slideStep * 0.12;
    if (dy < -threshold) {
      goNext();
    } else if (dy > threshold) {
      goPrev();
    } else {
      snapTrackToNearest();
    }
  }

  function onFrameMove(e: MouseEvent): void {
    if (reduceMotion) return;
    const active = slideEls[index];
    if (!active) return;
    const inner = active.querySelector<HTMLElement>(".showcase-media-inner");
    if (!inner) return;
    const b = frameEl.getBoundingClientRect();
    const py = (e.clientY - b.top) / b.height - 0.5;
    gsap.to(inner, {
      x: 0,
      y: py * b.height * parallaxStrength,
      duration: 0.45,
      ease: "power2.out",
      overwrite: "auto",
    });
  }

  function onFrameLeave(): void {
    const active = slideEls[index];
    const inner = active?.querySelector<HTMLElement>(".showcase-media-inner");
    if (inner) gsap.to(inner, { x: 0, y: 0, duration: 0.6, ease: EASE });
  }

  dotsEl.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const btn = t.closest("button[data-slide-index]");
    if (!btn) return;
    const idx = Number(btn.getAttribute("data-slide-index"));
    if (Number.isFinite(idx)) goToLogicalIndex(idx);
  });

  pauseEl.addEventListener("click", () => {
    pauseEl.classList.toggle("is-paused");
  });

  function shouldShowFixedUi(): boolean {
    const rect = rootEl.getBoundingClientRect();
    const sectionPinnedToTop = rect.top <= 1;
    const hasVisibleHeight = rect.bottom > 120;
    const heroPassed = heroEl
      ? heroEl.getBoundingClientRect().bottom <= 0
      : true;
    return sectionPinnedToTop && hasVisibleHeight && heroPassed;
  }

  function updateFixedUiVisibility(): void {
    const show = shouldShowFixedUi();
    fixedUiEl.classList.toggle("is-visible", show);
    fixedUiEl.setAttribute("aria-hidden", show ? "false" : "true");
  }

  window.addEventListener("scroll", updateFixedUiVisibility, { passive: true });
  window.addEventListener("resize", updateFixedUiVisibility);

  applySlideSizes();
  setTrackY(0);
  updateFixedUi();
  updateDots();
  syncVideos();
  animateSlideEntrance();

  window.addEventListener("resize", () => {
    applySlideSizes();
    setTrackY(-index * slideStep);
  });

  requestAnimationFrame(() => {
    applySlideSizes();
    setTrackY(-index * slideStep);
    updateFixedUiVisibility();
  });

  rootEl.addEventListener("wheel", onWheel, { passive: false });
  frameEl.addEventListener("pointerdown", onPointerDown);
  frameEl.addEventListener("pointermove", onPointerMove);
  frameEl.addEventListener("pointerup", onPointerUp);
  frameEl.addEventListener("pointercancel", onPointerUp);
  frameEl.addEventListener("mousemove", onFrameMove);
  frameEl.addEventListener("mouseleave", onFrameLeave);
  void reduceMotion;
}
