export class FourierMode {
    name = 'Fourier Series';

    constructor() {
        this.N = 8;
        this.preset = 'square';
        this.amps = [];
        this.phases = [];
        this.time = 0;
        this.timeScale = 1;
        this.trace = [];
        this.traceMax = 360;
        this.activeBar = -1;
        this.mouseDown = false;
        this.presetButtons = ['Square', 'Sawtooth', 'Triangle', 'Pulse', 'Custom'];
        this.activePresetIdx = 0;
        this.loadPreset(this.preset);
        this.setupMouse();
    }

    setupMouse() {
        const canvas = document.getElementById('overlay-canvas');
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            const presetRect = this.getPresetRect(rect.width, rect.height);
            if (my >= presetRect.y && my <= presetRect.y + presetRect.h) {
                for (let i = 0; i < this.presetButtons.length; i++) {
                    const bx = presetRect.startX + i * (presetRect.w + presetRect.gap);
                    if (mx >= bx && mx <= bx + presetRect.w) {
                        this.activePresetIdx = i;
                        const map = ['square', 'sawtooth', 'triangle', 'pulse', 'custom'];
                        this.loadPreset(map[i]);
                        e.stopPropagation(); e.preventDefault();
                        return;
                    }
                }
            }

            const sp = this.getSpectrumRect(rect.width, rect.height);
            if (mx >= sp.x && mx <= sp.x + sp.w && my >= sp.y && my <= sp.y + sp.h) {
                this.mouseDown = true;
                this.handleSpectrumDrag(mx, my, rect.width, rect.height);
            }
        });
        canvas.addEventListener('mousemove', (e) => {
            if (!this.mouseDown) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            this.handleSpectrumDrag(mx, my, rect.width, rect.height);
        });
        canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
            this.activeBar = -1;
        });
    }

    handleSpectrumDrag(mx, my, w, h) {
        const sp = this.getSpectrumRect(w, h);
        const barW = sp.w / this.N;
        const idx = Math.floor((mx - sp.x) / barW);
        if (idx < 0 || idx >= this.N) return;
        const ratio = 1 - (my - sp.y) / sp.h;
        this.amps[idx] = Math.max(-1, Math.min(1, ratio * 2 - 1));
        this.activeBar = idx;
        this.activePresetIdx = 4; // mark Custom
    }

    getPresetRect(w, h) {
        const btnW = 86, btnH = 26, gap = 6;
        const totalW = this.presetButtons.length * btnW + (this.presetButtons.length - 1) * gap;
        return { w: btnW, h: btnH, gap, startX: (w - totalW) / 2, y: h - 130 };
    }

    getSpectrumRect(w, h) {
        return { x: w * 0.36, y: h - 100, w: w * 0.32, h: 60 };
    }

    loadPreset(name) {
        this.preset = name;
        this.amps = new Array(this.N).fill(0);
        this.phases = new Array(this.N).fill(0);
        for (let n = 1; n <= this.N; n++) {
            const idx = n - 1;
            if (name === 'square') {
                this.amps[idx] = (n % 2 === 1) ? 4 / (Math.PI * n) : 0;
            } else if (name === 'sawtooth') {
                this.amps[idx] = (2 / (Math.PI * n)) * ((n % 2 === 1) ? 1 : -1);
            } else if (name === 'triangle') {
                if (n % 2 === 1) {
                    const k = (n - 1) / 2;
                    this.amps[idx] = (8 / (Math.PI * Math.PI * n * n)) * ((k % 2 === 0) ? 1 : -1);
                }
            } else if (name === 'pulse') {
                this.amps[idx] = 0.5 / n;
            }
        }
        // Normalize ≤ 1
        const m = Math.max(...this.amps.map(Math.abs));
        if (m > 1) this.amps = this.amps.map(a => a / m);
        this.trace = [];
    }

    reset() {
        this.time = 0;
        this.trace = [];
        this.activePresetIdx = 0;
        this.loadPreset('square');
    }

    update(_results, { leftPinch, rightPinch }) {
        // Right pinch sets time scale via thumb-index distance
        if (rightPinch && rightPinch.isPinching) {
            this.timeScale = 0.4 + Math.min(1.6, Math.max(0, (rightPinch.distance - 0.03) * 30));
        }
        this.time += 0.016 * this.timeScale;

        // Left pinch acts on spectrum bars
        if (leftPinch && leftPinch.isPinching) {
            const w = this._lastW || window.innerWidth;
            const h = this._lastH || window.innerHeight;
            const sp = this.getSpectrumRect(w, h);
            const px = leftPinch.x * w;
            const py = leftPinch.y * h;
            if (px >= sp.x && px <= sp.x + sp.w && py >= sp.y - 40 && py <= sp.y + sp.h + 40) {
                this.handleSpectrumDrag(px, Math.max(sp.y, Math.min(sp.y + sp.h, py)), w, h);
            }
        }
    }

    sampleSeries(t) {
        let s = 0;
        for (let n = 1; n <= this.N; n++) {
            s += this.amps[n - 1] * Math.sin(n * t + this.phases[n - 1]);
        }
        return s;
    }

    draw(ctx, w, h) {
        this._lastW = w; this._lastH = h;
        this.drawGrid(ctx, w, h);

        // Layout: epicycle on the left half, waveform on right half
        const epiX = w * 0.20;
        const epiY = h * 0.42;
        const waveX = w * 0.45;
        const waveY = h * 0.42;
        const waveW = w * 0.5;
        const waveH = h * 0.46;
        const epiR = Math.min(w, h) * 0.16;

        // ===== Epicycle =====
        let cx = epiX, cy = epiY;
        const points = [];
        points.push({ x: cx, y: cy });
        for (let n = 1; n <= this.N; n++) {
            const r = this.amps[n - 1] * epiR;
            ctx.strokeStyle = 'rgba(125, 211, 252, 0.18)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.abs(r), 0, Math.PI * 2);
            ctx.stroke();
            const angle = n * this.time + this.phases[n - 1];
            const nx = cx + r * Math.cos(angle);
            const ny = cy + r * Math.sin(angle);
            ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)';
            ctx.beginPath();
            ctx.moveTo(cx, cy); ctx.lineTo(nx, ny);
            ctx.stroke();
            cx = nx; cy = ny;
            points.push({ x: cx, y: cy });
        }
        // Tip dot
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();

        // ===== Waveform =====
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(waveX, waveY); ctx.lineTo(waveX + waveW, waveY);
        ctx.stroke();

        // Push current sum (sin component) into trace
        const value = this.sampleSeries(this.time);
        this.trace.push(value);
        if (this.trace.length > this.traceMax) this.trace.shift();

        // Draw trace
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < this.trace.length; i++) {
            const px = waveX + (i / (this.traceMax - 1)) * waveW;
            const py = waveY - this.trace[i] * (waveH * 0.4);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Connector from epicycle tip to wave start
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(waveX, waveY - value * (waveH * 0.4));
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(waveX, waveY - value * (waveH * 0.4), 4, 0, Math.PI * 2);
        ctx.fill();

        // Spectrum bars (interactive)
        this.drawSpectrum(ctx, w, h);
        this.drawPresets(ctx, w, h);
        this.drawInfoPanel(ctx, w, h, value);
    }

    drawSpectrum(ctx, w, h) {
        const sp = this.getSpectrumRect(w, h);
        ctx.fillStyle = 'rgba(13, 19, 33, 0.85)';
        ctx.beginPath();
        ctx.roundRect(sp.x - 8, sp.y - 18, sp.w + 16, sp.h + 28, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#7dd3fc';
        ctx.font = '700 10px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('SPECTRUM  (drag to edit)', sp.x, sp.y - 6);

        const barW = sp.w / this.N;
        const zeroY = sp.y + sp.h / 2;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.beginPath();
        ctx.moveTo(sp.x, zeroY); ctx.lineTo(sp.x + sp.w, zeroY);
        ctx.stroke();

        for (let n = 0; n < this.N; n++) {
            const a = this.amps[n];
            const bx = sp.x + n * barW + barW * 0.15;
            const bw = barW * 0.7;
            const bh = a * (sp.h / 2);
            ctx.fillStyle = (n === this.activeBar) ? '#fbbf24' : '#7dd3fc';
            ctx.fillRect(bx, zeroY, bw, -bh);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '500 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String(n + 1), bx + bw / 2, sp.y + sp.h + 12);
        }
    }

    drawPresets(ctx, w, h) {
        const r = this.getPresetRect(w, h);
        this.presetButtons.forEach((p, i) => {
            const x = r.startX + i * (r.w + r.gap);
            const active = i === this.activePresetIdx;
            ctx.fillStyle = active ? 'rgba(125, 211, 252, 0.16)' : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = active ? 'rgba(125, 211, 252, 0.5)' : 'rgba(255,255,255,0.10)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, r.y, r.w, r.h, 6);
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = active ? '#7dd3fc' : '#cbd5e1';
            ctx.font = '500 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(p, x + r.w / 2, r.y + 17);
        });
    }

    drawInfoPanel(ctx, w, _h, value) {
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
        ctx.fillText('FOURIER SERIES', x + 18, y + 24);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('SUM', x + 18, y + 46);

        ctx.fillStyle = '#fff';
        ctx.font = 'italic 600 16px "Times New Roman", serif';
        ctx.fillText('f(t) = Σ aₙ sin(n t + φₙ)', x + 18, y + 68);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText(`N      = ${this.N}`, x + 18, y + 96);
        ctx.fillText(`preset = ${this.preset}`, x + 18, y + 114);
        ctx.fillText(`speed  = ${this.timeScale.toFixed(2)}×`, x + 18, y + 132);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('LIVE VALUE', x + 18, y + 156);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '500 14px "JetBrains Mono", monospace';
        ctx.fillText(`f(t) = ${value.toFixed(3)}`, x + 18, y + 180);
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.035)';
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
            <div class="control-item"><span class="icon">🤏</span><span class="text">Left pinch · drag spectrum bars</span></div>
            <div class="control-item"><span class="icon">🤏</span><span class="text">Right pinch · time scale</span></div>
            <div class="control-item"><span class="icon">🖱️</span><span class="text">Drag bars or pick a preset</span></div>
        `;
    }
}
