/* global Scenes, Scene, Actors */

Scenes.ratsofthemaze = function (env, opts) {
  this.env = env;
  this.opts = this.genOpts(opts);
  this.attrs = this.genAttrs();
  this.init();
};

Scenes.ratsofthemaze.prototype = Object.create(Scene.prototype);

Scenes.ratsofthemaze.prototype.title = 'Rats of the Maze';

Scenes.ratsofthemaze.prototype.genAttrs = function () {
  return {
    lives: 16,
    time: 0,
    index: 0,
    stringdex: 0,
    value: 0,
    duration: this.opts.duration
  };
};

Scenes.ratsofthemaze.prototype.init = function () {
  this.maze = new Actors.Maze(
    this.env, {
      scene: this
    }, {
    });

  this.target_zoom = 1;
  this.target_x = 0;
  this.target_y = 0;
  this.x = 0;
  this.y = 0;
  this.zoom = 1;

  if (!this.env.story) {
    this.env.story = new Actors.Titles(
      this.env, {
        scene: this
      }, {
      });
  }
  this.story = this.env.story;
  this.memory = [];
  for (var i = 0; i < 16; i++) {
    this.memory.push(32);
  }
};

Scenes.ratsofthemaze.prototype.getCast = function () {
  return {
    Maze: Actors.Maze,
    Cell: Actors.Cell,
    Human: Actors.Human,
    Zap: Actors.Zap,
    Breeder: Actors.Breeder,
    Rat: Actors.Rat,
    King: Actors.King,
    Boom: Actors.Boom,
    Reactor: Actors.Reactor,
    Snake: Actors.Snake
  };
};

Scenes.ratsofthemaze.prototype.defaults = [{
  key: 'max_x',
  info: 'Max X',
  value: 1280,
  min: 100,
  max: 1600
}, {
  key: 'max_y',
  info: 'Max Y',
  value: 1280,
  min: 100,
  max: 1000
}, {
  key: 'rows',
  info: 'Rows',
  value: 3,
  min: 2,
  max: 12
}, {
  key: 'cols',
  info: 'Cols',
  value: 4,
  min: 2,
  max: 16
}, {
  key: 'duration',
  value: 60,
  min: 1,
  max: 120
}];

Scenes.ratsofthemaze.prototype.update = function (delta) {
  this.maze.update(delta);
  this.story.update(delta);

  var str = 'Rats of the Maze of the ';
  var len = str.length;
  this.attrs.time += this.env.diff * 0.5;
  if (this.attrs.time > this.attrs.duration) {
    this.attrs.time = 0;
    this.attrs.index ++;
    if (this.attrs.index === this.memory.length) {
      this.attrs.index = 0;
    }
    this.attrs.stringdex ++;
    if (this.attrs.stringdex === len) {
      this.attrs.stringdex = 0;
    }
    this.memory[this.attrs.index] = str.charCodeAt(this.attrs.stringdex);
  }

  var speed = 10;
  var max = Math.max(this.maze.opts.max_x, this.maze.opts.max_y);
  var rc = Math.max(this.maze.attrs.rows, this.maze.attrs.cols);
  var cell;

  var w = (max / rc);
  this.w = w;

  if (this.env.level % 3 === 0) {
    if (this.maze.human) {
      cell = this.maze.human.refs.cell;
      max = Math.max(this.maze.opts.max_x, this.maze.opts.max_y);
      rc = Math.max(this.maze.attrs.rows, this.maze.attrs.cols);
      w = this.maze.opts.max_x / this.maze.attrs.cols;

      this.target_zoom = 2.5;

      w *= this.target_zoom;
      this.target_x = 0 - (cell.attrs.x * w) - (this.w / 2) + (this.maze.attrs.cols / 2 * this.w);
      this.target_y = 0 - (cell.attrs.y * w) - (this.w / 2) + (this.maze.attrs.rows / 2 * this.w);
    }

    if (this.maze.attrs.boom) {
      this.target_zoom = 1;
      this.target_x = 0;
      this.target_y = 0;
      speed = 15;
    }

    if (this.zoom < this.target_zoom) {
      this.zoom += 0.01;
    }

    if (this.zoom > this.target_zoom) {
      this.zoom -= 0.01;
    }

    if (this.x < this.target_x) {
      this.x += speed;
    }

    if (this.x > this.target_x) {
      this.x -= speed;
    }

    if (this.y < this.target_y) {
      this.y += speed;
    }

    if (this.y > this.target_y) {
      this.y -= speed;
    }
  }
};

Scenes.ratsofthemaze.prototype.flash = function (fx, gx, sx) {
  if (this.maze.attrs.boom && this.maze.attrs.boomCountdown <= 0) {
    if (Math.random() < 0.5) {
      gx.ctx.fillStyle = '#ffffff';
      gx.ctx.fillRect(0, 0, gx.w, gx.h);
    }
    if (Math.random() < 0.15) {
      fx.ctx.fillStyle = '#f00';
      fx.ctx.fillRect(0, 0, fx.w, fx.h);
    }
    if (Math.random() < 0.15) {
      fx.ctx.fillStyle = '#ff0';
      fx.ctx.fillRect(0, 0, fx.w, fx.h);
    }
  }
};

