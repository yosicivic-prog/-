"""Builds the three Celeb Smile viral clips (HyperFrames projects) from one shared template.

usage: python3 scripts/viral/build.py
Each film = shared head/CSS/end card + its own titles, 3D choreography (render(t)) and text timeline.
Edit copy in FILMS below, then re-run; never edit the generated index.html files by hand.
"""
import os, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "scripts", "viral")
SHARED = os.path.join(ROOT, "videos", "cs-viral-invisible", "assets")  # vendored libs + fonts live here

WA = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.4a.8.8 0 0 0-.6.3 2.4 2.4 0 0 0-.8 1.8c0 1 .7 2 .8 2.1a8.8 8.8 0 0 0 3.4 3c1.3.5 1.8.6 2.5.5.4-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.1z"/></svg>'

TEMPLATE = r"""<!doctype html>
<html lang="he">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Heebo"; src: url("assets/fonts/heebo-hebrew-wght-normal.woff2") format("woff2"); font-weight: 100 900; unicode-range: U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F; }
      @font-face { font-family: "Heebo"; src: url("assets/fonts/heebo-latin-wght-normal.woff2") format("woff2"); font-weight: 100 900; unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD; }
      :root { --ground: #031a1d; --ink: #ffffff; --accent: #8ff5e6; --deep: #04201f; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: var(--ground); }
      #root { position: relative; width: 100%; height: 100%; background: var(--ground); font-family: "Heebo", sans-serif; color: var(--ink); overflow: hidden; }
      #stage { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; display: block; }
      .full { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
      /* keeps the title readable over the 3D scene */
      #scrim { background: linear-gradient(180deg, rgba(2,15,18,.94) 0px, rgba(2,15,18,.78) 330px, rgba(2,15,18,0) 700px); }
      .title { position: absolute; left: 90px; width: 900px; top: 228px; text-align: center; }
      .title .ln { font-size: 116px; font-weight: 900; line-height: 1.12; letter-spacing: -2px; white-space: nowrap; }
      .title .ln.sm { font-size: 92px; letter-spacing: -1.5px; line-height: 1.2; }
      .title .ln.ac { color: var(--accent); }
      .w { display: inline-block; }
      #sim { position: absolute; left: 0; width: 1080px; top: 170px; display: flex; justify-content: center; }
      #sim span { font-size: 30px; font-weight: 500; line-height: 1; color: #fff; background: rgba(2,15,18,.82); padding: 12px 26px; border-radius: 30px; }
      /* end card */
      #end-veil { background: linear-gradient(180deg, rgba(3,26,29,.97) 0px, rgba(3,26,29,.95) 1010px, rgba(3,26,29,0) 1300px); }
      #end-brand { position: absolute; left: 0; width: 1080px; top: 236px; text-align: center; font-size: 46px; font-weight: 700; letter-spacing: 14px; color: var(--accent); }
      #end-head { position: absolute; left: 90px; width: 900px; top: 338px; text-align: center; font-size: 80px; font-weight: 800; line-height: 1.22; white-space: nowrap; }
      #end-offwrap { position: absolute; left: 0; width: 1080px; top: 568px; height: 250px; perspective: 1400px; }
      #end-off { width: 1080px; text-align: center; font-size: 172px; font-weight: 900; line-height: 250px; color: var(--accent); letter-spacing: -3px; white-space: nowrap;
        text-shadow: 0 1px 0 #6fd9cb, 0 2px 0 #63cabd, 0 3px 0 #58bbaf, 0 4px 0 #4dada1, 0 5px 0 #439e94, 0 6px 0 #399087, 0 7px 0 #30827a, 0 8px 0 #28746d, 0 9px 0 #206760, 0 10px 0 #195a54, 0 22px 46px rgba(0,0,0,.55), 0 0 70px rgba(63,200,190,.35); }
      #end-ctawrap { position: absolute; left: 0; width: 1080px; top: 898px; display: flex; justify-content: center; }
      #end-cta { display: flex; align-items: center; gap: 22px; font-size: 58px; font-weight: 800; color: var(--deep); background: var(--accent); padding: 28px 62px; border-radius: 80px; box-shadow: 0 18px 50px rgba(0,0,0,.45); }
      #end-cta svg { width: 62px; height: 62px; fill: var(--deep); }
/*__CSS__*/
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1080" data-height="1920">
      <canvas id="stage" class="clip" data-layout-ignore data-start="0" data-duration="__DUR__" data-track-index="0" width="1080" height="1920"></canvas>
      <div id="scrim" class="clip full" data-start="0" data-duration="__END__" data-track-index="1"></div>
__TITLES__
__SIMEL__
__EXTRA__
      <div id="end" class="clip full" data-start="__END__" data-duration="__ENDDUR__" data-track-index="8" dir="rtl">
        <div id="end-veil" class="full"></div>
        <div id="end-brand">CELEB SMILE</div>
        <div id="end-head"><div id="end-h1">__H1__</div><div id="end-h2">__H2__</div></div>
        <div id="end-offwrap"><div id="end-off">__OFFER__</div></div>
        <div id="end-ctawrap"><div id="end-cta">__WA__<span>__CTA__</span></div></div>
      </div>
__AUDIO__
    </div>
    <script type="importmap">
      { "imports": { "three": "./assets/three.module.min.js" } }
    </script>
    <script type="module">
      import * as THREE from "three";
      import { W, H, makeRenderer, makeEnvironment, makeBackground, makeBokeh, makeMaterials, buildSmile, buildArch, addLights, toScreen, CROWDING, clamp01, mix, ease, ramp, track, spring } from "./assets/smile3d.js";
      const renderer = makeRenderer(document.getElementById("stage"));
      const scene = new THREE.Scene();
      scene.environment = makeEnvironment(renderer);
      scene.background = makeBackground();
      const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 120);
      const lights = addLights(scene);
      const bokeh = makeBokeh();
      scene.add(bokeh.group);
      // move the whole picture down by px (keeps perspective): frames the subject under the title
      const shift = (px) => camera.setViewOffset(W, H, 0, -px, W, H);
      const END = __END__;
/*__SCENE__*/
      window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
      renderAt(window.__hfThreeTime || 0);
    </script>
    <script>
      const tl = gsap.timeline({ paused: true });
      // title in: word by word, blur to sharp, no slide
      const wordsIn = (sel, at) => tl.fromTo(sel + " .w", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.2, stagger: 0.075, ease: "power2.out" }, at);
      // title out: one blur-out
      const blurOut = (sel, at) => tl.to(sel, { opacity: 0, filter: "blur(12px)", duration: 0.2, ease: "power2.in" }, at);
      const END = __END__;
/*__TEXT__*/
      // ---- end card: the mark and the offer land while the 3D keeps turning underneath ----
      tl.fromTo("#end-veil", { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.inOut" }, END);
      tl.fromTo("#end-brand", { opacity: 0, scale: 1.22 }, { opacity: 1, scale: 1, duration: 0.7, ease: "expo.out", transformOrigin: "50% 50%" }, END + 0.12);
      tl.fromTo("#end-h1", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.25, ease: "power2.out" }, END + 0.3);
      tl.fromTo("#end-h2", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.25, ease: "power2.out" }, END + 0.42);
      tl.fromTo("#end-off", { opacity: 0, rotationY: -78, scale: 0.72 }, { opacity: 1, rotationY: 0, scale: 1, duration: 0.75, ease: "back.out(1.5)", transformOrigin: "50% 50%" }, END + 0.6);
      tl.fromTo("#end-cta", { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }, END + 0.8);
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
"""


