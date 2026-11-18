'use strict';
/**
 * preview.js - draws a scene as the cluster would: the layers engine.js makes (tools/scene.js), each layer's
 * GLSL ES 1.00 shader compiled and run in WebGL 1 (the same shader language the KOMBI's renderer runs) in
 * headless Chromium. Fails if a shader does not compile. Used by preview_tiles.js.
 */
const fs = require('fs');
const path = require('path');

/* the service's quad vertex shader (cluster-render src/compositor.cpp), with the quad placed in pixels */
const VS = `#version 100
attribute vec2 a_position;
uniform mat4 u_mvp;
varying vec2 v_uv;
void main() {
    v_uv = vec2(a_position.x, 1.0 - a_position.y);
    gl_Position = u_mvp * vec4(a_position, 0.0, 1.0);
}`;

function page(scene, mapWindow, over) {
    /* with the map in the centre, a stand-in for it behind the cluster's layers, where slot 0x100 shows */
    /* (mapWindow: true for the native map area, or the layout's own window { x, y, w, h }) */
    const mw = mapWindow && mapWindow.w ? mapWindow : { x: 416, y: 120, w: 1088, h: 480 };
    const map = mapWindow ? `<div style="position:absolute;left:${mw.x}px;top:${mw.y}px;width:${mw.w}px;height:${mw.h}px;background:#1b222b;
background-image:linear-gradient(28deg,transparent 47%,#3a4656 47%,#3a4656 53%,transparent 53%),linear-gradient(-62deg,transparent 48%,#2f3a48 48%,#2f3a48 52%,transparent 52%),
linear-gradient(90deg,transparent 30%,#4ea3ff 30%,#4ea3ff 31.4%,transparent 31.4%);background-size:260px 200px,340px 300px,100% 100%;
color:#6f7f92;font:600 22px sans-serif;display:flex;align-items:center;justify-content:center">map</div>` : '';
    return `<!doctype html><html><body style="margin:0;background:#000;position:relative">${map}
<canvas id="c" width="${scene.w}" height="${scene.h}" style="position:absolute;left:0;top:0"></canvas>
${(over || []).map((b) => `<div style="position:absolute;left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;background:#020202;outline:1px solid #2a2a2a"></div>`).join('')}
<script>
const S = ${JSON.stringify(scene)};
const TIME = ${Number(scene.time) || 0};   /* the renderer's clock for animated pieces (--time s) */
const VS = ${JSON.stringify(VS)};
const MAPW = ${mapWindow ? 'true' : 'false'};
const gl = document.getElementById('c').getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true });
const errors = [];
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) errors.push(gl.getShaderInfoLog(s) + '\\n' + src.slice(0, 200)); return s; }
const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 1,1]), gl.STATIC_DRAW);
const tex = {};
for (const k in S.assets) {
  const a = S.assets[k], bin = atob(a.px), px = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) px[i] = bin.charCodeAt(i);
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const fmt = a.rgba ? gl.RGBA : gl.LUMINANCE;
  gl.texImage2D(gl.TEXTURE_2D, 0, fmt, a.w, a.h, 0, fmt, gl.UNSIGNED_BYTE, px);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  tex[k] = t;
}
gl.viewport(0, 0, S.w, S.h); gl.clearColor(0, 0, 0, MAPW ? 0 : 1); gl.clear(gl.COLOR_BUFFER_BIT);
gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
for (const q of S.quads) {
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, q.fs));
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { errors.push('link: ' + gl.getProgramInfoLog(p)); continue; }
  gl.useProgram(p);
  const loc = gl.getAttribLocation(p, 'a_position'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  /* pixels -> clip space, y down: x' = 2(x + u w)/W - 1, y' = 1 - 2(y + (1 - v) h)/H (a_position.y = 1 at the top) */
  const m = new Float32Array([2*q.w/S.w,0,0,0, 0,2*q.h/S.h,0,0, 0,0,1,0, 2*q.x/S.w-1, 1-2*(q.y+q.h)/S.h, 0,1]);
  gl.uniformMatrix4fv(gl.getUniformLocation(p, 'u_mvp'), false, m);
  for (const n in q.uniforms) {
    const u = q.uniforms[n], v = u.v, t = u.type;
    const l = gl.getUniformLocation(p, t ? n + '[0]' : n) || gl.getUniformLocation(p, n);
    if (!l) continue;
    const w = t === 'vec4' ? 4 : t === 'vec3' ? 3 : t === 'vec2' ? 2 : v.length;
    if (w === 1) gl.uniform1fv(l, v); else if (w === 2) gl.uniform2fv(l, v); else if (w === 3) gl.uniform3fv(l, v); else gl.uniform4fv(l, v);
  }
  let unit = 0;
  { const lt = gl.getUniformLocation(p, 'u_time'); if (lt) gl.uniform1f(lt, TIME); }
  for (const s in q.binds) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex[q.binds[s]]); gl.uniform1i(gl.getUniformLocation(p, s), unit); unit++; }
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
window.__errors = errors; window.__done = true;
</script></body></html>`;
}

async function render(scene, out, mapWindow, over) {
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    try {
        const p = await browser.newPage({ viewport: { width: scene.w, height: scene.h }, deviceScaleFactor: 1 });

        await p.setContent(page(scene, mapWindow, over));
        await p.waitForFunction(() => window.__done === true, null, { timeout: 30000 });
        const errors = await p.evaluate(() => window.__errors);
        await p.screenshot({ path: out, clip: { x: 0, y: 0, width: scene.w, height: scene.h } });
        return errors;
    } finally { await browser.close(); }
}

module.exports = { render, page };

