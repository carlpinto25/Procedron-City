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
                <h1>PROCEDRON CITY<span className="cursor" /></h1>
                <div className="sub">PROCEDURAL GENERATION ACTIVE</div>
            </div>

            <div id="hud-top-right">
                <div>POPULATION: <span style={{ color: '#00ffe7' }}>∞</span></div>
                <div>LOCAL TIME: {time}</div>
            </div>
        </div>
    )
}