def words(s):
    return " ".join('<span class="w">%s</span>' % w for w in s.split(" "))


def title(tid, start, dur, l1, l2, track, c1="", c2=""):
    return (
        '      <div id="%s" class="clip title" data-start="%s" data-duration="%s" data-track-index="%d" dir="rtl">'
        '<div class="ln %s">%s</div><div class="ln ac %s">%s</div></div>' % (tid, start, dur, track, c1, words(l1), c2, words(l2))
    )


# ------------------------------------------------------------------ film A: the invisible aligner
A_SCENE = r"""
      const smile = buildSmile({ crowding: CROWDING.mild });
      scene.add(smile.group);
      const M = smile.materials;
      const P = 0.62; // a real smile mid-treatment, tray seated
      smile.set(P, P, 0);
      // the light that finds the tray
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 6.4), new THREE.MeshBasicMaterial({ color: "#b8fff4", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 6.4), new THREE.MeshBasicMaterial({ color: "#2fbfb3", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      bar.position.z = glow.position.z = 1.3;
      scene.add(bar, glow);
      function renderAt(t) {
        // 2.9s: a light sweeps across and the tray catches it
        const sweep = ramp(t, 2.85, 3.75, ease.ioSine);
        const sweepOn = Math.sin(Math.PI * clamp01((t - 2.85) / 0.9));
        bar.position.x = glow.position.x = mix(-5.2, 5.2, sweep);
        bar.material.opacity = 0.95 * sweepOn;
        glow.material.opacity = 0.16 * sweepOn;
        const lit = ramp(t, 2.9, 3.7, ease.out);
        const flash = ramp(t, 2.9, 3.4, ease.out) * (1 - ramp(t, 3.4, 4.3));
        M.shell.envMapIntensity = mix(0.8, 2.8, lit);
        M.shell.emissiveIntensity = 0.4 * flash; // any steady glow tints the clear tray
        // 3.5s: the mouth opens and the upper tray comes off into the gap · 5.9s: it clicks back on
        const jaw = ramp(t, 3.5, 4.6, ease.io) * (1 - ramp(t, 5.7, 6.2, ease.io));
        smile.setJaw(1.2 * jaw);
        const off = ramp(t, 3.6, 4.8, ease.io) * (1 - Math.min(1.04, spring(t, 5.9, 0.6)));
        smile.upper.shellGroup.position.set(0, -1.5 * off, 1.1 * off);
        smile.upper.shellGroup.rotation.x = 0.5 * off;
        bokeh.update(t);
        scene.environmentRotation.set(0, 0.9 - t * 0.22, 0);
        const punch = 0.5 * Math.exp(-7 * Math.max(0, t - 6.02)) * (t > 6.02 ? 1 : 0);
        camera.position.set(
          track(t, [[0, -1.7], [2.9, 0.3], [5.0, 2.6], [END, -1.6], [END + 1.2, 0.6], [END + 3.2, 1.6]], ease.ioSine),
          track(t, [[0, 0.15], [2.9, 0.1], [5.0, 0.5], [END, 0.3], [END + 1.2, 0.5]], ease.ioSine),
          track(t, [[0, 15.4], [2.9, 13.8], [5.0, 17.4], [END, 16.4], [END + 1.2, 19.5]], ease.io) - punch,
        );
        camera.lookAt(0, -0.75, -0.5);
        shift(track(t, [[0, 0], [2.9, 20], [5.0, 90], [END, 60], [END + 1.2, 560]], ease.io));
        renderer.render(scene, camera);
      }
"""
A_TEXT = r"""
      blurOut("#t1", 2.62);
      tl.fromTo("#bar-fill", { scaleX: 0 }, { scaleX: 1, duration: 2.5, ease: "none", transformOrigin: "100% 50%" }, 0.12);
      tl.to("#bar", { opacity: 0, duration: 0.2 }, 2.62);
      wordsIn("#t2", 3.55);
      blurOut("#t2", 5.72);
      wordsIn("#t3", 6.05);
      blurOut("#t3", END - 0.25);
      tl.to("#sim", { opacity: 0, duration: 0.25 }, END - 0.25);
"""
A_CSS = r"""      #bar { position: absolute; left: 330px; width: 420px; top: 520px; height: 8px; border-radius: 8px; background: rgba(255,255,255,.2); overflow: hidden; }
      #bar-fill { width: 420px; height: 8px; border-radius: 8px; background: var(--accent); }"""

