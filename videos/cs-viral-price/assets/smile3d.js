// Shared 3D kit for the Celeb Smile viral clips: procedural teeth, gums and a glass aligner.
// Everything is a pure function of time: the films call render(t) from the hf-seek event.
import * as THREE from "three";

export { THREE };
export const W = 1080;
export const H = 1920;

// ---------- time helpers ----------
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const mix = (a, b, k) => a + (b - a) * k;
export const ease = {
  lin: (x) => x,
  io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  ioSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  out: (x) => 1 - Math.pow(1 - x, 3),
  out5: (x) => 1 - Math.pow(1 - x, 5),
  expoOut: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  in: (x) => x * x * x,
  back: (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2),
};
// 0 before a, 1 after b, eased in between
export const ramp = (t, a, b, e = ease.io) => e(clamp01((t - a) / (b - a)));
// piecewise keyframes: [[time, value], ...], eased per segment
export const track = (t, keys, e = ease.io) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) return mix(keys[i - 1][1], keys[i][1], e((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  }
  return keys[keys.length - 1][1];
};
// critically-ish damped settle used for "snap" moments: 0 → 1 with one small overshoot
export const spring = (t, a, dur = 0.5, damp = 5.5, freq = 13) => {
  const x = (t - a) / dur;
  if (x <= 0) return 0;
  return 1 - Math.exp(-damp * x) * Math.cos(freq * x * 0.6);
};
// deterministic pseudo-random (mulberry32)
export const prng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
};

// ---------- renderer / environment ----------
export function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  r.setPixelRatio(1);
  r.setSize(W, H, false);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.92;
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}

// Dark studio with a few soft strips: gives the glass tray crisp edge highlights that sweep as it turns.
export function makeEnvironment(renderer) {
  const room = new THREE.Scene();
  room.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(40, 40, 40),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.035, 0.06, 0.065), side: THREE.BackSide }),
    ),
  );
  const strip = (w, h, pos, k, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * k, tint[1] * k, tint[2] * k), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    room.add(m);
  };
  strip(3, 22, [-14, 3, 7], 9, [1, 0.96, 0.9]); // warm key strip
  strip(2, 22, [14, 2, 4], 7, [0.75, 1, 0.97]); // cool teal rim
  strip(18, 4, [0, 15, 2], 3.2);
  strip(22, 1.4, [0, 4, -16], 5, [0.6, 1, 0.95]);
  strip(2.2, 18, [-5, 2, 17], 9);
  strip(1.4, 18, [6, 1, 17], 5.5, [0.8, 1, 0.98]);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(room, 0.02).texture;
  pm.dispose();
  return tex;
}

export function makeBackground(top = "#07343a", mid = "#04262b", bottom = "#020f12", glowY = 0.48) {
  const c = document.createElement("canvas");
  c.width = 270;
  c.height = 480;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 480);
  g.addColorStop(0, bottom);
  g.addColorStop(0.5, mid);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 270, 480);
  const r = ctx.createRadialGradient(135, 480 * glowY, 0, 135, 480 * glowY, 300);
  r.addColorStop(0, top);
  r.addColorStop(0.45, "rgba(6,48,54,0.35)");
  r.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, 270, 480);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// soft additive discs drifting far behind the subject: parallax that makes camera moves read as depth
export function makeBokeh(count = 26, seed = 7) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,0.75)");
  g.addColorStop(0.55, "rgba(255,255,255,0.55)");
  g.addColorStop(0.7, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const rnd = prng(seed);
  const cols = ["#8ff5e6", "#3fc8be", "#bafff5", "#2a8f98", "#e9fffb"];
  const group = new THREE.Group();
  const items = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      color: cols[Math.floor(rnd() * cols.length)],
      transparent: true,
      opacity: 0.05 + rnd() * 0.11,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    const it = { m, x: (rnd() - 0.5) * 26, y: (rnd() - 0.5) * 40, z: -12 - rnd() * 10, r: 1 + rnd() * 2.6, sp: 0.2 + rnd() * 0.5, ph: rnd() * 6.28 };
    m.scale.setScalar(it.r * 2);
    group.add(m);
    items.push(it);
  }
  const update = (t) => {
    for (const it of items) {
      it.m.position.set(it.x + Math.sin(t * 0.3 * it.sp + it.ph) * 0.6, it.y + Math.cos(t * 0.25 * it.sp + it.ph) * 0.5, it.z);
    }
  };
  update(0);
  return { group, update };
}

