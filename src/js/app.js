/* globals Vec3, localStorage */

var Scenes = {}

function Coldwar () {
  this.boot()
}

document.addEventListener('DOMContentLoaded', function (event) {
  window.COLDWAR = new Coldwar()
})

Coldwar.prototype.boot = function () {
  // first load
  var opts = {}
  var scene = 'logo'
  this.opts = {} // easy access
  this.optsKeys = [] // keep order
  this.optsVals = {}
  this.setOpts('scene', Scenes[scene].prototype.defaults, opts.scene)
  this.env = this.genEnv()
  this.slug = scene;
  this.Scene = Scenes[scene]
  this.env.show_opts = false

  // if scene has changed, rerender
  this.layout()
  window.addEventListener('resize', this.render.bind(this), true)
  this.start()
}

Coldwar.prototype.start = function (scene, opts) {
  this.env.gameover = false
  this.env.at = 0
  this.env.timer = 0
  this.env.ms = 0
  this.env.diff = 0
  this.scene = new this.Scene(
    this.env,
    this.optsVals.scene
  )

  // start animated scene
  this.render()

  if (this.raf) {
    window.cancelAnimationFrame(this.raf)
  }

  this.raf = window.requestAnimationFrame(this.tick.bind(this))

}

Coldwar.prototype.setOpts = function (key, params, opts) {
  if (!opts) {
    opts = {}
  }
  var prev = null
  if (this.optsKeys.length > 0) {
    prev = this.optsKeys[this.optsKeys.length - 1]
  }
  this.optsKeys.push(key)
  this.opts[key] = {
    key: key,
    title: key,
    params: params
  }
  this.optsVals[key] = {}

  params.forEach(function (param) {
    if (opts.hasOwnProperty(param.key)) {
      param.value = opts[param.key]
    }
    if (param.inherit) {
      param.value = this.optsVals[prev][param.key]
    } else {
      this.optsVals[key][param.key] = param.value
    }
  }, this)
}

Coldwar.prototype.tick = function () {
  this.update()
  var timer = Date.now()

  this.paintScene();
  this.env.timers.paint = Date.now() - timer
  this.env.timers.total = this.env.timers.update + this.env.timers.paint
  this.raf = window.requestAnimationFrame(this.tick.bind(this))
}

Coldwar.prototype.update = function () {
  var at = Date.now()
  this.env.diff = at - this.env.last;
  this.env.ms += this.env.diff;
  this.env.ms = this.env.ms % 1000;
  var delta = this.env.delta = (at - this.env.last) / 16.77
  var fps = (1000 / (at - this.env.last)).toFixed(0)

  this.env.fps_hist.push(fps)
  while (this.env.fps_hist.length > 60) {
    this.env.fps_hist.shift()
  }
  var acc = 0
  for (var i = 0, ii = this.env.fps_hist.length; i < ii; i++) {
    acc += Number(this.env.fps_hist[i])
  }

  this.env.fps = acc / this.env.fps_hist.length

  this.env.delta = delta
  this.env.at += (at - this.env.last)
  this.env.last = at

  // 0 - 60
  // blink once a second
  this.env.blink = false
  this.env.timer += delta
  if (this.env.timer > 60) {
    this.env.blink = true
    this.env.timer = 0
  }

  // 0 - 1
  this.env.clock += delta
  this.env.clock = this.env.clock % 1

  this.env.flash = false

  var timer = Date.now()
  if (this.scene) {
    this.scene.update(delta)
  }
  this.env.timers.update = Date.now() - timer
}

