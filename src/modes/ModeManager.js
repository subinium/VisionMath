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

export class ModeManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.renderer = new Renderer();
        this.currentMode = null;
        this.currentModeIndex = -1;
        this.modes = [];

        const register = (mode, category) => {
            mode.category = category;
            this.modes.push(mode);
        };

        register(new TriangleCentersMode(),  'GEOMETRY');
        register(new PlatonicSolidsMode(),   'GEOMETRY');
        register(new LinearTransformMode(),  'ALGEBRA');
        register(new FourierMode(),          'ANALYSIS');
        register(new ComplexMappingMode(),   'ANALYSIS');
        register(new VectorAdditionMode(),   'PHYSICS');
        register(new PendulumMode(),         'PHYSICS');
        register(new LorenzMode(),           'PHYSICS');
        register(new MandelbrotMode(),       'FRACTALS');
    }

    getModes() {
        return this.modes;
    }

    isPinching(hand) {
        if (!hand) return { isPinching: false, x: 0, y: 0 };
        const thumb = hand[4];
        const index = hand[8];
        const dx = thumb.x - index.x;
        const dy = thumb.y - index.y;
        const dz = (thumb.z || 0) - (index.z || 0);
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const midX = (thumb.x + index.x) / 2;
        const midY = (thumb.y + index.y) / 2;
        return {
            isPinching: dist < 0.08,
            x: 1 - midX,
            y: midY,
            distance: dist
        };
    }

    getHands(results) {
        let leftHand = null, rightHand = null;
        if (results.hands && results.hands.landmarks && results.hands.handednesses) {
            results.hands.landmarks.forEach((hand, i) => {
                const handedness = results.hands.handednesses[i]?.[0]?.categoryName;
                if (handedness === 'Right') leftHand = hand;
                else if (handedness === 'Left') rightHand = hand;
            });
        }
        return { leftHand, rightHand };
    }

    update(results) {
        this.lastResults = results;
        const { leftHand, rightHand } = this.getHands(results);
        const leftPinch = this.isPinching(leftHand);
        const rightPinch = this.isPinching(rightHand);

        if (this.currentMode) {
            this.currentMode.update(results, { leftHand, rightHand, leftPinch, rightPinch });
        }
    }

    draw(w, h) {
        this.ctx.clearRect(0, 0, w, h);

        if (this.currentMode) {
            this.currentMode.draw(this.ctx, w, h);
        }

        if (this.lastResults && this.lastResults.hands && this.lastResults.hands.landmarks) {
            this.lastResults.hands.landmarks.forEach(hand => {
                this.renderer.drawSkeleton(this.ctx, w, h, hand, this.renderer.handConnections);
                this.renderer.drawFingerRings(this.ctx, w, h, hand);
            });
        }
    }

    selectMode(index) {
        if (this.modes[index]) {
            if (this.currentMode && typeof this.currentMode.deactivate === 'function') {
                this.currentMode.deactivate();
            }
            this.currentMode = this.modes[index];
            this.currentModeIndex = index;
            this.currentMode.reset();
            if (typeof this.currentMode.activate === 'function') {
                this.currentMode.activate();
            }
        }
    }
}
