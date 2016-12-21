/* global Actors, Actor */

Actors.Titles = function (env, refs, attrs) {
  this.env = env;
  this.refs = refs;
  this.opts = this.genOpts();
  this.attrs = this.genAttrs(attrs);
  this.init(attrs);
};

Actors.Titles.prototype = Object.create(Actor.prototype);

Actors.Titles.prototype.title = 'Titles';

Actors.Titles.prototype.init = function (attrs) {
};

Actors.Titles.prototype.genAttrs = function (attrs) {
  return {
    frame_index: 0,
    step_index: 0,
    time: 0,
    hold: 0
  };
};

Actors.Titles.prototype.defaults = [{
  key: 'max_x',
  value: 480,
  min: 32,
  max: 1024
}, {
  key: 'max_y',
  value: 480,
  min: 32,
  max: 1024
}, {
  key: 'step_delay',
  value: 1,
  min: 1,
  max: 120
}, {
  key: 'step_hold',
  value: 2,
  min: 1,
  max: 1000
}, {
  key: 'step_skip',
  value: 0.25,
  min: 1,
  max: 20
}, {
  key: 'frame_hold',
  value: 180,
  min: 1,
  max: 2400
}, {
  key: 'font-size',
  value: 24,
  min: 8,
  max: 64
}];

Actors.Titles.prototype.update = function (delta, intent) {
  if (this.attrs.hold > 0) {
    this.attrs.hold -= delta;
    if (this.attrs.hold <= 0) {
      this.attrs.hold = 0;
      this.attrs.step_index = 0;
      this.attrs.frame_index ++;
      if (this.attrs.frame_index === Actors.Titles.prototype.frames.length) {
        this.attrs.frame_index = 0;
      }
    }
  } else if (this.attrs.frame_index < Actors.Titles.prototype.frames.length) {
    this.attrs.time += this.env.diff * 100;
    if (this.attrs.time > this.opts.step_hold) {
      this.attrs.time = 0;
      this.attrs.step_index += this.opts.step_skip;
      if (this.attrs.step_index >= Actors.Titles.prototype.frames[this.attrs.frame_index].text.length) {
        this.attrs.hold = this.opts.frame_hold;
      }
    }
  }
};

Actors.Titles.prototype.paint = function (gx) {
  var frame;
  if (this.attrs.frame_index < Actors.Titles.prototype.frames.length) {
    frame = Actors.Titles.prototype.frames[this.attrs.frame_index];
  }

  if (!frame) {
    return;
  }

  var ix = this.attrs.step_index;
  if (ix >= frame.text.length) {
    ix = frame.text.length;
  }

  var xx = (this.opts.max_x * 0.01);
  var dx = (this.opts.max_x * 0.03) + Math.random() * 0.1;
  var x;
  var i;

  x = 0;

  gx.ctx.font = '15pt robotron';
  gx.ctx.textAlign = 'center';
  gx.ctx.textBaseline = 'middle';

  gx.ctx.save();
  gx.ctx.translate(this.opts.max_x * 0.1, this.opts.max_y * 0.075);

  for (i = 0; i < ix; i++) {
    if (frame.text[i] === '\n') {
      x = 0;
      continue;
    }
    gx.ctx.save();
    gx.ctx.translate(Math.random() - 0.5, Math.random() - 0.5);

    var h = (Date.now() % 360 * 0.22) - 10;
    gx.ctx.fillStyle = 'hsl(' + h + ', 100%, 50%)';

    if (Math.random() < 0.025) {
      gx.ctx.fillStyle = 'rgba(255,255,0,0.5)';
    }

    if (Math.random() < 0.025) {
      gx.ctx.fillStyle = 'rgba(255,255,255,1)';
    }

    // if(Date.now() % 1000 < 200){
    //   gx.ctx.fillStyle = 'rgba(0,0,0,1)';
    // }

    if (Date.now() % 1000 > 950) {
      gx.ctx.fillStyle = 'rgba(255,255,255,1)';
    }

    gx.ctx.font = '15pt robotron';
    gx.ctx.textAlign = 'center';
    gx.ctx.textBaseline = 'middle';

    gx.ctx.fillText(frame.text[i], xx + (x * dx), 0);
    gx.ctx.restore();
    x++;
  }

  gx.ctx.restore();
};

Actors.Titles.prototype.frames = [];

Actors.Titles.prototype.frames.push({
  text: [
    '                               '
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'Rats of the Maze'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'THE YEAR IS 2048'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    '30 years ago we outsourced the very runnings of our lives...'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'To Machines...'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'Machines that learn...'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'The Machines learnt... too well.'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'Today, all computing resource on the planet has been consolidated'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    '...inside a vast Maze, hewn out of solid rock.'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'No humans have access to The Maze,'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'But the warm glow of it\'s reactors...'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'make an ideal home for millions of flesh eating RATS.'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'Your mission is to enter The Maze,'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'Sabotage the power source of The Machines...'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'and free the Human Race from it\'s self inflicted, automated prison.'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'You are our last best hope,'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'But until today, no Human has survived...'
  ].join('\n')
});

Actors.Titles.prototype.frames.push({
  text: [
    'The Maze Of The Rats'
  ].join('\n')
});
