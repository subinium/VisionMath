export class LinearTransformMode {
    name = 'Linear Transform';

    constructor() {
        this.iHat = { x: 1, y: 0 };
        this.jHat = { x: 0, y: 1 };
        this.dragging = null;
        this.mouseDown = false;
        this.presets = ['Reset', 'Rotate 30°', 'Shear', 'Scale', 'Reflect'];
        this._lastW = 1; this._lastH = 1;
    }

    getPresetRect(w, h) {
        const btnW = 96, btnH = 28, gap = 8;
        const totalW = this.presets.length * btnW + (this.presets.length - 1) * gap;
        return { w: btnW, h: btnH, gap, startX: (w - totalW) / 2, y: h - 56 };
    }

    pickHandle(px, py, w, h) {
        const cx = w / 2, cy = h / 2;
        const u = this.computeUnit(w, h);
        const ix = cx + this.iHat.x * u, iy = cy - this.iHat.y * u;
        const jx = cx + this.jHat.x * u, jy = cy - this.jHat.y * u;
        if (Math.sqrt((px - ix) ** 2 + (py - iy) ** 2) < 18) return 'i';
        if (Math.sqrt((px - jx) ** 2 + (py - jy) ** 2) < 18) return 'j';
        return null;
    }

    setHandle(which, px, py, w, h) {
        const cx = w / 2, cy = h / 2;
        const u = this.computeUnit(w, h);
        const x = (px - cx) / u;
        const y = -(py - cy) / u;
        if (which === 'i') this.iHat = { x, y };
        if (which === 'j') this.jHat = { x, y };
    }

    computeUnit(w, h) { return Math.min(w, h) / 11; }

    applyPreset(i) {
        if (i === 0) { this.iHat = { x: 1, y: 0 }; this.jHat = { x: 0, y: 1 }; }
        else if (i === 1) {
            const a = Math.PI / 6;
            this.iHat = { x: Math.cos(a), y: Math.sin(a) };
            this.jHat = { x: -Math.sin(a), y: Math.cos(a) };
        }
        else if (i === 2) { this.iHat = { x: 1, y: 0 }; this.jHat = { x: 0.6, y: 1 }; }
        else if (i === 3) { this.iHat = { x: 1.4, y: 0 }; this.jHat = { x: 0, y: 0.7 }; }
        else if (i === 4) { this.iHat = { x: 1, y: 0 }; this.jHat = { x: 0, y: -1 }; }
    }

    reset() {
        this.iHat = { x: 1, y: 0 };
        this.jHat = { x: 0, y: 1 };
        this.dragging = null;
        this.mouseDown = false;
    }

    onPointerDown(mx, my, vw, vh) {
        const btn = this.getPresetRect(vw, vh);
        if (my >= btn.y && my <= btn.y + btn.h) {
            for (let i = 0; i < this.presets.length; i++) {
                const bx = btn.startX + i * (btn.w + btn.gap);
                if (mx >= bx && mx <= bx + btn.w) { this.applyPreset(i); return; }
            }
        }
        this.mouseDown = true;
        const which = this.pickHandle(mx, my, vw, vh);
        if (which) this.dragging = which;
    }

    onPointerMove(mx, my, vw, vh) {
        if (this.mouseDown && this.dragging) this.setHandle(this.dragging, mx, my, vw, vh);
    }

    onPointerUp() { this.mouseDown = false; this.dragging = null; }

    update(_results, { leftPinch, rightPinch }) {
        const w = this._lastW, h = this._lastH;
        const apply = (p) => {
            if (!p?.isPinching) return;
            const px = p.x * w, py = p.y * h;
            if (this.dragging) this.setHandle(this.dragging, px, py, w, h);
            else {
                const which = this.pickHandle(px, py, w, h);
                if (which) this.dragging = which;
            }
        };
        if (leftPinch.isPinching) apply(leftPinch);
        else if (rightPinch.isPinching) apply(rightPinch);
        if (!leftPinch.isPinching && !rightPinch.isPinching && !this.mouseDown) this.dragging = null;
    }

    matrix() { return { a: this.iHat.x, b: this.jHat.x, c: this.iHat.y, d: this.jHat.y }; }
    determinant() { const m = this.matrix(); return m.a * m.d - m.b * m.c; }
    trace() { const m = this.matrix(); return m.a + m.d; }

    eigen() {
        const m = this.matrix();
        const tr = m.a + m.d;
        const det = m.a * m.d - m.b * m.c;
        const disc = tr * tr - 4 * det;
        if (disc < 0) return { real: false, l1: tr / 2, l2: tr / 2, im: Math.sqrt(-disc) / 2, vecs: [] };
        const s = Math.sqrt(disc);
        const l1 = (tr + s) / 2, l2 = (tr - s) / 2;
        const vec = (lam) => {
            const v = (Math.abs(m.b) > 1e-6) ? { x: -m.b, y: m.a - lam } : { x: lam - m.d, y: m.c };
            const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
            return { x: v.x / len, y: v.y / len };
        };
        return { real: true, l1, l2, vecs: [vec(l1), vec(l2)] };
    }

    apply(p) {
        const m = this.matrix();
        return { x: m.a * p.x + m.b * p.y, y: m.c * p.x + m.d * p.y };
    }

    draw(ctx, w, h) {
        this._lastW = w; this._lastH = h;
        const cx = w / 2, cy = h / 2;
        const u = this.computeUnit(w, h);

        this.drawBackgroundGrid(ctx, w, h, u, cx, cy);
        this.drawTransformedGrid(ctx, u, cx, cy);

        const det = this.determinant();
        const ix = cx + this.iHat.x * u, iy = cy - this.iHat.y * u;
        const jx = cx + this.jHat.x * u, jy = cy - this.jHat.y * u;
        const sx = ix + (jx - cx), sy = iy + (jy - cy);

        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(ix, iy); ctx.lineTo(sx, sy); ctx.lineTo(jx, jy);
        ctx.closePath();
        ctx.fillStyle = det >= 0 ? 'rgba(125, 211, 252, 0.13)' : 'rgba(251, 113, 133, 0.16)';
        ctx.fill();
        ctx.strokeStyle = det >= 0 ? 'rgba(125, 211, 252, 0.55)' : 'rgba(251, 113, 133, 0.6)';
        ctx.lineWidth = 1.25;
        ctx.stroke();

        const eig = this.eigen();
        if (eig.real) {
            const drawEig = (v, color) => {
                const reach = Math.max(w, h);
                ctx.strokeStyle = color;
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 1.25;
                ctx.beginPath();
                ctx.moveTo(cx - v.x * reach, cy + v.y * reach);
                ctx.lineTo(cx + v.x * reach, cy - v.y * reach);
                ctx.stroke();
                ctx.setLineDash([]);
            };
            drawEig(eig.vecs[0], 'rgba(192, 132, 252, 0.7)');
            if (Math.abs(eig.l1 - eig.l2) > 1e-6) drawEig(eig.vecs[1], 'rgba(251, 191, 36, 0.7)');
        }

        this.drawArrow(ctx, cx, cy, ix, iy, '#fb7185', 'î', this.dragging === 'i');
        this.drawArrow(ctx, cx, cy, jx, jy, '#7dd3fc', 'ĵ', this.dragging === 'j');

        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        this.drawInfoPanel(ctx, w, eig);
        this.drawPresets(ctx, w, h);
    }

    drawBackgroundGrid(ctx, w, h, u, cx, cy) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
        ctx.lineWidth = 1;
        const range = Math.ceil(Math.max(w, h) / u) + 1;
        for (let k = -range; k <= range; k++) {
            ctx.beginPath();
            ctx.moveTo(cx + k * u, 0); ctx.lineTo(cx + k * u, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, cy + k * u); ctx.lineTo(w, cy + k * u);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.beginPath();
        ctx.moveTo(0, cy); ctx.lineTo(w, cy);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
        ctx.stroke();
    }

    drawTransformedGrid(ctx, u, cx, cy) {
        const range = 8;
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.32)';
        ctx.lineWidth = 1;
        for (let k = -range; k <= range; k++) {
            const p1 = this.apply({ x: -range, y: k });
            const p2 = this.apply({ x: range, y: k });
            ctx.beginPath();
            ctx.moveTo(cx + p1.x * u, cy - p1.y * u);
            ctx.lineTo(cx + p2.x * u, cy - p2.y * u);
            ctx.stroke();
        }
        for (let k = -range; k <= range; k++) {
            const p1 = this.apply({ x: k, y: -range });
            const p2 = this.apply({ x: k, y: range });
            ctx.beginPath();
            ctx.moveTo(cx + p1.x * u, cy - p1.y * u);
            ctx.lineTo(cx + p2.x * u, cy - p2.y * u);
            ctx.stroke();
        }
    }

    drawArrow(ctx, x1, y1, x2, y2, color, label, active) {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) return;
        const ang = Math.atan2(dy, dx);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.stroke();

        const head = 12;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 - head * Math.sin(ang - Math.PI / 6));
        ctx.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 - head * Math.sin(ang + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x2, y2, active ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = active ? '#fff' : color;
        ctx.fill();
        if (active) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.fillStyle = color;
        ctx.font = '600 12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(label, x2 + 10, y2 - 8);
    }

    drawPresets(ctx, w, h) {
        const btn = this.getPresetRect(w, h);
        this.presets.forEach((p, i) => {
            const x = btn.startX + i * (btn.w + btn.gap);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, btn.y, btn.w, btn.h, 6);
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = '#cbd5e1';
            ctx.font = '500 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(p, x + btn.w / 2, btn.y + 18);
        });
    }

    drawInfoPanel(ctx, w, eig) {
        const panelW = 290, panelH = 240;
        const x = w - panelW - 16, y = 16;

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
        ctx.fillText('LINEAR TRANSFORMATION', x + 18, y + 24);

        const m = this.matrix();
        const det = this.determinant();
        const tr = this.trace();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('MATRIX  M', x + 18, y + 46);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 22px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('[', x + 18, y + 88);
        ctx.fillText(']', x + 18 + 200, y + 88);

        ctx.font = '500 13px "JetBrains Mono", monospace';
        ctx.fillStyle = '#e2e8f0';
        const cell = (val, col, row) => {
            ctx.textAlign = 'right';
            ctx.fillText(val.toFixed(2).padStart(6), x + 90 + col * 64, y + 76 + row * 22);
        };
        cell(m.a, 0, 0); cell(m.b, 1, 0);
        cell(m.c, 0, 1); cell(m.d, 1, 1);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('SCALARS', x + 18, y + 132);

        ctx.fillStyle = det >= 0 ? '#4ade80' : '#fb7185';
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.fillText(`det(M) = ${det.toFixed(3)}${det < 0 ? '  ⟲' : ''}`, x + 18, y + 152);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(`tr(M)  = ${tr.toFixed(3)}`, x + 18, y + 170);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('EIGENVALUES', x + 18, y + 192);

        ctx.font = '500 12px "JetBrains Mono", monospace';
        if (eig.real) {
            ctx.fillStyle = '#c084fc';
            ctx.fillText(`λ₁ = ${eig.l1.toFixed(3)}`, x + 18, y + 212);
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(`λ₂ = ${eig.l2.toFixed(3)}`, x + 150, y + 212);
        } else {
            ctx.fillStyle = '#7dd3fc';
            ctx.fillText(`λ = ${eig.l1.toFixed(2)} ± ${eig.im.toFixed(2)}i`, x + 18, y + 212);
        }
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 10px Inter';
        ctx.fillText(eig.real ? 'Real basis · grid stretches along λ-lines' : 'Complex · contains rotation', x + 18, y + 230);
    }

    getControlsHTML() {
        return `
            <div class="control-item"><span class="icon">🤏</span><span class="text">Pinch î (red) or ĵ (cyan)</span></div>
            <div class="control-item"><span class="icon">🖱️</span><span class="text">Drag vector tips</span></div>
            <div class="control-item"><span class="icon">⏷</span><span class="text">Presets along the bottom</span></div>
        `;
    }
}
