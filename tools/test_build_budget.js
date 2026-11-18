'use strict';
/**
 * test_build_budget.js - the app built by the Store's build step (kit/tools/build.py) against a stand-in SDK:
 * the HMI's string bundle holds 1024 strings, one for every row of every drop-down in the settings (kit/tools/
 * localize.py raises "exceeds the verified 1024-resource budget" and the Store shows "the build failed (exit 1)").
 *   node tools/test_build_budget.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const py = spawnSync('python3', ['--version']);
if (py.error) { console.log('skip build budget: no python3'); process.exit(0); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'budget-'));
['kit', 'apps', 'shared'].forEach((d) => fs.cpSync(path.join(ROOT, d), path.join(tmp, d), { recursive: true }));
fs.mkdirSync(path.join(tmp, 'oap-sdk'));
fs.writeFileSync(path.join(tmp, 'oap-sdk', 'index.js'), 'module.exports = {};\n');
fs.writeFileSync(path.join(tmp, 'oap-sdk', 'package.json'), '{"name":"oap-sdk","version":"0.0.0"}\n');
const r = spawnSync('python3', [path.join(tmp, 'kit', 'tools', 'build.py'), 'cluster_tiles'], { cwd: tmp, encoding: 'utf8' });
assert.strictEqual(r.status, 0, 'build.py: ' + (r.stderr || '').split('\n').slice(-4).join(' | '));
const strings = JSON.parse(fs.readFileSync(path.join(tmp, 'dist', 'cluster_tiles', 'rhmiData', 'strings', 'en_US.json'), 'utf8'));
console.log('ok   builds: ' + Object.keys(strings).length + ' of 1024 HMI strings');
assert(Object.keys(strings).length <= 1024 - 60, 'keep some room under the string budget');
fs.rmSync(tmp, { recursive: true, force: true });