// ---------- geometry ----------
// weld duplicate vertices so normals are smooth across the sphere seam after deformation
function weld(g, tol = 1e-4) {
  const p = g.attributes.position;
  const map = new Map();
  const pos = [];
  const remap = new Int32Array(p.count);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const key = Math.round(x / tol) + "_" + Math.round(y / tol) + "_" + Math.round(z / tol);
    let j = map.get(key);
    if (j === undefined) {
      j = pos.length / 3;
      map.set(key, j);
      pos.push(x, y, z);
    }
    remap[i] = j;
  }
  const src = g.index.array;
  const idx = [];
  for (let i = 0; i < src.length; i += 3) {
    const a = remap[src[i]], b = remap[src[i + 1]], c = remap[src[i + 2]];
    if (a !== b && b !== c && a !== c) idx.push(a, b, c);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setIndex(idx);
  return out;
}

// A tooth crown: a squared-off ellipsoid, thinner at the biting edge, tapered toward the root.
// tip > 0 narrows the biting edge to a point (canines).
export function toothGeometry(w, h, d, pow = 0.62, tip = 0) {
  const g = weld(new THREE.SphereGeometry(1, 44, 32));
  const p = g.attributes.position;
  const f = (v, e = pow) => Math.sign(v) * Math.pow(Math.abs(v), e);
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const taper = 1 - 0.2 * Math.max(0, y) + 0.04 * Math.max(0, -y); // narrower neck, slightly flared edge
    const point = 1 - tip * Math.pow(Math.max(0, -y), 2.2);
    const thin = 1 - 0.42 * Math.pow(Math.max(0, -y), 1.6); // blade-like biting edge
    x = f(x, pow * 0.82) * (w / 2) * taper * point;
    z = f(z, 0.8) * (d / 2) * thin;
    y = f(y, pow * 0.9) * (h / 2);
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

// open a shell at the gum side so it reads as a thin hollow tray rather than a glass blob
function openShell(g, yCut) {
  const pos = g.attributes.position;
  const idx = g.index;
  const keep = [];
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
    if ((pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3 < yCut) keep.push(a, b, c);
  }
  g.setIndex(keep);
  g.computeVertexNormals();
  return g;
}

// ---------- arch layout ----------
export const R = 3.4; // arch radius
// per tooth, centre outwards: width, height, depth, canine tip
const HALF = [
  { w: 0.9, h: 1.05, d: 0.5, tip: 0 },
  { w: 0.7, h: 0.88, d: 0.48, tip: 0 },
  { w: 0.76, h: 1.0, d: 0.62, tip: 0.42 },
  { w: 0.68, h: 0.8, d: 0.64, tip: 0.12 },
  { w: 0.66, h: 0.78, d: 0.64, tip: 0.1 },
];
// starting misalignment per tooth [dx, dy, dz, rotY, rotZ]; index 0..4 = right side centre→back, 5..9 = left side
export const CROWDING = {
  mild: [
    [0.05, -0.02, 0.16, 0.2, 0.06], [-0.07, 0.04, -0.14, -0.42, -0.12], [0.09, -0.05, 0.24, 0.32, 0.05], [-0.04, 0.03, -0.1, -0.22, 0.04], [0.03, 0, 0.05, 0.1, -0.03],
    [-0.04, 0.02, 0.1, -0.14, -0.05], [0.08, -0.03, -0.18, 0.5, 0.14], [-0.08, 0.04, 0.2, -0.28, -0.06], [0.04, -0.02, -0.08, 0.2, -0.03], [-0.03, 0, 0.04, -0.1, 0.03],
  ],
  strong: [
    [0.1, -0.03, 0.2, 0.26, 0.09], [-0.2, 0.09, -0.3, -0.85, -0.24], [0.1, -0.08, 0.3, 0.36, 0.08], [-0.05, 0.03, -0.12, -0.26, 0.05], [0.03, 0, 0.06, 0.12, -0.03],
    [-0.08, 0.03, 0.14, -0.2, -0.07], [0.1, -0.04, -0.2, 0.52, 0.15], [-0.09, 0.05, 0.24, -0.3, -0.07], [0.05, -0.02, -0.09, 0.22, -0.04], [-0.03, 0, 0.05, -0.1, 0.03],
  ],
};

export function buildArch({ crowding = CROWDING.mild, materials, lower = false }) {
  const group = new THREE.Group();
  const defs = [];
  for (const side of [1, -1]) {
    let s = 0;
    HALF.forEach((t, i) => {
      const k = lower ? (i < 2 ? 0.8 : 0.95) : 1; // lower incisors are narrower
      defs.push({ ...t, w: t.w * k, side, s: side * (s + (t.w * k) / 2) });
      s += t.w * k;
    });
  }
  const pose = (i, p) => {
    const t = defs[i];
    const a = t.s / R;
    const k = 1 - p;
    const [dx, dy, dz, ry, rz] = crowding[i];
    return {
      x: R * Math.sin(a) + dx * k,
      y: 0.5 - t.h / 2 + dy * k,
      z: -R * (1 - Math.cos(a)) + dz * k,
      ry: a + ry * k,
      rz: rz * k,
    };
  };
  const teeth = [];
  const shells = [];
  const shellGroup = new THREE.Group();
  defs.forEach((t) => {
    const tooth = new THREE.Mesh(toothGeometry(t.w, t.h, t.d, 0.62, t.tip), materials.tooth);
    teeth.push(tooth);
    group.add(tooth);
    const shell = new THREE.Mesh(openShell(toothGeometry(t.w + 0.1, t.h + 0.07, t.d + 0.1, 0.6, t.tip * 0.8), t.h / 2 - 0.2), materials.shell);
    shell.renderOrder = 2;
    shells.push(shell);
    shellGroup.add(shell);
  });
  // gum: a soft tube following the arch
  const pts = [];
  for (let s = -4.25; s <= 4.25; s += 0.17) {
    const a = s / R;
    pts.push(new THREE.Vector3(R * Math.sin(a), 0.62, -R * (1 - Math.cos(a)) - 0.12));
  }
  const gum = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, 0.5, 24, false), materials.gum);
  gum.scale.set(1, 0.8, 0.9);
  gum.position.set(0, 0.26, -0.02);
  group.add(gum);
  group.add(shellGroup);

  const place = (m, ps) => {
    m.position.set(ps.x, ps.y, ps.z);
    m.rotation.set(0, ps.ry, ps.rz);
  };
  // p: tooth alignment 0..1 · pShell: the shape the tray currently has (the tray is always a step ahead)
  const set = (p, pShell = p) => {
    for (let i = 0; i < defs.length; i++) {
      place(teeth[i], pose(i, p));
      place(shells[i], pose(i, pShell));
    }
  };
  set(0, 0);
  return { group, teeth, shells, shellGroup, gum, defs, pose, set };
}

