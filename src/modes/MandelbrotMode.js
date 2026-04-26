export class MandelbrotMode {
    name = 'Mandelbrot · Julia';

    constructor() {
        this.center = { x: -0.5, y: 0 };
        this.scale = 3.0; // half-width in complex plane
        this.maxIter = 120;
        this.mode = 'mandelbrot'; // or 'julia'
        this.julia = { x: -0.7, y: 0.27015 };

        this.cache = { canvas: null, ctx: null, key: null };
        this.dirty = true;

        this.dragLast = null;
        this.mouseDown = false;
        this.twoPinchPrev = null;

        this.toggleHover = false;
        this.setupMouse();
    }

    setupMouse() {
        const canvas = document.getElementById('overlay-canvas');
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            const t = this.getToggleRect(rect.width, rect.height);
            if (mx >= t.x && mx <= t.x + t.w && my >= t.y && my <= t.y + t.h) {
                this.mode = (this.mode === 'mandelbrot') ? 'julia' : 'mandelbrot';
                this.dirty = true;
                e.stopPropagation(); e.preventDefault();
                return;
            }

            // Right-click or shift+click sets Julia c
            if (e.shiftKey) {
                const c = this.screenToComplex(mx, my, rect.width, rect.height);
                this.julia = c;
                this.mode = 'julia';
                this.dirty = true;
                return;
            }

            this.mouseDown = true;
            this.dragLast = { x: mx, y: my };
        });
        canvas.addEventListener('mousemove', (e) => {
            if (!this.mouseDown || !this.dragLast) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const dx = mx - this.dragLast.x;
            const dy = my - this.dragLast.y;
            this.center.x -= (dx / rect.width) * (this.scale * 2);
            this.center.y -= (dy / rect.height) * (this.scale * 2 * (rect.height / rect.width));
            this.dragLast = { x: mx, y: my };
            this.dirty = true;
        });
        canvas.addEventListener('mouseup', () => { this.mouseDown = false; this.dragLast = null; });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const before = this.screenToComplex(mx, my, rect.width, rect.height);
            this.scale *= (1 + e.deltaY * 0.0015);
            this.scale = Math.max(0.0008, Math.min(4, this.scale));
            const after = this.screenToComplex(mx, my, rect.width, rect.height);
            this.center.x += before.x - after.x;
            this.center.y += before.y - after.y;
            this.dirty = true;
        }, { passive: false });
    }

    getToggleRect(w, h) {
        return { x: w / 2 - 60, y: h - 130, w: 120, h: 28 };
    }

    screenToComplex(px, py, w, h) {
        const aspect = h / w;
        const u = px / w * 2 - 1;
        const v = py / h * 2 - 1;
        return { x: this.center.x + u * this.scale, y: this.center.y + v * this.scale * aspect };
    }

    reset() {
        this.center = { x: -0.5, y: 0 };
        this.scale = 3.0;
        this.dirty = true;
    }

    update(_results, { leftPinch, rightPinch }) {
        const w = this._lastW || window.innerWidth;
        const h = this._lastH || window.innerHeight;

        // Two-hand pinch: pan via midpoint + zoom via distance change
        if (leftPinch?.isPinching && rightPinch?.isPinching) {
            const mx = (leftPinch.x + rightPinch.x) / 2;
            const my = (leftPinch.y + rightPinch.y) / 2;
            const d = Math.hypot(leftPinch.x - rightPinch.x, leftPinch.y - rightPinch.y);

            if (this.twoPinchPrev) {
                // Pan
                const dx = mx - this.twoPinchPrev.mx;
                const dy = my - this.twoPinchPrev.my;
                this.center.x -= dx * (this.scale * 2);
                this.center.y -= dy * (this.scale * 2 * (h / w));

                // Zoom about midpoint
                if (d > 0.02 && this.twoPinchPrev.d > 0.02) {
                    const ratio = this.twoPinchPrev.d / d;
                    const before = this.screenToComplex(mx * w, my * h, w, h);
                    this.scale *= ratio;
                    this.scale = Math.max(0.0008, Math.min(4, this.scale));
                    const after = this.screenToComplex(mx * w, my * h, w, h);
                    this.center.x += before.x - after.x;
                    this.center.y += before.y - after.y;
                }
                this.dirty = true;
            }
            this.twoPinchPrev = { mx, my, d };
        } else if (leftPinch?.isPinching) {
            // Single-hand pinch: pick c for Julia
            const c = this.screenToComplex(leftPinch.x * w, leftPinch.y * h, w, h);
            if (this.mode === 'julia') {
                this.julia = c;
                this.dirty = true;
            }
            this.twoPinchPrev = null;
        } else {
            this.twoPinchPrev = null;
        }
    }

    iterate(zx, zy, cx, cy) {
        let x = zx, y = zy;
        let n = 0;
        let x2 = x * x, y2 = y * y;
        const max = this.maxIter;
        while (x2 + y2 < 4 && n < max) {
            y = 2 * x * y + cy;
            x = x2 - y2 + cx;
            x2 = x * x; y2 = y * y;
            n++;
        }
        if (n === max) return { iter: max, smooth: max };
        // Smooth coloring
        const log_zn = Math.log(x2 + y2) / 2;
        const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
        return { iter: n, smooth: n + 1 - nu };
    }

    palette(t) {
        // Cyclic perceptual-ish palette
        if (t < 0) return [0, 0, 0];
        const tt = (t * 0.05) % 1;
        const a = Math.sin(2 * Math.PI * tt) * 0.5 + 0.5;
        const b = Math.sin(2 * Math.PI * (tt + 0.33)) * 0.5 + 0.5;
        const c = Math.sin(2 * Math.PI * (tt + 0.66)) * 0.5 + 0.5;
        return [Math.round(40 + a * 215), Math.round(20 + b * 200), Math.round(60 + c * 195)];
    }

    renderCacheIfNeeded(w, h) {
        const key = `${this.mode}|${this.center.x.toFixed(6)}|${this.center.y.toFixed(6)}|${this.scale.toExponential(4)}|${this.julia.x.toFixed(4)}|${this.julia.y.toFixed(4)}|${w}x${h}`;
        if (!this.dirty && this.cache.key === key && this.cache.canvas) return;

        // Render at lower resolution for live interactivity
        const renderW = Math.max(160, Math.floor(w * 0.45));
        const renderH = Math.max(120, Math.floor(h * 0.45));

        if (!this.cache.canvas) {
            this.cache.canvas = document.createElement('canvas');
            this.cache.ctx = this.cache.canvas.getContext('2d');
        }
        this.cache.canvas.width = renderW;
        this.cache.canvas.height = renderH;
        const img = this.cache.ctx.createImageData(renderW, renderH);

        const aspect = h / w;
        const cx0 = this.center.x, cy0 = this.center.y;
        const sx = this.scale, sy = this.scale * aspect;

        for (let py = 0; py < renderH; py++) {
            const v = (py / renderH) * 2 - 1;
            for (let px = 0; px < renderW; px++) {
                const u = (px / renderW) * 2 - 1;
                const cre = cx0 + u * sx;
                const cim = cy0 + v * sy;
                let r;
                if (this.mode === 'mandelbrot') {
                    r = this.iterate(0, 0, cre, cim);
                } else {
                    r = this.iterate(cre, cim, this.julia.x, this.julia.y);
                }
                const idx = (py * renderW + px) * 4;
                if (r.iter >= this.maxIter) {
                    img.data[idx] = 4; img.data[idx + 1] = 6; img.data[idx + 2] = 14; img.data[idx + 3] = 255;
                } else {
                    const [R, G, B] = this.palette(r.smooth);
                    img.data[idx] = R; img.data[idx + 1] = G; img.data[idx + 2] = B; img.data[idx + 3] = 255;
                }
            }
        }
        this.cache.ctx.putImageData(img, 0, 0);
        this.cache.key = key;
        this.dirty = false;
    }

    draw(ctx, w, h) {
        this._lastW = w; this._lastH = h;

        this.renderCacheIfNeeded(w, h);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(this.cache.canvas, 0, 0, w, h);

        // Crosshair at picked c (julia) or center
        const cAt = this.mode === 'julia' ? this.julia : this.center;
        const cs = this.complexToScreen(cAt.x, cAt.y, w, h);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cs.x - 12, cs.y); ctx.lineTo(cs.x + 12, cs.y);
        ctx.moveTo(cs.x, cs.y - 12); ctx.lineTo(cs.x, cs.y + 12);
        ctx.stroke();

        this.drawToggle(ctx, w, h);
        this.drawScaleBar(ctx, w, h);
        this.drawInfoPanel(ctx, w, h);
    }

    complexToScreen(re, im, w, h) {
        const aspect = h / w;
        const u = (re - this.center.x) / this.scale;
        const v = (im - this.center.y) / (this.scale * aspect);
        return { x: (u + 1) * w / 2, y: (v + 1) * h / 2 };
    }

    drawToggle(ctx, w, h) {
        const t = this.getToggleRect(w, h);
        ctx.fillStyle = 'rgba(13, 19, 33, 0.9)';
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(t.x, t.y, t.w, t.h, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#7dd3fc';
        ctx.font = '600 11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(this.mode === 'mandelbrot' ? 'MANDELBROT  →  Julia' : 'JULIA  →  Mandelbrot', t.x + t.w / 2, t.y + 19);
    }

    drawScaleBar(ctx, _w, h) {
        // 1-unit bar in complex coords, displayed in screen px
        const x = 20, y = h - 78;
        const px = (1 / this.scale) * (this._lastW / 2);
        const barW = Math.min(220, Math.max(40, px));
        const realUnits = (barW / (this._lastW / 2)) * this.scale;

        ctx.fillStyle = 'rgba(13, 19, 33, 0.85)';
        ctx.beginPath();
        ctx.roundRect(x - 10, y - 18, barW + 100, 38, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + barW, y);
        ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
        ctx.moveTo(x + barW, y - 4); ctx.lineTo(x + barW, y + 4);
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${realUnits.toExponential(2)}`, x + barW + 10, y + 4);
    }

    drawInfoPanel(ctx, w, _h) {
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
        ctx.fillText(this.mode === 'mandelbrot' ? 'MANDELBROT SET' : 'JULIA SET', x + 18, y + 24);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('ITERATION', x + 18, y + 46);
        ctx.fillStyle = '#fff';
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.fillText('zₙ₊₁ = zₙ² + c', x + 18, y + 66);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('VIEW', x + 18, y + 92);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText(`center = ${this.center.x.toFixed(4)} + ${this.center.y.toFixed(4)}i`, x + 18, y + 112);
        ctx.fillStyle = '#7dd3fc';
        ctx.fillText(`scale  = ${this.scale.toExponential(2)}`, x + 18, y + 130);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`maxIter = ${this.maxIter}`, x + 18, y + 148);

        if (this.mode === 'julia') {
            ctx.fillStyle = '#c084fc';
            ctx.fillText(`c = ${this.julia.x.toFixed(3)} + ${this.julia.y.toFixed(3)}i`, x + 18, y + 170);
        } else {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '400 10px Inter';
            ctx.fillText('Toggle below or shift-click to pick a Julia seed', x + 18, y + 170);
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 10px Inter';
        ctx.fillText(`zoom × ${(3 / this.scale).toFixed(1)}`, x + 18, y + 190);
    }

    getControlsHTML() {
        return `
            <div class="control-item"><span class="icon">🤏🤏</span><span class="text">Two pinches · pan + zoom</span></div>
            <div class="control-item"><span class="icon">🤏</span><span class="text">Single pinch (Julia mode) · pick c</span></div>
            <div class="control-item"><span class="icon">🖱️</span><span class="text">Drag · pan · scroll · zoom · shift-click · Julia</span></div>
        `;
    }
}