Coldwar.prototype.paintScene = function () {

  var ex = this.env.views.ex
  var fx = this.env.views.fx
  var gx = this.env.views.gx
  var sx = this.env.views.sx

  ex.ctx.clearRect(0, 0, ex.w, ex.h)

  fx.ctx.fillStyle = 'rgba(0, 0, 0, ' + this.env.fx_alpha + ')'
  fx.ctx.fillRect(0, 0, fx.w, fx.h)

  gx.ctx.clearRect(0, 0, gx.w, gx.h)

  if (this.scene && typeof this.scene.flash === 'function') {
    this.scene.flash(fx, gx, sx)
  } else {
    gx.ctx.clearRect(0, 0, gx.w, gx.h)
    if (this.env.flash && !this.opts.safe_mode) {
      gx.ctx.fillStyle = '#ffffff'
      gx.ctx.fillRect(0, 0, gx.w, gx.h)
    }
  }

  gx.ctx.save()

  // autocenter
  gx.ctx.translate(gx.offset_x, gx.offset_y)
  // pan
  gx.ctx.translate(this.env.page_x, this.env.page_y)
  // zoom
  gx.ctx.scale(this.env.zoom, this.env.zoom)
  // scale
  gx.ctx.scale(gx.scale, gx.scale)

  fx.ctx.save()
  fx.ctx.translate(fx.offset_x, fx.offset_y)
  fx.ctx.translate(this.env.page_x, this.env.page_y)
  fx.ctx.scale(this.env.zoom, this.env.zoom)
  fx.ctx.scale(fx.scale, fx.scale)

  if (sx) {
    sx.ctx.clearRect(0, 0, sx.w, sx.h)
    if (this.env.flash && !this.opts.safe_mode) {
      sx.ctx.fillStyle = '#ffffff'
      sx.ctx.fillRect(0, 0, sx.w, sx.h)
    }
    sx.ctx.save()
    sx.ctx.translate(sx.offset_x, sx.offset_z)
    sx.ctx.scale(sx.scale, sx.scale)
  }

  this.scene.paint(fx, gx, sx, ex)

  fx.ctx.restore()
  gx.ctx.restore()

  if (sx) {
    sx.ctx.restore()
  }
}

Coldwar.prototype.genEnv = function () {
  return {
    gameover: false,
    el: document.getElementById('app'),
    views: {
      ex: null,
      fx: null,
      gx: null,
      sx: null
    },
    fx_alpha: 0.15,
    last: Date.now(),
    at: 0,
    fps: 0,
    fps_hist: [],
    clock: 0,
    blink: true,
    zoom: 0,
    page_x: 0,
    page_y: 0,
    timers: {
      update: null,
      paint: null
    }
  }
}

Coldwar.prototype.layout = function () {
  this.resetZoom()
  var html
  html = ''
  html += '<div id="ex"><canvas id="Ex" oncontextmenu="return false"></canvas></div>'
  html += '<div id="fx"><canvas id="Fx"></canvas></div>'
  html += '<div id="gx"><canvas id="Gx"></canvas></div>'
  this.env.el.innerHTML = html
  this.render()
}

Coldwar.prototype.render = function () {
  this.w = this.env.el.offsetWidth
  this.h = this.env.el.offsetHeight

  this.env.views.content = {}
  this.env.views.content.el = document.getElementById('content')

  this.env.views.help = {}
  this.env.views.help.el = document.getElementById('help')

  var keys = ['ex', 'fx', 'gx']
  keys.forEach(function (key) {
    this.env.views[key] = {}
    var view = this.env.views[key]
    view.wrap = document.getElementById(key, key.substr(0, 1))
    view.el = document.getElementById(key.substr(0, 1).toUpperCase() + key.substr(1))
    view.ctx = view.el.getContext('2d')

    view.w = view.wrap.offsetWidth
    view.h = view.wrap.offsetHeight

    view.el.width = view.w
    view.el.height = view.h
    view.scale_x = view.w / this.optsVals.scene.max_x
    view.scale_y = view.h / this.optsVals.scene.max_y
    view.scale = Math.min(view.scale_x, view.scale_y)

    view.offset_x = (view.w * 0.5) - (this.optsVals.scene.max_x * view.scale * 0.5)
    view.offset_y = (view.h * 0.5) - (this.optsVals.scene.max_y * view.scale * 0.5)
  }, this)

  var elSx = document.getElementById('sx')

  if (elSx) {
    this.env.views.sx = {}
    this.env.views.sx.wrap = document.getElementById('sx')
    this.env.views.sx.el = document.getElementById('Sx')
    this.env.views.sx.ctx = this.env.views.sx.el.getContext('2d')

    this.env.views.sx.w = this.env.views.sx.wrap.offsetWidth
    this.env.views.sx.h = this.env.views.sx.wrap.offsetHeight

    this.env.views.sx.el.width = this.env.views.sx.w
    this.env.views.sx.el.height = this.env.views.sx.h

    this.env.views.sx.scale_x = this.env.views.sx.w / this.optsVals.scene.max_x
    this.env.views.sx.scale_z = this.env.views.sx.h / this.optsVals.scene.max_z
    this.env.views.sx.scale = Math.min(this.env.views.sx.scale_x, this.env.views.sx.scale_z)

    this.env.views.sx.scale = this.env.views.gx.scale // = Math.min(this.env.views.sx.scale_x, this.env.views.sx.scale_z)

    this.env.views.sx.offset_x = (this.env.views.sx.w * 0.5) - (this.optsVals.scene.max_x * this.env.views.sx.scale * 0.5)
    this.env.views.sx.offset_z = -60// (this.env.views.sx.h * 0.5) - (this.optsVals.scene.max_z * this.env.views.sx.scale)
  }

}

