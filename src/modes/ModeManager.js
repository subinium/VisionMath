import { TriangleCentersMode } from './TriangleCentersMode';
import { PlatonicSolidsMode } from './PlatonicSolidsMode';
import { LinearTransformMode } from './LinearTransformMode';
import { FourierMode } from './FourierMode';
import { ComplexMappingMode } from './ComplexMappingMode';
import { VectorAdditionMode } from './VectorAdditionMode';
import { PendulumMode } from './PendulumMode';
import { LorenzMode } from './LorenzMode';
import { MandelbrotMode } from './MandelbrotMode';
import { Renderer } from '../renderer';

// Mirrors App.css grid layout. Keep in sync if the chrome changes.
const CHROME = {
    pad: 14,
    sidebarW: 224,
    gap: 14,
    topbarH: 52,
    controlsH: 64
};

export class ModeManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.renderer = new Renderer();
        this.currentMode = null;
        this.currentModeIndex = -1;
        this.modes = [];
        this.viewport = { x: 0, y: 0, w: 1, h: 1 };

        const reg = (mode, category) => { mode.category = category; this.modes.push(mode); };
        reg(new TriangleCentersMode(),  'GEOMETRY');
        reg(new PlatonicSolidsMode(),   'GEOMETRY');
        reg(new LinearTransformMode(),  'ALGEBRA');
        reg(new FourierMode(),          'ANALYSIS');
        reg(new ComplexMappingMode(),   'ANALYSIS');
        reg(new VectorAdditionMode(),   'PHYSICS');
        reg(new PendulumMode(),         'PHYSICS');
        reg(new LorenzMode(),           'PHYSICS');
        reg(new MandelbrotMode(),       'FRACTALS');

        this._setupListeners();
    }

    _setupListeners() {
        const c = this.canvas;
        c.addEventListener('mousedown',  (e) => this._dispatchDown(e));
        c.addEventListener('mousemove',  (e) => this._dispatchMove(e));
        c.addEventListener('mouseup',    (e) => this._dispatchUp(e));
        c.addEventListener('mouseleave', (e) => this._dispatchUp(e));
        c.addEventListener('wheel',      (e) => this._dispatchWheel(e), { passive: false });
    }

    _local(e) {
        const rect = this.canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const x = cx - this.viewport.x;
        const y = cy - this.viewport.y;
        const inside = x >= 0 && y >= 0 && x <= this.viewport.w && y <= this.viewport.h;
        return { x, y, inside };
    }

    _dispatchDown(e) {
        if (!this.currentMode?.onPointerDown) return;
        const { x, y, inside } = this._local(e);
        if (!inside) return;
        this.currentMode.onPointerDown(x, y, this.viewport.w, this.viewport.h, e);
    }

    _dispatchMove(e) {
        if (!this.currentMode?.onPointerMove) return;
        const { x, y } = this._local(e);
        this.currentMode.onPointerMove(x, y, this.viewport.w, this.viewport.h, e);
    }

    _dispatchUp(e) {
        if (this.currentMode?.onPointerUp) this.currentMode.onPointerUp(e);
    }

    _dispatchWheel(e) {
        if (!this.currentMode?.onWheel) return;
        const { x, y, inside } = this._local(e);
        if (!inside) return;
        e.preventDefault();
        this.currentMode.onWheel(e.deltaY, x, y, this.viewport.w, this.viewport.h, e);
    }

    getModes() { return this.modes; }

    isPinching(hand) {
        if (!hand) return { isPinching: false, x: 0, y: 0, distance: Infinity };
        const t = hand[4], i = hand[8];
        const dx = t.x - i.x, dy = t.y - i.y, dz = (t.z || 0) - (i.z || 0);
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return {
            isPinching: dist < 0.08,
            x: 1 - (t.x + i.x) / 2,
            y: (t.y + i.y) / 2,
            distance: dist
        };
    }

    getHands(results) {
        let leftHand = null, rightHand = null;
        if (results.hands?.landmarks && results.hands.handednesses) {
            results.hands.landmarks.forEach((hand, i) => {
                const h = results.hands.handednesses[i]?.[0]?.categoryName;
                if (h === 'Right') leftHand = hand;
                else if (h === 'Left') rightHand = hand;
            });
        }
        return { leftHand, rightHand };
    }

    _toViewportPinch(p, canvasW, canvasH) {
        if (!p.isPinching) return p;
        const v = this.viewport;
        return {
            isPinching: true,
            x: (p.x * canvasW - v.x) / v.w,
            y: (p.y * canvasH - v.y) / v.h,
            distance: p.distance
        };
    }

    update(results) {
        this.lastResults = results;
        const { leftHand, rightHand } = this.getHands(results);
        const lp = this.isPinching(leftHand);
        const rp = this.isPinching(rightHand);

        const rect = this.canvas.getBoundingClientRect();
        const leftPinch  = this._toViewportPinch(lp, rect.width, rect.height);
        const rightPinch = this._toViewportPinch(rp, rect.width, rect.height);

        if (this.currentMode) {
            this.currentMode.update(results, { leftHand, rightHand, leftPinch, rightPinch });
        }
    }

    computeViewport(w, h) {
        const x = CHROME.pad + CHROME.sidebarW + CHROME.gap;
        const y = CHROME.pad + CHROME.topbarH + CHROME.gap;
        const right = w - CHROME.pad;
        const bottom = h - CHROME.pad - CHROME.controlsH - CHROME.gap;
        return { x, y, w: Math.max(1, right - x), h: Math.max(1, bottom - y) };
    }

    draw(canvasW, canvasH) {
        this.viewport = this.computeViewport(canvasW, canvasH);
        const ctx = this.ctx;
        ctx.clearRect(0, 0, canvasW, canvasH);

        if (this.currentMode) {
            const v = this.viewport;
            ctx.save();
            ctx.beginPath();
            ctx.rect(v.x, v.y, v.w, v.h);
            ctx.clip();
            ctx.translate(v.x, v.y);
            this.currentMode.draw(ctx, v.w, v.h);
            ctx.restore();
        }

        if (this.lastResults?.hands?.landmarks) {
            this.lastResults.hands.landmarks.forEach(hand => {
                this.renderer.drawSkeleton(ctx, canvasW, canvasH, hand, this.renderer.handConnections);
                this.renderer.drawFingerRings(ctx, canvasW, canvasH, hand);
            });
        }
    }

    selectMode(index) {
        if (!this.modes[index]) return;
        if (this.currentMode?.deactivate) this.currentMode.deactivate();
        this.currentMode = this.modes[index];
        this.currentModeIndex = index;
        this.currentMode.reset();
        if (this.currentMode.activate) this.currentMode.activate();
    }
}
