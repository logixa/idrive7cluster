'use strict';
/**
 * make_tiles_icon.js [out.png] - Cluster Tiles' own icon: six tiles in two rows of three, each with a short line
 * for its value, one of them filled in the accent colour. 140x140, white line art on transparent like the HMI's
 * other icons (kit/tools/make_icon.js). The Store and the head unit both use apps/cluster_tiles/icon.png.
 *   node tools/make_tiles_icon.js apps/cluster_tiles/icon.png
 */
const fs = require('fs');
const path = require('path');
const { Canvas } = require(path.join(__dirname, '..', 'kit', 'runtime', 'canvas'));
const W = '#ffffff', B = '#2a8cff';
const c = new Canvas(140, 140);
const tw = 36, th = 48, gap = 8, x0 = 7, y0 = 17;
for (let r = 0; r < 2; r++) {
    for (let k = 0; k < 3; k++) {
        const x = x0 + k * (tw + gap), y = y0 + r * (th + gap), hot = r === 1 && k === 1;
        if (hot) c.roundRect(x, y, tw, th, 8, B); else c.strokeRoundRect(x, y, tw, th, 8, 4, W);
        const col = hot ? W : B;
        c.fillRect(x + 8, y + 12, tw - 16, 5, hot ? W : W);                // the value
        c.fillRect(x + 8, y + 24, tw - 16, 10, col);                         // its bar
        c.fillRect(x + 8, y + 38, 12 + k * 4, 3, hot ? W : '#9aa7b8');     // a small label
    }
}
fs.writeFileSync(process.argv[2] || 'icon.png', c.png(9));
