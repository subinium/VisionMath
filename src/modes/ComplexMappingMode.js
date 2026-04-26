export class ComplexMappingMode {
    name = 'Complex Mapping';

    constructor() {
        this.functions = [
            { id: 'z2',     label: 'z²',          fn: (re, im) => [re * re - im * im, 2 * re * im] },
            { id: 'z3',     label: 'z³',          fn: (re, im) => {
                const r2 = re * re - im * im, i2 = 2 * re * im;
                return [r2 * re - i2 * im, r2 * im + i2 * re];
            }},
            { id: '1/z',    label: '1/z',         fn: (re, im) => {
                const d = re * re + im * im;
                return d === 0 ? [0, 0] : [re / d, -im / d];
            }},
            { id: 'sin',    label: 'sin(z)',      fn: (re, im) => [Math.sin(re) * Math.cosh(im), Math.cos(re) * Math.sinh(im)] },
            { id: 'exp',    label: 'eᶻ',          fn: (re, im) => [Math.exp(re) * Math.cos(im), Math.exp(re) * Math.sin(im)] },
            { id: 'mobius', label: '(z−1)/(z+1)', fn: (re, im) => {
                const ar = re - 1, ai = im;
                const br = re + 1, bi = im;
                const d = br * br + bi * bi;
                if (d === 0) return [0, 0];
                return [(ar * br + ai * bi) / d, (ai * br - ar * bi) / d];
            }},
        ];
        this.activeFn = 0;
        this.zoom = 2.5;
        this.point = { re: 0.7, im: 0.5 };
        this.dragging = false;
        this.mouseDown = false;
        this.cache = { canvas: null, ctx: null, key: null };
        this.dirty = true;
        this._lastW = 1; this._lastH = 1;
    }

    getFnButtonsRect(w, h) {
        const btnW = 70, btnH = 26, gap = 6;
        const totalW = this.functions.length * btnW + (this.functions.length - 1) * gap;
        return { w: btnW, h: btnH, gap, startX: (w - totalW) / 2, y: h - 56 };
    }

    getZPaneRect(w, h) {
        const padTop = 16, padBot = 100, gap = 24;
        const paneH = h - padTop - padBot;
        const sideMax = (w - gap - 40) / 2;
        const side = Math.max(80, Math.min(sideMax, paneH));
        const totalW = side * 2 + gap;
        const x = (w - totalW) / 2;
        const y = padTop + (paneH - side) / 2;
        return { x, y, w: side, h: side };
    }

    getWPaneRect(w, h) {
        const left = this.getZPaneRect(w, h);
        return { x: left.x + left.w + 24, y: left.y, w: left.w, h: left.h };
    }

    setPointFromScreen(mx, my, rectPane) {
        const u = (mx - rectPane.x - rectPane.w / 2) / (rectPane.w / 2);
        const v = (my - rectPane.y - rectPane.h / 2) / (rectPane.h / 2);
        this.point.re = u * this.zoom;
        this.point.im = -v * this.zoom;
    }

    reset() {
        this.zoom = 2.5;
        this.point = { re: 0.7, im: 0.5 };
        this.dragging = false;
        this.mouseDown = false;
        this.dirty = true;
    }

    onPointerDown(mx, my, vw, vh) {
        const fb = this.getFnButtonsRect(vw, vh);
        if (my >= fb.y && my <= fb.y + fb.h) {
            for (let i = 0; i < this.functions.length; i++) {
                const bx = fb.startX + i * (fb.w + fb.gap);
                if (mx >= bx && mx <= bx + fb.w) {
                    if (this.activeFn !== i) { this.activeFn = i; this.dirty = true; }
                    return;
                }
            }
        }
        this.mouseDown = true;
        const left = this.getZPaneRect(vw, vh);
        if (mx >= left.x && mx <= left.x + left.w && my >= left.y && my <= left.y + left.h) {
            this.dragging = true;
            this.setPointFromScreen(mx, my, left);
        }
    }

    onPointerMove(mx, my, vw, vh) {
        if (!this.mouseDown || !this.dragging) return;
        const left = this.getZPaneRect(vw, vh);
        this.setPointFromScreen(mx, my, left);
    }

    onPointerUp() { this.mouseDown = false; this.dragging = false; }

    onWheel(deltaY) {
        this.zoom *= (1 + deltaY * 0.001);
        this.zoom = Math.max(0.5, Math.min(8, this.zoom));
        this.dirty = true;
    }

    update(_results, { leftPinch, rightPinch }) {
        if (rightPinch && rightPinch.isPinching) {
            const target = 1.0 + (0.18 - Math.min(0.18, rightPinch.distance)) * 25;
            this.zoom = Math.max(0.6, Math.min(6, target));
            this.dirty = true;
        }
        if (leftPinch && leftPinch.isPinching) {
            const left = this.getZPaneRect(this._lastW, this._lastH);
            const px = leftPinch.x * this._lastW;
            const py = leftPinch.y * this._lastH;
            if (px >= left.x && px <= left.x + left.w && py >= left.y && py <= left.y + left.h) {
                this.setPointFromScreen(px, py, left);
            }
        }
    }

    domainColor(re, im) {
        const r = Math.sqrt(re * re + im * im);
        const arg = Math.atan2(im, re);
        const hue = ((arg + Math.PI) / (2 * Math.PI));
        const lvl = Math.log2(Math.max(1e-6, r));
        const frac = lvl - Math.floor(lvl);
        const light = 0.30 + frac * 0.35;
        return [hue, 0.7, light];
    }

    renderCacheIfNeeded(w, h) {
        const pane = this.getWPaneRect(w, h);
        const W = Math.floor(pane.w);
        const H = Math.floor(pane.h);
        const key = `${this.activeFn}|${this.zoom.toFixed(3)}|${W}x${H}`;
        if (!this.dirty && this.cache.key === key && this.cache.canvas) return;

        const renderScale = 0.5;
        const RW = Math.max(64, Math.floor(W * renderScale));
        const RH = Math.max(64, Math.floor(H * renderScale));

        if (!this.cache.canvas) {
            this.cache.canvas = document.createElement('canvas');
            this.cache.ctx = this.cache.canvas.getContext('2d');
        }
        this.cache.canvas.width = RW;
        this.cache.canvas.height = RH;

        const img = this.cache.ctx.createImageData(RW, RH);
        const buf = new Uint32Array(img.data.buffer);
        const fn = this.functions[this.activeFn].fn;
        const z = this.zoom;
        let p = 0;
        for (let py = 0; py < RH; py++) {
            const v = (py / RH) * 2 - 1;
            const im = -v * z;
            for (let px = 0; px < RW; px++) {
                const u = (px / RW) * 2 - 1;
                const re = u * z;
                const [wre, wim] = fn(re, im);
                const [hh, ss, ll] = this.domainColor(wre, wim);
                const [r, g, b] = hslToRgb(hh, ss, ll);
                buf[p++] = (255 << 24) | (b << 16) | (g << 8) | r;
            }
        }
        this.cache.ctx.putImageData(img, 0, 0);
        this.cache.key = key;
        this.dirty = false;
    }

    draw(ctx, w, h) {
        this._lastW = w; this._lastH = h;
        this.drawGrid(ctx, w, h);

        const left = this.getZPaneRect(w, h);
        const right = this.getWPaneRect(w, h);
        this.renderCacheIfNeeded(w, h);

        // z-plane (schematic)
        this.drawPaneFrame(ctx, left, 'z-plane');
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
        ctx.lineWidth = 1;
        const steps = 4;
        for (let k = -steps; k <= steps; k++) {
            const u = (k / steps) * 0.5 + 0.5;
            const xx = left.x + u * left.w;
            const yy = left.y + u * left.h;
            ctx.beginPath();
            ctx.moveTo(xx, left.y); ctx.lineTo(xx, left.y + left.h);
            ctx.moveTo(left.x, yy); ctx.lineTo(left.x + left.w, yy);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.beginPath();
        ctx.moveTo(left.x, left.y + left.h / 2); ctx.lineTo(left.x + left.w, left.y + left.h / 2);
        ctx.moveTo(left.x + left.w / 2, left.y); ctx.lineTo(left.x + left.w / 2, left.y + left.h);
        ctx.stroke();

        const cxL = left.x + left.w / 2, cyL = left.y + left.h / 2;
        const half = left.w / 2;
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.22)';
        for (let r = 1; r <= 4; r++) {
            const radius = (r / this.zoom) * half;
            if (radius > half) break;
            ctx.beginPath();
            ctx.arc(cxL, cyL, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        for (let k = 0; k < 12; k++) {
            const a = k * Math.PI / 6;
            ctx.beginPath();
            ctx.moveTo(cxL, cyL);
            ctx.lineTo(cxL + Math.cos(a) * half, cyL + Math.sin(a) * half);
            ctx.stroke();
        }

        const zU = this.point.re / this.zoom;
        const zV = -this.point.im / this.zoom;
        const zx = cxL + zU * half;
        const zy = cyL + zV * half;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(zx, zy, this.dragging ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();

        // w-plane (domain colored)
        this.drawPaneFrame(ctx, right, 'w-plane = f(z)');
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.cache.canvas, right.x, right.y, right.w, right.h);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(right.x, right.y + right.h / 2); ctx.lineTo(right.x + right.w, right.y + right.h / 2);
        ctx.moveTo(right.x + right.w / 2, right.y); ctx.lineTo(right.x + right.w / 2, right.y + right.h);
        ctx.stroke();

        const fn = this.functions[this.activeFn].fn;
        const [wre, wim] = fn(this.point.re, this.point.im);
        const wU = wre / this.zoom;
        const wV = -wim / this.zoom;
        const wx = right.x + right.w / 2 + Math.max(-0.95, Math.min(0.95, wU)) * (right.w / 2);
        const wy = right.y + right.h / 2 + Math.max(-0.95, Math.min(0.95, wV)) * (right.h / 2);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(wx, wy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();

        this.drawFnButtons(ctx, w, h);
        this.drawInfoPanel(ctx, w, wre, wim);
    }

    drawPaneFrame(ctx, r, title) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(r.x, r.y, r.w, r.h, 8);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(title.toUpperCase(), r.x, r.y - 8);
    }

    drawFnButtons(ctx, w, h) {
        const r = this.getFnButtonsRect(w, h);
        this.functions.forEach((f, i) => {
            const x = r.startX + i * (r.w + r.gap);
            const active = i === this.activeFn;
            ctx.fillStyle = active ? 'rgba(125, 211, 252, 0.16)' : 'rgba(255, 255, 255, 0.04)';
            ctx.strokeStyle = active ? 'rgba(125, 211, 252, 0.5)' : 'rgba(255, 255, 255, 0.10)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, r.y, r.w, r.h, 6);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = active ? '#7dd3fc' : '#cbd5e1';
            ctx.font = '500 12px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(f.label, x + r.w / 2, r.y + 18);
        });
    }

    drawInfoPanel(ctx, w, wre, wim) {
        const panelW = 260, panelH = 200;
        const x = w - panelW - 16;
        const yAnchor = 16;
        ctx.fillStyle = 'rgba(13, 19, 33, 0.92)';
        ctx.beginPath();
        ctx.roundRect(x, yAnchor, panelW, panelH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#7dd3fc';
        ctx.font = '700 11px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('COMPLEX MAPPING', x + 18, yAnchor + 24);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('FUNCTION', x + 18, yAnchor + 46);

        ctx.fillStyle = '#fff';
        ctx.font = '600 18px "JetBrains Mono", monospace';
        ctx.fillText(`f(z) = ${this.functions[this.activeFn].label}`, x + 18, yAnchor + 70);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('INPUT  z', x + 18, yAnchor + 96);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.fillText(`${this.point.re.toFixed(2)} + ${this.point.im.toFixed(2)}i`, x + 18, yAnchor + 116);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('OUTPUT  f(z)', x + 18, yAnchor + 138);
        ctx.fillStyle = '#fff';
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.fillText(`${wre.toFixed(2)} + ${wim.toFixed(2)}i`, x + 18, yAnchor + 158);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 10px Inter';
        ctx.fillText(`|f(z)| = ${Math.sqrt(wre * wre + wim * wim).toFixed(2)}   arg = ${(Math.atan2(wim, wre) * 180 / Math.PI).toFixed(1)}°`, x + 18, yAnchor + 180);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 10px Inter';
        ctx.fillText(`zoom × ${this.zoom.toFixed(2)}`, x + 18, yAnchor + 196);
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.03)';
        ctx.lineWidth = 1;
        const step = Math.min(w, h) / 22;
        for (let x = 0; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }

    getControlsHTML() {
        return `
            <div class="control-item"><span class="icon">🤏</span><span class="text">Left pinch · drag z point</span></div>
            <div class="control-item"><span class="icon">🤏</span><span class="text">Right pinch · zoom</span></div>
            <div class="control-item"><span class="icon">⏷</span><span class="text">Pick a function below</span></div>
        `;
    }
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
