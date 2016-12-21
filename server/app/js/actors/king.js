/* global Actors, Actor, Vec3, VecR */

Actors.King = function (env, refs, attrs) {
  this.env = env;
  this.refs = refs;
  this.opts = this.genOpts();
  this.attrs = this.genAttrs(attrs);
  this.init(attrs);
};

Actors.King.prototype = Object.create(Actor.prototype);

Actors.King.prototype.title = 'King';

Actors.King.prototype.init = function (attrs) {
  this.pos = new Vec3(
    this.refs.cell.opts.max_x / 2,
    this.refs.cell.opts.max_y / 2
  );

  this.velo = new VecR(
    Math.PI * 2 * Math.random(),
    this.attrs.speed
  ).vec3();
};

Actors.King.prototype.genAttrs = function (attrs) {
  var hp = 200 + (100 * Math.random());
  var speed = this.opts.speed_base + (Math.random() * this.opts.speed_flux);

  return {
    phase: Math.random() * 2 * Math.PI,
    phase_v: Math.random() * 0.5,
    speed: speed,
    dead: false,
    hp: hp,
    hp_max: hp
  };
};

Actors.King.prototype.defaults = [{
  key: 'speed_base',
  info: '',
  value: 4,
  min: 1,
  max: 100
}, {
  key: 'speed_flux',
  info: '',
  value: 2,
  min: 0,
  max: 50
}, {
  key: 'velo_scale',
  info: '',
  value: 1,
  min: 0.1,
  max: 1,
  step: 0.1
}, {
  key: 'separation_range',
  info: '',
  value: 160,
  min: 10,
  max: 500
}, {
  key: 'reflect_force',
  info: '',
  value: 1,
  min: 0,
  max: 10
}, {
  key: 'chase_force',
  info: '',
  value: 1,
  min: 0.1,
  max: 1.0
}, {
  key: 'intent_scale',
  value: 2,
  min: 0,
  max: 100
}];

Actors.King.prototype.update = function (delta, intent) {
  this.attrs.phase += this.attrs.phase_v;
  if (this.attrs.phase > 2 * Math.PI) {
    this.attrs.phase - 2 * Math.PI;
  }

  var vec = new Vec3();
  vec.add(this.chase().scale(1));
  vec.add(this.separation().scale(1));
  vec.add(this.reflect());

  var intents = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  var scale = this.opts.intent_scale;

  if (typeof intent !== 'undefined' && intent !== null) {
    vec.add(new Vec3(intents[intent][0], intents[intent][1]).scale(scale));
    if (intent === 1 || intent === 3) {
      if (this.pos.y < this.refs.cell.opts.max_y * 0.4) {
        vec.add(new Vec3(0, 1).scale(scale));
      }
      if (this.pos.y > this.refs.cell.opts.max_y * 0.6) {
        vec.add(new Vec3(0, -1).scale(scale));
      }
    }

    if (intent === 0 || intent === 2) {
      if (this.pos.x < this.refs.cell.opts.max_x * 0.4) {
        vec.add(new Vec3(1, 0).scale(scale));
      }
      if (this.pos.x > this.refs.cell.opts.max_x * 0.6) {
        vec.add(new Vec3(-1, 0).scale(scale));
      }
    }
  }

  this.velo.add(vec);
  this.velo.limit(this.attrs.speed);
  this.pos.add(this.velo);

  // exit
  var other, cell;

  if (this.pos.x < 0) {
    other = this.refs.cell.exits[3];
    if (other) {
      this.pos.x += this.refs.cell.opts.max_x;
    } else {
      this.velo = new Vec3(-this.velo.x, this.velo.y, 0);
      this.pos.x = 0;
    }
  } else if (this.pos.x > this.refs.cell.opts.max_x) {
    other = this.refs.cell.exits[1];
    if (other) {
      this.pos.x = this.pos.x - this.refs.cell.opts.max_x;
    } else {
      this.velo = new Vec3(-this.velo.x, this.velo.y, 0);
      this.pos.x = this.refs.cell.opts.max_x;
    }
  } else if (this.pos.y < 0) {
    other = this.refs.cell.exits[0];
    if (other) {
      this.pos.y += this.refs.cell.opts.max_y;
    } else {
      this.velo = new Vec3(this.velo.x, -this.velo.y, 0);
      this.pos.y = 0;
    }
  } else if (this.pos.y > this.refs.cell.opts.max_y) {
    other = this.refs.cell.exits[2];
    if (other) {
      this.pos.y = this.pos.y - this.refs.cell.opts.max_y;
    } else {
      this.velo = new Vec3(this.velo.x, -this.velo.y, 0);
      this.pos.y = this.refs.cell.opts.max_y;
    }
  }

  cell = this.refs.cell;

  if (other) {
    for (var i = 0, ii = cell.kings.length; i < ii; i++) {
      if (cell.kings[i] === this) {
        cell.kings[i] = null;
        break;
      }
    }
    this.refs.cell = other;
    other.kings.push(this);
  }
};

