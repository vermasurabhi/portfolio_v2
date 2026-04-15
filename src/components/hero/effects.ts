import * as THREE from "three";

type BlobMesh = THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> & {
  userData: {
    baseX: number;
    baseY: number;
    baseZ: number;
    speed: number;
    offset: number;
    rotMul: number;
  };
};

function initNoiseGradient(hero: HTMLElement): void {
  const canvasGrad = document.getElementById("canvas-gradient") as HTMLCanvasElement | null;
  const canvasGrain = document.getElementById("canvas-grain") as HTMLCanvasElement | null;
  if (!canvasGrad || !canvasGrain) return;

  const ctxGrad = canvasGrad.getContext("2d");
  const ctxGrain = canvasGrain.getContext("2d");
  if (!ctxGrad || !ctxGrain) return;
  const gradCanvas = canvasGrad;
  const grainCanvas = canvasGrain;
  const gradCtx = ctxGrad;
  const grainCtx = ctxGrain;

  const colors = ["#f8f4ec", "#f3eee4", "#ece6dc", "#e4ddd2"];
  const CHAOS = 30;
  const GRAIN = 100;
  let seed = randSeed();

  function hexToRgb(h: string): number[] {
    const hex = h.replace("#", "");
    const normalized = hex.length === 3 ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] : hex;
    return [
      parseInt(normalized.slice(0, 2), 16),
      parseInt(normalized.slice(2, 4), 16),
      parseInt(normalized.slice(4, 6), 16),
    ];
  }

  function randSeed() {
    return {
      ax: Math.random() * 2 - 1,
      bx: Math.random() * 2 - 1,
      cx: Math.random() * 2 - 1,
      ay: Math.random() * 2 - 1,
      by: Math.random() * 2 - 1,
      cy: Math.random() * 2 - 1,
      ox: Math.random() * Math.PI * 2,
      oy: Math.random() * Math.PI * 2,
    };
  }

  function sampleField(wx: number, wy: number, rgbs: number[][], n: number, c: number) {
    const weights = rgbs.map((_, i) => {
      const t = i / Math.max(n - 1, 1);
      const sx = Math.sin(seed.ax * wx * Math.PI * (1 + c * 4) + seed.ox + t * 2.5) * 0.5 + 0.5;
      const sy = Math.sin(seed.ay * wy * Math.PI * (1 + c * 4) + seed.oy + t * 1.7) * 0.5 + 0.5;
      const dist = Math.abs(wx + wy * 0.5 - t);
      return Math.exp(-dist * dist * 8) * (0.3 + 0.7 * (sx * sy + 0.1 * c));
    });

    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = 0; i < n; i++) {
      const w = weights[i] / sum;
      r += rgbs[i][0] * w;
      g += rgbs[i][1] * w;
      b += rgbs[i][2] * w;
    }
    return { r, g, b };
  }

  function draw(includeGrain: boolean): void {
    const width = gradCanvas.width;
    const height = gradCanvas.height;
    if (!width || !height) return;

    const imgGrad = gradCtx.createImageData(width, height);
    const gradData = imgGrad.data;
    const imgGrain = includeGrain ? grainCtx.createImageData(width, height) : null;
    const grainData = imgGrain?.data ?? null;

    const rgbs = colors.map(hexToRgb);
    const n = rgbs.length;
    const c = CHAOS / 100;
    const g = GRAIN / 100;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const ny = y / height;
        const sampled = sampleField(nx, ny, rgbs, n, c);
        const idx = (y * width + x) * 4;

        gradData[idx] = Math.min(255, Math.max(0, sampled.r));
        gradData[idx + 1] = Math.min(255, Math.max(0, sampled.g));
        gradData[idx + 2] = Math.min(255, Math.max(0, sampled.b));
        gradData[idx + 3] = 255;

        if (includeGrain && grainData) {
          const noise = (Math.random() - 0.8) * g * 80;
          const value = Math.min(255, Math.max(0, 128 + noise));
          grainData[idx] = value;
          grainData[idx + 1] = value;
          grainData[idx + 2] = value;
          grainData[idx + 3] = Math.min(255, 16 + g * 55);
        }
      }
    }

    gradCtx.putImageData(imgGrad, 0, 0);
    if (imgGrain) grainCtx.putImageData(imgGrain, 0, 0);
  }

  function resize(): void {
    gradCanvas.width = hero.offsetWidth || 800;
    gradCanvas.height = hero.offsetHeight || 600;
    grainCanvas.width = gradCanvas.width;
    grainCanvas.height = gradCanvas.height;
    draw(true);
  }

  function regenerate(): void {
    seed = randSeed();
    draw(true);
  }

  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space") return;
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "SELECT") return;
    event.preventDefault();
    regenerate();
  });

  window.addEventListener("resize", resize);
  setTimeout(resize, 50);
}

