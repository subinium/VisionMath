export class TriangleCentersMode {
    constructor() {
        this.points = [];
        this.dragIndex = -1;
        this.mouseDown = false;
        this.triangleTypes = ['Acute', 'Right', 'Obtuse'];
        this.reset();
        this.setupMouse();
    }

    setupMouse() {
        const canvas = document.getElementById('overlay-canvas');
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            // Button dimensions - MUCH LARGER for testing
            const btnW = 100;
            const btnH = 32;
            const gap = 10;
            const totalW = this.triangleTypes.length * btnW + (this.triangleTypes.length - 1) * gap;
            const startX = (rect.width - totalW) / 2;
            const startY = rect.height - 60;

            console.log('=== TRIANGLE MODE CLICK ===');
            console.log('Mouse:', mx.toFixed(1), my.toFixed(1));
            console.log('Canvas rect:', rect.width.toFixed(1), rect.height.toFixed(1));
            console.log('Button area X:', startX.toFixed(1), '-', (startX + totalW).toFixed(1));
            console.log('Button area Y:', startY.toFixed(1), '-', (startY + btnH).toFixed(1));

            // Check if in general button area first
            if (my >= startY && my <= startY + btnH) {
                console.log('✓ Y coordinate is in button area!');

                for (let i = 0; i < this.triangleTypes.length; i++) {
                    const bx = startX + i * (btnW + gap);

                    console.log(`Button ${i} (${this.triangleTypes[i]}): X=${bx.toFixed(1)}-${(bx + btnW).toFixed(1)}`);

                    if (mx >= bx && mx <= bx + btnW) {
                        console.log(`✓✓✓ BUTTON ${i} CLICKED: ${this.triangleTypes[i]}`);
                        this.setTriangleType(i);
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                }
            } else {
                console.log('✗ Y coordinate NOT in button area');
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

    setTriangleType(typeIndex) {
        if (typeIndex === 0) { // Acute
            this.points = [
                { x: 0.5, y: 0.25 },
                { x: 0.3, y: 0.65 },
                { x: 0.7, y: 0.65 }
            ];
        } else if (typeIndex === 1) { // Right
            this.points = [
                { x: 0.3, y: 0.25 },
                { x: 0.3, y: 0.65 },
                { x: 0.7, y: 0.65 }
            ];
        } else if (typeIndex === 2) { // Obtuse
            this.points = [
                { x: 0.2, y: 0.25 },
                { x: 0.4, y: 0.65 },
                { x: 0.8, y: 0.65 }
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
                const dx = mx - p.x;
                const dy = my - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
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
        this.setTriangleType(0); // Default to Acute
        this.dragIndex = -1;
    }

    update(results, { leftHand, rightHand, leftPinch, rightPinch }) {
        const pinch = leftPinch.isPinching ? leftPinch : (rightPinch.isPinching ? rightPinch : null);

        if (pinch && pinch.isPinching) {
            if (this.dragIndex === -1) {
                let minDist = 0.06;
                this.points.forEach((p, i) => {
                    const dx = pinch.x - p.x;
                    const dy = pinch.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
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

    // All calculations in screen coordinates for accuracy
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
        const a = Math.sqrt((pts[1].x - pts[2].x) ** 2 + (pts[1].y - pts[2].y) ** 2);
        const b = Math.sqrt((pts[0].x - pts[2].x) ** 2 + (pts[0].y - pts[2].y) ** 2);
        const c = Math.sqrt((pts[0].x - pts[1].x) ** 2 + (pts[0].y - pts[1].y) ** 2);
        const perimeter = a + b + c;
        if (perimeter < 0.0001) return null;

        return {
            x: (a * pts[0].x + b * pts[1].x + c * pts[2].x) / perimeter,
            y: (a * pts[0].y + b * pts[1].y + c * pts[2].y) / perimeter
        };
    }

    getOrthocenter(pts) {
        const ax = pts[0].x, ay = pts[0].y;
        const bx = pts[1].x, by = pts[1].y;
        const cx = pts[2].x, cy = pts[2].y;

        // Using the formula: H = A + B + C - 2*O (where O is circumcenter)
        const O = this.getCircumcenter(pts);
        if (!O) return null;

        return {
            x: ax + bx + cx - 2 * O.x,
            y: ay + by + cy - 2 * O.y
        };
    }

    getCircumradius(pts, circumcenter) {
        if (!circumcenter) return 0;
        return Math.sqrt(
            (pts[0].x - circumcenter.x) ** 2 +
            (pts[0].y - circumcenter.y) ** 2
        );
    }

    getInradius(pts) {
        const a = Math.sqrt((pts[1].x - pts[2].x) ** 2 + (pts[1].y - pts[2].y) ** 2);
        const b = Math.sqrt((pts[0].x - pts[2].x) ** 2 + (pts[0].y - pts[2].y) ** 2);
        const c = Math.sqrt((pts[0].x - pts[1].x) ** 2 + (pts[0].y - pts[1].y) ** 2);
        const s = (a + b + c) / 2;
        const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
        return s > 0 ? area / s : 0;
    }

    draw(ctx, w, h) {
        // Convert to screen coordinates (original method)
        const pts = this.points.map(p => ({
            x: p.x * w,
            y: p.y * h
        }));

        this.drawGrid(ctx, w, h);

        // Calculate centers in screen coordinates
        const centroid = this.getCentroid(pts);
        const circumcenter = this.getCircumcenter(pts);
        const incenter = this.getIncenter(pts);
        const orthocenter = this.getOrthocenter(pts);

        // Draw circumcircle
        if (circumcenter) {
            const radius = this.getCircumradius(pts, circumcenter);
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)'; // Darker
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(circumcenter.x, circumcenter.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw incircle
        if (incenter) {
            const radius = this.getInradius(pts);
            ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)'; // Darker
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(incenter.x, incenter.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw medians (thin dashed)
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // Darker
        ctx.lineWidth = 1.5;
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

        // Draw altitudes (thin dashed)
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)'; // Darker
        ctx.lineWidth = 1.5;
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

        // Draw triangle
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.06)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // Darker
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Euler line (through G, O, H)
        if (centroid && circumcenter && orthocenter) {
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'; // Darker
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(orthocenter.x, orthocenter.y);
            ctx.lineTo(circumcenter.x, circumcenter.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw centers
        this.drawCenter(ctx, centroid, '#ef4444', 'G');
        this.drawCenter(ctx, circumcenter, '#22c55e', 'O');
        this.drawCenter(ctx, incenter, '#eab308', 'I');
        this.drawCenter(ctx, orthocenter, '#a855f7', 'H');

        // Draw vertices
        const labels = ['A', 'B', 'C'];
        pts.forEach((pt, i) => {
            const isDragging = i === this.dragIndex;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, isDragging ? 8 : 5, 0, Math.PI * 2);
            ctx.fillStyle = isDragging ? '#60a5fa' : 'rgba(59, 130, 246, 0.8)';
            ctx.fill();

            ctx.fillStyle = '#e2e8f0';
            ctx.font = '500 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], pt.x, pt.y - 12);
        });

        this.drawLegend(ctx, w, h);
        this.drawTypeSelectors(ctx, w, h);
    }

    drawCenter(ctx, pos, color, label) {
        if (!pos) return;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = color;
        ctx.font = '500 10px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(label, pos.x + 8, pos.y + 3);
    }

    drawLegend(ctx, w, h) {
        const panelW = 280;
        const panelH = 200;
        const x = w - panelW - 24;
        const y = 80;

        // Glass panel
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.beginPath();
        ctx.roundRect(x, y, panelW, panelH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Title
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('TRIANGLE CENTERS', x + 20, y + 30);

        const items = [
            { color: 'rgba(239, 68, 68, 0.95)', label: 'G', name: 'Centroid', desc: 'Intersection of medians' },
            { color: 'rgba(34, 197, 94, 0.95)', label: 'O', name: 'Circumcenter', desc: 'Equidistant from vertices' },
            { color: 'rgba(234, 179, 8, 0.95)', label: 'I', name: 'Incenter', desc: 'Equidistant from edges' },
            { color: 'rgba(168, 85, 247, 0.95)', label: 'H', name: 'Orthocenter', desc: 'Intersection of altitudes' }
        ];

        items.forEach((item, i) => {
            const iy = y + 60 + i * 36;

            // Dot
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(x + 28, iy, 5, 0, Math.PI * 2);
            ctx.fill();

            // Label and name
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '600 13px Inter';
            ctx.fillText(`${item.label}  ${item.name}`, x + 44, iy + 4);

            // Description
            ctx.fillStyle = '#94a3b8';
            ctx.font = '400 11px Inter';
            ctx.fillText(item.desc, x + 44, iy + 20);
        });
    }

    drawTypeSelectors(ctx, w, h) {
        const btnW = 100;
        const btnH = 32;
        const gap = 10;
        const totalW = this.triangleTypes.length * btnW + (this.triangleTypes.length - 1) * gap;
        const startX = (w - totalW) / 2;
        const y = h - 60;

        this.triangleTypes.forEach((type, i) => {
            const x = startX + i * (btnW + gap);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.roundRect(x, y, btnW, btnH, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#e2e8f0';
            ctx.font = '500 12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(type, x + btnW / 2, y + 20);
        });
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
        ctx.lineWidth = 1;
        const step = Math.min(w, h) / 16;

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
                <span class="icon">🖱️</span>
                <span class="text">Drag vertices to reshape</span>
            </div>
            <div class="control-item">
                <span class="icon">🖱️</span>
                <span class="text">Click buttons to set type</span>
            </div>
        `;
    }
}
