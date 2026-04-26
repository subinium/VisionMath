export class VectorAdditionMode {
    name = 'Vector Addition';

    constructor() {
        this.origin = { x: 0.5, y: 0.55 };
        this.vectors = [
            { x: 0.72, y: 0.32, color: '#ef4444', label: 'v₁' },
            { x: 0.32, y: 0.32, color: '#3b82f6', label: 'v₂' }
        ];
        this.dragIndex = -1;
        this.dragOrigin = false;
        this.mouseDown = false;
        this.setupMouse();
    }

    setupMouse() {
        const canvas = document.getElementById('overlay-canvas');
        canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.handleMouseDrag(e);
        });
        canvas.addEventListener('mousemove', (e) => {
            if (this.mouseDown) this.handleMouseDrag(e);
        });
        canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
            this.dragIndex = -1;
            this.dragOrigin = false;
        });
    }

    handleMouseDrag(e) {
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width;
        const my = (e.clientY - rect.top) / rect.height;

        if (this.dragIndex === -1 && !this.dragOrigin) {
            const dOrigin = Math.hypot(mx - this.origin.x, my - this.origin.y);
            if (dOrigin < 0.04) {
                this.dragOrigin = true;
                return;
            }

            let minDist = 0.05;
            this.vectors.forEach((v, i) => {
                const dist = Math.hypot(mx - v.x, my - v.y);
                if (dist < minDist) {
                    minDist = dist;
                    this.dragIndex = i;
                }
            });
        }

        if (this.dragOrigin) {
            this.origin.x = mx;
            this.origin.y = my;
        } else if (this.dragIndex !== -1) {
            this.vectors[this.dragIndex].x = mx;
            this.vectors[this.dragIndex].y = my;
        }
    }

    reset() {
        this.origin = { x: 0.5, y: 0.55 };
        this.vectors = [
            { x: 0.72, y: 0.32, color: '#ef4444', label: 'v₁' },
            { x: 0.32, y: 0.32, color: '#3b82f6', label: 'v₂' }
        ];
    }

    update(_results, { leftPinch, rightPinch }) {
        const pinch = leftPinch.isPinching ? leftPinch : (rightPinch.isPinching ? rightPinch : null);

        if (pinch && pinch.isPinching) {
            if (this.dragIndex === -1 && !this.dragOrigin) {
                const dOrigin = Math.hypot(pinch.x - this.origin.x, pinch.y - this.origin.y);
                if (dOrigin < 0.06) {
                    this.dragOrigin = true;
                } else {
                    let minDist = 0.06;
                    this.vectors.forEach((v, i) => {
                        const dist = Math.hypot(pinch.x - v.x, pinch.y - v.y);
                        if (dist < minDist) {
                            minDist = dist;
                            this.dragIndex = i;
                        }
                    });
                }
            }

            if (this.dragOrigin) {
                this.origin.x = pinch.x;
                this.origin.y = pinch.y;
            } else if (this.dragIndex !== -1) {
                this.vectors[this.dragIndex].x = pinch.x;
                this.vectors[this.dragIndex].y = pinch.y;
            }
        } else if (!this.mouseDown) {
            this.dragIndex = -1;
            this.dragOrigin = false;
        }
    }

    draw(ctx, w, h) {
        this.drawGrid(ctx, w, h);
        this.drawAxes(ctx, w, h);

        const ox = this.origin.x * w;
        const oy = this.origin.y * h;

        // Vector heads in screen space
        const h1x = this.vectors[0].x * w, h1y = this.vectors[0].y * h;
        const h2x = this.vectors[1].x * w, h2y = this.vectors[1].y * h;

        // Components in screen-space (y inverted by canvas convention; we keep math vector = head - origin)
        const v1x = h1x - ox, v1y = h1y - oy;
        const v2x = h2x - ox, v2y = h2y - oy;

        // Sum head
        const sumX = ox + v1x + v2x;
        const sumY = oy + v1y + v2y;

        // Diff vector v1 - v2 from origin
        const diffX = ox + (v1x - v2x);
        const diffY = oy + (v1y - v2y);

        const mag1 = Math.hypot(v1x, v1y);
        const mag2 = Math.hypot(v2x, v2y);
        const magR = Math.hypot(v1x + v2x, v1y + v2y);
        const magD = Math.hypot(v1x - v2x, v1y - v2y);

        const dot = v1x * v2x + v1y * v2y;
        const cross = v1x * v2y - v1y * v2x; // z component
        const cosT = (mag1 > 0 && mag2 > 0) ? dot / (mag1 * mag2) : 1;
        const theta = Math.acos(Math.max(-1, Math.min(1, cosT)));
        const thetaDeg = theta * 180 / Math.PI;

        // Component decomposition (axis-aligned dashed lines)
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ox, oy); ctx.lineTo(h1x, oy); ctx.lineTo(h1x, h1y);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
        ctx.beginPath();
        ctx.moveTo(ox, oy); ctx.lineTo(h2x, oy); ctx.lineTo(h2x, h2y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Parallelogram (sum)
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(h1x, h1y);
        ctx.lineTo(sumX, sumY);
        ctx.lineTo(h2x, h2y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Difference vector v1 - v2
        this.drawArrow(ctx, ox, oy, diffX, diffY, '#f59e0b', 'v₁−v₂', magD.toFixed(0), { dashed: true });

        // Resultant
        this.drawArrow(ctx, ox, oy, sumX, sumY, '#22c55e', 'v₁+v₂', magR.toFixed(0));

        // Projection of v2 onto v1 (scalar projection point)
        if (mag1 > 1) {
            const t = dot / (mag1 * mag1);
            const projX = ox + v1x * t;
            const projY = oy + v1y * t;

            // Drop a perpendicular from h2 to projection point
            ctx.setLineDash([1, 4]);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(h2x, h2y);
            ctx.lineTo(projX, projY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Projection segment
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(projX, projY);
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(projX, projY, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Angle arc between v1 and v2
        if (mag1 > 1 && mag2 > 1) {
            const a1 = Math.atan2(v1y, v1x);
            const a2 = Math.atan2(v2y, v2x);
            let diff = a2 - a1;
            while (diff <= -Math.PI) diff += 2 * Math.PI;
            while (diff > Math.PI) diff -= 2 * Math.PI;
            const ccw = diff < 0;
            const r = 36;
            ctx.strokeStyle = 'rgba(96, 165, 250, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(ox, oy, r, a1, a2, ccw);
            ctx.stroke();

            const mid = a1 + diff / 2;
            const lx = ox + Math.cos(mid) * (r + 16);
            const ly = oy + Math.sin(mid) * (r + 16);
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '500 11px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`θ = ${thetaDeg.toFixed(0)}°`, lx, ly + 3);
        }

        // Main vectors
        this.drawArrow(ctx, ox, oy, h1x, h1y, this.vectors[0].color, this.vectors[0].label, mag1.toFixed(0));
        this.drawArrow(ctx, ox, oy, h2x, h2y, this.vectors[1].color, this.vectors[1].label, mag2.toFixed(0));

        // Unit vector hats on v1 (small arrow scaled to 40px)
        if (mag1 > 1) {
            const ux = v1x / mag1, uy = v1y / mag1;
            const uLen = 40;
            this.drawArrow(ctx, ox, oy, ox + ux * uLen, oy + uy * uLen, '#fb7185', 'v̂₁', null, { thin: true });
        }

        // Origin
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('O', ox, oy + 20);

        this.drawInfoPanel(ctx, w, h, { mag1, mag2, magR, magD, dot, cross, thetaDeg, v1x, v1y, v2x, v2y });
    }

    drawArrow(ctx, x1, y1, x2, y2, color, label, magnitude, opts = {}) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        if (len < 1) return;
        const angle = Math.atan2(dy, dx);
        const headlen = opts.thin ? 7 : 10;

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = opts.thin ? 1.25 : 2;

        if (opts.dashed) ctx.setLineDash([5, 4]);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        if (label) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            // Offset label perpendicular to arrow
            const ox = -Math.sin(angle) * 12;
            const oy = Math.cos(angle) * 12;
            ctx.fillStyle = color;
            ctx.font = '600 12px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(label, midX + ox, midY + oy);

            if (magnitude) {
                ctx.font = '400 10px "JetBrains Mono", monospace';
                ctx.fillStyle = '#cbd5e1';
                ctx.fillText(magnitude, midX + ox, midY + oy + 14);
            }
        }
    }

    drawAxes(ctx, w, h) {
        const ox = this.origin.x * w;
        const oy = this.origin.y * h;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, oy); ctx.lineTo(w, oy);
        ctx.moveTo(ox, 0); ctx.lineTo(ox, h);
        ctx.stroke();
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
        ctx.lineWidth = 1;
        const step = Math.min(w, h) / 18;
        for (let x = 0; x < w; x += step) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
    }

    drawInfoPanel(ctx, w, _h, m) {
        const panelW = 280;
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
        ctx.fillText('VECTOR ADDITION', x + 18, y + 24);

        let yPos = y + 50;
        const lh = 18;

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('MAGNITUDES', x + 18, yPos); yPos += 16;

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText(`|v₁| = ${m.mag1.toFixed(1)}`, x + 18, yPos);
        ctx.fillText(`|v₂| = ${m.mag2.toFixed(1)}`, x + 150, yPos);
        yPos += lh;
        ctx.fillStyle = '#4ade80';
        ctx.fillText(`|v₁+v₂| = ${m.magR.toFixed(1)}`, x + 18, yPos);
        yPos += lh;
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`|v₁−v₂| = ${m.magD.toFixed(1)}`, x + 18, yPos);
        yPos += lh + 6;

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('PRODUCTS', x + 18, yPos); yPos += 16;

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText(`v₁·v₂ = ${m.dot.toFixed(0)}`, x + 18, yPos);
        ctx.fillText(`θ = ${m.thetaDeg.toFixed(1)}°`, x + 150, yPos);
        yPos += lh;
        ctx.fillText(`(v₁×v₂)_z = ${m.cross.toFixed(0)}`, x + 18, yPos);
        yPos += lh + 6;

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('COMPONENTS', x + 18, yPos); yPos += 16;

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText(`v₁ = (${m.v1x.toFixed(0)}, ${(-m.v1y).toFixed(0)})`, x + 18, yPos);
        yPos += lh;
        ctx.fillText(`v₂ = (${m.v2x.toFixed(0)}, ${(-m.v2y).toFixed(0)})`, x + 18, yPos);
        yPos += lh + 6;

        // Cosine law check
        const lhs = m.magR * m.magR;
        const rhs = m.mag1 * m.mag1 + m.mag2 * m.mag2 + 2 * m.dot;
        ctx.fillStyle = '#60a5fa';
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillText(`|v₁+v₂|² ≈ |v₁|²+|v₂|²+2 v₁·v₂`, x + 18, yPos);
        yPos += lh - 2;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${lhs.toFixed(0)} ≈ ${rhs.toFixed(0)}`, x + 18, yPos);
    }

    getControlsHTML() {
        return `
            <div class="control-item">
                <span class="icon">🤏</span>
                <span class="text">Pinch a vector head to drag</span>
            </div>
            <div class="control-item">
                <span class="icon">⚪</span>
                <span class="text">Drag origin to move axes</span>
            </div>
            <div class="control-item">
                <span class="icon">📐</span>
                <span class="text">Sum, diff, projection auto-compute</span>
            </div>
        `;
    }
}
