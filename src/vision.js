import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export class Vision {
    constructor() {
        this.handLandmarker = null;
        this.video = null;
        this.lastVideoTime = -1;
        this.results = {
            hands: null
        };
    }

    async initialize(statusCallback = () => { }) {
        statusCallback("Initializing Vision Core...");
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        statusCallback("Vision Core Loaded");

        statusCallback("Loading Hand Tracking...");
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.3,
            minHandPresenceConfidence: 0.3,
            minTrackingConfidence: 0.3
        });

        await this.setupCamera(statusCallback);
        statusCallback("Systems Online");
    }

    async setupCamera(statusCallback) {
        statusCallback("Accessing Camera Feed...");
        this.video = document.createElement('video');
        this.video.setAttribute('playsinline', ''); // Important for mobile

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }
            });
            statusCallback("Camera Signal Acquired");
            this.video.srcObject = stream;

            await new Promise((resolve, reject) => {
                // Timeout after 10 seconds
                const timeout = setTimeout(() => {
                    reject(new Error("Camera initialization timed out"));
                }, 10000);

                this.video.onloadedmetadata = () => {
                    clearTimeout(timeout);
                    statusCallback("Calibrating Video Feed...");
                    this.video.play().then(() => {
                        const container = document.getElementById('video-container');
                        if (container) {
                            container.innerHTML = ''; // Clear previous
                            container.appendChild(this.video);
                        }
                        resolve();
                    }).catch(reject);
                };
            });
        } catch (error) {
            console.error("Error accessing camera:", error);
            throw error;
        }
    }

    getVideo() {
        return this.video;
    }

    detect() {
        if (!this.video || this.video.paused || this.video.ended) return null;

        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;
            const timestamp = performance.now();

            if (this.handLandmarker) {
                this.results.hands = this.handLandmarker.detectForVideo(this.video, timestamp);
            }
        }

        return this.results;
    }
}
