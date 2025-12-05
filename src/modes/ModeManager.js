import { TriangleCentersMode } from './TriangleCentersMode';
import { PlatonicSolidsMode } from './PlatonicSolidsMode';
import { VectorAdditionMode } from './VectorAdditionMode';
import { PendulumMode } from './PendulumMode';
import { Renderer } from '../renderer';

export class ModeManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.renderer = new Renderer();
        this.currentMode = null;
        this.currentModeIndex = -1;
        this.modes = [];
        this.pinchState = { left: false, right: false };
        this.lastPinchTime = 0;
        this.pinchCooldown = 500;

        // Auto-register modes
        this.registerMode(new TriangleCentersMode());
        this.registerMode(new PlatonicSolidsMode());
        this.registerMode(new VectorAdditionMode());
        this.registerMode(new PendulumMode());
    }

    registerMode(mode) {
        this.modes.push(mode);
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
            y: midY
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

        // Draw skeleton on top
        if (this.lastResults && this.lastResults.hands && this.lastResults.hands.landmarks) {
            this.lastResults.hands.landmarks.forEach(hand => {
                this.renderer.drawSkeleton(this.ctx, w, h, hand, this.renderer.handConnections);
                this.renderer.drawFingerRings(this.ctx, w, h, hand);
            });
        }
    }

    selectMode(index) {
        if (this.modes[index]) {
            this.currentMode = this.modes[index];
            this.currentModeIndex = index;
            this.currentMode.reset();
        }
    }
}