Scenes.ratsofthemaze.prototype.paint = function (fx, gx, sx) {
  fx.ctx.save();
  fx.ctx.translate(this.x, this.y);

  gx.ctx.save();
  gx.ctx.translate(this.x, this.y);

  var cell_w = this.maze.opts.max_x / this.maze.attrs.cols;
  var cell_h = this.maze.opts.max_y / this.maze.attrs.rows;
  var mm = Math.min(cell_w, cell_h);

  var qq = this.maze.attrs.cols - this.maze.attrs.rows;

  if (qq > 0) {
    gx.ctx.translate(0, Math.abs(mm * qq / 2));
    fx.ctx.translate(0, Math.abs(mm * qq / 2));
  } else {
    gx.ctx.translate(Math.abs(mm / qq * 2), 0);
    fx.ctx.translate(Math.abs(mm / qq * 2), 0);
  }

  fx.ctx.scale(this.zoom, this.zoom);
  gx.ctx.scale(this.zoom, this.zoom);

  this.maze.paint(gx, fx);
  gx.ctx.restore();
  fx.ctx.restore();

  var story = this.env.views.story;
  story.ctx.save();
  story.ctx.scale(0.66, 1.1);
  this.story.paint(story);
  story.ctx.restore();

  var leds = this.env.views.leds;
  this.paintLevel(leds);
  this.paintScore(leds);
};

Scenes.ratsofthemaze.prototype.paintLevel = function (leds) {
  var h = (Date.now() % 360 * 0.22) - 10;
  leds.ctx.fillStyle = 'hsl(' + h + ', 100%, 50%)';

  if (Math.random() < 0.025) {
    leds.ctx.fillStyle = 'rgba(255,255,0,0.5)';
  }

  if (Math.random() < 0.025) {
    leds.ctx.fillStyle = 'rgba(255,255,255,1)';
  }

  if (Date.now() % 1000 < 200) {
    leds.ctx.fillStyle = 'rgba(0,0,0,1)';
  }

  if (Date.now() % 1000 > 950) {
    leds.ctx.fillStyle = 'rgba(255,255,255,1)';
  }

  leds.ctx.save();
  leds.ctx.translate(64, 16);

  leds.ctx.font = '28pt robotron';
  leds.ctx.textAlign = 'center';
  leds.ctx.textBaseline = 'top';

  leds.ctx.fillText(this.env.level.toString(16).toUpperCase(), 0, 0);
  leds.ctx.restore();
};

Scenes.ratsofthemaze.prototype.paintScore = function (leds) {
  var h = (Date.now() % 360 * 0.22) - 10;
  leds.ctx.fillStyle = 'hsl(' + h + ', 100%, 50%)';

  if (Math.random() < 0.025) {
    leds.ctx.fillStyle = 'rgba(255,255,0,0.5)';
  }

  if (Math.random() < 0.025) {
    leds.ctx.fillStyle = 'rgba(255,255,255,1)';
  }

  if (Date.now() % 1000 < 200) {
    leds.ctx.fillStyle = 'rgba(0,0,0,1)';
  }

  if (Date.now() % 1000 > 950) {
    leds.ctx.fillStyle = 'rgba(255,255,255,1)';
  }

  leds.ctx.save();
  leds.ctx.translate(leds.w - 32, 16);
  leds.ctx.font = '28pt robotron';
  leds.ctx.textAlign = 'right';
  leds.ctx.textBaseline = 'top';

  leds.ctx.fillText(this.env.score, 0, 0);
  leds.ctx.restore();
};

Scenes.ratsofthemaze.prototype.paintTitle = function (fx, gx) {
  fx.ctx.save();
  fx.ctx.translate(gx.w - 320, gx.h - 16);
  gx.ctx.save();
  gx.ctx.translate(gx.w - 320, gx.h - 16);

  for (var i = 0; i < this.memory.length; i++) {
    if (this.attrs.index === i) {
      fx.ctx.fillStyle = '#0f0';
      fx.ctx.font = '24px robotron';
      fx.ctx.textAlign = 'center';
      fx.ctx.textBaseline = 'bottom';
      fx.ctx.fillText(
        ((this.memory[i] < 16) ? '0' : '') + String.fromCharCode(this.memory[i]),
        this.memory.length * i * 1.2,
        0
      );

      gx.ctx.fillStyle = '#fff';
      gx.ctx.font = '24px robotron';
      gx.ctx.textAlign = 'center';
      gx.ctx.textBaseline = 'bottom';
      gx.ctx.fillText(
        ((this.memory[i] < 16) ? '0' : '') + String.fromCharCode(this.memory[i]),
        this.memory.length * i * 1.2,
        0
      );
    }
  }
  gx.ctx.restore();
  fx.ctx.restore();
};

Scenes.ratsofthemaze.prototype.paintLives = function (leds) {
  var gx = leds;
  for (var i = this.attrs.lives; i > 0; i--) {
    gx.ctx.save();
    gx.ctx.translate(128 + (4 * i), 36);

    gx.ctx.fillStyle = '#022';
    gx.ctx.strokeStyle = '#0ff';
    gx.ctx.lineWidth = 1;

    var z = 8;
    gx.ctx.lineWidth = 1.2;

    gx.ctx.rotate(-0.5 * Math.PI);
    gx.ctx.beginPath();
    gx.ctx.rect(-z, -z - z, z, z + z + z + z);
    gx.ctx.stroke();

    gx.ctx.beginPath();
    gx.ctx.moveTo(z, 0);
    gx.ctx.lineTo(-z, z);
    gx.ctx.lineTo(-z, -z);
    gx.ctx.lineTo(z, 0);
    gx.ctx.closePath();
    gx.ctx.fill();
    gx.ctx.stroke();

    gx.ctx.restore();
  }
};