# ------------------------------------------------------------------ film B: follow this tooth
B_SCENE = r"""
      const smile = buildSmile({ crowding: CROWDING.strong });
      scene.add(smile.group);
      const M = smile.materials;
      const hero = smile.upper.teeth[1];
      const T0 = 1.75, GAP = 1.55, IN = 0.5, MOVE = 0.95;
      const targets = [0.3, 0.58, 0.82, 1];
      const ret = document.getElementById("ret");
      const stageNum = document.getElementById("stage-num");
      const segs = [...document.querySelectorAll("#stage-bar i")];
      const align = (t) => {
        let p = 0, prev = 0;
        targets.forEach((to, i) => {
          p += (to - prev) * ramp(t, T0 + i * GAP + IN, T0 + i * GAP + IN + MOVE, ease.io);
          prev = to;
        });
        return p;
      };
      // which tray is on, how far off the teeth it is, and how visible
      const tray = (t) => {
        if (t < T0) return { shape: targets[0], off: 1, op: 0, n: 0 };
        let i = Math.min(targets.length - 1, Math.floor((t - T0) / GAP));
        const x = clamp01((t - (T0 + i * GAP)) / IN);
        if (i === 0) return { shape: targets[0], off: 1 - Math.min(1.03, spring(t, T0, IN * 1.1)), op: clamp01(x * 2.5), n: 1 };
        if (x < 0.42) return { shape: targets[i - 1], off: ease.in(x / 0.42), op: 1 - x / 0.42, n: i };
        return { shape: targets[i], off: 1 - Math.min(1.03, spring(t, T0 + i * GAP + IN * 0.42, IN * 0.75)), op: clamp01((x - 0.42) / 0.3), n: i + 1 };
      };
      const DONE = T0 + 3 * GAP + IN + MOVE; // teeth straight
      function renderAt(t) {
        const p = align(t);
        const tr = tray(t);
        smile.set(p, tr.shape, 0.03);
        const away = 0.35 * ramp(t, DONE + 0.25, DONE + 0.9, ease.io); // the last tray eases off the finished smile and is gone
        const off = Math.max(tr.off, away);
        M.shell.opacity = tr.op * (1 - ramp(t, DONE + 0.3, DONE + 0.85));
        for (const a of [smile.upper, smile.lower]) {
          a.shellGroup.visible = M.shell.opacity > 0.01;
          a.shellGroup.position.set(0, -0.95 * off, 1.25 * off);
          a.shellGroup.rotation.x = 0.3 * off;
        }
        bokeh.update(t);
        scene.environmentRotation.set(0, 0.7 - t * 0.2, 0);
        // one move: from a macro on the tooth out to the whole smile
        const k = ramp(t, T0 - 0.1, DONE + 0.2, ease.io);
        const push = 0.6 * ramp(t, 0, T0, ease.out);
        camera.position.set(
          mix(1.75, -1.1, k) + track(t, [[END, 0], [END + 1.2, 1.2], [END + 3.4, 2.2]], ease.ioSine),
          mix(0.1, 0.5, k),
          mix(8.4 - push, 17.4, k) + track(t, [[END, 0], [END + 1.2, 2.2]], ease.io),
        );
        camera.lookAt(mix(1.02, 0, k), mix(0.08, -0.75, k), mix(-0.5, -0.5, k));
        shift(mix(120, 50, k) + track(t, [[END, 0], [END + 1.2, 510]], ease.io));
        camera.updateMatrixWorld();
        // marker that stays on the tooth
        const s = toScreen(hero, camera);
        const dist = camera.position.distanceTo(hero.getWorldPosition(new THREE.Vector3()));
        const px = (1.0 / (2 * dist * Math.tan((15 * Math.PI) / 180))) * H;
        const lock = 1 + 0.3 * (1 - ramp(t, 0, 0.55, ease.out));
        const gone = ramp(t, DONE - 0.1, DONE + 0.35, ease.out);
        ret.style.transform = `translate(${(s.x - 75).toFixed(2)}px, ${(s.y - 100 + 14).toFixed(2)}px) scale(${((px / 200) * lock * (1 + 0.5 * gone)).toFixed(4)})`;
        ret.style.opacity = (1 - gone).toFixed(3);
        // stage counter
        stageNum.textContent = String(Math.max(1, tr.n));
        segs.forEach((el, i) => {
          el.style.transform = `scaleX(${ramp(t, T0 + i * GAP + IN, T0 + i * GAP + IN + MOVE, ease.io).toFixed(4)})`;
        });
        renderer.render(scene, camera);
      }
"""
B_TEXT = r"""
      blurOut("#t1", 1.55);
      wordsIn("#t2", 1.9);
      blurOut("#t2", 7.75);
      wordsIn("#t3", 8.05);
      blurOut("#t3", END - 0.25);
      tl.fromTo("#stage-chip", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" }, 1.75);
      tl.to("#stage-chip", { opacity: 0, duration: 0.25 }, 8.0);
      tl.to("#sim", { opacity: 0, duration: 0.25 }, END - 0.25);
"""
B_CSS = r"""      #ret { position: absolute; left: 0; top: 0; width: 150px; height: 200px; }
      #ret i { position: absolute; width: 46px; height: 46px; border: 0 solid var(--accent); filter: drop-shadow(0 0 8px rgba(63,200,190,.8)); }
      #ret i:nth-child(1) { left: 0; top: 0; border-left-width: 7px; border-top-width: 7px; border-top-left-radius: 14px; }
      #ret i:nth-child(2) { right: 0; top: 0; border-right-width: 7px; border-top-width: 7px; border-top-right-radius: 14px; }
      #ret i:nth-child(3) { left: 0; bottom: 0; border-left-width: 7px; border-bottom-width: 7px; border-bottom-left-radius: 14px; }
      #ret i:nth-child(4) { right: 0; bottom: 0; border-right-width: 7px; border-bottom-width: 7px; border-bottom-right-radius: 14px; }
      #stage-wrap { position: absolute; left: 0; width: 1080px; top: 514px; display: flex; justify-content: center; }
      #stage-chip { display: flex; align-items: center; gap: 26px; background: rgba(4,24,28,.78); border: 2px solid rgba(143,245,230,.45); border-radius: 60px; padding: 16px 40px; font-size: 50px; font-weight: 800; }
      #stage-bar { display: flex; gap: 10px; direction: ltr; }
      #stage-bar b { display: block; width: 74px; height: 12px; border-radius: 12px; background: rgba(255,255,255,.2); overflow: hidden; }
      #stage-bar i { display: block; width: 74px; height: 12px; background: var(--accent); transform-origin: 0 50%; }"""
