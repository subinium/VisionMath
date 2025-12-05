export class Renderer {
    constructor() {
        // Helper class, no internal state needed for drawing
        this.handConnections = [
            [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17]
        ];
    }

    resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        this.canvas.width = w;
        this.canvas.height = h;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawSkeleton(ctx, w, h, landmarks, connections, isVisible = () => true, lineWidth = 2, opacity = 0.6) {
        ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
        ctx.lineWidth = lineWidth;
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = lineWidth * 4;

        connections.forEach(([s, e]) => {
            if (landmarks[s] && landmarks[e] && isVisible(landmarks[s]) && isVisible(landmarks[e])) {
                const x1 = (1 - landmarks[s].x) * w, y1 = landmarks[s].y * h;
                const x2 = (1 - landmarks[e].x) * w, y2 = landmarks[e].y * h;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        });

        ctx.shadowBlur = 0;
    }

    drawFingerRings(ctx, w, h, landmarks) {
        const fingertips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky tips

        fingertips.forEach(idx => {
            const p = landmarks[idx];
            const x = (1 - p.x) * w;
            const y = p.y * h;

            // Outer ring
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Middle ring
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Center dot
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
        });
    }

    update(results) {
        this.clear();
        this.frameCount++;

        const now = performance.now();
        this.fps = 1000 / (now - this.lastTime);
        this.lastTime = now;

        // Draw hand skeletons only (no pose/face)
        if (results.hands && results.hands.landmarks) {
            results.hands.landmarks.forEach(hand => {
                this.drawSkeleton(hand, this.handConnections);
                this.drawFingerRings(hand);
            });

            if (results.hands.landmarks.length === 2) {
                this.drawFingerConnections(results.hands.landmarks[0], results.hands.landmarks[1]);
            }
        }
    }

    drawFingerConnections(hand1, hand2) {
        const w = this.canvas.width, h = this.canvas.height;
        const fingertips = [4, 8, 12, 16, 20]; // Thumb to Pinky

        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);

        fingertips.forEach(idx => {
            const p1 = hand1[idx];
            const p2 = hand2[idx];

            const x1 = (1 - p1.x) * w, y1 = p1.y * h;
            const x2 = (1 - p2.x) * w, y2 = p2.y * h;

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        });

        this.ctx.setLineDash([]);
    }
}