Actors.King.prototype.separation = function () {
  var i, ii;
  var other;
  var range;

  var vec = new Vec3();

  for (i = 0, ii = this.refs.cell.kings.length; i < ii; i++) {
    other = this.refs.cell.kings[i];
    if (!other) {
      continue;
    }

    if (other === this) {
      continue;
    }

    range = this.pos.rangeXY(other.pos);

    if (range === 0) {
      continue;
    }

    if (range > this.opts.separation_range) {
      continue;
    }

    vec.add(this.pos.minus(other.pos).normalize().scale(1 / range));
  }

  return vec.normalize();
};

Actors.King.prototype.chase = function () {
  var xx = 0;
  var yy = 0;
  var c = 0;

  if (this.refs.cell.humans.length === 0) {
    return new Vec3();
  }

  var human;

  for (var i = 0, ii = this.refs.cell.humans.length; i < ii; i++) {
    human = this.refs.cell.humans[i];
    if (!human) {
      continue;
    }
    xx += human.pos.x;
    yy += human.pos.y;
    c++;
  }

  var target = new Vec3(xx / c, yy / c);
  return target.minus(this.pos).normalize();
};

Actors.King.prototype.center = function () {
  var i, ii;
  var other;
  var range;
  var c;

  var center = new Vec3();
  c = 0;
  for (i = 0, ii = this.refs.cell.kings.length; i < ii; i++) {
    other = this.refs.cell.kings[i];
    if (!other) {
      continue;
    }

    if (other === this) {
      continue;
    }

    c++;
    center.add(other.pos);
  }
  if (c === 0) {
    return new Vec3();
  }
  center.div(c);

  range = this.pos.rangeXY(center);

  if (range === 0) {
    return new Vec3();
  }

  if (range < 56) {
    return new Vec3();
  }

  // return this.pos.minus(center).normalize();;
  return this.pos.minus(center).normalize().scale(128 / range);
};

Actors.King.prototype.separation = function () {
  var i, ii;
  var other;
  var range;

  var vec = new Vec3();

  for (i = 0, ii = this.refs.cell.kings.length; i < ii; i++) {
    other = this.refs.cell.kings[i];
    if (!other) {
      continue;
    }

    if (other === this) {
      continue;
    }

    range = this.pos.rangeXY(other.pos);

    if (range === 0) {
      continue;
    }

    if (range > 100) {
      continue;
    }

    vec.add(this.pos.minus(other.pos).normalize().scale(1 / range));
  }

  return vec.normalize();
};

Actors.King.prototype.reflect = function () {
  var reflect = new Vec3();

  if (this.pos.y < this.refs.cell.opts.max_y * 0.1) {
    reflect.y = ((this.refs.cell.opts.max_y * 0.1) - this.pos.y) / (this.refs.cell.opts.max_y * 0.1);
  }

  if (this.pos.x > this.refs.cell.opts.max_x * 0.9) {
    reflect.x = -(this.pos.x - (this.refs.cell.opts.max_x * 0.9)) / (this.refs.cell.opts.max_x * 0.1);
  }

  if (this.pos.x < this.refs.cell.opts.max_x * 0.1) {
    reflect.x = ((this.refs.cell.opts.max_x * 0.1) - this.pos.x) / (this.refs.cell.opts.max_x * 0.1);
  }

  if (this.pos.y > this.refs.cell.opts.max_y * 0.9) {
    reflect.y = -(this.pos.y - (this.refs.cell.opts.max_y * 0.9)) / (this.refs.cell.opts.max_y * 0.1);
  }

  return reflect;
};

