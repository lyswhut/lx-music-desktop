// https://github.com/tholman/cursor-effects/blob/master/src/bubbleCursor.js

class Particle {
  constructor(x, y, fillStyle, strokeStyle) {
    const lifeSpan = Math.floor(Math.random() * 60 + 60)
    this.initialLifeSpan = lifeSpan //
    this.lifeSpan = lifeSpan // ms
    this.velocity = {
      x: (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 10),
      y: -0.4 + Math.random() * -1,
    }
    this.position = { x, y }
    this.fillStyle = fillStyle
    this.strokeStyle = strokeStyle

    this.baseDimension = 4
  }

  update(context, width) {
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    this.velocity.x += ((Math.random() < 0.5 ? -1 : 1) * 2) / 75
    this.velocity.y -= Math.random() / 600
    if (this.position.x >= width - 2 || this.position.x <= 2) this.lifeSpan = 0
    else if (this.position.y <= 5) this.lifeSpan = 0
    this.lifeSpan--

    const scale =
      0.2 + (this.initialLifeSpan - this.lifeSpan) / this.initialLifeSpan

    context.fillStyle = this.fillStyle
    context.strokeStyle = this.strokeStyle
    context.beginPath()
    context.arc(
      this.position.x - (this.baseDimension / 2) * scale,
      this.position.y - this.baseDimension / 2,
      this.baseDimension * scale,
      0,
      2 * Math.PI,
    )

    context.stroke()
    context.fill()

    context.closePath()
  }
}


export default class BubbleCursor {
  constructor({ element, fillStyle = 'rgba(77, 175, 124, 0.1)', strokeStyle = 'rgba(77, 175, 124, 0.3)' } = {}) {
    this.hasWrapperEl = element
    this.element = this.hasWrapperEl || document.body

    this.width = window.innerWidth
    this.height = window.innerHeight
    this.cursor = { x: this.width / 2, y: this.width / 2 }
    this.particles = []
    this.canvas = null
    this.context = null
    this.fillStyle = fillStyle
    this.strokeStyle = strokeStyle

    this.init()
  }

  init() {
    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d')

    this.canvas.style.top = '0px'
    this.canvas.style.left = '0px'
    this.canvas.style.pointerEvents = 'none'
    this.canvas.style.zIndex = 100

    if (this.hasWrapperEl) {
      this.canvas.style.position = 'absolute'
      this.element.appendChild(this.canvas)
      this.canvas.width = this.element.clientWidth
      this.canvas.height = this.element.clientHeight
    } else {
      this.canvas.style.position = 'fixed'
      document.body.appendChild(this.canvas)
      this.canvas.width = this.width
      this.canvas.height = this.height
    }

    this.bindEvents()
    this.loop()
  }

  bindEvents() {
    this.element.addEventListener('mousemove', this.onMouseMove)
    this.element.addEventListener('touchmove', this.onTouchMove, { passive: true })
    this.element.addEventListener('touchstart', this.onTouchMove, { passive: true })
    window.addEventListener('resize', this.onWindowResize)
  }


  onWindowResize = (e) => {
    this.width = window.innerWidth
    this.height = window.innerHeight

    if (this.hasWrapperEl) {
      this.canvas.width = this.element.clientWidth
      this.canvas.height = this.element.clientHeight
    } else {
      this.canvas.width = this.width
      this.canvas.height = this.height
    }
  }

  onTouchMove = (e) => {
    if (e.touches.length > 0) {
      for (let i = 0; i < e.touches.length; i++) {
        this.addParticle(
          e.touches[i].clientX,
          e.touches[i].clientY,
        )
      }
    }
  }

  onMouseMove = (e) => {
    if (this.hasWrapperEl) {
      const boundingRect = this.element.getBoundingClientRect()
      this.cursor.x = e.clientX - boundingRect.left
      this.cursor.y = e.clientY - boundingRect.top
    } else {
      this.cursor.x = e.clientX
      this.cursor.y = e.clientY
    }

    this.addParticle(this.cursor.x, this.cursor.y)
  }

  addParticle(x, y) {
    this.particles.push(new Particle(x, y, this.fillStyle, this.strokeStyle))
  }

  updateParticles() {
    this.context.clearRect(0, 0, this.width, this.height)

    // Update
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update(this.context, this.width)
    }

    // Remove dead particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (this.particles[i].lifeSpan < 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  loop = () => {
    this.updateParticles()
    window.requestAnimationFrame(this.loop)
  }

  setColor(fillStyle, strokeStyle) {
    this.fillStyle = fillStyle
    this.strokeStyle = strokeStyle
  }

  destroy() {
    this.element.removeEventListener('mousemove', this.onMouseMove)
    this.element.removeEventListener('touchmove', this.onTouchMove, { passive: true })
    this.element.removeEventListener('touchstart', this.onTouchMove, { passive: true })
    window.removeEventListener('resize', this.onWindowResize)

    if (this.hasWrapperEl) {
      this.element.removeChild(this.canvas)
    } else {
      document.body.removeChild(this.canvas)
    }

    this.canvas = null
    this.context = null
  }
}
