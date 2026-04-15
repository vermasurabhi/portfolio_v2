import { initHeroEffects } from "../components/hero/effects";
import {
  initShowcaseSlider,
  renderShowcaseSlider,
} from "../components/showcase-slider/showcase-slider";

function initCursorGradientTrail(): void {
  const hero = document.getElementById("hero");
  const trail = document.getElementById("cursor-gradient-trail") as HTMLDivElement | null;
  if (!hero || !trail) return;
  const heroEl = hero;
  const trailEl = trail;

  let targetX = window.innerWidth * 0.5;
  let targetY = window.innerHeight * 0.5;
  let smoothX = targetX;
  let smoothY = targetY;
  let visible = false;
  let raf = 0;

  const lag = 0.035;

  function setVisibility(next: boolean): void {
    if (visible === next) return;
    visible = next;
    trailEl.style.opacity = visible ? "1" : "0";
  }

  function pointerInHero(clientX: number, clientY: number): boolean {
    const rect = heroEl.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }

  function onPointerMove(event: PointerEvent): void {
    targetX = event.clientX;
    targetY = event.clientY;
    setVisibility(!pointerInHero(event.clientX, event.clientY));
  }

  function onPointerLeave(): void {
    setVisibility(false);
  }

  function animate(): void {
    smoothX += (targetX - smoothX) * lag;
    smoothY += (targetY - smoothY) * lag;
    trailEl.style.transform = `translate(${smoothX}px, ${smoothY}px) translate(-50%, -50%)`;
    raf = window.requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave);
  raf = window.requestAnimationFrame(animate);

  window.addEventListener("beforeunload", () => {
    if (raf) window.cancelAnimationFrame(raf);
  });
}

export function renderHomePage(root: HTMLDivElement): void {
  root.innerHTML = `
    <div id="hero">
      <canvas id="canvas-gradient" aria-hidden="true"></canvas>
      <div id="webgl_wrapper" aria-hidden="true"></div>

      <nav aria-label="Primary">
        <div class="nav-inner">
          <span class="nav-work">WORK</span>
          <span class="nav-info">INFO</span>
        </div>
      </nav>

      <div id="content-stack">
        <h1 id="title">
          <span class="title-line" id="line1">SURABHI VERMA</span>
          <span class="title-line" id="line2">WEB DEVELOPER</span>
        </h1>
        <p class="hint">CLICK ANYWHERE TO ADD COLOR.<br />SCROLL TO CONTINUE.</p>
      </div>

      <canvas id="canvas-grain" aria-hidden="true"></canvas>
    </div>
    ${renderShowcaseSlider()}
    <div id="cursor-gradient-trail" aria-hidden="true"></div>
    <div id="cursor-dot" aria-hidden="true"></div>
  `;

  initHeroEffects();
  initShowcaseSlider();
  initCursorGradientTrail();
}
