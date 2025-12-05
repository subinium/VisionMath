export class PendulumMode {
    constructor() {
        this.origin = { x: 0.5, y: 0.15 };
        this.length = 0.5; // meters
        this.angle = Math.PI / 6;
        this.velocity = 0; // radians per second
        this.acceleration = 0;

        // Real physics constants
        this.g = 9.81; // m/s^2 - gravitational acceleration
        this.damping = 0.998; // Air resistance coefficient
        this.mass = 24; // Visual size only, doesn't affect period

        // Simulation parameters
        this.dt = 1 / 60; // Time step (60 FPS)

        this.isDraggingBob = false;
        this.dragOrigin = false;

        this.sliders = [
            { label: 'Air Resistance', value: 0.2, min: 0.990, max: 0.9995, x: 0.3, y: 0.85, w: 0.4, h: 0.015 }
        ];
        this.activeSlider = -1;

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

        // Check sliders
        for (let i = 0; i < this.sliders.length; i++) {
            const s = this.sliders[i];
            if (mx >= s.x && mx <= s.x + s.w && my >= s.y - 0.04 && my <= s.y + s.h + 0.04) {
                this.activeSlider = i;
                this.updateSlider(i, mx);
                return;
            }
        }

        // Check Bob
        const bobX = this.origin.x + Math.sin(this.angle) * this.length;
        const bobY = this.origin.y + Math.cos(this.angle) * this.length;
        const aspect = rect.width / rect.height;
        const distBob = Math.sqrt(((mx - bobX) * aspect) ** 2 + (my - bobY) ** 2);

        if (distBob < 0.05) {
            this.isDraggingBob = true;
            this.velocity = 0;
            return;
        }

        // Check Origin
        const distOrigin = Math.sqrt(((mx - this.origin.x) * aspect) ** 2 + (my - this.origin.y) ** 2);
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
            this.length = Math.sqrt(dx * dx + dy * dy);
            this.velocity = 0;
        } else if (this.dragOrigin) {
            this.origin.x = mx;
            this.origin.y = my;
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
        this.origin = { x: 0.5, y: 0.15 };
        this.length = 0.5;
        this.angle = Math.PI / 6;
        this.velocity = 0;
        this.acceleration = 0;
    }

    update(results, { leftHand, rightHand, leftPinch, rightPinch }) {
        const pinch = leftPinch.isPinching ? leftPinch : (rightPinch.isPinching ? rightPinch : null);

        if (pinch && pinch.isPinching) {
            if (!this.isDraggingBob && !this.dragOrigin && this.activeSlider === -1) {
                const bobX = this.origin.x + Math.sin(this.angle) * this.length;
                const bobY = this.origin.y + Math.cos(this.angle) * this.length;
                const dist = Math.sqrt((pinch.x - bobX) ** 2 + (pinch.y - bobY) ** 2);

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
                this.length = Math.sqrt(dx * dx + dy * dy);
                this.velocity = 0;
            } else if (this.activeSlider !== -1) {
                this.updateSlider(this.activeSlider, pinch.x);
            }
        } else {
            this.isDraggingBob = false;
            this.activeSlider = -1;
        }

        // Physics simulation using real equations
        if (!this.isDraggingBob) {
            // Angular acceleration: α = -(g/L) * sin(θ)
            this.acceleration = -(this.g / this.length) * Math.sin(this.angle);

            // Update angular velocity: ω = ω + α * dt
            this.velocity += this.acceleration * this.dt;

            // Apply damping
            this.velocity *= this.damping;

            // Update angle: θ = θ + ω * dt
            this.angle += this.velocity * this.dt;
        }
    }

    draw(ctx, w, h) {
        this.drawGrid(ctx, w, h);

        const ox = this.origin.x * w;
        const oy = this.origin.y * h;
        const bobX = ox + Math.sin(this.angle) * this.length * h;
        const bobY = oy + Math.cos(this.angle) * this.length * h;

        // Draw String
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(bobX, bobY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Vertical Dashed Line (Equilibrium)
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox, oy + this.length * h + 50);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Origin
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fill();

        // Draw Bob
        ctx.beginPath();
        ctx.arc(bobX, bobY, this.mass, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(bobX - 5, bobY - 5, 2, bobX, bobY, this.mass);
        grad.addColorStop(0, this.isDraggingBob ? '#93c5fd' : '#60a5fa');
        grad.addColorStop(1, this.isDraggingBob ? '#3b82f6' : '#2563eb');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Sliders
        this.sliders.forEach(s => {
            const sx = s.x * w;
            const sy = s.y * h;
            const sw = s.w * w;
            const sh = s.h * h;

            ctx.beginPath();
            ctx.roundRect(sx, sy, sw, sh, 4);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fill();

            ctx.beginPath();
            ctx.roundRect(sx, sy, sw * s.value, sh, 4);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();

            const hx = sx + sw * s.value;
            const hy = sy + sh / 2;
            ctx.beginPath();
            ctx.arc(hx, hy, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#e2e8f0';
            ctx.font = '600 12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(s.label.toUpperCase(), sx + sw / 2, sy - 15);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('Low', sx, sy + sh + 15);
            ctx.textAlign = 'right';
            ctx.fillText('High', sx + sw, sy + sh + 15);
        });

        this.drawInfoPanel(ctx, w, h);
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.03)';
        ctx.lineWidth = 1;
        const step = Math.min(w, h) / 20;
        for (let x = 0; x < w; x += step) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
    }

    drawInfoPanel(ctx, w, h) {
        const panelW = 340;
        const panelH = 240;
        const x = w - panelW - 24;
        const y = 80;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.beginPath();
        ctx.roundRect(x, y, panelW, panelH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('PENDULUM PHYSICS', x + 20, y + 30);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 14px Inter';
        ctx.fillText('Period Formula:', x + 20, y + 65);

        ctx.font = 'italic 22px "Times New Roman", serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('T = 2π√(L/g)', x + 20, y + 95);

        // Calculate period using real physics
        const T = 2 * Math.PI * Math.sqrt(this.length / this.g);

        ctx.font = '14px "Times New Roman", serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`L = ${this.length.toFixed(2)} m`, x + 20, y + 125);
        ctx.fillText(`g = ${this.g.toFixed(2)} m/s²`, x + 160, y + 125);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '13px "Times New Roman", serif';
        ctx.fillText(`T = 2π√(${this.length.toFixed(2)} / ${this.g.toFixed(2)})`, x + 20, y + 155);

        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 16px Inter';
        ctx.fillText(`   = ${T.toFixed(3)} seconds`, x + 20, y + 185);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 12px Inter';
        const text = "Period increases with √L. Independent of mass and amplitude (for small angles).";
        this.wrapText(ctx, text, x + 20, y + 210, panelW - 40, 16);
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
                <span class="icon">✊</span>
                <span class="text">Drag bob to change length</span>
            </div>
            <div class="control-item">
                <span class="icon">🤏</span>
                <span class="text">Pinch slider to adjust resistance</span>
            </div>
        `;
    }
}
