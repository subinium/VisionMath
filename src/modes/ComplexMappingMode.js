export class ComplexMappingMode {
    name = 'Complex Mapping';

    constructor() {
        this.functions = [
            { id: 'z2',     label: 'z²',         fn: (re, im) => [re*re - im*im, 2*re*im] },
            { id: 'z3',     label: 'z³',         fn: (re, im) => {
                const r2 = re*re - im*im, i2 = 2*re*im;
                return [r2*re - i2*im, r2*im + i2*re];
            }},
            { id: '1/z',    label: '1/z',        fn: (re, im) => {
                const d = re*re + im*im;
                return d === 0 ? [0, 0] : [re/d, -im/d];
            }},
            { id: 'sin',    label: 'sin(z)',     fn: (re, im) => [Math.sin(re)*Math.cosh(im), Math.cos(re)*Math.sinh(im)] },
            { id: 'exp',    label: 'eᶻ',         fn: (re, im) => [Math.exp(re)*Math.cos(im), Math.exp(re)*Math.sin(im)] },
            { id: 'mobius', label: '(z−1)/(z+1)', fn: (re, im) => {
                // (z-1)/(z+1)
                const ar = re - 1, ai = im;
                const br = re + 1, bi = im;
                const d = br*br + bi*bi;
                if (d === 0) return [0, 0];
                return [(ar*br + ai*bi) / d, (ai*br - ar*bi) / d];
            }},
        ];
        this.activeFn = 0;

        this.zoom = 2.5;       // half-width of plotting region in z-plane
        this.point = { re: 0.7, im: 0.5 }; // draggable z point
        this.dragging = false;
        this.mouseDown = false;

        // Off-screen image cache for the w-plane domain coloring
        this.cache = { canvas: null, ctx: null, key: null, w: 0, h: 0 };
        this.dirty = true;

        this.setupMouse();
    }

    setupMouse() {
        const canvas = document.getElementById('overlay-canvas');
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            const fb = this.getFnButtonsRect(rect.width, rect.height);
            if (my >= fb.y && my <= fb.y + fb.h) {
                for (let i = 0; i < this.functions.length; i++) {
                    const bx = fb.startX + i * (fb.w + fb.gap);
                    if (mx >= bx && mx <= bx + fb.w) {
                        if (this.activeFn !== i) { this.activeFn = i; this.dirty = true; }
                        e.stopPropagation(); e.preventDefault();
                        return;
                    }
                }
            }

            this.mouseDown = true;
            const left = this.getZPaneRect(rect.width, rect.height);
            if (mx >= left.x && mx <= left.x + left.w && my >= left.y && my <= left.y + left.h) {
                this.dragging = true;
                this.setPointFromScreen(mx, my, left);
            }
        });
        canvas.addEventListener('mousemove', (e) => {
            if (!this.mouseDown || !this.dragging) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const left = this.getZPaneRect(rect.width, rect.height);
            this.setPointFromScreen(mx, my, left);
        });
        canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
            this.dragging = false;
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom *= (1 + e.deltaY * 0.001);
            this.zoom = Math.max(0.5, Math.min(8, this.zoom));
            this.dirty = true;
        }, { passive: false });
    }

    setPointFromScreen(mx, my, rectPane) {
        const u = (mx - rectPane.x - rectPane.w / 2) / (rectPane.w / 2); // -1..1
        const v = (my - rectPane.y - rectPane.h / 2) / (rectPane.h / 2);
        this.point.re = u * this.zoom;
        this.point.im = -v * this.zoom;
    }

    getFnButtonsRect(w, h) {
        const btnW = 70, btnH = 26, gap = 6;
        const totalW = this.functions.length * btnW + (this.functions.length - 1) * gap;
        return { w: btnW, h: btnH, gap, startX: (w - totalW) / 2, y: h - 130 };
    }

    getZPaneRect(w, h) {
        const padX = 30, padTop = 80, padBot = 160, gap = 24;
        const paneW = (w - padX * 2 - gap) / 2 - 50;
        const paneH = h - padTop - padBot;
        const side = Math.min(paneW, paneH);
        const totalW = side * 2 + gap;
        const x = (w - totalW) / 2 - 100;
        const y = padTop + (paneH - side) / 2;
        return { x, y, w: side, h: side };
    }

    getWPaneRect(w, h) {
        const left = this.getZPaneRect(w, h);
        return { x: left.x + left.w + 24, y: left.y, w: left.w, h: left.h };
    }

    reset() {
        this.zoom = 2.5;
        this.point = { re: 0.7, im: 0.5 };
        this.dragging = false;
        this.dirty = true;
    }

    update(_results, { leftPinch, rightPinch }) {
        const w = this._lastW || window.innerWidth;
        const h = this._lastH || window.innerHeight;
        const left = this.getZPaneRect(w, h);

        // Right pinch: zoom (use distance)
        if (rightPinch && rightPinch.isPinching) {
            const target = 1.0 + (0.18 - Math.min(0.18, rightPinch.distance)) * 25;
            this.zoom = Math.max(0.6, Math.min(6, target));
            this.dirty = true;
        }

        // Left pinch: drag point on z-plane
        if (leftPinch && leftPinch.isPinching) {
            const px = leftPinch.x * w;
            const py = leftPinch.y * h;
            if (px >= left.x && px <= left.x + left.w && py >= left.y && py <= left.y + left.h) {
                this.setPointFromScreen(px, py, left);
            }
        }
    }

    // Domain coloring color: hue from arg, lightness from |w| log-modulated
    domainColor(re, im) {
        const r = Math.hypot(re, im);
        const arg = Math.atan2(im, re);
        const hue = ((arg + Math.PI) / (2 * Math.PI)) * 360;
        // Cyclic lightness gradient on log scale → bands at |w| = 2^n
        const lvl = Math.log2(Math.max(1e-6, r));
        const frac = lvl - Math.floor(lvl);
        const sat = 70;
        const light = 30 + frac * 35;
        return [hue, sat, light];
    }

    renderCacheIfNeeded(w, h) {
        const pane = this.getWPaneRect(w, h);
        const W = Math.floor(pane.w);
        const H = Math.floor(pane.h);
        const key = `${this.activeFn}|${this.zoom.toFixed(3)}|${W}x${H}`;
        if (!this.dirty && this.cache.key === key && this.cache.canvas) return;

        // Render at half resolution then upscale for performance
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
        const fn = this.functions[this.activeFn].fn;
        for (let py = 0; py < RH; py++) {
            const v = (py / RH) * 2 - 1;
            const im = -v * this.zoom;
            for (let px = 0; px < RW; px++) {
                const u = (px / RW) * 2 - 1;
                const re = u * this.zoom;
                const [wre, wim] = fn(re, im);
                const [h2, s, l] = this.domainColor(wre, wim);
                const [r, g, b] = hslToRgb(h2 / 360, s / 100, l / 100);
                const idx = (py * RW + px) * 4;
                img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = 255;
            }
        }
        this.cache.ctx.putImageData(img, 0, 0);
        this.cache.key = key;
        this.cache.w = W; this.cache.h = H;
        this.dirty = false;
    }

    draw(ctx, w, h) {
        this._lastW = w; this._lastH = h;
        this.drawGrid(ctx, w, h);

        const left = this.getZPaneRect(w, h);
        const right = this.getWPaneRect(w, h);

        // Render cache (w-plane domain coloring)
        this.renderCacheIfNeeded(w, h);

        // ===== Z-plane (left, schematic) =====
        this.drawPaneFrame(ctx, left, 'z-plane');

        // Light reference grid in z-plane
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
        ctx.lineWidth = 1;
        const steps = 4;
        for (let k = -steps; k <= steps; k++) {
            const u = (k / steps) * 0.5 + 0.5; // 0..1
            const xx = left.x + u * left.w;
            const yy = left.y + u * left.h;
            ctx.beginPath();
            ctx.moveTo(xx, left.y); ctx.lineTo(xx, left.y + left.h);
            ctx.moveTo(left.x, yy); ctx.lineTo(left.x + left.w, yy);
            ctx.stroke();
        }
        // axes
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.beginPath();
        ctx.moveTo(left.x, left.y + left.h / 2); ctx.lineTo(left.x + left.w, left.y + left.h / 2);
        ctx.moveTo(left.x + left.w / 2, left.y); ctx.lineTo(left.x + left.w / 2, left.y + left.h);
        ctx.stroke();

        // Concentric circles + radial lines (preimage hint)
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.22)';
        const cxL = left.x + left.w / 2, cyL = left.y + left.h / 2;
        const half = left.w / 2;
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

        // Z point
        const zU = this.point.re / this.zoom;
        const zV = -this.point.im / this.zoom;
        const zx = cxL + zU * half;
        const zy = cyL + zV * half;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(zx, zy, this.dragging ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();

        // ===== W-plane (right, domain colored) =====
        this.drawPaneFrame(ctx, right, 'w-plane = f(z)');
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.cache.canvas, right.x, right.y, right.w, right.h);

        // axes overlay
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(right.x, right.y + right.h / 2); ctx.lineTo(right.x + right.w, right.y + right.h / 2);
        ctx.moveTo(right.x + right.w / 2, right.y); ctx.lineTo(right.x + right.w / 2, right.y + right.h);
        ctx.stroke();

        // f(z) point
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
        this.drawInfoPanel(ctx, w, h, wre, wim);
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
            ctx.fillStyle = active ? 'rgba(125, 211, 252, 0.16)' : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = active ? 'rgba(125, 211, 252, 0.5)' : 'rgba(255,255,255,0.10)';
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

    drawInfoPanel(ctx, w, _h, wre, wim) {
        const panelW = 260, panelH = 200;
        const x = w - panelW - 20, y = 76;
        ctx.fillStyle = 'rgba(13, 19, 33, 0.92)';
        ctx.beginPath();
        ctx.roundRect(x, y, panelW, panelH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#7dd3fc';
        ctx.font = '700 11px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('COMPLEX MAPPING', x + 18, y + 24);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('FUNCTION', x + 18, y + 46);

        ctx.fillStyle = '#fff';
        ctx.font = '600 18px "JetBrains Mono", monospace';
        ctx.fillText(`f(z) = ${this.functions[this.activeFn].label}`, x + 18, y + 70);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('INPUT  z', x + 18, y + 96);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.fillText(`${this.point.re.toFixed(2)} + ${this.point.im.toFixed(2)}i`, x + 18, y + 116);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('OUTPUT  f(z)', x + 18, y + 138);
        ctx.fillStyle = '#fff';
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.fillText(`${wre.toFixed(2)} + ${wim.toFixed(2)}i`, x + 18, y + 158);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 10px Inter';
        ctx.fillText(`|f(z)| = ${Math.hypot(wre, wim).toFixed(2)}   arg = ${(Math.atan2(wim, wre) * 180 / Math.PI).toFixed(1)}°`, x + 18, y + 180);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 10px Inter';
        ctx.fillText(`zoom × ${this.zoom.toFixed(2)}`, x + 18, y + 196);
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.03)';
        ctx.lineWidth = 1;
        const step = Math.min(w, h) / 22;
        for (let x = 0; x < w; x += step) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
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
