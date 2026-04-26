import { useEffect, useRef, useState } from 'react'
import { Vision } from './vision'
import { ModeManager } from './modes/ModeManager'
import './App.css'

const CATEGORY_ORDER = ['GEOMETRY', 'ALGEBRA', 'ANALYSIS', 'PHYSICS', 'FRACTALS']

function App() {
    const canvasRef = useRef(null)
    const modeManagerRef = useRef(null)
    const [loading, setLoading] = useState(true)
    const [loadingText, setLoadingText] = useState('Initializing')
    const [fps, setFps] = useState(0)
    const [activeModeIndex, setActiveModeIndex] = useState(0)
    const [modes, setModes] = useState([])
    const [controlsContent, setControlsContent] = useState('')
    const [showCamera, setShowCamera] = useState(true)

    useEffect(() => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`

        const modeManager = new ModeManager(canvas, ctx)
        modeManagerRef.current = modeManager

        const registeredModes = modeManager.getModes()
        setModes(registeredModes)

        if (registeredModes.length > 0) {
            modeManager.selectMode(0)
            updateControls(registeredModes[0])
        }

        let animationFrameId
        let lastTime = performance.now()
        let frameCount = 0

        const init = async () => {
            setLoadingText('Loading vision models')
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
                            modeManager.update(results)
                            modeManager.draw(rect.width, rect.height)
                        }
                        animationFrameId = requestAnimationFrame(loop)
                    } catch (error) {
                        console.error('Loop error:', error)
                    }
                }
                loop()
            } catch (err) {
                setLoadingText(`Error: ${err.message}`)
                console.error(err)
            }
        }

        const vision = new Vision()
        init()

        return () => cancelAnimationFrame(animationFrameId)
    }, [])

    const updateControls = (mode) => {
        if (mode && mode.getControlsHTML) {
            setControlsContent(mode.getControlsHTML())
        } else {
            setControlsContent('')
        }
    }

    const handleModeSelect = (index) => {
        if (modeManagerRef.current) {
            modeManagerRef.current.selectMode(index)
            setActiveModeIndex(index)
            updateControls(modeManagerRef.current.getModes()[index])
        }
    }

    const grouped = CATEGORY_ORDER.map(cat => ({
        category: cat,
        items: modes
            .map((m, i) => ({ mode: m, index: i }))
            .filter(({ mode }) => (mode.category || 'GEOMETRY') === cat)
    })).filter(g => g.items.length > 0)

    const activeMode = modes[activeModeIndex]
    const activeName = activeMode?.name || ''
    const activeCat = activeMode?.category || ''

    return (
        <div className="app-container">
            {loading && (
                <div className="loading-overlay">
                    <div className="brand-large">
                        <div className="logo" />
                        <span>Vision<strong>Math</strong></span>
                    </div>
                    <div className="loader"></div>
                    <p className="loading-text">{loadingText}</p>
                </div>
            )}

            <div id="video-container" className={showCamera ? '' : 'hidden'}></div>
            <canvas ref={canvasRef} id="overlay-canvas" style={{ width: '100%', height: '100%' }} />
            <div className="vignette" />

            {!loading && (
                <div className="ui-layer">
                    <header className="topbar">
                        <div className="brand">
                            <div className="logo" />
                            <span>Vision<strong>Math</strong></span>
                        </div>

                        <div className="crumb">
                            {activeCat && <>{activeCat}<b>{activeName}</b></>}
                        </div>

                        <div className="right">
                            <span className="chip"><span className="dot" />{fps} FPS</span>
                            <button
                                className="icon-btn"
                                onClick={() => setShowCamera(!showCamera)}
                                title={showCamera ? 'Hide camera' : 'Show camera'}
                            >
                                {showCamera ? '◐' : '○'}
                            </button>
                        </div>
                    </header>

                    <aside className="sidebar">
                        {grouped.map((g, gi) => (
                            <div key={g.category}>
                                {gi > 0 && <div className="divider" />}
                                <div className="section">{g.category}</div>
                                {g.items.map(({ mode, index }) => (
                                    <button
                                        key={index}
                                        className={`mode-btn ${activeModeIndex === index ? 'active' : ''}`}
                                        onClick={() => handleModeSelect(index)}
                                    >
                                        <span className="mode-num">{String(index + 1).padStart(2, '0')}</span>
                                        <span>{mode.name || mode.constructor.name}</span>
                                    </button>
                                ))}
                            </div>
                        ))}

                        <div className="sidebar-footer">
                            <a href="https://github.com/subinium/VisionMath" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
                            <span style={{ margin: '0 6px', color: 'var(--text-faint)' }}>·</span>
                            <a href="https://github.com/subinium" target="_blank" rel="noopener noreferrer">@subinium</a>
                        </div>
                    </aside>

                    <div className="viewport" />

                    {controlsContent && (
                        <div className="controls-bar">
                            <div className="label">Controls</div>
                            <div className="items" dangerouslySetInnerHTML={{ __html: controlsContent }} />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default App
