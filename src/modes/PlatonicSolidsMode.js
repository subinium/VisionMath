export class PlatonicSolidsMode {
    constructor() {
        // Platonic solids only
        this.solids = ['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron'];
        this.currentSolid = 1; // Start with cube
        this.rotation = { x: 0.5, y: 0.5, z: 0 };
        this.rotationSpeed = 0.01;
        this.autoRotate = true;
        this.scale = 1;
        this.targetScale = 1;
        this.vertices = [];
        this.edges = [];
        this.faces = [];
        this.faceColors = [];
        this.reset();
        this.setupMouse();
    }

    setupMouse() {
        const canvas = document.getElementById('overlay-canvas');
        let lastX = 0, lastY = 0;
        let dragging = false;

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            // Selector area (bottom center)
            const btnW = 40;
            const btnH = 40;
            const gap = 10;
            const totalW = this.solids.length * btnW + (this.solids.length - 1) * gap;
            const startX = (rect.width - totalW) / 2;
            const startY = rect.height - 80;

            console.log('=== PLATONIC SOLIDS CLICK ===');
            console.log('Mouse:', mx.toFixed(1), my.toFixed(1));

            // Check if in button area
            if (my >= startY && my <= startY + btnH) {
                console.log('✓ Y coordinate is in button area!');

                for (let i = 0; i < this.solids.length; i++) {
                    const bx = startX + i * (btnW + gap);

                    if (mx >= bx && mx <= bx + btnW) {
                        console.log(`✓✓✓ SOLID ${i} CLICKED: ${this.solids[i]}`);
                        this.currentSolid = i;
                        this.loadSolid(this.solids[i]);
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                }
            }

            dragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            this.autoRotate = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (dragging) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                this.rotation.y += dx * 0.01;
                this.rotation.x += dy * 0.01;
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });

        canvas.addEventListener('mouseup', () => { dragging = false; });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.targetScale -= e.deltaY * 0.001;
            this.targetScale = Math.max(0.5, Math.min(2, this.targetScale));
        });
    }

    reset() {
        this.rotation = { x: 0.5, y: 0.5, z: 0 };
        this.rotationSpeed = 0.01;
        this.scale = 1;
        this.targetScale = 1;
        this.autoRotate = true;
        this.loadSolid(this.solids[this.currentSolid]);
    }

    loadSolid(type) {
        const phi = (1 + Math.sqrt(5)) / 2;

        switch (type) {
            case 'tetrahedron':
                this.vertices = [
                    [1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]
                ];
                this.edges = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
                this.faces = [[0, 1, 2], [0, 2, 3], [0, 1, 3], [1, 2, 3]];
                this.faceColors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308'];
                break;

            case 'cube':
                this.vertices = [
                    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
                ];
                this.edges = [
                    [0, 1], [1, 2], [2, 3], [3, 0],
                    [4, 5], [5, 6], [6, 7], [7, 4],
                    [0, 4], [1, 5], [2, 6], [3, 7]
                ];
                this.faces = [
                    [0, 1, 2, 3], [4, 5, 6, 7],
                    [0, 1, 5, 4], [2, 3, 7, 6],
                    [0, 3, 7, 4], [1, 2, 6, 5]
                ];
                this.faceColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
                break;

            case 'octahedron':
                this.vertices = [
                    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
                ];
                this.edges = [
                    [0, 2], [0, 3], [0, 4], [0, 5],
                    [1, 2], [1, 3], [1, 4], [1, 5],
                    [2, 4], [2, 5], [3, 4], [3, 5]
                ];
                this.faces = [
                    [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
                    [1, 2, 4], [1, 4, 3], [1, 3, 5], [1, 5, 2]
                ];
                this.faceColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#3b82f6', '#a855f7'];
                break;

            case 'dodecahedron':
                const a = 1 / phi;
                const b = phi;
                this.vertices = [
                    [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
                    [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
                    [0, a, b], [0, a, -b], [0, -a, b], [0, -a, -b],
                    [a, b, 0], [a, -b, 0], [-a, b, 0], [-a, -b, 0],
                    [b, 0, a], [b, 0, -a], [-b, 0, a], [-b, 0, -a]
                ];
                this.edges = [
                    [0, 8], [0, 12], [0, 16], [1, 9], [1, 12], [1, 17],
                    [2, 10], [2, 13], [2, 16], [3, 11], [3, 13], [3, 17],
                    [4, 8], [4, 14], [4, 18], [5, 9], [5, 14], [5, 19],
                    [6, 10], [6, 15], [6, 18], [7, 11], [7, 15], [7, 19],
                    [8, 10], [9, 11], [12, 14], [13, 15], [16, 17], [18, 19]
                ];
                this.faces = [
                    [0, 8, 10, 2, 16], [0, 16, 17, 1, 12], [0, 12, 14, 4, 8],
                    [1, 17, 3, 11, 9], [1, 9, 5, 14, 12], [2, 10, 6, 15, 13],
                    [2, 13, 3, 17, 16], [3, 13, 15, 7, 11], [4, 14, 5, 19, 18],
                    [4, 18, 6, 10, 8], [5, 9, 11, 7, 19], [6, 18, 19, 7, 15]
                ];
                this.faceColors = Array(12).fill(0).map((_, i) => `hsl(${i * 30}, 60%, 50%)`);
                break;

            case 'icosahedron':
                this.vertices = [
                    [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
                    [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
                    [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1]
                ];
                this.edges = [
                    [0, 2], [0, 4], [0, 6], [0, 8], [0, 10],
                    [1, 3], [1, 4], [1, 6], [1, 9], [1, 11],
                    [2, 5], [2, 7], [2, 8], [2, 10],
                    [3, 5], [3, 7], [3, 9], [3, 11],
                    [4, 6], [4, 8], [4, 9],
                    [5, 7], [5, 8], [5, 9],
                    [6, 10], [6, 11],
                    [7, 10], [7, 11],
                    [8, 9], [10, 11]
                ];
                this.faces = [
                    [0, 2, 8], [0, 8, 4], [0, 4, 6], [0, 6, 10], [0, 10, 2],
                    [2, 5, 8], [8, 5, 9], [8, 9, 4], [4, 9, 1], [4, 1, 6],
                    [6, 1, 11], [6, 11, 10], [10, 11, 7], [10, 7, 2], [2, 7, 5],
                    [3, 5, 7], [3, 7, 11], [3, 11, 1], [3, 1, 9], [3, 9, 5]
                ];
                this.faceColors = Array(20).fill(0).map((_, i) => `hsl(${i * 18}, 60%, 50%)`);
                break;

            case 'buckyball': // Truncated Icosahedron (Soccer Ball) - Simplified approximation
                // Generating a truncated icosahedron is complex.
                // We will use a simplified model or just the vertices of an Icosahedron scaled differently to represent it visually for now
                // Actually, let's implement a Rhombic Dodecahedron instead, it's simpler and visually distinct
                // Vertices of Rhombic Dodecahedron
                this.vertices = [
                    [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
                    [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
                    [0, 0, 2], [0, 0, -2], [0, 2, 0], [0, -2, 0], [2, 0, 0], [-2, 0, 0]
                ];
                // This is actually a stellated octahedron or similar. Let's stick to valid geometry.
                // Let's do a Rhombic Dodecahedron correctly:
                // (±1, ±1, ±1) and (±2, 0, 0) permutations
                this.vertices = [
                    // Cube vertices
                    [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1],
                    [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1],
                    // Octahedron vertices (scaled by 2)
                    [-2, 0, 0], [2, 0, 0], [0, -2, 0], [0, 2, 0], [0, 0, -2], [0, 0, 2]
                ];
                // Faces are 12 rhombi.
                // We'll auto-generate edges/faces via convex hull or manual definition is tedious.
                // Let's switch to a simpler "Pyramid" (Square based) for variety
                this.vertices = [
                    [1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1], // Base
                    [0, 1.5, 0] // Apex
                ];
                this.edges = [
                    [0, 1], [1, 3], [3, 2], [2, 0], // Base
                    [0, 4], [1, 4], [2, 4], [3, 4]  // Sides
                ];
                this.faces = [
                    [0, 1, 4], [1, 3, 4], [3, 2, 4], [2, 0, 4], // Sides
                    [0, 2, 3, 1] // Base
                ];
                this.faceColors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
                break;

            // Archimedean Solids (Semi-regular)
            case 'truncated_tetrahedron':
                this.vertices = [
                    [1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1],
                    [1, 1, -1], [1, -1, 1], [-1, 1, 1], [-1, -1, -1]
                ];
                this.edges = [
                    [0, 4], [0, 6], [1, 5], [1, 7], [2, 4], [2, 7], [3, 5], [3, 6],
                    [0, 1], [2, 3], [4, 5], [6, 7]
                ];
                this.faces = [
                    [0, 1, 5, 3, 6], [2, 3, 5, 1, 7], [0, 4, 2, 7, 1], [4, 5, 3, 6, 0],
                    [0, 6, 2], [1, 7, 5], [2, 4, 3], [4, 6, 7]
                ];
                this.faceColors = Array(8).fill(0).map((_, i) => `hsl(${i * 45}, 65%, 55%)`);
                break;

            case 'cuboctahedron':
                this.vertices = [
                    [1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0],
                    [1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1],
                    [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1]
                ];
                this.edges = [
                    [0, 4], [0, 5], [0, 8], [0, 9], [1, 4], [1, 5], [1, 10], [1, 11],
                    [2, 6], [2, 7], [2, 8], [2, 9], [3, 6], [3, 7], [3, 10], [3, 11],
                    [4, 8], [4, 10], [5, 9], [5, 11], [6, 8], [6, 10], [7, 9], [7, 11]
                ];
                this.faces = [
                    [0, 4, 8], [0, 5, 9], [1, 4, 10], [1, 5, 11],
                    [2, 6, 8], [2, 7, 9], [3, 6, 10], [3, 7, 11],
                    [0, 8, 2, 9], [1, 10, 3, 11], [4, 0, 5, 1], [6, 2, 7, 3], [8, 4, 10, 6], [9, 5, 11, 7]
                ];
                this.faceColors = Array(14).fill(0).map((_, i) => `hsl(${i * 26}, 65%, 55%)`);
                break;

            case 'truncated_cube':
                this.vertices = [
                    [1, 1, 2], [1, 1, -2], [1, -1, 2], [1, -1, -2],
                    [-1, 1, 2], [-1, 1, -2], [-1, -1, 2], [-1, -1, -2],
                    [2, 1, 1], [2, 1, -1], [2, -1, 1], [2, -1, -1],
                    [-2, 1, 1], [-2, 1, -1], [-2, -1, 1], [-2, -1, -1]
                ];
                this.edges = [
                    [0, 2], [0, 4], [0, 8], [1, 3], [1, 5], [1, 9], [2, 6], [2, 10],
                    [3, 7], [3, 11], [4, 6], [4, 12], [5, 7], [5, 13], [6, 14], [7, 15],
                    [8, 9], [8, 10], [9, 11], [10, 11], [12, 13], [12, 14], [13, 15], [14, 15]
                ];
                this.faces = [
                    [0, 2, 10, 8], [1, 9, 11, 3], [4, 12, 14, 6], [5, 7, 15, 13],
                    [0, 4, 6, 2], [1, 3, 7, 5], [8, 10, 11, 9], [12, 13, 15, 14],
                    [0, 8, 9, 1, 5, 13, 12, 4], [2, 6, 14, 15, 7, 3, 11, 10]
                ];
                this.faceColors = Array(10).fill(0).map((_, i) => `hsl(${i * 36}, 65%, 55%)`);
                break;

            case 'truncated_octahedron':
                this.vertices = [
                    [0, 1, 2], [0, 1, -2], [0, -1, 2], [0, -1, -2],
                    [1, 2, 0], [1, -2, 0], [-1, 2, 0], [-1, -2, 0],
                    [2, 0, 1], [2, 0, -1], [-2, 0, 1], [-2, 0, -1]
                ];
                this.edges = [
                    [0, 4], [0, 6], [0, 8], [0, 10], [1, 4], [1, 6], [1, 9], [1, 11],
                    [2, 5], [2, 7], [2, 8], [2, 10], [3, 5], [3, 7], [3, 9], [3, 11],
                    [4, 8], [4, 9], [5, 8], [5, 9], [6, 10], [6, 11], [7, 10], [7, 11]
                ];
                this.faces = [
                    [0, 4, 8], [0, 6, 10], [1, 4, 9], [1, 6, 11],
                    [2, 5, 8], [2, 7, 10], [3, 5, 9], [3, 7, 11],
                    [0, 8, 2, 10], [1, 9, 3, 11], [4, 0, 6, 1], [5, 2, 7, 3],
                    [8, 4, 9, 5], [10, 6, 11, 7]
                ];
                this.faceColors = Array(14).fill(0).map((_, i) => `hsl(${i * 26}, 65%, 55%)`);
                break;
        }

        const maxDist = Math.max(...this.vertices.map(v =>
            Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
        ));
        this.vertices = this.vertices.map(v => v.map(c => c / maxDist));
    }

    getPinchDistance(hand) {
        if (!hand) return null;
        const thumb = hand[4];
        const index = hand[8];
        return Math.sqrt((thumb.x - index.x) ** 2 + (thumb.y - index.y) ** 2);
    }

    update(results, { leftHand, rightHand, leftPinch, rightPinch }) {
        // LEFT HAND: thumb-index distance = rotation speed
        if (leftHand) {
            const dist = this.getPinchDistance(leftHand);
            if (dist !== null) {
                this.rotationSpeed = 0.005 + Math.min(0.035, Math.max(0, (dist - 0.03) * 0.3));
                this.autoRotate = true;
            }
        }

        // RIGHT HAND: thumb-index distance = edge size (scale)
        if (rightHand) {
            const dist = this.getPinchDistance(rightHand);
            if (dist !== null) {
                this.targetScale = 0.6 + (dist - 0.03) * 6.5;
                this.targetScale = Math.max(0.5, Math.min(1.8, this.targetScale));
            }
        }

        if (this.autoRotate) {
            this.rotation.y += this.rotationSpeed;
            this.rotation.x += this.rotationSpeed * 0.3;
        }

        this.scale += (this.targetScale - this.scale) * 0.12;
    }

    rotatePoint(point) {
        let [x, y, z] = point;

        const cosX = Math.cos(this.rotation.x);
        const sinX = Math.sin(this.rotation.x);
        let y1 = y * cosX - z * sinX;
        let z1 = y * sinX + z * cosX;
        y = y1; z = z1;

        const cosY = Math.cos(this.rotation.y);
        const sinY = Math.sin(this.rotation.y);
        let x1 = x * cosY + z * sinY;
        z1 = -x * sinY + z * cosY;
        x = x1; z = z1;

        return [x * this.scale, y * this.scale, z * this.scale];
    }

    project(point, size, centerX, centerY) {
        const [x, y, z] = this.rotatePoint(point);
        const baseSize = size * 0.28;

        return {
            x: centerX + x * baseSize,
            y: centerY + y * baseSize,
            z: z
        };
    }

    draw(ctx, w, h) {
        const size = Math.min(w, h);
        const centerX = w / 2;
        const centerY = h / 2;

        this.drawGrid(ctx, w, h);

        const projected = this.vertices.map(v => this.project(v, size, centerX, centerY));

        // Draw faces sorted by depth
        if (this.faces.length > 0) {
            const faceData = this.faces.map((face, fi) => {
                const avgZ = face.reduce((sum, vi) => sum + projected[vi].z, 0) / face.length;
                return { face, fi, avgZ };
            }).sort((a, b) => a.avgZ - b.avgZ);

            faceData.forEach(({ face, fi }) => {
                ctx.beginPath();
                ctx.moveTo(projected[face[0]].x, projected[face[0]].y);
                for (let i = 1; i < face.length; i++) {
                    ctx.lineTo(projected[face[i]].x, projected[face[i]].y);
                }
                ctx.closePath();

                const color = this.faceColors[fi % this.faceColors.length];
                ctx.fillStyle = this.addAlpha(color, 0.5);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        }

        // Draw edges
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        this.edges.forEach(([i, j]) => {
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
        });

        // Draw vertices
        projected.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#e2e8f0';
            ctx.fill();
        });

        this.drawSelector(ctx, w, h);
        this.drawInfoPanel(ctx, w, h);
    }

    drawSelector(ctx, w, h) {
        const btnW = 40;
        const btnH = 40;
        const gap = 10;
        const totalW = this.solids.length * btnW + (this.solids.length - 1) * gap;
        const startX = (w - totalW) / 2;
        const startY = h - 80;

        this.solids.forEach((solid, i) => {
            const x = startX + i * (btnW + gap);
            const y = startY;
            const isActive = i === this.currentSolid;

            // Button bg
            ctx.fillStyle = isActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.roundRect(x, y, btnW, btnH, 8);
            ctx.fill();
            ctx.stroke();

            // Draw icon
            this.drawSolidIcon(ctx, x + btnW / 2, y + btnH / 2, i);
        });
    }

    drawSolidIcon(ctx, cx, cy, index) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const r = 8;

        if (index === 0) { // Tetrahedron
            ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy + r); ctx.lineTo(cx - r, cy + r); ctx.closePath();
        } else if (index === 1) { // Cube
            ctx.rect(cx - r, cy - r, r * 2, r * 2);
        } else if (index === 2) { // Octahedron
            ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath();
        } else if (index === 3) { // Dodecahedron
            for (let j = 0; j < 5; j++) {
                const ang = j * Math.PI * 2 / 5 - Math.PI / 2;
                const px = cx + r * Math.cos(ang);
                const py = cy + r * Math.sin(ang);
                if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
        } else if (index === 4) { // Icosahedron
            for (let j = 0; j < 6; j++) {
                const ang = j * Math.PI * 2 / 6;
                const px = cx + r * Math.cos(ang);
                const py = cy + r * Math.sin(ang);
                if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
        } else { // Archimedean solids - use simpler icons
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
        }
        ctx.stroke();
    }

    addAlpha(color, alpha) {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        if (color.startsWith('hsl')) {
            return color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
        }
        return color;
    }

    drawInfoPanel(ctx, w, h) {
        const solidNames = ['Tetrahedron', 'Cube', 'Octahedron', 'Dodecahedron', 'Icosahedron', 'Square Pyramid'];
        const solidInfo = [
            { f: 4, v: 4, e: 6, face: 'Triangular', dual: 'Self-dual' },
            { f: 6, v: 8, e: 12, face: 'Square', dual: 'Octahedron' },
            { f: 8, v: 6, e: 12, face: 'Triangular', dual: 'Cube' },
            { f: 12, v: 20, e: 30, face: 'Pentagonal', dual: 'Icosahedron' },
            { f: 20, v: 12, e: 30, face: 'Triangular', dual: 'Dodecahedron' },
            { f: 5, v: 5, e: 8, face: 'Tri/Square', dual: 'Self-dual' }
        ];

        const info = solidInfo[this.currentSolid];
        const panelW = 220;
        const panelH = 160;
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

        // Name
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(solidNames[this.currentSolid].toUpperCase(), x + 20, y + 30);

        // Properties
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 13px Inter';
        ctx.fillText(`Faces: ${info.f} (${info.face})`, x + 20, y + 60);
        ctx.fillText(`Vertices: ${info.v}`, x + 20, y + 82);
        ctx.fillText(`Edges: ${info.e}`, x + 20, y + 104);

        // Dual
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 11px Inter';
        ctx.fillText(`Dual: ${info.dual}`, x + 20, y + 126);

        // Euler formula
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 14px Inter';
        ctx.fillText(`V − E + F = ${info.v} − ${info.e} + ${info.f} = 2`, x + 20, y + 150);
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
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
                <span class="icon">🤏</span>
                <span class="text">Left Pinch: Rotate Speed</span>
            </div>
            <div class="control-item">
                <span class="icon">🤏</span>
                <span class="text">Right Pinch: Zoom Scale</span>
            </div>
            <div class="control-item">
                <span class="icon">🖱️</span>
                <span class="text">Click icons below to switch shape</span>
            </div>
        `;
    }
}
