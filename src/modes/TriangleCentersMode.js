export class TriangleCentersMode {
    name = 'Triangle Centers';

    constructor() {
        this.points = [];
        this.dragIndex = -1;
        this.mouseDown = false;
        this.triangleTypes = ['Acute', 'Right', 'Obtuse'];
        this.activeType = 0;
        this.reset();
        this.setupMouse();
    }

    setupMouse() {
        const canvas = document.getElementById('overlay-canvas');
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            const btn = this.getTypeButtonRect(rect.width, rect.height);
            if (my >= btn.y && my <= btn.y + btn.h) {
                for (let i = 0; i < this.triangleTypes.length; i++) {
                    const bx = btn.startX + i * (btn.w + btn.gap);
                    if (mx >= bx && mx <= bx + btn.w) {
                        this.setTriangleType(i);
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                }
            }

            this.mouseDown = true;
            this.handleMouseDrag(e);
        });
        canvas.addEventListener('mousemove', (e) => {
            if (this.mouseDown) this.handleMouseDrag(e);
        });
        canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
            this.dragIndex = -1;
        });
    }

    getTypeButtonRect(w, h) {
        const btnW = 92;
        const btnH = 30;
        const gap = 8;
        const totalW = this.triangleTypes.length * btnW + (this.triangleTypes.length - 1) * gap;
        return {
            w: btnW,
            h: btnH,
            gap,
            startX: (w - totalW) / 2,
            y: h - 56
        };
    }

    setTriangleType(typeIndex) {
        this.activeType = typeIndex;
        if (typeIndex === 0) {
            this.points = [
                { x: 0.5, y: 0.28 },
                { x: 0.32, y: 0.66 },
                { x: 0.68, y: 0.66 }
            ];
        } else if (typeIndex === 1) {
            this.points = [
                { x: 0.32, y: 0.28 },
                { x: 0.32, y: 0.66 },
                { x: 0.68, y: 0.66 }
            ];
        } else {
            this.points = [
                { x: 0.22, y: 0.28 },
                { x: 0.42, y: 0.66 },
                { x: 0.78, y: 0.66 }
            ];
        }
    }

    handleMouseDrag(e) {
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width;
        const my = (e.clientY - rect.top) / rect.height;

        if (this.dragIndex === -1) {
            let minDist = 0.05;
            this.points.forEach((p, i) => {
                const dist = Math.hypot(mx - p.x, my - p.y);
                if (dist < minDist) {
                    minDist = dist;
                    this.dragIndex = i;
                }
            });
        }
        if (this.dragIndex !== -1) {
            this.points[this.dragIndex].x = mx;
            this.points[this.dragIndex].y = my;
        }
    }

    reset() {
        this.setTriangleType(0);
        this.dragIndex = -1;
    }

    update(_results, { leftPinch, rightPinch }) {
        const pinch = leftPinch.isPinching ? leftPinch : (rightPinch.isPinching ? rightPinch : null);

        if (pinch && pinch.isPinching) {
            if (this.dragIndex === -1) {
                let minDist = 0.06;
                this.points.forEach((p, i) => {
                    const dist = Math.hypot(pinch.x - p.x, pinch.y - p.y);
                    if (dist < minDist) {
                        minDist = dist;
                        this.dragIndex = i;
                    }
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

    getCentroid(pts) {
        return {
            x: (pts[0].x + pts[1].x + pts[2].x) / 3,
            y: (pts[0].y + pts[1].y + pts[2].y) / 3
        };
    }

    getCircumcenter(pts) {
        const ax = pts[0].x, ay = pts[0].y;
        const bx = pts[1].x, by = pts[1].y;
        const cx = pts[2].x, cy = pts[2].y;

        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 0.0001) return null;

        const ux = ((ax * ax + ay * ay) * (by - cy) +
            (bx * bx + by * by) * (cy - ay) +
            (cx * cx + cy * cy) * (ay - by)) / d;
        const uy = ((ax * ax + ay * ay) * (cx - bx) +
            (bx * bx + by * by) * (ax - cx) +
            (cx * cx + cy * cy) * (bx - ax)) / d;

        return { x: ux, y: uy };
    }

    getIncenter(pts) {
        const a = Math.hypot(pts[1].x - pts[2].x, pts[1].y - pts[2].y);
        const b = Math.hypot(pts[0].x - pts[2].x, pts[0].y - pts[2].y);
        const c = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const perimeter = a + b + c;
        if (perimeter < 0.0001) return null;

        return {
            x: (a * pts[0].x + b * pts[1].x + c * pts[2].x) / perimeter,
            y: (a * pts[0].y + b * pts[1].y + c * pts[2].y) / perimeter
        };
    }

    getOrthocenter(pts) {
        const O = this.getCircumcenter(pts);
        if (!O) return null;
        return {
            x: pts[0].x + pts[1].x + pts[2].x - 2 * O.x,
            y: pts[0].y + pts[1].y + pts[2].y - 2 * O.y
        };
    }

    getCircumradius(pts, circumcenter) {
        if (!circumcenter) return 0;
        return Math.hypot(pts[0].x - circumcenter.x, pts[0].y - circumcenter.y);
    }

    getInradius(pts) {
        const a = Math.hypot(pts[1].x - pts[2].x, pts[1].y - pts[2].y);
        const b = Math.hypot(pts[0].x - pts[2].x, pts[0].y - pts[2].y);
        const c = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const s = (a + b + c) / 2;
        const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
        return s > 0 ? area / s : 0;
    }

    getSideLengths(pts) {
        // a = BC, b = CA, c = AB
        return [
            Math.hypot(pts[1].x - pts[2].x, pts[1].y - pts[2].y),
            Math.hypot(pts[0].x - pts[2].x, pts[0].y - pts[2].y),
            Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        ];
    }

    getAngles(pts) {
        const [a, b, c] = this.getSideLengths(pts);
        // Law of cosines, returns degrees for A, B, C
        const A = Math.acos(Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c))));
        const B = Math.acos(Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c))));
        const C = Math.acos(Math.max(-1, Math.min(1, (a * a + b * b - c * c) / (2 * a * b))));
        const r2d = 180 / Math.PI;
        return [A * r2d, B * r2d, C * r2d];
    }

    getArea(pts) {
        const [a, b, c] = this.getSideLengths(pts);
        const s = (a + b + c) / 2;
        return Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
    }

    // Nine-point center is midpoint of OH
    getNinePointCenter(O, H) {
        if (!O || !H) return null;
        return { x: (O.x + H.x) / 2, y: (O.y + H.y) / 2 };
    }

    draw(ctx, w, h) {
        const pts = this.points.map(p => ({ x: p.x * w, y: p.y * h }));

        this.drawGrid(ctx, w, h);

        const centroid = this.getCentroid(pts);
        const circumcenter = this.getCircumcenter(pts);
        const incenter = this.getIncenter(pts);
        const orthocenter = this.getOrthocenter(pts);
        const ninePoint = this.getNinePointCenter(circumcenter, orthocenter);
        const sideLens = this.getSideLengths(pts);
        const angles = this.getAngles(pts);
        const area = this.getArea(pts);

        // Circumcircle
        if (circumcenter) {
            const radius = this.getCircumradius(pts, circumcenter);
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(circumcenter.x, circumcenter.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Incircle
        if (incenter) {
            const inradiusScreen = this.getInradius(pts);
            ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(incenter.x, incenter.y, inradiusScreen, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Nine-point circle (radius = R/2)
        if (ninePoint && circumcenter) {
            const r9 = this.getCircumradius(pts, circumcenter) / 2;
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(ninePoint.x, ninePoint.y, r9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Medians
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.32)';
        ctx.lineWidth = 1.25;
        for (let i = 0; i < 3; i++) {
            const mid = {
                x: (pts[(i + 1) % 3].x + pts[(i + 2) % 3].x) / 2,
                y: (pts[(i + 1) % 3].y + pts[(i + 2) % 3].y) / 2
            };
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(mid.x, mid.y);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Altitudes
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.32)';
        ctx.lineWidth = 1.25;
        for (let i = 0; i < 3; i++) {
            const opp1 = pts[(i + 1) % 3];
            const opp2 = pts[(i + 2) % 3];
            const dx = opp2.x - opp1.x;
            const dy = opp2.y - opp1.y;
            const len2 = dx * dx + dy * dy;
            if (len2 > 0.01) {
                const t = ((pts[i].x - opp1.x) * dx + (pts[i].y - opp1.y) * dy) / len2;
                const foot = { x: opp1.x + t * dx, y: opp1.y + t * dy };
                ctx.beginPath();
                ctx.moveTo(pts[i].x, pts[i].y);
                ctx.lineTo(foot.x, foot.y);
                ctx.stroke();
            }
        }
        ctx.setLineDash([]);

        // Perpendicular bisectors (extend line through midpoint perpendicular to side)
        ctx.setLineDash([1, 4]);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
        ctx.lineWidth = 1.25;
        for (let i = 0; i < 3; i++) {
            const a = pts[(i + 1) % 3];
            const b = pts[(i + 2) % 3];
            const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            // perpendicular direction
            const px = -dy / len;
            const py = dx / len;
            const reach = Math.max(w, h);
            ctx.beginPath();
            ctx.moveTo(mid.x - px * reach, mid.y - py * reach);
            ctx.lineTo(mid.x + px * reach, mid.y + py * reach);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Triangle fill + outline
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(96, 165, 250, 0.07)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.85)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Euler line through G, O, H
        if (centroid && circumcenter && orthocenter) {
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.moveTo(orthocenter.x, orthocenter.y);
            ctx.lineTo(circumcenter.x, circumcenter.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Side length labels
        this.drawSideLabels(ctx, pts, sideLens, w, h);

        // Angle arcs at each vertex
        this.drawAngleArcs(ctx, pts, angles);

        // Centers
        this.drawCenter(ctx, centroid, '#ef4444', 'G');
        this.drawCenter(ctx, circumcenter, '#22c55e', 'O');
        this.drawCenter(ctx, incenter, '#eab308', 'I');
        this.drawCenter(ctx, orthocenter, '#a855f7', 'H');
        this.drawCenter(ctx, ninePoint, '#38bdf8', 'N');

        // Vertices + labels
        const labels = ['A', 'B', 'C'];
        pts.forEach((pt, i) => {
            const isDragging = i === this.dragIndex;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, isDragging ? 8 : 5, 0, Math.PI * 2);
            ctx.fillStyle = isDragging ? '#93c5fd' : 'rgba(96, 165, 250, 0.9)';
            ctx.fill();

            ctx.fillStyle = '#e2e8f0';
            ctx.font = '600 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], pt.x, pt.y - 12);
        });

        this.drawLegend(ctx, w, h, area, sideLens, angles);
        this.drawTypeSelectors(ctx, w, h);
    }

    drawSideLabels(ctx, pts, sideLens, w, h) {
        // a opposite A, b opposite B, c opposite C
        const sideNames = ['a', 'b', 'c'];
        const norm = Math.min(w, h);
        for (let i = 0; i < 3; i++) {
            const p1 = pts[(i + 1) % 3];
            const p2 = pts[(i + 2) % 3];
            const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            // Outward-ish offset away from centroid
            const C = this.getCentroid(pts);
            const dx = mid.x - C.x;
            const dy = mid.y - C.y;
            const len = Math.hypot(dx, dy) || 1;
            const ox = (dx / len) * 14;
            const oy = (dy / len) * 14;
            const valuePx = sideLens[i];
            const valueUnit = (valuePx / norm).toFixed(2);

            ctx.font = '500 11px "JetBrains Mono", monospace';
            ctx.fillStyle = '#cbd5e1';
            ctx.textAlign = 'center';
            ctx.fillText(`${sideNames[i]} = ${valueUnit}`, mid.x + ox, mid.y + oy + 4);
        }
    }

    drawAngleArcs(ctx, pts, angles) {
        for (let i = 0; i < 3; i++) {
            const v = pts[i];
            const p1 = pts[(i + 1) % 3];
            const p2 = pts[(i + 2) % 3];
            const a1 = Math.atan2(p1.y - v.y, p1.x - v.x);
            const a2 = Math.atan2(p2.y - v.y, p2.x - v.x);
            let start = a1;
            let end = a2;
            // Normalize so that arc < PI
            let diff = end - start;
            while (diff <= -Math.PI) diff += 2 * Math.PI;
            while (diff > Math.PI) diff -= 2 * Math.PI;
            const ccw = diff < 0;
            const r = 22;

            ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(v.x, v.y, r, start, end, ccw);
            ctx.stroke();

            // Angle label inside the arc
            const mid = start + diff / 2;
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

    drawLegend(ctx, w, h, area, sideLens, angles) {
        const panelW = 250;
        const panelH = 280;
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
        ctx.fillText('TRIANGLE CENTERS', x + 18, y + 24);

        const items = [
            { color: '#ef4444', label: 'G', name: 'Centroid' },
            { color: '#22c55e', label: 'O', name: 'Circumcenter' },
            { color: '#eab308', label: 'I', name: 'Incenter' },
            { color: '#a855f7', label: 'H', name: 'Orthocenter' },
            { color: '#38bdf8', label: 'N', name: 'Nine-point' }
        ];

        items.forEach((item, i) => {
            const iy = y + 48 + i * 22;
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(x + 24, iy, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e2e8f0';
            ctx.font = '500 12px Inter';
            ctx.fillText(`${item.label}  ${item.name}`, x + 36, iy + 4);
        });

        // Divider
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 168);
        ctx.lineTo(x + panelW - 18, y + 168);
        ctx.stroke();

        // Metrics
        const norm = Math.min(w, h);
        const a = (sideLens[0] / norm).toFixed(2);
        const b = (sideLens[1] / norm).toFixed(2);
        const c = (sideLens[2] / norm).toFixed(2);
        const areaUnit = (area / (norm * norm)).toFixed(3);
        const sumAngles = angles.reduce((s, v) => s + v, 0).toFixed(0);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('METRICS', x + 18, y + 188);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText(`a, b, c  =  ${a}, ${b}, ${c}`, x + 18, y + 208);
        ctx.fillText(`A, B, C  =  ${angles[0].toFixed(0)}°, ${angles[1].toFixed(0)}°, ${angles[2].toFixed(0)}°`, x + 18, y + 226);
        ctx.fillText(`Σ∠  =  ${sumAngles}°`, x + 18, y + 244);
        ctx.fillStyle = '#4ade80';
        ctx.fillText(`Area = ${areaUnit}`, x + 18, y + 262);
    }

    drawTypeSelectors(ctx, w, h) {
        const btn = this.getTypeButtonRect(w, h);

        this.triangleTypes.forEach((type, i) => {
            const x = btn.startX + i * (btn.w + btn.gap);
            const isActive = i === this.activeType;

            ctx.fillStyle = isActive ? 'rgba(96, 165, 250, 0.18)' : 'rgba(255, 255, 255, 0.04)';
            ctx.strokeStyle = isActive ? 'rgba(96, 165, 250, 0.55)' : 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.roundRect(x, btn.y, btn.w, btn.h, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isActive ? '#93c5fd' : '#e2e8f0';
            ctx.font = '500 12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(type, x + btn.w / 2, btn.y + 19);
        });
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
        ctx.lineWidth = 1;
        const step = Math.min(w, h) / 18;

        for (let x = 0; x < w; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

    getControlsHTML() {
        return `
            <div class="control-item">
                <span class="icon">🤏</span>
                <span class="text">Pinch a vertex to drag</span>
            </div>
            <div class="control-item">
                <span class="icon">🖱️</span>
                <span class="text">Drag vertices to reshape</span>
            </div>
            <div class="control-item">
                <span class="icon">⏷</span>
                <span class="text">Buttons set preset triangle</span>
            </div>
        `;
    }
}
