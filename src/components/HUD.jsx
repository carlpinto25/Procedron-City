import { useState, useEffect } from 'react'

export function HUD() {
    const [time, setTime] = useState('')
    const [buildings, setBuildings] = useState('—')

    useEffect(() => {
        const tick = () => {
            const d = new Date()
            const hh = String(d.getHours()).padStart(2, '0')
            const mm = String(d.getMinutes()).padStart(2, '0')
            const ss = String(d.getSeconds()).padStart(2, '0')
            setTime(`${hh}:${mm}:${ss}`)
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [])

    return (
        <div id="hud">
            <div className="scanline" />

            <div id="hud-top-left">
                <h1>SECTOR‑7 // NEXUS CITY<span className="cursor" /></h1>
                <div className="sub">PROCEDURAL GENERATION ACTIVE · REACT THREE FIBER</div>
            </div>

            <div id="hud-top-right">
                <div>POPULATION: <span style={{ color: '#00ffe7' }}>∞</span></div>
                <div>THREAT LVL: <span style={{ color: '#ff4444' }}>ELEVATED</span></div>
                <div>LOCAL TIME: {time}</div>
            </div>

            <div id="hud-bottom">
                drag to orbit &nbsp;·&nbsp; scroll to zoom &nbsp;·&nbsp; right-drag to pan
            </div>
        </div>
    )
}
