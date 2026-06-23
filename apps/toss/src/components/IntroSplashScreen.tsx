import { useEffect, useRef, useState } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  size: number
  color: string
  angle: number
  speed: number
}

export default function IntroSplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFading(true), 2000)
    const destroyTimer = setTimeout(() => setIsVisible(false), 2700)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(destroyTimer)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const particles: Particle[] = []
    const particleCount = 80
    const colors = [
      'rgba(212, 255, 59, ', // Volt Yellow-Green
      'rgba(168, 85, 247, ', // Purple
      'rgba(56, 189, 248, ', // Sky Blue
    ]

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        alpha: Math.random() * 0.5 + 0.3,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0]!,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 1 + 0.5,
      })
    }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    let frame = 0
    const render = () => {
      frame++
      ctx.fillStyle = 'rgba(10, 10, 12, 0.2)'
      ctx.fillRect(0, 0, width, height)

      // Network lines
      particles.forEach((p, idx) => {
        if (!p) return
        const dx = width / 2 - p.x
        const dy = height / 2 - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > 30) {
          p.vx += (dx / dist) * 0.04
          p.vy += (dy / dist) * 0.04
          p.vx += Math.cos(p.angle) * 0.02
          p.vy += Math.sin(p.angle) * 0.02
          p.angle += 0.02
        }

        p.vx *= 0.96
        p.vy *= 0.96
        p.x += p.vx
        p.y += p.vy

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color + p.alpha + ')'
        ctx.fill()

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j]
          if (!p2) continue
          const lx = p.x - p2.x
          const ly = p.y - p2.y
          const ldist = Math.sqrt(lx * lx + ly * ly)

          if (ldist < 60) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            const lineAlpha = (1 - ldist / 60) * 0.1 * Math.min(p.alpha, p2.alpha)
            ctx.strokeStyle = `rgba(212, 255, 59, ${lineAlpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })

      // Draw Logo / Text
      const text = 'PROMPT MARKET'
      ctx.font = '900 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.letterSpacing = '6px'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.shadowBlur = 10
      ctx.shadowColor = 'rgba(212, 255, 59, 0.4)'

      const progress = Math.min(frame / 40, 1)
      const currentText = text.substring(0, Math.floor(text.length * progress))
      ctx.fillText(currentText, width / 2, height / 2)
      ctx.shadowBlur = 0

      // Sub text
      ctx.font = '500 10px monospace'
      ctx.letterSpacing = '2px'
      ctx.fillStyle = 'rgba(212, 255, 59, 0.7)'
      ctx.fillText('TOSS IN-APP PORTAL', width / 2, height / 2 + 30)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0c',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
