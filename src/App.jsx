import { useEffect, useRef, useState } from 'react'
import { Vision } from './vision'
import { Renderer } from './renderer'
import { ModeManager } from './modes/ModeManager'
import './App.css'

function App() {
    const canvasRef = useRef(null)
    const modeManagerRef = useRef(null)
    const [loading, setLoading] = useState(true)
    const [loadingText, setLoadingText] = useState('Initializing...')
    const [fps, setFps] = useState(0)
    const [activeModeIndex, setActiveModeIndex] = useState(0)
    const [modes, setModes] = useState([])
    const [controlsContent, setControlsContent] = useState('')
    const [showCamera, setShowCamera] = useState(true)

    useEffect(() => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        // Handle High DPI
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`

        const modeManager = new ModeManager(canvas, ctx)
        modeManagerRef.current = modeManager

        // Modes are now auto-registered in ModeManager constructor
        const registeredModes = modeManager.getModes()
        setModes(registeredModes)

        // Select first mode by default
        if (registeredModes.length > 0) {
            modeManager.selectMode(0)
            updateControls(registeredModes[0])
        }

        let animationFrameId
        let lastTime = performance.now()
        let frameCount = 0

        const init = async () => {
            setLoadingText('Loading Vision Models...')
            try {
                await vision.initialize((msg) => setLoadingText(msg))
                setLoading(false)

                const loop = () => {
                    try {
                        frameCount++
                        const currentTime = performance.now()
                        if (currentTime - lastTime >= 1000) {
                            setFps(Math.round(frameCount * 1000 / (currentTime - lastTime)))
                            frameCount = 0
                            lastTime = currentTime
                        }

                        const results = vision.detect()
                        if (results) {
                            // Pass logical size to update/draw
                            modeManager.update(results)
                            modeManager.draw(rect.width, rect.height)
                        }
                        animationFrameId = requestAnimationFrame(loop)
                    } catch (error) {
                        console.error("Loop error:", error)
                    }
                }
                loop()
            } catch (err) {
                setLoadingText(`Error: ${err.message}`)
                console.error(err)
            }
        }

        const vision = new Vision()
        const renderer = new Renderer()
        init()

        return () => {
            cancelAnimationFrame(animationFrameId)
        }
    }, [])

    const updateControls = (mode) => {
        if (mode && mode.getControlsHTML) {
            setControlsContent(mode.getControlsHTML())
        } else {
            setControlsContent('Interactive Mode Active')
        }
    }

    const handleModeSelect = (index) => {
        if (modeManagerRef.current) {
            modeManagerRef.current.selectMode(index)
            setActiveModeIndex(index)
            updateControls(modeManagerRef.current.getModes()[index])
        }
    }

    const getModeName = (mode) => {
        return mode.name || mode.constructor.name
    }

    // Group modes by category
    const mathModes = modes.slice(0, 2); // Triangle Centers, Platonic Solids
    const physicsModes = modes.slice(2, 4); // Vector Addition, Pendulum

    return (
        <div className="app-container">
            {loading && (
                <div className="loading-overlay">
                    <div className="loader"></div>
                    <p className="loading-text">{loadingText}</p>
                </div>
            )}

            <div id="video-container" className={showCamera ? '' : 'hidden'}></div>
            <canvas ref={canvasRef} id="overlay-canvas" style={{ width: '100%', height: '100%' }} />

            {!loading && (
                <div className="ui-layer">
                    <header className="header">
                        <div className="title">Vision<span>Math</span></div>
                        <div className="stats">
                            <span>{fps} FPS</span>
                            <button
                                className="bg-toggle-btn"
                                onClick={() => setShowCamera(!showCamera)}
                                title={showCamera ? "Switch to Dark Mode" : "Switch to Camera Mode"}
                            >
                                {showCamera ? '🎥' : '🌙'}
                            </button>
                        </div>
                    </header>

                    <div className="main-content">
                        <div className="mode-menu">
                            <div className="menu-category">MATH</div>
                            {mathModes.map((mode, i) => (
                                <button
                                    key={i}
                                    className={`mode-btn ${activeModeIndex === i ? 'active' : ''}`}
                                    onClick={() => handleModeSelect(i)}
                                >
                                    <span className="mode-number">{String(i + 1).padStart(2, '0')}</span>
                                    {getModeName(mode)}
                                </button>
                            ))}

                            <div className="menu-category" style={{ marginTop: '16px' }}>PHYSICS</div>
                            {physicsModes.map((mode, i) => (
                                <button
                                    key={i + 2}
                                    className={`mode-btn ${activeModeIndex === i + 2 ? 'active' : ''}`}
                                    onClick={() => handleModeSelect(i + 2)}
                                >
                                    <span className="mode-number">{String(i + 3).padStart(2, '0')}</span>
                                    {getModeName(mode)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {controlsContent && (
                        <div className="controls-panel">
                            <div className="controls-title">Controls</div>
                            <div className="controls-content" dangerouslySetInnerHTML={{ __html: controlsContent }} />
                        </div>
                    )}

                    <div className="credit-footer">
                        <a href="https://github.com/subinium/VisionMath" target="_blank" rel="noopener noreferrer">
                            GitHub
                        </a>
                        <span> · Created by </span>
                        <a href="https://github.com/subinium" target="_blank" rel="noopener noreferrer">
                            @subinium
                        </a>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
