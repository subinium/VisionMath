export class PlatonicSolidsMode {
    name = 'Platonic Solids';

    constructor() {
        this.solids = ['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron'];
        this.currentSolid = 1;
        this.rotation = { x: 0.5, y: 0.5, z: 0 };
        this.rotationSpeed = 0.01;
        this.autoRotate = true;
        this.scale = 1;
        this.targetScale = 1;
        this.vertices = [];
        this.edges = [];
        this.faces = [];
        this.faceColors = [];
        this.showVertexLabels = false;
        this.wireframeOnly = false;
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

            // Solid selector
            const sel = this.getSelectorRect(rect.width, rect.height);
            if (my >= sel.startY && my <= sel.startY + sel.btnH) {
                for (let i = 0; i < this.solids.length; i++) {
                    const bx = sel.startX + i * (sel.btnW + sel.gap);
                    if (mx >= bx && mx <= bx + sel.btnW) {
                        this.currentSolid = i;
                        this.loadSolid(this.solids[i]);
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                }
            }

            // Toggle buttons
            const tog = this.getToggleRect(rect.width, rect.height);
            for (let i = 0; i < tog.buttons.length; i++) {
                const b = tog.buttons[i];
                if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                    if (b.action === 'wireframe') this.wireframeOnly = !this.wireframeOnly;
                    if (b.action === 'labels') this.showVertexLabels = !this.showVertexLabels;
                    e.stopPropagation();
                    e.preventDefault();
                    return;
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
        }, { passive: false });
    }

    getSelectorRect(w, h) {
        const btnW = 40, btnH = 40, gap = 10;
        const totalW = this.solids.length * btnW + (this.solids.length - 1) * gap;
        return {
            btnW, btnH, gap,
            startX: (w - totalW) / 2,
            startY: h - 76
        };
    }

    getToggleRect(w, h) {
        const btnW = 96, btnH = 28, gap = 8;
        const buttons = [
            { action: 'wireframe', label: this.wireframeOnly ? 'Faces' : 'Wireframe' },
            { action: 'labels', label: this.showVertexLabels ? 'Hide #' : 'Show #' }
        ];
        const totalW = buttons.length * btnW + (buttons.length - 1) * gap;
        const startX = (w - totalW) / 2;
        const y = h - 124;
        return {
            buttons: buttons.map((b, i) => ({
                ...b,
                x: startX + i * (btnW + gap),
                y, w: btnW, h: btnH
            }))
        };
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

            case 'dodecahedron': {
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
                this.faceColors = Array(12).fill(0).map((_, i) => `hsl(${i * 30}, 55%, 55%)`);
                break;
            }

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
                this.faceColors = Array(20).fill(0).map((_, i) => `hsl(${i * 18}, 55%, 55%)`);
                break;
        }

        const maxDist = Math.max(...this.vertices.map(v => Math.hypot(v[0], v[1], v[2])));
        this.vertices = this.vertices.map(v => v.map(c => c / maxDist));
    }

    getPinchDistance(hand) {
        if (!hand) return null;
        const thumb = hand[4];
        const index = hand[8];
        return Math.hypot(thumb.x - index.x, thumb.y - index.y);
    }

    update(_results, { leftHand, rightHand }) {
        if (leftHand) {
            const dist = this.getPinchDistance(leftHand);
            if (dist !== null) {
                this.rotationSpeed = 0.005 + Math.min(0.035, Math.max(0, (dist - 0.03) * 0.3));
                this.autoRotate = true;
            }
        }

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
        // Slight perspective so far points shrink
        const persp = 1 / (1 + z * 0.18);
        return {
            x: centerX + x * baseSize * persp,
            y: centerY + y * baseSize * persp,
            z: z
        };
    }

    faceNormal(face, projected) {
        // Normal in screen-rotated space (after rotation, so lighting follows view)
        const a = projected[face[0]];
        const b = projected[face[1]];
        const c = projected[face[2]];
        const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
        const vx = c.x - a.x, vy = c.y - a.y, vz = c.z - a.z;
        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz) || 1;
        return { x: nx / len, y: ny / len, z: nz / len };
    }

    // Computes properties for the current Platonic solid using the unit-edge formulas
    computeProperties(type) {
        // Edge length in our normalized coords
        const e = (() => {
            if (this.edges.length === 0) return 1;
            const [i, j] = this.edges[0];
            const a = this.vertices[i];
            const b = this.vertices[j];
            return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        })();
        const e2 = e * e;
        const e3 = e2 * e;

        switch (type) {
            case 'tetrahedron':
                return { area: Math.sqrt(3) * e2, volume: e3 / (6 * Math.sqrt(2)) };
            case 'cube':
                return { area: 6 * e2, volume: e3 };
            case 'octahedron':
                return { area: 2 * Math.sqrt(3) * e2, volume: (Math.sqrt(2) / 3) * e3 };
            case 'dodecahedron':
                return {
                    area: 3 * Math.sqrt(25 + 10 * Math.sqrt(5)) * e2,
                    volume: ((15 + 7 * Math.sqrt(5)) / 4) * e3
                };
            case 'icosahedron':
                return {
                    area: 5 * Math.sqrt(3) * e2,
                    volume: (5 / 12) * (3 + Math.sqrt(5)) * e3
                };
            default:
                return { area: 0, volume: 0 };
        }
    }

    draw(ctx, w, h) {
        const size = Math.min(w, h);
        const centerX = w / 2;
        const centerY = h / 2;

        this.drawGrid(ctx, w, h);

        const projected = this.vertices.map(v => this.project(v, size, centerX, centerY));

        // Faces with depth sort + normal-based shading
        if (this.faces.length > 0 && !this.wireframeOnly) {
            const lightDir = { x: -0.4, y: -0.6, z: -0.7 };
            const lLen = Math.hypot(lightDir.x, lightDir.y, lightDir.z);
            lightDir.x /= lLen; lightDir.y /= lLen; lightDir.z /= lLen;

            const faceData = this.faces.map((face, fi) => {
                const avgZ = face.reduce((sum, vi) => sum + projected[vi].z, 0) / face.length;
                return { face, fi, avgZ };
            }).sort((a, b) => a.avgZ - b.avgZ);

            faceData.forEach(({ face, fi }) => {
                const n = this.faceNormal(face, projected);
                // Lambert
                const dot = n.x * lightDir.x + n.y * lightDir.y + n.z * lightDir.z;
                const intensity = 0.45 + Math.max(0, dot) * 0.55;

                ctx.beginPath();
                ctx.moveTo(projected[face[0]].x, projected[face[0]].y);
                for (let i = 1; i < face.length; i++) {
                    ctx.lineTo(projected[face[i]].x, projected[face[i]].y);
                }
                ctx.closePath();

                const color = this.faceColors[fi % this.faceColors.length];
                ctx.fillStyle = this.shadeColor(color, intensity, 0.55);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        }

        // Edges
        ctx.strokeStyle = this.wireframeOnly ? 'rgba(147, 197, 253, 0.85)' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = this.wireframeOnly ? 1.25 : 1;
        this.edges.forEach(([i, j]) => {
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
        });

        // Vertices: size scales with z (depth)
        projected.forEach((p, i) => {
            const t = (p.z + 1) / 2; // 0..1 (back..front)
            const r = 1.6 + t * 2.6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(226, 232, 240, ${0.55 + t * 0.4})`;
            ctx.fill();

            if (this.showVertexLabels) {
                ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
                ctx.font = '500 10px "JetBrains Mono", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(String(i), p.x + 6, p.y - 6);
            }
        });

        this.drawSelector(ctx, w, h);
        this.drawToggles(ctx, w, h);
        this.drawInfoPanel(ctx, w, h);
    }

    drawSelector(ctx, w, h) {
        const sel = this.getSelectorRect(w, h);

        this.solids.forEach((_solid, i) => {
            const x = sel.startX + i * (sel.btnW + sel.gap);
            const y = sel.startY;
            const isActive = i === this.currentSolid;

            ctx.fillStyle = isActive ? 'rgba(96, 165, 250, 0.22)' : 'rgba(255, 255, 255, 0.04)';
            ctx.strokeStyle = isActive ? 'rgba(96, 165, 250, 0.6)' : 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.roundRect(x, y, sel.btnW, sel.btnH, 8);
            ctx.fill();
            ctx.stroke();

            this.drawSolidIcon(ctx, x + sel.btnW / 2, y + sel.btnH / 2, i, isActive);
        });
    }

    drawToggles(ctx, w, h) {
        const tog = this.getToggleRect(w, h);
        tog.buttons.forEach(b => {
            const active = (b.action === 'wireframe' && this.wireframeOnly) ||
                           (b.action === 'labels' && this.showVertexLabels);
            ctx.fillStyle = active ? 'rgba(96, 165, 250, 0.18)' : 'rgba(255, 255, 255, 0.04)';
            ctx.strokeStyle = active ? 'rgba(96, 165, 250, 0.5)' : 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = active ? '#93c5fd' : '#cbd5e1';
            ctx.font = '500 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(b.label, b.x + b.w / 2, b.y + 18);
        });
    }

    drawSolidIcon(ctx, cx, cy, index, active) {
        ctx.strokeStyle = active ? '#93c5fd' : '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const r = 8;

        if (index === 0) {
            ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy + r); ctx.lineTo(cx - r, cy + r); ctx.closePath();
        } else if (index === 1) {
            ctx.rect(cx - r, cy - r, r * 2, r * 2);
        } else if (index === 2) {
            ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath();
        } else if (index === 3) {
            for (let j = 0; j < 5; j++) {
                const ang = j * Math.PI * 2 / 5 - Math.PI / 2;
                const px = cx + r * Math.cos(ang);
                const py = cy + r * Math.sin(ang);
                if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
        } else if (index === 4) {
            for (let j = 0; j < 6; j++) {
                const ang = j * Math.PI * 2 / 6;
                const px = cx + r * Math.cos(ang);
                const py = cy + r * Math.sin(ang);
                if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
        }
        ctx.stroke();
    }

    shadeColor(color, intensity, baseAlpha) {
        // intensity: 0..1
        const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${clamp(r * intensity)}, ${clamp(g * intensity)}, ${clamp(b * intensity)}, ${baseAlpha})`;
        }
        if (color.startsWith('hsl')) {
            // Convert "hsl(h, s%, l%)" → "hsla(h, s%, l*intensity%, alpha)"
            const m = color.match(/hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)/);
            if (m) {
                const hh = m[1], ss = m[2], ll = Math.max(0, Math.min(100, parseFloat(m[3]) * intensity));
                return `hsla(${hh}, ${ss}%, ${ll}%, ${baseAlpha})`;
            }
        }
        return color;
    }

    drawInfoPanel(ctx, w, _h) {
        const solidNames = ['Tetrahedron', 'Cube', 'Octahedron', 'Dodecahedron', 'Icosahedron'];
        const solidInfo = [
            { f: 4, v: 4, e: 6, face: 'Triangular', dual: 'Self-dual' },
            { f: 6, v: 8, e: 12, face: 'Square', dual: 'Octahedron' },
            { f: 8, v: 6, e: 12, face: 'Triangular', dual: 'Cube' },
            { f: 12, v: 20, e: 30, face: 'Pentagonal', dual: 'Icosahedron' },
            { f: 20, v: 12, e: 30, face: 'Triangular', dual: 'Dodecahedron' }
        ];

        const info = solidInfo[this.currentSolid];
        const props = this.computeProperties(this.solids[this.currentSolid]);
        const panelW = 240;
        const panelH = 220;
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
        ctx.fillText(solidNames[this.currentSolid].toUpperCase(), x + 18, y + 24);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 12px Inter';
        ctx.fillText(`Faces: ${info.f} · ${info.face}`, x + 18, y + 50);
        ctx.fillText(`Vertices: ${info.v}`, x + 18, y + 70);
        ctx.fillText(`Edges: ${info.e}`, x + 18, y + 90);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 11px Inter';
        ctx.fillText(`Dual: ${info.dual}`, x + 18, y + 110);

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 124);
        ctx.lineTo(x + panelW - 18, y + 124);
        ctx.stroke();

        // Surface area & volume (per unit edge length)
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter';
        ctx.fillText('GEOMETRY (a = 1)', x + 18, y + 142);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillText(`A = ${props.area.toFixed(3)}`, x + 18, y + 162);
        ctx.fillText(`V = ${props.volume.toFixed(3)}`, x + 18, y + 180);

        ctx.fillStyle = '#4ade80';
        ctx.font = '700 12px Inter';
        ctx.fillText(`V − E + F = ${info.v - info.e + info.f}`, x + 18, y + 204);
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.035)';
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
                <span class="text">Left pinch · rotate speed</span>
            </div>
            <div class="control-item">
                <span class="icon">🤏</span>
                <span class="text">Right pinch · zoom scale</span>
            </div>
            <div class="control-item">
                <span class="icon">🖱️</span>
                <span class="text">Drag to rotate · scroll to zoom</span>
            </div>
            <div class="control-item">
                <span class="icon">⏷</span>
                <span class="text">Toggle wireframe / vertex IDs</span>
            </div>
        `;
    }
}