B_EXTRA = (
    '      <div id="ret-clip" class="clip full" data-start="0" data-duration="8.4" data-track-index="5" data-layout-ignore><div id="ret"><i></i><i></i><i></i><i></i></div></div>\n'
    '      <div id="stage-wrap" class="clip" data-start="1.75" data-duration="6.6" data-track-index="7" dir="rtl"><div id="stage-chip"><span>שלב <span id="stage-num">1</span></span>'
    '<div id="stage-bar"><b><i></i></b><b><i></i></b><b><i></i></b><b><i></i></b></div></div></div>'
)

# ------------------------------------------------------------------ film C: why is it so expensive
C_SCENE = r"""
      const M = makeMaterials();
      M.shell.emissiveIntensity = 0.28;
      M.shell.envMapIntensity = 4.2;
      // the product: one clear tray, on top of everything it costs to reach you
      const tray = buildArch({ crowding: CROWDING.mild, materials: M });
      tray.set(1, 1);
      tray.teeth.forEach((m) => (m.visible = false));
      tray.gum.visible = false;
      const trayRig = new THREE.Group();
      tray.group.position.set(0, 0.05, 1.05);
      tray.group.scale.setScalar(0.62);
      trayRig.add(tray.group);
      scene.add(trayRig);
      // slabs: rounded blocks with the label painted on the front
      const SW = 4.3, SH = 1.02, SD = 3.2, GAPY = 0.1;
      const shape = new THREE.Shape();
      const r = 0.2, hw = SW / 2, hh = SH / 2;
      shape.moveTo(-hw + r, -hh); shape.lineTo(hw - r, -hh); shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
      shape.lineTo(hw, hh - r); shape.quadraticCurveTo(hw, hh, hw - r, hh); shape.lineTo(-hw + r, hh);
      shape.quadraticCurveTo(-hw, hh, -hw, hh - r); shape.lineTo(-hw, -hh + r); shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
      const slabGeo = new THREE.ExtrudeGeometry(shape, { depth: SD, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 4, curveSegments: 10 });
      slabGeo.translate(0, 0, -SD / 2);
      const label = (text, ink, sub) => {
        const c = document.createElement("canvas");
        c.width = 1024; c.height = 256;
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        const draw = () => {
          const ctx = c.getContext("2d");
          ctx.clearRect(0, 0, 1024, 256);
          ctx.direction = "rtl"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = ink;
          ctx.font = '800 ' + (sub ? 104 : 124) + 'px "Heebo"';
          ctx.fillText(text, 512, sub ? 104 : 134);
          if (sub) { ctx.font = '700 50px "Heebo"'; ctx.globalAlpha = 0.85; ctx.fillText(sub, 512, 204); ctx.globalAlpha = 1; }
          tex.needsUpdate = true;
        };
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(SW * 0.86, SW * 0.86 / 4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
        mesh.position.set(0, 0, SD / 2 + 0.085);
        return { mesh, draw };
      };
      const labels = [];
      const mkSlab = (color, emissive, text, ink, sub) => {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(slabGeo, new THREE.MeshPhysicalMaterial({ color, roughness: 0.36, metalness: 0.15, clearcoat: 0.8, clearcoatRoughness: 0.25, emissive: new THREE.Color(emissive), emissiveIntensity: 0.5, envMapIntensity: 0.9 })));
        const l = label(text, ink, sub);
        labels.push(l);
        g.add(l.mesh);
        scene.add(g);
        return g;
      };
      const lab = mkSlab("#0f8f86", "#0a5a55", "המעבדה", "#eafffb", "CELEB SMILE");
      const mids = [0, 1, 2].map(() => mkSlab("#3a3036", "#2a1218", "פער תיווך", "#ffb9b0"));
      // labels need the font: hold the first frame until it is drawn
      window.__hf = window.__hf || {};
      window.__hf.buildReady = window.__hf.buildReady || {};
      window.__hf.buildReady["cs-price-labels"] = document.fonts.load('800 124px "Heebo"', "המעבדה פער תיווך").then(() => document.fonts.load('700 50px "Heebo"', "CELEB SMILE")).then(() => {
        labels.forEach((l) => l.draw());
        renderAt(window.__hfThreeTime || 0);
      });
      const STEP = SH + GAPY;
      const baseY = -3.1;
      const KNOCK = [3.0, 3.62, 4.24]; // bottom middleman first: the whole stack drops each time
      const DIR = [1, -1, 1];
      // 0 → 1 fall with one small bounce
      const drop = (t, a) => {
        const x = (t - a) / 0.34;
        if (x <= 0) return 0;
        if (x < 1) return x * x;
        return 1 - 0.07 * Math.exp(-5 * (x - 1)) * Math.abs(Math.sin((x - 1) * 7));
      };
      function renderAt(t) {
        const fallen = KNOCK.map((k) => drop(t, k + 0.08));
        const total = fallen[0] + fallen[1] + fallen[2];
        lab.position.set(0, baseY, 0);
        mids.forEach((m, i) => {
          const out = ramp(t, KNOCK[i], KNOCK[i] + 0.6, ease.out);
          // slab i rests on (i - knocked-below) slabs
          let below = 0;
          for (let j = 0; j < i; j++) below += fallen[j];
          m.position.set(DIR[i] * 13 * out, baseY + STEP * (1 + i - below) + 1.2 * out - 2.2 * out * out, 2.2 * out);
          m.rotation.set(0.5 * out * DIR[i], 0.9 * out * DIR[i], -1.6 * out * DIR[i]);
          m.visible = out < 0.999;
        });
        const trayY = baseY + STEP * (4 - total) - SH / 2 + 0.38;
        const settle = 0.08 * Math.exp(-4 * Math.max(0, t - 4.7)) * Math.sin(Math.max(0, t - 4.7) * 16) * (t > 4.7 ? 1 : 0);
        trayRig.position.set(0, trayY + settle + 0.08 * Math.sin(t * 1.6), 0);
        trayRig.rotation.y = 0.5 * Math.sin(t * 0.55 + 0.4);
        bokeh.update(t);
        scene.environmentRotation.set(0, 0.6 - t * 0.2, 0);
        // climb the tower, then follow the product down to the lab
        const topY = baseY + STEP * 4 + 0.2;
        const lookY = track(t, [[0, topY - 1.9], [2.3, topY - 1.9], [2.9, baseY + STEP * 2.0], [4.9, baseY + 0.75], [END, baseY + 0.75], [END + 1.2, baseY + 0.75]], ease.io);
        camera.position.set(
          track(t, [[0, -3.4], [2.6, 2.6], [5.2, -1.8], [END, 1.4], [END + 3.3, 2.6]], ease.ioSine),
          lookY + track(t, [[0, -2.6], [2.6, 0.6], [5.2, 1.3], [END + 1.2, 1.6]], ease.io),
          track(t, [[0, 14.5], [2.3, 15.5], [2.9, 19], [4.9, 15], [END, 14.2], [END + 1.2, 16.5]], ease.io),
        );
        camera.lookAt(0, lookY, 0);
        shift(track(t, [[0, 210], [2.3, 210], [2.9, 120], [4.9, -60], [END, -60], [END + 1.2, 600]], ease.io));
        renderer.render(scene, camera);
      }
"""
C_TEXT = r"""
      blurOut("#t1", 2.3);
      wordsIn("#t2", 2.55);
      blurOut("#t2", 4.85);
      wordsIn("#t3", 5.1);
      blurOut("#t3", END - 0.25);
"""