export function makeMaterials() {
  const tooth = new THREE.MeshPhysicalMaterial({
    color: "#e8dfcc",
    roughness: 0.24,
    clearcoat: 0.9,
    clearcoatRoughness: 0.16,
    sheen: 0.5,
    sheenColor: new THREE.Color("#ffe9d0"),
    sheenRoughness: 0.5,
    emissive: new THREE.Color("#3a2a1e"),
    emissiveIntensity: 0.1,
    envMapIntensity: 0.7,
  });
  const gum = new THREE.MeshPhysicalMaterial({
    color: "#96404e",
    roughness: 0.55,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
    sheen: 0.2,
    envMapIntensity: 0.45,
    sheenColor: new THREE.Color("#ffb0b8"),
    emissive: new THREE.Color("#5a1a24"),
    emissiveIntensity: 0.1,
  });
  const shell = new THREE.MeshPhysicalMaterial({
    color: "#f6fffe",
    emissive: new THREE.Color("#2fbfb3"),
    emissiveIntensity: 0,
    transmission: 1,
    thickness: 0.05,
    ior: 1.5,
    roughness: 0.03,
    clearcoat: 1,
    clearcoatRoughness: 0.01,
    envMapIntensity: 2.2,
    specularIntensity: 1,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
  });
  return { tooth, gum, shell };
}

