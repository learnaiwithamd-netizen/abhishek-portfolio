/* ============================================================
   scene.js — three.js point-field ocean for the hero
   Cheap by design: one BufferGeometry of points, sine swell
   displaced in the vertex loop, DPR capped, paused offscreen.
   ============================================================ */
import * as THREE from "three";

const canvas = document.getElementById("ocean");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 640px)").matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b0f0e, 18, 64);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(0, 5.2, 16);
camera.lookAt(0, 0, -6);

/* ---- point grid ---- */
const COLS = isMobile ? 90 : 160;
const ROWS = isMobile ? 50 : 80;
const W = 90;
const D = 60;

const count = COLS * ROWS;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

const bone = new THREE.Color(0xe9e4d6);
const signal = new THREE.Color(0xff4d12);

let i = 0;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    positions[i * 3] = (c / (COLS - 1) - 0.5) * W;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = -(r / (ROWS - 1)) * D + 6;

    // mostly bone points, a scattering of signal-orange buoys
    const col = Math.random() < 0.012 ? signal : bone;
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
    i++;
  }
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

// soft round sprite so points read as dots, not squares
const spriteCanvas = document.createElement("canvas");
spriteCanvas.width = spriteCanvas.height = 64;
const ctx = spriteCanvas.getContext("2d");
const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
grad.addColorStop(0, "rgba(255,255,255,1)");
grad.addColorStop(0.5, "rgba(255,255,255,0.6)");
grad.addColorStop(1, "rgba(255,255,255,0)");
ctx.fillStyle = grad;
ctx.fillRect(0, 0, 64, 64);
const sprite = new THREE.CanvasTexture(spriteCanvas);

const material = new THREE.PointsMaterial({
  size: isMobile ? 0.11 : 0.14,
  map: sprite,
  vertexColors: true,
  transparent: true,
  opacity: isMobile ? 0.42 : 0.55,
  sizeAttenuation: true,
  depthWrite: false
});

const points = new THREE.Points(geometry, material);
scene.add(points);

/* ---- swell ---- */
const pos = geometry.attributes.position;
function swell(t) {
  for (let j = 0; j < count; j++) {
    const x = pos.array[j * 3];
    const z = pos.array[j * 3 + 2];
    pos.array[j * 3 + 1] =
      Math.sin(x * 0.16 + t * 0.7) * 0.7 +
      Math.cos(z * 0.22 + t * 0.45) * 0.9 +
      Math.sin((x + z) * 0.07 + t * 0.3) * 0.6;
  }
  pos.needsUpdate = true;
}

/* ---- mouse drift ---- */
let targetX = 0, targetY = 0, curX = 0, curY = 0;
if (window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("mousemove", (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
}

/* ---- resize ---- */
function resize() {
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener("resize", resize, { passive: true });

/* ---- render loop, paused when hero offscreen or tab hidden ---- */
let visible = true;
new IntersectionObserver(
  (entries) => { visible = entries[0].isIntersecting; },
  { threshold: 0 }
).observe(canvas);

const clock = new THREE.Clock();
let elapsed = 0;

function frame() {
  requestAnimationFrame(frame);
  if (!visible || document.hidden) return;

  const dt = clock.getDelta();
  if (!reduceMotion) elapsed += dt;

  swell(elapsed);
  curX += (targetX - curX) * 0.04;
  curY += (targetY - curY) * 0.04;
  camera.position.x = curX * 1.6;
  camera.position.y = 5.2 + curY * -0.6;
  camera.lookAt(0, 0, -6);

  renderer.render(scene, camera);
}

if (reduceMotion) {
  swell(2.5); // a single static frame of swell
  renderer.render(scene, camera);
} else {
  frame();
}