Actors.King.prototype.damage = function (hp) {
  if (!hp) {
    hp = 1;
  }

  this.attrs.hp -= hp;
  this.attrs.hit = true;

  if (this.attrs.hp > 0) {
    return;
  }

  if (this.attrs.dead) {
    return;
  }

  this.kill();
};

Actors.King.prototype.kill = function (terminal) {
  if (this.attrs.dead) {
    return;
  }

  this.attrs.dead = true;

  var i, ii;

  if (this.refs.cell) {
    for (i = 0, ii = this.refs.cell.kings.length; i < ii; i++) {
      if (this.refs.cell.kings[i] === this) {
        this.refs.cell.kings[i] = null;
        break;
      }
    }
  }

  this.refs.cell.booms.push(new Actors.Boom(
    this.env, {
    }, {
      style: '',
      radius: 16,
      x: this.pos.x,
      y: this.pos.y,
      color: '255,0,0'
    }
  ));

  if (terminal) {
    return;
  }
};

Actors.King.prototype.paint = function (view) {
  view.ctx.save();
  view.ctx.rotate(this.velo.angleXY());

  var ccc = '#c00';

  if (this.attrs.hit) {
    this.attrs.hit = false;
    ccc = '#ff0';
  }

  view.ctx.fillStyle = '#c00';
  view.ctx.strokeStyle = '#c00';
  view.ctx.lineWidth = 1;

  var z = 16;

  // for tails
  var q1 = (Math.sin(this.attrs.phase / 2) % (2 * Math.PI));
  var q2 = (Math.sin(this.attrs.phase / 3) % (2 * Math.PI));

  // tail
  view.ctx.fillStyle = ccc;
  view.ctx.strokeStyle = ccc;
  view.ctx.save();
  view.ctx.translate(-1.5 * z, 0);
  view.ctx.beginPath();
  view.ctx.moveTo(0, 0.5 * z);
  view.ctx.quadraticCurveTo(-5 * z, z * q1, -5 * z, 0);
  view.ctx.quadraticCurveTo(-5 * z, z * q1, 0, -0.5 * z);
  view.ctx.closePath();
  view.ctx.stroke();
  view.ctx.fill();
  view.ctx.restore();

  // body
  view.ctx.fillStyle = ccc;
  view.ctx.lineWidth = 1;
  view.ctx.beginPath();
  view.ctx.ellipse(0, 0, z * 2.5, z * 1.2, 0, 2 * Math.PI, 0);
  view.ctx.closePath();
  view.ctx.fill();

  // head
  view.ctx.save();
  view.ctx.translate(2.2 * z, 0);
  view.ctx.rotate(q2 * 0.3);

  // whiskers
  view.ctx.strokeStyle = ccc;
  view.ctx.lineWidth = 0.5;

  view.ctx.beginPath();
  view.ctx.moveTo(z * 0.8, 0);
  view.ctx.lineTo(z * 0.7, -z);
  view.ctx.stroke();

  view.ctx.beginPath();
  view.ctx.moveTo(z * 0.8, 0);
  view.ctx.lineTo(z * 0.9, -z);
  view.ctx.stroke();

  view.ctx.beginPath();
  view.ctx.moveTo(z * 0.8, 0);
  view.ctx.lineTo(z * 0.7, z);
  view.ctx.stroke();

  view.ctx.beginPath();
  view.ctx.moveTo(z * 0.8, 0);
  view.ctx.lineTo(z * 0.9, z);
  view.ctx.stroke();

  // skull
  view.ctx.fillStyle = ccc;
  view.ctx.beginPath();
  view.ctx.ellipse(0, 0, z * 1.2, z * 0.7, 0, 2 * Math.PI, 0);
  view.ctx.closePath();
  view.ctx.fill();

  // eyes
  view.ctx.fillStyle = '#ff0';

  // blink
  if (Math.random() < 0.1) {
    view.ctx.fillStyle = '#000';
  }
  view.ctx.beginPath();
  view.ctx.ellipse(z * 0.8, -z * 0.2, z * 0.1, z * 0.05, 0, 2 * Math.PI, 0);
  view.ctx.closePath();

  view.ctx.fill();
  view.ctx.beginPath();
  view.ctx.ellipse(z * 0.8, z * 0.2, z * 0.1, z * 0.05, 0, 2 * Math.PI, 0);
  view.ctx.closePath();
  view.ctx.fill();

  view.ctx.restore();
  // end head

  view.ctx.restore();
};