function initWebGLBlobs(hero: HTMLElement): void {
  const wrap = document.getElementById("webgl_wrapper");
  const cursorDot = document.getElementById("cursor-dot") as HTMLDivElement | null;
  if (!wrap) return;

  const MAX_EXTRA = 8;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);

  const geometry = new THREE.SphereGeometry(1, 64, 64);

  const gradientBlobShaders = {
    vertex: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragment: `
      precision mediump float;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform float opacity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 n = normalize(vNormal);
        vec3 viewDir = normalize(-vViewPosition);
        float ndotv = max(dot(n, viewDir), 0.0);
        float ty = n.y * 0.5 + 0.5;
        float tx = n.x * 0.5 + 0.5;
        float tz = n.z * 0.5 + 0.5;
        float t = ty * 0.55 + tx * 0.28 + tz * 0.17;
        t = smoothstep(0.1, 0.9, t);
        vec3 col = mix(colorA, colorB, t);
        float core = pow(ndotv, 1.55);
        float feather = smoothstep(0.02, 0.78, ndotv);
        float a = opacity * core * feather;
        gl_FragColor = vec4(col, a);
      }
    `,
  };

  function createGradientBlobMaterial(): THREE.ShaderMaterial {
    const h = Math.random();
    const h2 = (h + 0.07 + Math.random() * 0.18) % 1;
    return new THREE.ShaderMaterial({
      uniforms: {
        colorA: { value: new THREE.Color().setHSL(h, 0.74, 0.6) },
        colorB: { value: new THREE.Color().setHSL(h2, 0.68, 0.42) },
        opacity: { value: 0.64 + Math.random() * 0.22 },
      },
      vertexShader: gradientBlobShaders.vertex,
      fragmentShader: gradientBlobShaders.fragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
  }

  const blobs: BlobMesh[] = [];
  const basePositions = [
    [-1.1, 0.4, 0.2],
    [1.0, -0.3, -0.4],
    [-0.4, -0.9, 0.3],
    [0.5, 0.6, -0.2],
  ];

  for (let i = 0; i < 4; i++) {
    const mesh = new THREE.Mesh(geometry, createGradientBlobMaterial()) as BlobMesh;
    mesh.position.set(basePositions[i][0], basePositions[i][1], basePositions[i][2]);
    mesh.userData.baseX = mesh.position.x;
    mesh.userData.baseY = mesh.position.y;
    mesh.userData.baseZ = mesh.position.z;
    mesh.scale.setScalar(1.85 + Math.random() * 0.7);
    mesh.userData.speed = Math.random() * 0.9 + 0.65;
    mesh.userData.offset = Math.random() * 10;
    mesh.userData.rotMul = 0.85 + Math.random() * 0.35;
    scene.add(mesh);
    blobs.push(mesh);
  }

  const clock = new THREE.Clock();
  clock.getDelta();

  let targetMX = 0;
  let targetMY = 0;
  let smoothMX = 0;
  let smoothMY = 0;

  function updatePointerFromEvent(clientX: number, clientY: number): void {
    const rect = hero.getBoundingClientRect();
    const inside =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;
    if (!inside) {
      targetMX = 0;
      targetMY = 0;
      return;
    }
    targetMX = ((clientX - rect.left) / rect.width - 0.5) * 2;
    targetMY = ((clientY - rect.top) / rect.height - 0.5) * 2;
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      updatePointerFromEvent(event.clientX, event.clientY);
      if (!cursorDot) return;
      cursorDot.style.opacity = "1";
      cursorDot.style.left = `${event.clientX}px`;
      cursorDot.style.top = `${event.clientY}px`;
      cursorDot.style.transform = "translate(-50%, -50%)";
    },
    { passive: true }
  );

  hero.addEventListener("pointerleave", () => {
    if (!cursorDot) return;
    cursorDot.style.opacity = "0";
  });

  hero.addEventListener("pointerdown", () => {
    if (!cursorDot) return;
    cursorDot.style.transform = "translate(-50%, -50%) scale(0.75)";
  });

  hero.addEventListener("pointerup", () => {
    if (!cursorDot) return;
    cursorDot.style.transform = "translate(-50%, -50%)";
  });

  function onResize(): void {
    const width = hero.offsetWidth || 1;
    const height = hero.offsetHeight || 1;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function addBlobFromClick(): void {
    if (blobs.length >= 4 + MAX_EXTRA) {
      const old = blobs.shift();
      if (old) {
        scene.remove(old);
        old.material.dispose();
      }
    }
    const mesh = new THREE.Mesh(geometry, createGradientBlobMaterial()) as BlobMesh;
    mesh.position.set((Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.2);
    mesh.userData.baseX = mesh.position.x;
    mesh.userData.baseY = mesh.position.y;
    mesh.userData.baseZ = mesh.position.z;
    mesh.scale.setScalar(1.5 + Math.random() * 0.95);
    mesh.userData.speed = Math.random() * 0.95 + 0.7;
    mesh.userData.offset = Math.random() * 10;
    mesh.userData.rotMul = 0.8 + Math.random() * 0.5;
    scene.add(mesh);
    blobs.push(mesh);
  }

  const lerp = THREE.MathUtils.lerp;
  const CAM_PARALLAX = 3.2;
  const SMOOTH_MOUSE = 0.14;
  const CAM_FOLLOW = 0.12;
  const MAX_DT = 0.05;

  function animate(): void {
    requestAnimationFrame(animate);
    let delta = clock.getDelta();
    if (delta > MAX_DT) delta = MAX_DT;
    const time = performance.now() * 0.001;

    smoothMX = lerp(smoothMX, targetMX, SMOOTH_MOUSE);
    smoothMY = lerp(smoothMY, targetMY, SMOOTH_MOUSE);

    const wantX = smoothMX * CAM_PARALLAX;
    const wantY = -smoothMY * CAM_PARALLAX;
    camera.position.x = lerp(camera.position.x, wantX, CAM_FOLLOW);
    camera.position.y = lerp(camera.position.y, wantY, CAM_FOLLOW);
    camera.position.z = 5;
    camera.lookAt(0, 0, 0);

    blobs.forEach((blob) => {
      const sp = blob.userData.speed;
      const off = blob.userData.offset;
      const rm = blob.userData.rotMul || 1;
      const bx = blob.userData.baseX;
      const by = blob.userData.baseY;
      const bz = blob.userData.baseZ;
      blob.rotation.y += delta * 1.0 * sp * rm;
      blob.rotation.x += delta * 0.65 * sp * rm;
      blob.position.x = bx + Math.cos(time * sp * 1.2 + off * 0.7) * 0.82;
      blob.position.y = by + Math.sin(time * sp * 1.45 + off) * 0.92;
      blob.position.z = bz + Math.sin(time * sp * 1.0 + off * 0.3) * 0.3;
    });

    renderer.render(scene, camera);
  }

  window.addEventListener("resize", onResize);
  hero.addEventListener("click", addBlobFromClick);
  onResize();
  animate();
}

export function initHeroEffects(): void {
  const hero = document.getElementById("hero");
  if (!hero) return;
  initNoiseGradient(hero);
  initWebGLBlobs(hero);
}