FILMS = {
    "cs-viral-invisible": dict(
        dur=11.4, end=8.2,
        titles=[("t1", 0, 2.85, "מצאתם", "את הקשתית?"), ("t2", 3.55, 2.4, "היא שם", "כל הזמן"), ("t3", 6.05, 2.15, "שקופה.", "כמעט בלתי נראית.", "", "sm")],
        sim="הדמיית מחשב להמחשה בלבד", h1="יישור שיניים", h2="בקשתיות שקופות",
        css=A_CSS, scene=A_SCENE, text=A_TEXT,
        extra='      <div id="bar" class="clip" data-start="0" data-duration="2.85" data-track-index="5"><div id="bar-fill"></div></div>',
    ),
    "cs-viral-tooth": dict(
        dur=13.0, end=9.8,
        titles=[("t1", 0, 1.78, "תעקבו אחרי", "השן הזאת"), ("t2", 1.9, 6.08, "כל קשתית", "מזיזה עוד קצת"), ("t3", 8.05, 1.75, "ככה מיישרים.", "בלי גשר.")],
        sim="הדמיה מואצת להמחשה בלבד", h1="יישור שיניים", h2="בקשתיות שקופות",
        css=B_CSS, scene=B_SCENE, text=B_TEXT, extra=B_EXTRA,
    ),
    "cs-viral-price": dict(
        dur=11.1, end=7.9,
        titles=[("t1", 0, 2.52, "למה יישור שיניים", "כל כך יקר?", "sm", ""), ("t2", 2.55, 2.52, "כי בדרך אליכם", "יש מתווכים", "sm", ""), ("t3", 5.1, 2.8, "אצלנו:", "ישר מהמעבדה")],
        sim="", h1="ישר מהמעבדה.", h2="פחות פערי תיווך.",
        css="", scene=C_SCENE, text=C_TEXT, extra="",
    ),
}
OFFER = "40% הנחה"
CTA = "שלחו הודעה עכשיו"