// A full smile: upper + lower arch. The lower arch is the upper one mirrored.
export function buildSmile({ crowding = CROWDING.mild, materials = makeMaterials(), lowerY = -1.5 } = {}) {
  const group = new THREE.Group();
  const upper = buildArch({ crowding, materials });
  const lower = buildArch({ crowding, materials, lower: true });
  lower.group.scale.set(0.93, -1, 0.93);
  lower.group.position.set(0, lowerY, -0.3);
  group.add(upper.group, lower.group);
  // dark "mouth" disc behind the teeth so the smile has a ground to sit on
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(8,3,5,0.96)");
  g.addColorStop(0.62, "rgba(10,4,6,0.85)");
  g.addColorStop(1, "rgba(10,4,6,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const mouth = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false }),
  );
  mouth.position.set(0, lowerY / 2 + 0.05, -3.6);
  mouth.scale.set(10.5, 5.2, 1);
  mouth.renderOrder = -1;
  group.add(mouth);
  // opaque core: glass only refracts opaque things, so without it the trays would show the bright backdrop
  const core = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshBasicMaterial({ color: "#0c0407", toneMapped: false }));
  group.add(core);
  const set = (p, pShell = p, lag = 0) => {
    upper.set(p, pShell);
    lower.set(Math.max(0, p - lag), Math.max(0, pShell - lag));
  };
  // open the mouth by `open` units (the lower arch drops)
  const setJaw = (open) => {
    lower.group.position.y = lowerY - open;
    core.position.set(0, lowerY / 2 - open / 2, -2.5);
    core.scale.set(3.5, 1.55 + open / 2, 0.6);
    mouth.position.y = lowerY / 2 + 0.05 - open / 2;
    mouth.scale.y = 5.2 + open;
  };
  setJaw(0);
  return { group, upper, lower, mouth, core, materials, set, setJaw, lowerY };
}

export function addLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.2));
  const key = new THREE.DirectionalLight("#fff1dd", 1.9);
  key.position.set(3, 5, 8);
  const rim = new THREE.DirectionalLight("#7fe9e0", 1.3);
  rim.position.set(-6, 1, 3);
  const under = new THREE.PointLight("#ffb48a", 12, 14);
  under.position.set(0, -4, 5);
  const back = new THREE.PointLight("#9ff3ff", 34, 14);
  back.position.set(0, 3, -3);
  scene.add(key, rim, under, back);
  return { key, rim, under, back };
}

// project a world position to frame pixels (for DOM markers that follow a 3D point)
const _v = new THREE.Vector3();
export function toScreen(obj, camera, offset) {
  obj.getWorldPosition(_v);
  if (offset) _v.add(offset);
  _v.project(camera);
  return { x: (_v.x * 0.5 + 0.5) * W, y: (-_v.y * 0.5 + 0.5) * H, behind: _v.z > 1 };
}
