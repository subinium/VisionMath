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
        this._dragLast = null;
        this.reset();
    }

    getSelectorRect(w, h) {
        const btnW = 40, btnH = 40, gap = 10;
        const totalW = this.solids.length * btnW + (this.solids.length - 1) * gap;
        return { btnW, btnH, gap, startX: (w - totalW) / 2, startY: h - 76 };
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
        return { buttons: buttons.map((b, i) => ({ ...b, x: startX + i * (btnW + gap), y, w: btnW, h: btnH })) };
    }

    reset() {
        this.rotation = { x: 0.5, y: 0.5, z: 0 };
        this.rotationSpeed = 0.01;
        this.scale = 1;
        this.targetScale = 1;
        this.autoRotate = true;
        this._dragLast = null;
        this.loadSolid(this.solids[this.currentSolid]);
    }

    onPointerDown(mx, my, vw, vh, e) {
        const sel = this.getSelectorRect(vw, vh);
        if (my >= sel.startY && my <= sel.startY + sel.btnH) {
            for (let i = 0; i < this.solids.length; i++) {
                const bx = sel.startX + i * (sel.btnW + sel.gap);
                if (mx >= bx && mx <= bx + sel.btnW) {
                    this.currentSolid = i;
                    this.loadSolid(this.solids[i]);
                    return;
                }
            }
        }

        const tog = this.getToggleRect(vw, vh);
        for (const b of tog.buttons) {
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                if (b.action === 'wireframe') this.wireframeOnly = !this.wireframeOnly;
                if (b.action === 'labels') this.showVertexLabels = !this.showVertexLabels;
                return;
            }
        }

        this._dragLast = { x: e.clientX, y: e.clientY };
        this.autoRotate = false;
    }

    onPointerMove(_mx, _my, _vw, _vh, e) {
        if (!this._dragLast) return;
        const dx = e.clientX - this._dragLast.x;
        const dy = e.clientY - this._dragLast.y;
        this.rotation.y += dx * 0.01;
        this.rotation.x += dy * 0.01;
        this._dragLast = { x: e.clientX, y: e.clientY };
    }

    onPointerUp() { this._dragLast = null; }

    onWheel(deltaY) {
        this.targetScale -= deltaY * 0.001;
        this.targetScale = Math.max(0.5, Math.min(2, this.targetScale));
    }

    loadSolid(type) {
        const phi = (1 + Math.sqrt(5)) / 2;
        switch (type) {
            case 'tetrahedron':
                this.vertices = [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]];
                this.edges = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
                this.faces = [[0,1,2],[0,2,3],[0,1,3],[1,2,3]];
                this.faceColors = ['#ef4444','#22c55e','#3b82f6','#eab308'];
                break;
            case 'cube':
                this.vertices = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
                this.edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
                this.faces = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[0,3,7,4],[1,2,6,5]];
                this.faceColors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7'];
                break;
            case 'octahedron':
                this.vertices = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
                this.edges = [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]];
                this.faces = [[0,2,4],[0,4,3],[0,3,5],[0,5,2],[1,2,4],[1,4,3],[1,3,5],[1,5,2]];
                this.faceColors = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e','#14b8a6','#3b82f6','#a855f7'];
                break;
            case 'dodecahedron': {
                const a = 1 / phi, b = phi;
                this.vertices = [
                    [1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1],
                    [-1,1,1],[-1,1,-1],[-1,-1,1],[-1,-1,-1],
                    [0,a,b],[0,a,-b],[0,-a,b],[0,-a,-b],
                    [a,b,0],[a,-b,0],[-a,b,0],[-a,-b,0],
                    [b,0,a],[b,0,-a],[-b,0,a],[-b,0,-a]
                ];
                this.edges = [
                    [0,8],[0,12],[0,16],[1,9],[1,12],[1,17],
                    [2,10],[2,13],[2,16],[3,11],[3,13],[3,17],
                    [4,8],[4,14],[4,18],[5,9],[5,14],[5,19],
                    [6,10],[6,15],[6,18],[7,11],[7,15],[7,19],
                    [8,10],[9,11],[12,14],[13,15],[16,17],[18,19]
                ];
                this.faces = [
                    [0,8,10,2,16],[0,16,17,1,12],[0,12,14,4,8],
                    [1,17,3,11,9],[1,9,5,14,12],[2,10,6,15,13],
                    [2,13,3,17,16],[3,13,15,7,11],[4,14,5,19,18],
                    [4,18,6,10,8],[5,9,11,7,19],[6,18,19,7,15]
                ];
                this.faceColors = Array(12).fill(0).map((_, i) => `hsl(${i * 30}, 55%, 55%)`);
                break;
            }
            case 'icosahedron':
                this.vertices = [
                    [0,1,phi],[0,1,-phi],[0,-1,phi],[0,-1,-phi],
                    [1,phi,0],[1,-phi,0],[-1,phi,0],[-1,-phi,0],
                    [phi,0,1],[phi,0,-1],[-phi,0,1],[-phi,0,-1]
                ];
                this.edges = [
                    [0,2],[0,4],[0,6],[0,8],[0,10],
                    [1,3],[1,4],[1,6],[1,9],[1,11],
                    [2,5],[2,7],[2,8],[2,10],
                    [3,5],[3,7],[3,9],[3,11],
                    [4,6],[4,8],[4,9],
                    [5,7],[5,8],[5,9],
                    [6,10],[6,11],
                    [7,10],[7,11],
                    [8,9],[10,11]
                ];
                this.faces = [
                    [0,2,8],[0,8,4],[0,4,6],[0,6,10],[0,10,2],
                    [2,5,8],[8,5,9],[8,9,4],[4,9,1],[4,1,6],
                    [6,1,11],[6,11,10],[10,11,7],[10,7,2],[2,7,5],
                    [3,5,7],[3,7,11],[3,11,1],[3,1,9],[3,9,5]
                ];
                this.faceColors = Array(20).fill(0).map((_, i) => `hsl(${i * 18}, 55%, 55%)`);
                break;
        }
        const maxDist = Math.max(...this.vertices.map(v => Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2])));
        this.vertices = this.vertices.map(v => v.map(c => c / maxDist));
    }

    pinchDistance(hand) {
        if (!hand) return null;
        const t = hand[4], i = hand[8];
        return Math.sqrt((t.x - i.x) ** 2 + (t.y - i.y) ** 2);
    }

    update(_results, { leftHand, rightHand }) {
        if (leftHand) {
            const d = this.pinchDistance(leftHand);
            if (d !== null) {
                this.rotationSpeed = 0.005 + Math.min(0.035, Math.max(0, (d - 0.03) * 0.3));
                this.autoRotate = true;
            }
        }
        if (rightHand) {
            const d = this.pinchDistance(rightHand);
            if (d !== null) {
                this.targetScale = 0.6 + (d - 0.03) * 6.5;
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
        const cosX = Math.cos(this.rotation.x), sinX = Math.sin(this.rotation.x);
        let y1 = y * cosX - z * sinX;
        let z1 = y * sinX + z * cosX;
        y = y1; z = z1;
        const cosY = Math.cos(this.rotation.y), sinY = Math.sin(this.rotation.y);
        let x1 = x * cosY + z * sinY;
        z1 = -x * sinY + z * cosY;
        x = x1; z = z1;
        return [x * this.scale, y * this.scale, z * this.scale];
    }

    project(point, size, cx, cy) {
        const [x, y, z] = this.rotatePoint(point);
        const base = size * 0.28;
        const persp = 1 / (1 + z * 0.18);
        return { x: cx + x * base * persp, y: cy + y * base * persp, z };
    }

    faceNormal(face, projected) {
        const a = projected[face[0]], b = projected[face[1]], c = projected[face[2]];
        const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
        const vx = c.x - a.x, vy = c.y - a.y, vz = c.z - a.z;
        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        return { x: nx / len, y: ny / len, z: nz / len };
    }

    computeProperties(type) {
        const e = (() => {
            if (this.edges.length === 0) return 1;
            const [i, j] = this.edges[0];
            const a = this.vertices[i], b = this.vertices[j];
            return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
        })();
        const e2 = e * e, e3 = e2 * e;
        switch (type) {
            case 'tetrahedron':  return { area: Math.sqrt(3) * e2, volume: e3 / (6 * Math.sqrt(2)) };
            case 'cube':         return { area: 6 * e2, volume: e3 };
            case 'octahedron':   return { area: 2 * Math.sqrt(3) * e2, volume: (Math.sqrt(2) / 3) * e3 };
            case 'dodecahedron': return { area: 3 * Math.sqrt(25 + 10 * Math.sqrt(5)) * e2, volume: ((15 + 7 * Math.sqrt(5)) / 4) * e3 };
            case 'icosahedron':  return { area: 5 * Math.sqrt(3) * e2, volume: (5 / 12) * (3 + Math.sqrt(5)) * e3 };
            default:             return { area: 0, volume: 0 };
        }
    }

    draw(ctx, w, h) {
        const size = Math.min(w, h);
        const cx = w / 2, cy = h / 2;

        this.drawGrid(ctx, w, h);

        const proj = this.vertices.map(v => this.project(v, size, cx, cy));

        if (this.faces.length > 0 && !this.wireframeOnly) {
            const lDir = { x: -0.4, y: -0.6, z: -0.7 };
            const lLen = Math.sqrt(lDir.x*lDir.x + lDir.y*lDir.y + lDir.z*lDir.z);
            lDir.x /= lLen; lDir.y /= lLen; lDir.z /= lLen;

            const data = this.faces.map((face, fi) => {
                let s = 0; for (const vi of face) s += proj[vi].z;
                return { face, fi, avgZ: s / face.length };
            }).sort((a, b) => a.avgZ - b.avgZ);

            for (const { face, fi } of data) {
                const n = this.faceNormal(face, proj);
                const dot = n.x * lDir.x + n.y * lDir.y + n.z * lDir.z;
                const intensity = 0.45 + Math.max(0, dot) * 0.55;

                ctx.beginPath();
                ctx.moveTo(proj[face[0]].x, proj[face[0]].y);
                for (let i = 1; i < face.length; i++) ctx.lineTo(proj[face[i]].x, proj[face[i]].y);
                ctx.closePath();

                ctx.fillStyle = this.shadeColor(this.faceColors[fi % this.faceColors.length], intensity, 0.55);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        ctx.strokeStyle = this.wireframeOnly ? 'rgba(147, 197, 253, 0.85)' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = this.wireframeOnly ? 1.25 : 1;
        for (const [i, j] of this.edges) {
            ctx.beginPath();
            ctx.moveTo(proj[i].x, proj[i].y);
            ctx.lineTo(proj[j].x, proj[j].y);
            ctx.stroke();
        }

        proj.forEach((p, i) => {
            const t = (p.z + 1) / 2;
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
        this.drawInfoPanel(ctx, w);
    }

    drawSelector(ctx, w, h) {
        const sel = this.getSelectorRect(w, h);
        this.solids.forEach((_solid, i) => {
            const x = sel.startX + i * (sel.btnW + sel.gap);
            const y = sel.startY;
            const active = i === this.currentSolid;
            ctx.fillStyle = active ? 'rgba(96, 165, 250, 0.22)' : 'rgba(255, 255, 255, 0.04)';
            ctx.strokeStyle = active ? 'rgba(96, 165, 250, 0.6)' : 'rgba(255, 255, 255, 0.10)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, y, sel.btnW, sel.btnH, 8);
            ctx.fill(); ctx.stroke();
            this.drawSolidIcon(ctx, x + sel.btnW / 2, y + sel.btnH / 2, i, active);
        });
    }

    drawToggles(ctx, w, h) {
        const tog = this.getToggleRect(w, h);
        for (const b of tog.buttons) {
            const active = (b.action === 'wireframe' && this.wireframeOnly) ||
                (b.action === 'labels' && this.showVertexLabels);
            ctx.fillStyle = active ? 'rgba(96, 165, 250, 0.18)' : 'rgba(255, 255, 255, 0.04)';
            ctx.strokeStyle = active ? 'rgba(96, 165, 250, 0.5)' : 'rgba(255, 255, 255, 0.10)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 6);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = active ? '#93c5fd' : '#cbd5e1';
            ctx.font = '500 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(b.label, b.x + b.w / 2, b.y + 18);
        }
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
                const a = j * Math.PI * 2 / 5 - Math.PI / 2;
                const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
                if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
        } else if (index === 4) {
            for (let j = 0; j < 6; j++) {
                const a = j * Math.PI * 2 / 6;
                const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
                if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
        }
        ctx.stroke();
    }

    shadeColor(color, intensity, alpha) {
        const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
        if (color[0] === '#') {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${clamp(r * intensity)},${clamp(g * intensity)},${clamp(b * intensity)},${alpha})`;
        }
        if (color.startsWith('hsl')) {
            const m = color.match(/hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)/);
            if (m) {
                const ll = Math.max(0, Math.min(100, parseFloat(m[3]) * intensity));
                return `hsla(${m[1]},${m[2]}%,${ll}%,${alpha})`;
            }
        }
        return color;
    }

    drawInfoPanel(ctx, w) {
        const names = ['Tetrahedron', 'Cube', 'Octahedron', 'Dodecahedron', 'Icosahedron'];
        const info = [
            { f: 4, v: 4, e: 6, face: 'Triangular', dual: 'Self-dual' },
            { f: 6, v: 8, e: 12, face: 'Square', dual: 'Octahedron' },
            { f: 8, v: 6, e: 12, face: 'Triangular', dual: 'Cube' },
            { f: 12, v: 20, e: 30, face: 'Pentagonal', dual: 'Icosahedron' },
            { f: 20, v: 12, e: 30, face: 'Triangular', dual: 'Dodecahedron' }
        ][this.currentSolid];
        const props = this.computeProperties(this.solids[this.currentSolid]);
        const panelW = 240, panelH = 220;
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
        ctx.fillText(names[this.currentSolid].toUpperCase(), x + 18, y + 24);

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
        ctx.moveTo(x + 18, y + 124); ctx.lineTo(x + panelW - 18, y + 124);
        ctx.stroke();

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
        for (let x = 0; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }

    getControlsHTML() {
        return `
            <div class="control-item"><span class="icon">🤏</span><span class="text">Left pinch · rotate speed</span></div>
            <div class="control-item"><span class="icon">🤏</span><span class="text">Right pinch · zoom</span></div>
            <div class="control-item"><span class="icon">🖱️</span><span class="text">Drag · rotate · scroll · zoom</span></div>
            <div class="control-item"><span class="icon">⏷</span><span class="text">Toggle wireframe / IDs</span></div>
        `;
    }
}