Coldwar.prototype.resetZoom = function () {
  this.env.zoom = 1
  this.env.page_x = 0
  this.env.page_y = 0
}

Coldwar.prototype.doZoom = function (delta, x, y) {
  // x any y are world coordinates
  if (!x || !y) {
    x = (this.optsVals.scene.max_x / 2)
    y = (this.optsVals.scene.max_y / 2)
  }

  var oldzoom = this.env.zoom
  var zoom

  x = x * oldzoom
  y = y * oldzoom

  if (delta > 0) {
    zoom = this.env.zoom * 1.1111
  }

  if (delta < 0) {
    zoom = this.env.zoom * 0.9
  }

  if (zoom > 16) {
    zoom = 16
  }

  if (zoom < 0.25) {
    zoom = 0.25
  }

  if (zoom < 0.5) {
    zoom = 0.5
  }

  // world coords
  var old_w = this.optsVals.scene.max_x * oldzoom
  var old_h = this.optsVals.scene.max_y * oldzoom

  var new_w = this.optsVals.scene.max_x * zoom
  var new_h = this.optsVals.scene.max_y * zoom

  var dx = ((old_w - new_w) * this.env.views.gx.scale) * (x / old_w)
  var dy = ((old_h - new_h) * this.env.views.gx.scale) * (y / old_h)

  // movement of top left of canvas in actual pixels
  this.env.page_x += dx
  this.env.page_y += dy
  this.env.zoom = zoom
}

Coldwar.prototype.handleMouseMove = function (e) {
  // world coordinate position of mouse
  var x = ((e.offsetX - this.env.page_x - this.env.views.gx.offset_x) / this.env.views.gx.scale) / this.env.zoom
  var y = ((e.offsetY - this.env.page_y - this.env.views.gx.offset_y) / this.env.views.gx.scale) / this.env.zoom

  this.env.mouse.x = x
  this.env.mouse.y = y

  if (this.scene.nozoom) {
    return
  }

  if (this.env.mouseDown) {
    this.env.page_x += ((e.offsetX - this.env.drag_from_x))
    this.env.page_y += ((e.offsetY - this.env.drag_from_y))
  }

  this.env.drag_from_x = e.offsetX
  this.env.drag_from_y = e.offsetY
}

Coldwar.prototype.handleMouseUp = function (e) {
  if (this.env.mouseDown) {
    this.env.mouseDown = false
    this.env.drag_from_x = null
    this.env.drag_from_y = null
  }
}

Coldwar.prototype.handleMouseDown = function (e) {
  if (!this.env.mouseDown) {
    this.env.drag_from_x = e.offsetX
    this.env.drag_from_y = e.offsetY
    this.env.mouseDown = true
  }

  if (this.scene && typeof this.scene.onClick === 'function') {
    this.scene.onClick(this.env.mouse.x, this.env.mouse.y, e)
  }
}

Coldwar.prototype.pushOpts = function () {
  var opts = []
  for (var key in this.opts) {
    this.opts[key].params.forEach(function (param) {
      opts.push(key + '-' + param.key + '=' + param.value)
    })
  }
  window.history.pushState(null, null, '?' + opts.join('&'))
}

Coldwar.prototype.scenes = [{
  title: 'Logo',
  slug: 'logo'
}]
