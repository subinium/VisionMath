export class PendulumMode {
    name = 'Pendulum';

    constructor() {
        this.origin = { x: 0.5, y: 0.18 };
        this.length = 0.5;
        this.angle = Math.PI / 6;
        this.velocity = 0;
        this.acceleration = 0;

        this.g = 9.81;
        this.damping = 0.998;
        this.mass = 22;

        this.dt = 1 / 60;

        this.isDraggingBob = false;
        this.dragOrigin = false;

        this.sliders = [
            { label: 'Air Resistance', value: 0.2, min: 0.990, max: 0.9995, x: 0.3, y: 0.86, w: 0.4, h: 0.014 }
        ];
        this.activeSlider = -1;

        // Trail of bob positions
        this.trail = [];
        this.trailMax = 80;

        // Phase samples (theta, omega)
        this.phaseSamples = [];
        this.phaseMax = 240;

        this.setupMouse();
    }

    setupMouse() {
        const canvas = document.getElementById('overlay-canvas');
        canvas.addEventListener('mousedown', (e) => {
            this.handleInputStart(e.clientX, e.clientY, canvas);
        });
        canvas.addEventListener('mousemove', (e) => {
            this.handleInputMove(e.clientX, e.clientY, canvas);
        });
        canvas.addEventListener('mouseup', () => {
            this.handleInputEnd();
        });
    }

    handleInputStart(clientX, clientY, canvas) {
        const rect = canvas.getBoundingClientRect();
        const mx = (clientX - rect.left) / rect.width;
        const my = (clientY - rect.top) / rect.height;

        for (let i = 0; i < this.sliders.length; i++) {
            const s = this.sliders[i];
            if (mx >= s.x && mx <= s.x + s.w && my >= s.y - 0.04 && my <= s.y + s.h + 0.04) {
                this.activeSlider = i;
                this.updateSlider(i, mx);
                return;
            }
        }

        const bobX = this.origin.x + Math.sin(this.angle) * this.length;
        const bobY = this.origin.y + Math.cos(this.angle) * this.length;
        const aspect = rect.width / rect.height;
        const distBob = Math.hypot((mx - bobX) * aspect, my - bobY);

        if (distBob < 0.05) {
            this.isDraggingBob = true;
            this.velocity = 0;
            return;
        }

        const distOrigin = Math.hypot((mx - this.origin.x) * aspect, my - this.origin.y);
        if (distOrigin < 0.05) {
            this.dragOrigin = true;
        }
    }

    handleInputMove(clientX, clientY, canvas) {
        const rect = canvas.getBoundingClientRect();
        const mx = (clientX - rect.left) / rect.width;
        const my = (clientY - rect.top) / rect.height;

        if (this.activeSlider !== -1) {
            this.updateSlider(this.activeSlider, mx);
        } else if (this.isDraggingBob) {
            const dx = mx - this.origin.x;
            const dy = my - this.origin.y;
            this.angle = Math.atan2(dx, dy);
            this.length = Math.hypot(dx, dy);
            this.velocity = 0;
            this.trail = [];
        } else if (this.dragOrigin) {
            this.origin.x = mx;
            this.origin.y = my;
            this.trail = [];
        }
    }

    handleInputEnd() {
        this.isDraggingBob = false;
        this.dragOrigin = false;
        this.activeSlider = -1;
    }

    updateSlider(index, mx) {
        const s = this.sliders[index];
        const percent = Math.max(0, Math.min(1, (mx - s.x) / s.w));
        s.value = percent;
        this.damping = s.max - percent * (s.max - s.min);
    }

    reset() {
        this.origin = { x: 0.5, y: 0.18 };
        this.length = 0.5;
        this.angle = Math.PI / 6;
        this.velocity = 0;
        this.acceleration = 0;
        this.trail = [];
        this.phaseSamples = [];
    }

    update(_results, { leftPinch, rightPinch }) {
        const pinch = leftPinch.isPinching ? leftPinch : (rightPinch.isPinching ? rightPinch : null);

        if (pinch && pinch.isPinching) {
            if (!this.isDraggingBob && !this.dragOrigin && this.activeSlider === -1) {
                const bobX = this.origin.x + Math.sin(this.angle) * this.length;
                const bobY = this.origin.y + Math.cos(this.angle) * this.length;
                const dist = Math.hypot(pinch.x - bobX, pinch.y - bobY);

                if (dist < 0.1) {
                    this.isDraggingBob = true;
                } else {
                    for (let i = 0; i < this.sliders.length; i++) {
                        const s = this.sliders[i];
                        if (pinch.x >= s.x - 0.05 && pinch.x <= s.x + s.w + 0.05 &&
                            pinch.y >= s.y - 0.08 && pinch.y <= s.y + s.h + 0.08) {
                            this.activeSlider = i;
                            break;
                        }
                    }
                }
            }

            if (this.isDraggingBob) {
                const dx = pinch.x - this.origin.x;
                const dy = pinch.y - this.origin.y;
                this.angle = Math.atan2(dx, dy);
                this.length = Math.hypot(dx, dy);
                this.velocity = 0;
                this.trail = [];
            } else if (this.activeSlider !== -1) {
                this.updateSlider(this.activeSlider, pinch.x);
            }
        } else {
            this.isDraggingBob = false;
            this.activeSlider = -1;
        }

        if (!this.isDraggingBob) {
            this.acceleration = -(this.g / this.length) * Math.sin(this.angle);
            this.velocity += this.acceleration * this.dt;
            this.velocity *= this.damping;
            this.angle += this.velocity * this.dt;
        }

        // Sample trail (in normalized coords)
        const bobX = this.origin.x + Math.sin(this.angle) * this.length;
        const bobY = this.origin.y + Math.cos(this.angle) * this.length;
        this.trail.push({ x: bobX, y: bobY });
        if (this.trail.length > this.trailMax) this.trail.shift();

        // Sample phase
        this.phaseSamples.push({ theta: this.angle, omega: this.velocity });
        if (this.phaseSamples.length > this.phaseMax) this.phaseSamples.shift();
    }

    draw(ctx, w, h) {
        this.drawGrid(ctx, w, h);

        const ox = this.origin.x * w;
        const oy = this.origin.y * h;
        const lengthPx = this.length * h;
        const bobX = ox + Math.sin(this.angle) * lengthPx;
        const bobY = oy + Math.cos(this.angle) * lengthPx;

        // Trail
        if (this.trail.length > 1) {
            ctx.lineWidth = 1.5;
            for (let i = 1; i < this.trail.length; i++) {
                const a = this.trail[i - 1];
                const b = this.trail[i];
                const t = i / this.trail.length;
                ctx.strokeStyle = `rgba(96, 165, 250, ${t * 0.5})`;
                ctx.beginPath();
                ctx.moveTo(a.x * w, a.y * h);
                ctx.lineTo(b.x * w, b.y * h);
                ctx.stroke();
            }
        }

        // Equilibrium line
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox, oy + lengthPx + 50);
        ctx.stroke();
        ctx.setLineDash([]);

        // Reference angle arc
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
        ctx.lineWidth = 1.25;
        const arcR = 30;
        const startAng = Math.PI / 2;
        const endAng = Math.PI / 2 + this.angle;
        ctx.beginPath();
        ctx.arc(ox, oy, arcR, Math.min(startAng, endAng), Math.max(startAng, endAng));
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${(this.angle * 180 / Math.PI).toFixed(0)}°`, ox + Math.sin(this.angle / 2) * (arcR + 14), oy + Math.cos(this.angle / 2) * (arcR + 14) + 4);

        // String
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(bobX, bobY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pivot
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fill();

        // Tangent unit vector at bob (perpendicular to string, in direction of increasing θ)
        const tangentX = Math.cos(this.angle);
        const tangentY = -Math.sin(this.angle);

        // Velocity vector arrow (length proportional to angular velocity * length)
        const vScale = 60;
        const v = this.velocity * this.length;
        if (Math.abs(v) > 0.01) {
            const vx = bobX + tangentX * v * vScale;
            const vy = bobY + tangentY * v * vScale;
            this.drawArrow(ctx, bobX, bobY, vx, vy, '#22c55e');
            ctx.fillStyle = '#22c55e';
            ctx.font = '500 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText('v', vx + 6, vy);
        }

        // Acceleration vector (tangential component) at bob
        const aScale = 4;
        const aTan = this.acceleration * this.length;
        if (Math.abs(aTan) > 0.005) {
            const ax = bobX + tangentX * aTan * aScale;
            const ay = bobY + tangentY * aTan * aScale;
            this.drawArrow(ctx, bobX, bobY, ax, ay, '#f59e0b');
            ctx.fillStyle = '#f59e0b';
            ctx.font = '500 10px "JetBrains Mono", monospace';
            ctx.fillText('a', ax + 6, ay + 12);
        }

        // Bob
        ctx.beginPath();
        ctx.arc(bobX, bobY, this.mass, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(bobX - 5, bobY - 5, 2, bobX, bobY, this.mass);
        grad.addColorStop(0, this.isDraggingBob ? '#bfdbfe' : '#93c5fd');
        grad.addColorStop(1, this.isDraggingBob ? '#3b82f6' : '#2563eb');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Sliders
        this.sliders.forEach(s => {
            const sx = s.x * w;
            const sy = s.y * h;
            const sw = s.w * w;
            const sh = s.h * h;

            ctx.beginPath();
            ctx.roundRect(sx, sy, sw, sh, 4);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fill();

            ctx.beginPath();
            ctx.roundRect(sx, sy, sw * s.value, sh, 4);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();

            const hx = sx + sw * s.value;
            const hy = sy + sh / 2;
            ctx.beginPath();
            ctx.arc(hx, hy, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            ctx.fillStyle = '#cbd5e1';
            ctx.font = '600 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(s.label.toUpperCase(), sx + sw / 2, sy - 12);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '500 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText('low', sx, sy + sh + 14);
            ctx.textAlign = 'right';
            ctx.fillText('high', sx + sw, sy + sh + 14);
        });

        this.drawEnergyBars(ctx, w, h);
        this.drawPhasePortrait(ctx, w, h);
        this.drawInfoPanel(ctx, w, h);
    }

    drawArrow(ctx, x1, y1, x2, y2, color) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        if (len < 1) return;
        const angle = Math.atan2(dy, dx);
        const headlen = 8;

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }

    drawEnergyBars(ctx, _w, _h) {
        // KE = 0.5 * m * (Lω)²    (we use unit mass)
        // PE = m * g * L * (1 - cosθ)
        const m = 1;
        const KE = 0.5 * m * (this.length * this.velocity) ** 2;
        const PE = m * this.g * this.length * (1 - Math.cos(this.angle));
        const total = KE + PE;
        const max = Math.max(total * 1.05, m * this.g * this.length * (1 - Math.cos(Math.PI / 4)), 0.001);

        const x = 20;
        const y = 96;
        const barW = 180;
        const barH = 10;
        const gap = 18;

        ctx.fillStyle = 'rgba(13, 19, 33, 0.85)';
        ctx.beginPath();
        ctx.roundRect(x - 12, y - 22, barW + 24, barH * 3 + gap * 3 + 24, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#60a5fa';
        ctx.font = '700 10px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('ENERGY', x, y - 8);

        const bar = (label, val, color, idx) => {
            const by = y + idx * gap;
            ctx.fillStyle = '#94a3b8';
            ctx.font = '500 10px "JetBrains Mono", monospace';
            ctx.fillText(label, x, by - 2);

            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath();
            ctx.roundRect(x, by, barW, barH, 5);
            ctx.fill();

            const ratio = Math.max(0, Math.min(1, val / max));
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(x, by, barW * ratio, barH, 5);
            ctx.fill();

            ctx.fillStyle = '#cbd5e1';
            ctx.font = '500 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(val.toFixed(2), x + barW, by - 2);
            ctx.textAlign = 'left';
        };

        bar('KE', KE, '#22c55e', 0);
        bar('PE', PE, '#a855f7', 1);
        bar('Total', total, '#60a5fa', 2);
    }

    drawPhasePortrait(ctx, w, h) {
        const panelW = 180;
        const panelH = 130;
        const x = w - panelW - 20;
        const y = h - panelH - 76;

        ctx.fillStyle = 'rgba(13, 19, 33, 0.92)';
        ctx.beginPath();
        ctx.roundRect(x, y, panelW, panelH, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#60a5fa';
        ctx.font = '700 10px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('PHASE  θ vs ω', x + 12, y + 18);

        // Plot area
        const px = x + 14;
        const py = y + 28;
        const pw = panelW - 28;
        const ph = panelH - 42;
        const cx = px + pw / 2;
        const cy = py + ph / 2;

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, cy); ctx.lineTo(px + pw, cy);
        ctx.moveTo(cx, py); ctx.lineTo(cx, py + ph);
        ctx.stroke();

        // Determine scale
        const thetaMax = Math.PI / 2;
        const omegaMax = Math.max(2, ...this.phaseSamples.map(s => Math.abs(s.omega)));

        if (this.phaseSamples.length > 1) {
            ctx.lineWidth = 1.25;
            for (let i = 1; i < this.phaseSamples.length; i++) {
                const a = this.phaseSamples[i - 1];
                const b = this.phaseSamples[i];
                const t = i / this.phaseSamples.length;
                ctx.strokeStyle = `rgba(96, 165, 250, ${t * 0.7})`;
                const ax = cx + (a.theta / thetaMax) * (pw / 2);
                const ay = cy - (a.omega / omegaMax) * (ph / 2);
                const bx = cx + (b.theta / thetaMax) * (pw / 2);
                const by = cy - (b.omega / omegaMax) * (ph / 2);
                ctx.beginPath();
                ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
                ctx.stroke();
            }
        }

        // Current point
        const ccx = cx + (this.angle / thetaMax) * (pw / 2);
        const ccy = cy - (this.velocity / omegaMax) * (ph / 2);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(ccx, ccy, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 9px "JetBrains Mono", monospace';
        ctx.fillText('θ →', px + pw - 18, cy - 4);
        ctx.fillText('ω', cx + 4, py + 8);
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

    drawInfoPanel(ctx, w, _h) {
        const panelW = 280;
        const panelH = 230;
        const x = w - panelW - 20;
        const y = 76;

        ctx.fillStyle = 'rgba(13, 19, 33, 0.92)';
        ctx.beginPath();
        ctx.roundRect(x, y, panelW, panelH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#60a5fa';
        ctx.font = '700 11px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('PENDULUM PHYSICS', x + 18, y + 24);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('PERIOD', x + 18, y + 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 600 18px "Times New Roman", serif';
        ctx.fillText('T = 2π√(L/g)', x + 18, y + 76);

        const T = 2 * Math.PI * Math.sqrt(this.length / this.g);
        const f = 1 / T;

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText(`L = ${this.length.toFixed(2)} m`, x + 18, y + 100);
        ctx.fillText(`g = ${this.g.toFixed(2)} m/s²`, x + 150, y + 100);

        ctx.fillStyle = '#4ade80';
        ctx.font = '700 13px Inter';
        ctx.fillText(`T = ${T.toFixed(3)} s`, x + 18, y + 124);
        ctx.fillStyle = '#60a5fa';
        ctx.fillText(`f = ${f.toFixed(2)} Hz`, x + 150, y + 124);

        // Live state
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 140);
        ctx.lineTo(x + panelW - 18, y + 140);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('LIVE', x + 18, y + 158);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText(`θ = ${(this.angle * 180 / Math.PI).toFixed(1)}°`, x + 18, y + 178);
        ctx.fillText(`ω = ${this.velocity.toFixed(2)} rad/s`, x + 130, y + 178);
        ctx.fillText(`α = ${this.acceleration.toFixed(2)} rad/s²`, x + 18, y + 196);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 10px Inter';
        const text = "Period depends only on √L and g — not mass or amplitude (small angle).";
        this.wrapText(ctx, text, x + 18, y + 218, panelW - 36, 13);
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    getControlsHTML() {
        return `
            <div class="control-item">
                <span class="icon">🤏</span>
                <span class="text">Pinch bob to set angle/length</span>
            </div>
            <div class="control-item">
                <span class="icon">🤏</span>
                <span class="text">Pinch slider · air resistance</span>
            </div>
            <div class="control-item">
                <span class="icon">📊</span>
                <span class="text">Energy + phase auto-track</span>
            </div>
        `;
    }
}