for name, f in FILMS.items():
    d = os.path.join(ROOT, "videos", name)
    os.makedirs(os.path.join(d, "assets", "fonts"), exist_ok=True)
    shutil.copy(os.path.join(SRC, "smile3d.js"), os.path.join(d, "assets", "smile3d.js"))
    if os.path.abspath(os.path.join(d, "assets")) != os.path.abspath(SHARED):
        for a in ("gsap.min.js", "three.module.min.js"):
            shutil.copy(os.path.join(SHARED, a), os.path.join(d, "assets", a))
        for a in os.listdir(os.path.join(SHARED, "fonts")):
            shutil.copy(os.path.join(SHARED, "fonts", a), os.path.join(d, "assets", "fonts", a))
    titles = "\n".join(title(t[0], t[1], t[2], t[3], t[4], 2 + i, *(t[5:] if len(t) > 5 else ("", ""))) for i, t in enumerate(f["titles"]))
    audio_file = os.path.join(d, "assets", "sound.wav")
    audio = (
        '      <audio id="sound" src="assets/sound.wav" data-start="0" data-duration="%s" data-track-index="9" data-volume="0.9"></audio>' % f["dur"]
        if os.path.exists(audio_file) else ""
    )
    html = TEMPLATE
    for k, v in {
        "/*__CSS__*/": f["css"], "__TITLES__": titles, "__EXTRA__": f["extra"], "__AUDIO__": audio, "/*__SCENE__*/": f["scene"], "/*__TEXT__*/": f["text"],
        "__SIMEL__": ('      <div id="sim" class="clip" data-start="0" data-duration="__END__" data-track-index="6" dir="rtl"><span>%s</span></div>' % f["sim"]) if f["sim"] else "", "__H1__": f["h1"], "__H2__": f["h2"], "__OFFER__": OFFER, "__CTA__": CTA, "__WA__": WA,
        "__ENDDUR__": "%g" % round(f["dur"] - f["end"], 3), "__END__": "%g" % f["end"], "__DUR__": "%g" % f["dur"],
    }.items():
        html = html.replace(k, v)
    with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(html)
    print("built", name, f["dur"], "s")
