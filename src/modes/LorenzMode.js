export class LorenzMode {
    name = 'Lorenz Attractor';

    constructor() {
        this.sigma = 10;
        this.rho = 28;
        this.beta = 8 / 3;
        this.dt = 0.005;
        this.subSteps = 4;

        this.particleCount = 220;
        this.particles = [];
        this.trailLen = 28;

        this.rot = { x: 0.7, y: 0.6 };
        this.scale = 1.0;
        this.targetScale = 1.0;

        this.params = ['ρ', 'σ', 'β'];
        this.activeParam = 0;
        this.mouseDown = false;
        this.dragLast = null;

        this.setupMouse();
        this.spawn();
    }

    setupMouse() {
        const canvas = document.getElementById('overlay-canvas');
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            const r = this.getParamButtonsRect(rect.width, rect.height);
            if (my >= r.y && my <= r.y + r.h) {
                for (let i = 0; i < this.params.length; i++) {
                    const bx = r.startX + i * (r.w + r.gap);
                    if (mx >= bx && mx <= bx + r.w) {
                        this.activeParam = i;
                        e.stopPropagation(); e.preventDefault();
                        return;
                    }
                }
            }

            const sl = this.getSliderRect(rect.width, rect.height);
            if (mx >= sl.x && mx <= sl.x + sl.w && my >= sl.y - 10 && my <= sl.y + sl.h + 10) {
                this.mouseDown = 'slider';
                this.setSliderFromX(mx, sl);
                return;
            }

            this.mouseDown = 'rotate';
            this.dragLast = { x: e.clientX, y: e.clientY };
        });
        canvas.addEventListener('mousemove', (e) => {
            if (this.mouseDown === 'rotate' && this.dragLast) {
                const dx = e.clientX - this.dragLast.x;
                const dy = e.clientY - this.dragLast.y;
                this.rot.y += dx * 0.008;
                this.rot.x += dy * 0.008;
                this.dragLast = { x: e.clientX, y: e.clientY };
            } else if (this.mouseDown === 'slider') {
                const rect = canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const sl = this.getSliderRect(rect.width, rect.height);
                this.setSliderFromX(mx, sl);
            }
        });
        canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
            this.dragLast = null;
        });
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.targetScale -= e.deltaY * 0.0008;
            this.targetScale = Math.max(0.4, Math.min(2.5, this.targetScale));
        }, { passive: false });
    }

    getParamButtonsRect(w, h) {
        const btnW = 60, btnH = 24, gap = 6;
        const totalW = this.params.length * btnW + (this.params.length - 1) * gap;
        return { w: btnW, h: btnH, gap, startX: w * 0.5 - totalW / 2 - 80, y: h - 130 };
    }

    getSliderRect(w, h) {
        const r = this.getParamButtonsRect(w, h);
        return {
            x: r.startX + r.w * this.params.length + r.gap * (this.params.length - 1) + 16,
            y: r.y + 8,
            w: 220, h: 8
        };
    }

    setSliderFromX(mx, sl) {
        const t = Math.max(0, Math.min(1, (mx - sl.x) / sl.w));
        if (this.activeParam === 0) this.rho = 0 + t * 60;        // 0..60
        else if (this.activeParam === 1) this.sigma = 1 + t * 25; // 1..26
        else this.beta = 0.5 + t * 4.5;                            // 0.5..5
    }

    sliderValue() {
        if (this.activeParam === 0) return (this.rho - 0) / 60;
        if (this.activeParam === 1) return (this.sigma - 1) / 25;
        return (this.beta - 0.5) / 4.5;
    }

    spawn() {
        this.particles = [];
        // Cluster of points around (0.1, 0, 0) with tiny perturbation
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: 0.1 + (Math.random() - 0.5) * 0.04,
                y: 0 + (Math.random() - 0.5) * 0.04,
                z: 0 + (Math.random() - 0.5) * 0.04,
                hue: 180 + (i / this.particleCount) * 80,
                trail: []
            });
        }
    }

    reset() {
        this.spawn();
        this.rot = { x: 0.7, y: 0.6 };
        this.scale = 1.0;
        this.targetScale = 1.0;
    }

    deriv(x, y, z) {
        return [
            this.sigma * (y - x),
            x * (this.rho - z) - y,
            x * y - this.beta * z
        ];
    }

    step(p, dt) {
        const [k1x, k1y, k1z] = this.deriv(p.x, p.y, p.z);
        const [k2x, k2y, k2z] = this.deriv(p.x + dt * k1x / 2, p.y + dt * k1y / 2, p.z + dt * k1z / 2);
        const [k3x, k3y, k3z] = this.deriv(p.x + dt * k2x / 2, p.y + dt * k2y / 2, p.z + dt * k2z / 2);
        const [k4x, k4y, k4z] = this.deriv(p.x + dt * k3x, p.y + dt * k3y, p.z + dt * k3z);
        p.x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
        p.y += (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
        p.z += (dt / 6) * (k1z + 2 * k2z + 2 * k3z + k4z);
    }

    update(_results, { leftHand, rightHand, leftPinch, rightPinch }) {
        // Left hand: orbit rotation. Use index tip x/y deltas via pinch midpoint motion when pinching.
        if (leftPinch && leftPinch.isPinching) {
            if (this._lastLeft) {
                this.rot.y += (leftPinch.x - this._lastLeft.x) * 4;
                this.rot.x += (leftPinch.y - this._lastLeft.y) * 4;
            }
            this._lastLeft = { x: leftPinch.x, y: leftPinch.y };
        } else {
            this._lastLeft = null;
        }

        // Right hand: tune ρ via thumb-index distance
        if (rightHand && rightPinch) {
            this.rho = 5 + Math.min(55, Math.max(0, (rightPinch.distance - 0.02) * 350));
        }

        // Auto orbit when no input
        if (!leftHand && !this.mouseDown) {
            this.rot.y += 0.003;
        }

        for (let i = 0; i < this.subSteps; i++) {
            for (const p of this.particles) {
                this.step(p, this.dt);
            }
        }

        // Push trails
        for (const p of this.particles) {
            p.trail.push({ x: p.x, y: p.y, z: p.z });
            if (p.trail.length > this.trailLen) p.trail.shift();
        }

        this.scale += (this.targetScale - this.scale) * 0.1;
    }

    project(x, y, z, w, h) {
        // Center attractor: roughly z mean ~25, so subtract
        x = x; y = y; z = z - 25;
        // Rotate around X
        const cosX = Math.cos(this.rot.x), sinX = Math.sin(this.rot.x);
        let y1 = y * cosX - z * sinX;
        let z1 = y * sinX + z * cosX;
        // Rotate around Y
        const cosY = Math.cos(this.rot.y), sinY = Math.sin(this.rot.y);
        let x1 = x * cosY + z1 * sinY;
        let z2 = -x * sinY + z1 * cosY;

        const f = Math.min(w, h) * 0.018 * this.scale;
        const persp = 60 / (60 + z2);
        return {
            x: w / 2 + x1 * f * persp,
            y: h / 2 - y1 * f * persp,
            z: z2,
            persp
        };
    }

    draw(ctx, w, h) {
        this._lastW = w; this._lastH = h;
        this.drawGrid(ctx, w, h);

        // Project all current points
        const projP = this.particles.map(p => ({
            head: this.project(p.x, p.y, p.z, w, h),
            trail: p.trail.map(pt => this.project(pt.x, pt.y, pt.z, w, h)),
            hue: p.hue
        }));

        // Draw trails, sorted by depth (back first)
        projP.sort((a, b) => a.head.z - b.head.z);

        for (const p of projP) {
            ctx.lineWidth = 1.1;
            for (let i = 1; i < p.trail.length; i++) {
                const a = p.trail[i - 1], b = p.trail[i];
                const t = i / p.trail.length;
                ctx.strokeStyle = `hsla(${p.hue}, 70%, 60%, ${t * 0.45})`;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
            // Head dot
            ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${0.6 + p.head.persp * 0.4})`;
            ctx.beginPath();
            ctx.arc(p.head.x, p.head.y, 1.4 + p.head.persp * 1.6, 0, Math.PI * 2);
            ctx.fill();
        }

        this.drawAxes(ctx, w, h);
        this.drawSpread(ctx, w, h);
        this.drawSlider(ctx, w, h);
        this.drawInfoPanel(ctx, w, h);
    }

    drawAxes(ctx, w, h) {
        const O = this.project(0, 0, 25, w, h);
        const X = this.project(15, 0, 25, w, h);
        const Y = this.project(0, 15, 25, w, h);
        const Z = this.project(0, 0, 40, w, h);
        const drawA = (P, label, col) => {
            ctx.strokeStyle = col;
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.moveTo(O.x, O.y); ctx.lineTo(P.x, P.y);
            ctx.stroke();
            ctx.fillStyle = col;
            ctx.font = '500 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(label, P.x + 4, P.y + 4);
        };
        drawA(X, 'x', 'rgba(251, 113, 133, 0.7)');
        drawA(Y, 'y', 'rgba(125, 211, 252, 0.7)');
        drawA(Z, 'z', 'rgba(192, 132, 252, 0.7)');
    }

    drawSpread(ctx, _w, h) {
        // Average spread of particles (max pairwise distance approx via std dev)
        let mx = 0, my = 0, mz = 0;
        for (const p of this.particles) { mx += p.x; my += p.y; mz += p.z; }
        const N = this.particles.length;
        mx /= N; my /= N; mz /= N;
        let s = 0;
        for (const p of this.particles) {
            s += (p.x - mx) ** 2 + (p.y - my) ** 2 + (p.z - mz) ** 2;
        }
        const std = Math.sqrt(s / N);

        const x = 20, y = h - 78;
        const barW = 200, barH = 8;
        ctx.fillStyle = 'rgba(13, 19, 33, 0.85)';
        ctx.beginPath();
        ctx.roundRect(x - 10, y - 24, barW + 20, barH + 36, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#7dd3fc';
        ctx.font = '700 10px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('SENSITIVITY  σ_xyz', x, y - 8);

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 4);
        ctx.fill();

        const ratio = Math.max(0, Math.min(1, std / 40));
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.roundRect(x, y, barW * ratio, barH, 4);
        ctx.fill();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`std = ${std.toFixed(2)}`, x + barW + 12, y + 8);
    }

    drawSlider(ctx, w, h) {
        const r = this.getParamButtonsRect(w, h);
        // Param buttons
        this.params.forEach((p, i) => {
            const x = r.startX + i * (r.w + r.gap);
            const active = i === this.activeParam;
            ctx.fillStyle = active ? 'rgba(125, 211, 252, 0.16)' : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = active ? 'rgba(125, 211, 252, 0.5)' : 'rgba(255,255,255,0.10)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, r.y, r.w, r.h, 6);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = active ? '#7dd3fc' : '#cbd5e1';
            ctx.font = '500 12px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(p, x + r.w / 2, r.y + 16);
        });

        const sl = this.getSliderRect(w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.roundRect(sl.x, sl.y, sl.w, sl.h, 4);
        ctx.fill();
        const t = this.sliderValue();
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.roundRect(sl.x, sl.y, sl.w * t, sl.h, 4);
        ctx.fill();
        const hx = sl.x + sl.w * t;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(hx, sl.y + sl.h / 2, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawInfoPanel(ctx, w, _h) {
        const panelW = 240, panelH = 200;
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
        ctx.fillText('LORENZ SYSTEM', x + 18, y + 24);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('ODE', x + 18, y + 46);

        ctx.fillStyle = '#fff';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText("dx/dt = σ(y − x)", x + 18, y + 66);
        ctx.fillText("dy/dt = x(ρ − z) − y", x + 18, y + 84);
        ctx.fillText("dz/dt = xy − βz", x + 18, y + 102);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('PARAMETERS', x + 18, y + 124);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.fillText(`σ = ${this.sigma.toFixed(2)}`, x + 18, y + 144);
        ctx.fillStyle = '#7dd3fc';
        ctx.fillText(`ρ = ${this.rho.toFixed(2)}`, x + 110, y + 144);
        ctx.fillStyle = '#c084fc';
        ctx.fillText(`β = ${this.beta.toFixed(2)}`, x + 18, y + 162);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 10px Inter';
        ctx.fillText(`particles = ${this.particleCount}`, x + 18, y + 184);
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
            <div class="control-item"><span class="icon">🤏</span><span class="text">Left pinch + move · orbit</span></div>
            <div class="control-item"><span class="icon">🤏</span><span class="text">Right pinch distance · ρ</span></div>
            <div class="control-item"><span class="icon">🖱️</span><span class="text">Drag · rotate · scroll · zoom</span></div>
        `;
    }
}
