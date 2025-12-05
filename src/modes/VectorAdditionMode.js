export class VectorAdditionMode {
    constructor() {
        this.origin = { x: 0.5, y: 0.5 };
        this.vectors = [
            { x: 0.7, y: 0.3, color: '#ef4444', label: 'v1' },
            { x: 0.3, y: 0.3, color: '#3b82f6', label: 'v2' }
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
        const mx = (e.clientX - rect.left) / canvas.width;
        const my = (e.clientY - rect.top) / canvas.height;

        if (this.dragIndex === -1 && !this.dragOrigin) {
            // Check origin
            const dOrigin = Math.sqrt((mx - this.origin.x) ** 2 + (my - this.origin.y) ** 2);
            if (dOrigin < 0.05) {
                this.dragOrigin = true;
                return;
            }

            // Check vectors
            let minDist = 0.05;
            this.vectors.forEach((v, i) => {
                const dist = Math.sqrt((mx - v.x) ** 2 + (my - v.y) ** 2);
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
        this.origin = { x: 0.5, y: 0.5 };
        this.vectors = [
            { x: 0.7, y: 0.3, color: '#ef4444', label: 'v1' },
            { x: 0.3, y: 0.3, color: '#3b82f6', label: 'v2' }
        ];
    }

    update(results, { leftHand, rightHand, leftPinch, rightPinch }) {
        const pinch = leftPinch.isPinching ? leftPinch : (rightPinch.isPinching ? rightPinch : null);

        if (pinch && pinch.isPinching) {
            if (this.dragIndex === -1 && !this.dragOrigin) {
                const dOrigin = Math.sqrt((pinch.x - this.origin.x) ** 2 + (pinch.y - this.origin.y) ** 2);
                if (dOrigin < 0.06) {
                    this.dragOrigin = true;
                } else {
                    let minDist = 0.06;
                    this.vectors.forEach((v, i) => {
                        const dist = Math.sqrt((pinch.x - v.x) ** 2 + (pinch.y - v.y) ** 2);
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

        const ox = this.origin.x * w;
        const oy = this.origin.y * h;

        // Calculate Resultant
        const resX = this.vectors[0].x + (this.vectors[1].x - this.origin.x);
        const resY = this.vectors[0].y + (this.vectors[1].y - this.origin.y);
        const rx = resX * w;
        const ry = resY * h;

        // Calculate magnitudes for display
        const v1x = this.vectors[0].x * w - ox;
        const v1y = this.vectors[0].y * h - oy;
        const v2x = this.vectors[1].x * w - ox;
        const v2y = this.vectors[1].y * h - oy;
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
        const magR = Math.sqrt((rx - ox) ** 2 + (ry - oy) ** 2);

        // Draw Parallelogram
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(this.vectors[0].x * w, this.vectors[0].y * h);
        ctx.lineTo(rx, ry);
        ctx.lineTo(this.vectors[1].x * w, this.vectors[1].y * h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Resultant Vector
        this.drawArrow(ctx, ox, oy, rx, ry, '#22c55e', 'v1 + v2', magR.toFixed(1));

        // Draw Vectors
        this.drawArrow(ctx, ox, oy, this.vectors[0].x * w, this.vectors[0].y * h, this.vectors[0].color, this.vectors[0].label, mag1.toFixed(1));
        this.drawArrow(ctx, ox, oy, this.vectors[1].x * w, this.vectors[1].y * h, this.vectors[1].color, this.vectors[1].label, mag2.toFixed(1));

        // Draw Origin
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter';
        ctx.fillText('Origin', ox - 20, oy + 20);

        this.drawInfoPanel(ctx, w, h);
    }

    drawArrow(ctx, x1, y1, x2, y2, color, label, magnitude) {
        const headlen = 10;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);

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
        ctx.lineTo(x2, y2);
        ctx.fill();

        // Label at midpoint
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        ctx.fillStyle = color;
        ctx.font = '600 14px Inter';
        ctx.fillText(label, midX + 10, midY - 5);

        // Magnitude below label
        if (magnitude) {
            ctx.font = '400 12px Inter';
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText(`|${label}| = ${magnitude}`, midX + 10, midY + 10);
        }
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
        ctx.lineWidth = 1;
        const step = Math.min(w, h) / 16;
        for (let x = 0; x < w; x += step) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
    }

    drawInfoPanel(ctx, w, h) {
        const panelW = 320;
        const panelH = 260;
        const x = w - panelW - 24;
        const y = 80;

        // Calculate vector properties
        const ox = this.origin.x * w;
        const oy = this.origin.y * h;
        const v1x = this.vectors[0].x * w - ox;
        const v1y = this.vectors[0].y * h - oy;
        const v2x = this.vectors[1].x * w - ox;
        const v2y = this.vectors[1].y * h - oy;

        // Magnitudes
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
        const magR = Math.sqrt((v1x + v2x) ** 2 + (v1y + v2y) ** 2);

        // Angle between vectors using dot product
        const dotProduct = v1x * v2x + v1y * v2y;
        const cosTheta = dotProduct / (mag1 * mag2);
        const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180 / Math.PI;

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
        ctx.fillText('VECTOR ADDITION', x + 20, y + 30);

        let yPos = y + 60;
        const lineHeight = 22;

        // Vector magnitudes
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 13px Inter';
        ctx.fillText(`|v₁| = ${mag1.toFixed(1)}`, x + 20, yPos);
        ctx.fillText(`|v₂| = ${mag2.toFixed(1)}`, x + 160, yPos);
        yPos += lineHeight;

        ctx.fillText(`|v₁ + v₂| = ${magR.toFixed(1)}`, x + 20, yPos);
        yPos += lineHeight + 8;

        // Angle between vectors
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 12px Inter';
        ctx.fillText(`Angle between vectors:`, x + 20, yPos);
        yPos += lineHeight - 4;

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 13px Inter';
        ctx.fillText(`θ = ${theta.toFixed(1)}°`, x + 20, yPos);
        yPos += lineHeight + 8;

        // Cosine law formula
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 13px "Georgia", serif';
        ctx.fillText(`|v₁ + v₂|² = |v₁|² + |v₂|² + 2|v₁||v₂|cos θ`, x + 20, yPos);
        yPos += lineHeight;

        // Verification
        const lhs = magR * magR;
        const rhs = mag1 * mag1 + mag2 * mag2 + 2 * mag1 * mag2 * cosTheta;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 11px Inter';
        ctx.fillText(`${lhs.toFixed(0)} ≈ ${rhs.toFixed(0)}`, x + 20, yPos);
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
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
                <span class="icon">👆</span>
                <span class="text">Drag vector heads to change magnitude/direction</span>
            </div>
            <div class="control-item">
                <span class="icon">⚪</span>
                <span class="text">Drag origin to move coordinate system</span>
            </div>
        `;
    }
}
