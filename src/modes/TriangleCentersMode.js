export class TriangleCentersMode {
    name = 'Triangle Centers';

    constructor() {
        this.points = [];
        this.dragIndex = -1;
        this.mouseDown = false;
        this.triangleTypes = ['Acute', 'Right', 'Obtuse'];
        this.activeType = 0;
        this.reset();
    }

    getTypeButtonRect(w, h) {
        const btnW = 92, btnH = 30, gap = 8;
        const totalW = this.triangleTypes.length * btnW + (this.triangleTypes.length - 1) * gap;
        return { w: btnW, h: btnH, gap, startX: (w - totalW) / 2, y: h - 56 };
    }

    setTriangleType(typeIndex) {
        this.activeType = typeIndex;
        if (typeIndex === 0) {
            this.points = [{ x: 0.5, y: 0.28 }, { x: 0.32, y: 0.66 }, { x: 0.68, y: 0.66 }];
        } else if (typeIndex === 1) {
            this.points = [{ x: 0.32, y: 0.28 }, { x: 0.32, y: 0.66 }, { x: 0.68, y: 0.66 }];
        } else {
            this.points = [{ x: 0.22, y: 0.28 }, { x: 0.42, y: 0.66 }, { x: 0.78, y: 0.66 }];
        }
    }

    reset() {
        this.setTriangleType(0);
        this.dragIndex = -1;
        this.mouseDown = false;
    }

    onPointerDown(mx, my, vw, vh) {
        const btn = this.getTypeButtonRect(vw, vh);
        if (my >= btn.y && my <= btn.y + btn.h) {
            for (let i = 0; i < this.triangleTypes.length; i++) {
                const bx = btn.startX + i * (btn.w + btn.gap);
                if (mx >= bx && mx <= bx + btn.w) { this.setTriangleType(i); return; }
            }
        }
        this.mouseDown = true;
        this._dragAt(mx / vw, my / vh);
    }

    onPointerMove(mx, my, vw, vh) {
        if (this.mouseDown) this._dragAt(mx / vw, my / vh);
    }

    onPointerUp() {
        this.mouseDown = false;
        this.dragIndex = -1;
    }

    _dragAt(fx, fy) {
        if (this.dragIndex === -1) {
            let minDist = 0.05;
            this.points.forEach((p, i) => {
                const d = Math.sqrt((fx - p.x) ** 2 + (fy - p.y) ** 2);
                if (d < minDist) { minDist = d; this.dragIndex = i; }
            });
        }
        if (this.dragIndex !== -1) {
            this.points[this.dragIndex].x = fx;
            this.points[this.dragIndex].y = fy;
        }
    }

    update(_results, { leftPinch, rightPinch }) {
        const pinch = leftPinch.isPinching ? leftPinch : (rightPinch.isPinching ? rightPinch : null);
        if (pinch) {
            if (this.dragIndex === -1) {
                let minDist = 0.06;
                this.points.forEach((p, i) => {
                    const d = Math.sqrt((pinch.x - p.x) ** 2 + (pinch.y - p.y) ** 2);
                    if (d < minDist) { minDist = d; this.dragIndex = i; }
                });
            }
            if (this.dragIndex !== -1) {
                this.points[this.dragIndex].x = pinch.x;
                this.points[this.dragIndex].y = pinch.y;
            }
        } else if (!this.mouseDown) {
            this.dragIndex = -1;
        }
    }

    getCentroid(p) { return { x: (p[0].x + p[1].x + p[2].x) / 3, y: (p[0].y + p[1].y + p[2].y) / 3 }; }

    getCircumcenter(p) {
        const ax = p[0].x, ay = p[0].y, bx = p[1].x, by = p[1].y, cx = p[2].x, cy = p[2].y;
        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 1e-4) return null;
        const ux = ((ax*ax+ay*ay)*(by-cy) + (bx*bx+by*by)*(cy-ay) + (cx*cx+cy*cy)*(ay-by)) / d;
        const uy = ((ax*ax+ay*ay)*(cx-bx) + (bx*bx+by*by)*(ax-cx) + (cx*cx+cy*cy)*(bx-ax)) / d;
        return { x: ux, y: uy };
    }

    getIncenter(p) {
        const a = Math.sqrt((p[1].x - p[2].x) ** 2 + (p[1].y - p[2].y) ** 2);
        const b = Math.sqrt((p[0].x - p[2].x) ** 2 + (p[0].y - p[2].y) ** 2);
        const c = Math.sqrt((p[0].x - p[1].x) ** 2 + (p[0].y - p[1].y) ** 2);
        const per = a + b + c;
        if (per < 1e-4) return null;
        return { x: (a * p[0].x + b * p[1].x + c * p[2].x) / per, y: (a * p[0].y + b * p[1].y + c * p[2].y) / per };
    }

    getOrthocenter(p) {
        const O = this.getCircumcenter(p);
        if (!O) return null;
        return { x: p[0].x + p[1].x + p[2].x - 2 * O.x, y: p[0].y + p[1].y + p[2].y - 2 * O.y };
    }

    getCircumradius(p, c) {
        if (!c) return 0;
        return Math.sqrt((p[0].x - c.x) ** 2 + (p[0].y - c.y) ** 2);
    }

    getInradius(p) {
        const a = Math.sqrt((p[1].x - p[2].x) ** 2 + (p[1].y - p[2].y) ** 2);
        const b = Math.sqrt((p[0].x - p[2].x) ** 2 + (p[0].y - p[2].y) ** 2);
        const c = Math.sqrt((p[0].x - p[1].x) ** 2 + (p[0].y - p[1].y) ** 2);
        const s = (a + b + c) / 2;
        const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
        return s > 0 ? area / s : 0;
    }

    getSideLengths(p) {
        return [
            Math.sqrt((p[1].x - p[2].x) ** 2 + (p[1].y - p[2].y) ** 2),
            Math.sqrt((p[0].x - p[2].x) ** 2 + (p[0].y - p[2].y) ** 2),
            Math.sqrt((p[0].x - p[1].x) ** 2 + (p[0].y - p[1].y) ** 2)
        ];
    }

    getAngles(p) {
        const [a, b, c] = this.getSideLengths(p);
        const A = Math.acos(Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c))));
        const B = Math.acos(Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c))));
        const C = Math.acos(Math.max(-1, Math.min(1, (a * a + b * b - c * c) / (2 * a * b))));
        const r = 180 / Math.PI;
        return [A * r, B * r, C * r];
    }

    getArea(p) {
        const [a, b, c] = this.getSideLengths(p);
        const s = (a + b + c) / 2;
        return Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
    }

    getNinePointCenter(O, H) {
        if (!O || !H) return null;
        return { x: (O.x + H.x) / 2, y: (O.y + H.y) / 2 };
    }

    draw(ctx, w, h) {
        const pts = this.points.map(p => ({ x: p.x * w, y: p.y * h }));

        this.drawGrid(ctx, w, h);

        const G = this.getCentroid(pts);
        const O = this.getCircumcenter(pts);
        const I = this.getIncenter(pts);
        const H = this.getOrthocenter(pts);
        const N = this.getNinePointCenter(O, H);
        const sides = this.getSideLengths(pts);
        const angles = this.getAngles(pts);
        const area = this.getArea(pts);

        if (O) {
            const R = this.getCircumradius(pts, O);
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(O.x, O.y, R, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (I) {
            const r = this.getInradius(pts);
            ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(I.x, I.y, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (N && O) {
            const r9 = this.getCircumradius(pts, O) / 2;
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(N.x, N.y, r9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Medians
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.32)';
        ctx.lineWidth = 1.25;
        for (let i = 0; i < 3; i++) {
            const m = { x: (pts[(i + 1) % 3].x + pts[(i + 2) % 3].x) / 2, y: (pts[(i + 1) % 3].y + pts[(i + 2) % 3].y) / 2 };
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(m.x, m.y);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Altitudes
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.32)';
        for (let i = 0; i < 3; i++) {
            const a = pts[(i + 1) % 3], b = pts[(i + 2) % 3];
            const dx = b.x - a.x, dy = b.y - a.y;
            const l2 = dx * dx + dy * dy;
            if (l2 > 0.01) {
                const t = ((pts[i].x - a.x) * dx + (pts[i].y - a.y) * dy) / l2;
                const f = { x: a.x + t * dx, y: a.y + t * dy };
                ctx.beginPath();
                ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(f.x, f.y);
                ctx.stroke();
            }
        }
        ctx.setLineDash([]);

        // Perpendicular bisectors
        ctx.setLineDash([1, 4]);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
        for (let i = 0; i < 3; i++) {
            const a = pts[(i + 1) % 3], b = pts[(i + 2) % 3];
            const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            const dx = b.x - a.x, dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const px = -dy / len, py = dx / len;
            const reach = Math.max(w, h);
            ctx.beginPath();
            ctx.moveTo(m.x - px * reach, m.y - py * reach);
            ctx.lineTo(m.x + px * reach, m.y + py * reach);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Triangle
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(96, 165, 250, 0.07)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.85)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Euler line
        if (G && O && H) {
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.moveTo(H.x, H.y); ctx.lineTo(O.x, O.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        this.drawSideLabels(ctx, pts, sides, w, h);
        this.drawAngleArcs(ctx, pts, angles);

        this.drawCenter(ctx, G, '#ef4444', 'G');
        this.drawCenter(ctx, O, '#22c55e', 'O');
        this.drawCenter(ctx, I, '#eab308', 'I');
        this.drawCenter(ctx, H, '#a855f7', 'H');
        this.drawCenter(ctx, N, '#38bdf8', 'N');

        const labels = ['A', 'B', 'C'];
        pts.forEach((pt, i) => {
            const dragging = i === this.dragIndex;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, dragging ? 8 : 5, 0, Math.PI * 2);
            ctx.fillStyle = dragging ? '#93c5fd' : 'rgba(96, 165, 250, 0.9)';
            ctx.fill();

            ctx.fillStyle = '#e2e8f0';
            ctx.font = '600 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], pt.x, pt.y - 12);
        });

        this.drawLegend(ctx, w, h, area, sides, angles);
        this.drawTypeSelectors(ctx, w, h);
    }

    drawSideLabels(ctx, pts, sides, w, h) {
        const names = ['a', 'b', 'c'];
        const norm = Math.min(w, h);
        const C = this.getCentroid(pts);
        for (let i = 0; i < 3; i++) {
            const p1 = pts[(i + 1) % 3], p2 = pts[(i + 2) % 3];
            const m = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            const dx = m.x - C.x, dy = m.y - C.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const ox = (dx / len) * 14, oy = (dy / len) * 14;
            ctx.font = '500 11px "JetBrains Mono", monospace';
            ctx.fillStyle = '#cbd5e1';
            ctx.textAlign = 'center';
            ctx.fillText(`${names[i]} = ${(sides[i] / norm).toFixed(2)}`, m.x + ox, m.y + oy + 4);
        }
    }

    drawAngleArcs(ctx, pts, angles) {
        for (let i = 0; i < 3; i++) {
            const v = pts[i], p1 = pts[(i + 1) % 3], p2 = pts[(i + 2) % 3];
            const a1 = Math.atan2(p1.y - v.y, p1.x - v.x);
            const a2 = Math.atan2(p2.y - v.y, p2.x - v.x);
            let diff = a2 - a1;
            while (diff <= -Math.PI) diff += 2 * Math.PI;
            while (diff > Math.PI) diff -= 2 * Math.PI;
            const ccw = diff < 0;
            const r = 22;
            ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(v.x, v.y, r, a1, a2, ccw);
            ctx.stroke();

            const mid = a1 + diff / 2;
            const lx = v.x + Math.cos(mid) * (r + 10);
            const ly = v.y + Math.sin(mid) * (r + 10);
            ctx.font = '500 10px "JetBrains Mono", monospace';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText(`${angles[i].toFixed(0)}°`, lx, ly + 3);
        }
    }

    drawCenter(ctx, pos, color, label) {
        if (!pos) return;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = color;
        ctx.font = '600 10px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(label, pos.x + 7, pos.y + 3);
    }

    drawLegend(ctx, w, h, area, sides, angles) {
        const panelW = 250, panelH = 280;
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
        ctx.fillText('TRIANGLE CENTERS', x + 18, y + 24);

        const items = [
            { color: '#ef4444', label: 'G', name: 'Centroid' },
            { color: '#22c55e', label: 'O', name: 'Circumcenter' },
            { color: '#eab308', label: 'I', name: 'Incenter' },
            { color: '#a855f7', label: 'H', name: 'Orthocenter' },
            { color: '#38bdf8', label: 'N', name: 'Nine-point' }
        ];
        items.forEach((it, i) => {
            const iy = y + 48 + i * 22;
            ctx.fillStyle = it.color;
            ctx.beginPath();
            ctx.arc(x + 24, iy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '500 12px Inter';
            ctx.fillText(`${it.label}  ${it.name}`, x + 36, iy + 4);
        });

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 168); ctx.lineTo(x + panelW - 18, y + 168);
        ctx.stroke();

        const norm = Math.min(w, h);
        const a = (sides[0] / norm).toFixed(2);
        const b = (sides[1] / norm).toFixed(2);
        const c = (sides[2] / norm).toFixed(2);
        const areaUnit = (area / (norm * norm)).toFixed(3);
        const sumA = angles.reduce((s, v) => s + v, 0).toFixed(0);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('METRICS', x + 18, y + 188);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText(`a, b, c  =  ${a}, ${b}, ${c}`, x + 18, y + 208);
        ctx.fillText(`A, B, C  =  ${angles[0].toFixed(0)}°, ${angles[1].toFixed(0)}°, ${angles[2].toFixed(0)}°`, x + 18, y + 226);
        ctx.fillText(`Σ∠  =  ${sumA}°`, x + 18, y + 244);
        ctx.fillStyle = '#4ade80';
        ctx.fillText(`Area = ${areaUnit}`, x + 18, y + 262);
    }

    drawTypeSelectors(ctx, w, h) {
        const btn = this.getTypeButtonRect(w, h);
        this.triangleTypes.forEach((t, i) => {
            const x = btn.startX + i * (btn.w + btn.gap);
            const active = i === this.activeType;
            ctx.fillStyle = active ? 'rgba(96, 165, 250, 0.18)' : 'rgba(255, 255, 255, 0.04)';
            ctx.strokeStyle = active ? 'rgba(96, 165, 250, 0.55)' : 'rgba(255, 255, 255, 0.10)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, btn.y, btn.w, btn.h, 6);
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = active ? '#93c5fd' : '#e2e8f0';
            ctx.font = '500 12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(t, x + btn.w / 2, btn.y + 19);
        });
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
        ctx.lineWidth = 1;
        const step = Math.min(w, h) / 18;
        for (let x = 0; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }

    getControlsHTML() {
        return `
            <div class="control-item"><span class="icon">🤏</span><span class="text">Pinch a vertex to drag</span></div>
            <div class="control-item"><span class="icon">🖱️</span><span class="text">Drag vertices to reshape</span></div>
            <div class="control-item"><span class="icon">⏷</span><span class="text">Buttons set preset triangle</span></div>
        `;
    }
}
