import { useEffect, useRef, useState } from 'react'

interface Particle {
  x: number
  y: number
  targetX: number
  targetY: number
  vx: number
  vy: number
  alpha: number
  size: number
  color: string
  angle: number
  speed: number
  glow: boolean
}

export default function IntroSplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    // 2.2 seconds play, then start fading
    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, 2200)

    // 3.0 seconds, unmount completely
    const destroyTimer = setTimeout(() => {
      setIsVisible(false)
    }, 3000)

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
    const particleCount = 180

    // PromptMarket Volt Theme Colors
    const colors = [
      'rgba(212, 255, 59, ', // Volt Yellow-Green
      'rgba(168, 85, 247, ', // Purple
      'rgba(56, 189, 248, ', // Sky Blue
      'rgba(244, 63, 94, ', // Rose
    ]

    // Create prompt stream particles
    for (let i = 0; i < particleCount; i++) {
      const isGlow = Math.random() > 0.8
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        targetX: width / 2 + (Math.random() - 0.5) * 300,
        targetY: height / 2 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        alpha: Math.random() * 0.5 + 0.3,
        size: Math.random() * (isGlow ? 3 : 1.5) + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0]!,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 1.5 + 0.5,
        glow: isGlow,
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
      ctx.fillStyle = 'rgba(10, 10, 12, 0.18)' // Deep space background
      ctx.fillRect(0, 0, width, height)

      // Draw digital code grids in background
      ctx.strokeStyle = 'rgba(212, 255, 59, 0.02)'
      ctx.lineWidth = 1
      const gridSize = 80
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Draw and update prompt stream particles
      particles.forEach((p, idx) => {
        if (!p) return

        // Dynamic motion: Swirling towards the center (Text base)
        const dx = width / 2 - p.x
        const dy = height / 2 - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > 50) {
          // Gravity pull to center
          p.vx += (dx / dist) * 0.06
          p.vy += (dy / dist) * 0.06
          // Circular orbital motion
          p.vx += Math.cos(p.angle) * 0.02
          p.vy += Math.sin(p.angle) * 0.02
          p.angle += 0.015
        } else {
          // Drift slowly in the center core
          p.vx = (Math.random() - 0.5) * 0.5
          p.vy = (Math.random() - 0.5) * 0.5
        }

        // Apply friction
        p.vx *= 0.95
        p.vy *= 0.95

        p.x += p.vx
        p.y += p.vy

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color + p.alpha + ')'

        if (p.glow) {
          ctx.shadowBlur = 10
          ctx.shadowColor = p.color + '0.8)'
        } else {
          ctx.shadowBlur = 0
        }

        ctx.fill()
        ctx.shadowBlur = 0

        // Draw networking token connection lines
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j]
          if (!p2) continue

          const lx = p.x - p2.x
          const ly = p.y - p2.y
          const ldist = Math.sqrt(lx * lx + ly * ly)

          if (ldist < 80) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            const lineAlpha = (1 - ldist / 80) * 0.12 * Math.min(p.alpha, p2.alpha)
            ctx.strokeStyle = `rgba(212, 255, 59, ${lineAlpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })

      // Prompt Token Text Assembler
      const text = 'PROMPT MARKET'
      ctx.font = '900 clamp(24px, 6vw, 68px) sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.letterSpacing = '12px'

      // Mask typing/assembling effect
      const progress = Math.min(frame / 60, 1) // 1 second full load
      const visibleChars = Math.floor(text.length * progress)
      const currentText = text.substring(0, visibleChars)

      // Subtitle
      ctx.font = '500 clamp(10px, 1.8vw, 16px) monospace'
      ctx.letterSpacing = '4px'
      const subText = 'CONNECTING TO LLM INTEGRATION PORTAL...'
      const subProgress = Math.max(0, Math.min((frame - 30) / 60, 1))
      const currentSub = subText.substring(0, Math.floor(subText.length * subProgress))

      // Glowing Text
      ctx.shadowBlur = 15
      ctx.shadowColor = 'rgba(212, 255, 59, 0.4)'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'

      // Main text draw
      ctx.font = '900 clamp(24px, 6vw, 68px) sans-serif'
      ctx.fillText(currentText, width / 2, height / 2)

      ctx.shadowBlur = 0

      // Draw cursor at the end of typing
      if (frame % 20 < 10 && visibleChars < text.length) {
        const textWidth = ctx.measureText(currentText).width
        ctx.fillStyle = '#d4ff3b'
        ctx.fillRect(width / 2 + textWidth / 2 + 4, height / 2 - 16, 4, 32)
      }

      // Sub text draw
      if (frame > 30) {
        ctx.fillStyle = 'rgba(212, 255, 59, 0.7)'
        ctx.fillText(currentSub, width / 2, height / 2 + 50)
      }

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
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
