/* global Actors, Actor, pickOne, random */

Actors.Maze = function (env, refs, attrs, opts) {
  this.env = env;
  this.refs = refs;
  this.opts = this.genOpts(opts);
  this.attrs = this.genAttrs(attrs);
  this.init();
};

Actors.Maze.prototype = Object.create(Actor.prototype);

Actors.Maze.prototype.title = 'Maze';

Actors.Maze.prototype.genAttrs = function (attrs) {
  return {
    ttl: 0,
    phase: 'gen',
    max: Math.min(this.opts.max_x, this.opts.max_y),
    escape: false,
    escape_done: false,
    rows: attrs.rows || this.opts.rows,
    cols: attrs.cols || this.opts.cols,
    humanCountdown: 60,
    boom: false,
    boomCountdown: 0
  };
};

Actors.Maze.prototype.init = function () {
  this.makeGrid();
  this.human = false;

  if (this.env.level % 4 === 0) {
    this.attrs.color = '153, 153, 0';
  }

  if (this.env.level % 7 === 0) {
    this.attrs.color = '153, 0, 153';
  }

  if (this.env.level > 6 && this.env.level % 3 === 0) {
    this.attrs.color = '0, 0, 204';
  }

  this._steps = {
    ttl: this.attrs.ttl,
    cell: -1,
    other: false,
    other_dir: null,
    stack: [],
    total: this.cells.length,
    visited: 1,
    done: false
  };
};

Actors.Maze.prototype.defaults = [{
  key: 'max_x',
  value: 1280,
  min: 100,
  max: 1600
}, {
  key: 'max_y',
  value: 1280,
  min: 100,
  max: 1000
}, {
  key: 'rows',
  value: 4,
  min: 3,
  max: 24
}, {
  key: 'cols',
  value: 6,
  min: 8,
  max: 32
}, {
  key: 'cell_w',
  value: 480,
  min: 100,
  max: 1600
}, {
  key: 'fit',
  value: 1,
  min: 0,
  max: 1
}, {
  key: 'breeders',
  value: 3,
  min: 0,
  max: 16
}, {
  key: 'snakes',
  value: 1,
  min: 0,
  max: 16
}];

Actors.Maze.prototype.makeGrid = function () {
  var level = this.env.level % 4;
  var x, y, i, ii;

  if (this.env.level === 1) {
    this.attrs.rows = 3;
    this.attrs.cols = 4;
  } else if (this.env.level % 5 === 0) {
    this.attrs.rows = 6;
    this.attrs.cols = 7;
  } else if (this.env.level % 13 === 0) {
    this.attrs.rows = 3;
    this.attrs.cols = 3;
  } else {
    switch (level) {
      case 0:
        this.attrs.rows = 4;
        this.attrs.cols = 7;
        break;
      case 1:
        this.attrs.rows = 4;
        this.attrs.cols = 7;
        break;
      case 2:
        this.attrs.rows = 4;
        this.attrs.cols = 5;
        break;
      case 3:
        this.attrs.rows = 5;
        this.attrs.cols = 8;
        break;
    }
  }

  // if(this.env.h > this.env.w){
  //   var tmp = this.attrs.rows
  //   this.attrs.rows = this.attrs.cols
  //   this.attrs.cols = tmp
  // }

  // init blank grid
  this.booms = [];

  this.cells = new Array(this.attrs.rows * this.attrs.cols);
  x = 0;
  y = 0;
  for (i = 0, ii = this.cells.length; i < ii; i++) {
    this.cells[i] = new Actors.Cell(
      this.env, {
        maze: this,
        cells: this.cells
      }, {
        // position on grid
        i: i,
        x: x,
        y: y
      });
    x++;
    if (x === this.attrs.cols) {
      x = 0;
      y++;
    }
  }

  this.makeGridmates();

  if (!this.attrs.phase) {
    this.generatePerfectMaze();
    this.seedActors();
  }
};

Actors.Maze.prototype.seedActors = function () {
  this.attrs.entry_cell = 0;
  this.attrs.logo_cell = this.cells.length - this.opts.cols;
  this.attrs.capacitor_cell = this.cells.length - this.opts.cols;
  this.attrs.powerup_cell = this.opts.cols - 1;
  this.attrs.reactor_cell = this.cells.length - 1;

  this.portal = this.addPortal(this.attrs.entry_cell);
  this.reactor = this.addReactor(this.attrs.reactor_cell);

  if (this.env.level === 1) {
    this.randomBreeders(2, route);
  } else {
    if (this.env.level % 6 !== 0) {
      this.randomBreeders(3, route);
    }
  }

  if (this.env.level > 1) {
    var route = this.route(this.cells[this.attrs.entry_cell], this.cells[this.attrs.reactor_cell]);
    if (route.length > 6) {
      route.shift();
      route.pop();
      this.randomPowerup(route);
    }
    // this.randomPowerup();
  }

  if (this.env.level > 1) {
    var count = this.env.level - 1;
    if (count > 3) {
      count = 3;
    }
  }

  if (this.env.level > 1) {
    this.randomCapacitor(route);
    this.randomSnake(route);
  }
  if (this.env.level > 2) {
    this.randomCapacitors(route);
    this.randomSnake(route);
    this.randomSnake(route);
  }
  if (this.env.level > 3) {
    this.randomMachine();
    this.randomSnake(route);
  }

  if (this.env.level > 3) {
    this.randomPong();
  }

  if (this.env.level > 4) {
    this.randomLogo(route);
    this.randomSnake(route);
    if (this.env.level % 6 !== 0) {
      this.randomBreeders(1, route);
    }
  }

  if (this.env.level % 5 === 0) {
    if (this.env.level % 6 !== 0) {
      this.randomBreeders(2, route);
    }
  }

  if (route && route.length > 10) {
    this.randomPowerup(route);
  }

  if (route && route.length > 12) {
    this.randomPowerup(route);
  }

  if (this.env.level % 13 === 0) {
  }
};

Actors.Maze.prototype.makeGridmates = function () {
  var dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  var i, ii, x, y, ix, exit;
  var cell;
  for (i = 0, ii = this.cells.length; i < ii; i++) {
    cell = this.cells[i];
    for (exit = 0; exit < 4; exit++) {
      x = cell.attrs.x + dirs[exit][0];
      y = cell.attrs.y + dirs[exit][1];
      if (y < 0 || x < 0 || x >= this.attrs.cols || y >= this.attrs.rows) {
        continue;
      }
      ix = (y * this.attrs.cols) + x;
      cell.gridmates[exit] = this.cells[ix];
    }
  }
};

Actors.Maze.prototype.connectAllCells = function () {
  var dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  var i, ii, x, y, ix, exit;
  var cell;
  for (i = 0, ii = this.cells.length; i < ii; i++) {
    cell = this.cells[i];
    for (exit = 0; exit < 4; exit++) {
      x = cell.attrs.x + dirs[exit][0];
      y = cell.attrs.y + dirs[exit][1];
      if (y < 0 || x < 0 || x >= this.attrs.cols || y >= this.attrs.rows) {
        continue;
      }
      ix = (y * this.attrs.cols) + x;
      cell.exits[exit] = this.cells[ix];
      cell.gridmates[exit] = this.cells[ix];
    }
  }
};

Actors.Maze.prototype.generatePerfectMaze = function (max) {
  var stack = [];
  var cells = this.cells;
  var total = cells.length;
  var cell;
  var visited = 1;
  var n; // neighbours
  var i, j, c;
  var pick, other, dir;
  var flip = [2, 3, 0, 1];

  cell = pickOne(cells);
  while (visited < total) {
    n = [];
    // find all neighbors of Cell with all walls intact
    for (i = 0; i < 4; i++) {
      if (cell.gridmates[i]) {
        c = 0;
        other = cell.gridmates[i];
        for (j = 0; j < 4; j++) {
          if (!other.exits[j]) {
            c++;
          }
        }
        if (c === 4) {
          n.push([i, other]);
        }
      }
    }
    if (n.length > 0) {
      pick = pickOne(n);
      dir = pick[0];
      other = pick[1];
      cell.exits[dir] = other;
      other.exits[flip[dir]] = cell;
      stack.push(cell);
      cell = other;
      visited++;
    } else {
      cell = stack.pop();
    }
  }
};

Actors.Maze.prototype.addLogo = function (ix) {
  this.cells[ix].addLogo();
};

Actors.Maze.prototype.randomLogo = function (route) {
  var x = 10; // attempts
  var ix;
  while (x > 0) {
    ix = random.from0upto(this.cells.length);
    if (route && route.indexOf(ix) > -1) {
      x--;
      continue;
    }
    if (this.cells[ix].snake) {
      x--;
      continue;
    }
    if (this.cells[ix].capacitor) {
      x--;
      continue;
    }
    if (this.cells[ix].capacitors) {
      x--;
      continue;
    }
    if (this.cells[ix].machine) {
      x--;
      continue;
    }
    if (this.cells[ix].reactor) {
      x--;
      continue;
    }
    if (this.cells[ix].breeders.length > 0) {
      x--;
      continue;
    }
    if (this.cells[ix].portal) {
      x--;
      continue;
    }
    this.cells[ix].addLogo();
    break;
  }
};

Actors.Maze.prototype.addCapacitor = function (ix) {
  this.cells[ix].addCapacitor();
};

Actors.Maze.prototype.randomCapacitor = function (route) {
  var x = 10; // attempts
  var ix;
  while (x > 0) {
    if (route) {
      ix = pickOne(route);
    } else {
      ix = random.from0upto(this.cells.length);
    }
    if (this.cells[ix].logo) {
      x--;
      continue;
    }
    if (this.cells[ix].powerup) {
      x--;
      continue;
    }
    if (this.cells[ix].snake) {
      x--;
      continue;
    }
    if (this.cells[ix].machine) {
      x--;
      continue;
    }
    if (this.cells[ix].reactor) {
      x--;
      continue;
    }
    if (this.cells[ix].breeders.length > 0) {
      x--;
      continue;
    }
    if (this.cells[ix].portal) {
      x--;
      continue;
    }
    this.cells[ix].addCapacitor();
    break;
  }
};

Actors.Maze.prototype.addCapacitors = function (ix) {
  this.cells[ix].addCapacitors();
};

Actors.Maze.prototype.randomCapacitors = function (route) {
  var ix, x;
  x = 10; // attempts
  while (x > 0) {
    ix = random.from0upto(this.cells.length);
    if (route) {
      ix = pickOne(route);
    } else {
      ix = random.from0upto(this.cells.length);
    }
    if (this.cells[ix].logo) {
      x--;
      continue;
    }
    if (this.cells[ix].powerup) {
      x--;
      continue;
    }
    if (this.cells[ix].snake) {
      x--;
      continue;
    }
    if (this.cells[ix].capacitor) {
      x--;
      continue;
    }
    if (this.cells[ix].machine) {
      x--;
      continue;
    }
    if (this.cells[ix].powerup) {
      x--;
      continue;
    }
    if (this.cells[ix].reactor) {
      x--;
      continue;
    }
    if (this.cells[ix].breeders.length > 0) {
      x--;
      continue;
    }
    if (this.cells[ix].portal) {
      x--;
      continue;
    }
    this.cells[ix].addCapacitors();
    break;
  }
};

Actors.Maze.prototype.addMachine = function (ix) {
  this.cells[ix].addMachine();
};

Actors.Maze.prototype.randomMachine = function (route) {
  var x = 10; // attempts
  var ix;
  while (x > 0) {
    if (route) {
      ix = pickOne(route);
    } else {
      ix = random.from0upto(this.cells.length);
    }
    if (this.cells[ix].logo) {
      x--;
      continue;
    }
    if (this.cells[ix].snake) {
      x--;
      continue;
    }
    if (this.cells[ix].capacitor) {
      x--;
      continue;
    }
    if (this.cells[ix].capacitors) {
      x--;
      continue;
    }
    if (this.cells[ix].reactor) {
      x--;
      continue;
    }
    if (this.cells[ix].breeders.length > 0) {
      x--;
      continue;
    }
    if (this.cells[ix].portal) {
      x--;
      continue;
    }
    this.cells[ix].addMachine();
    break;
  }
};

Actors.Maze.prototype.addPong = function (ix) {
  this.cells[ix].addPong();
};

Actors.Maze.prototype.randomPong = function (max) {
  var x = 10; // attempts
  var ix;
  while (x > 0) {
    ix = random.from0upto(this.cells.length);
    if (this.cells[ix].snake) {
      x--;
      continue;
    }
    if (this.cells[ix].reactor) {
      x--;
      continue;
    }
    if (this.cells[ix].breeders.length > 0) {
      x--;
      continue;
    }
    if (this.cells[ix].portal) {
      x--;
      continue;
    }
    this.cells[ix].addPong();
    break;
  }
};

Actors.Maze.prototype.addPowerup = function (ix) {
  this.cells[ix].addPowerup();
};

Actors.Maze.prototype.randomPowerup = function (route) {
  var x = 10; // attempts
  var ix;
  while (x > 0) {
    if (route) {
      ix = pickOne(route);
    } else {
      ix = random.from0upto(this.cells.length);
    }
    if (this.cells[ix].snake) {
      x--;
      continue;
    }
    if (this.cells[ix].machine) {
      x--;
      continue;
    }
    if (this.cells[ix].capacitor) {
      x--;
      continue;
    }
    if (this.cells[ix].capacitors) {
      x--;
      continue;
    }
    if (this.cells[ix].logo) {
      x--;
      continue;
    }
    if (this.cells[ix].reactor) {
      x--;
      continue;
    }
    if (this.cells[ix].breeders.length > 0) {
      x--;
      continue;
    }
    if (this.cells[ix].portal) {
      x--;
      continue;
    }
    this.cells[ix].addPowerup();
    break;
  }
};

Actors.Maze.prototype.addStory = function (max) {
  var x = 10; // attempts
  var ix;
  while (x > 0) {
    ix = random.from0upto(this.cells.length);
    if (ix === this.attrs.entry_cell) {
      x--;
      continue;
    }
    if (this.cells[ix].snake) {
      x--;
      continue;
    }
    if (this.cells[ix].reactor) {
      x--;
      continue;
    }
    if (this.cells[ix].breeders.length > 0) {
      x--;
      continue;
    }
    if (this.cells[ix].portal) {
      x--;
      continue;
    }
    this.cells[ix].addStory();
    break;
  }
};

Actors.Maze.prototype.randomSnake = function (route) {
  var x = 10; // attempts
  var ix;
  while (x > 0) {
    ix = random.from0upto(this.cells.length);

    // exclude route
    if (route && route.indexOf(ix) > -1) {
      x--;
      continue;
    }

    if (this.cells[ix].snake) {
      x--;
      continue;
    }
    if (this.cells[ix].machine) {
      x--;
      continue;
    }
    if (this.cells[ix].capacitor) {
      x--;
      continue;
    }
    if (this.cells[ix].capacitors) {
      x--;
      continue;
    }
    if (this.cells[ix].logo) {
      x--;
      continue;
    }
    if (this.cells[ix].reactor) {
      x--;
      continue;
    }
    if (this.cells[ix].breeders.length > 0) {
      x--;
      continue;
    }
    if (this.cells[ix].portal) {
      x--;
      continue;
    }
    this.cells[ix].addSnake();
    break;
  }
};

Actors.Maze.prototype.addStory = function (max) {
  var x = 10; // attempts
  var ix;
  while (x > 0) {
    ix = random.from0upto(this.cells.length);
    if (this.cells[ix].snake) {
      x--;
      continue;
    }
    if (this.cells[ix].reactor) {
      x--;
      continue;
    }
    if (this.cells[ix].breeders.length > 0) {
      x--;
      continue;
    }
    if (this.cells[ix].portal) {
      x--;
      continue;
    }
    this.cells[ix].addStory();
    break;
  }
};

Actors.Maze.prototype.randomBreeders = function (max, route) {
  if (!max) {
    max = 0;
  }
  for (var i = 0; i < max; i++) {
    this.randomBreeder(route);
  }
};

Actors.Maze.prototype.addBreeder = function (ix) {
  this.cells[ix].addBreeder();
};

Actors.Maze.prototype.randomBreeder = function (route) {
  var x = 5; // attempts
  var ix;
  while (x > 0) {
    ix = random.from0upto(this.cells.length);
    if (route && route.indexOf(ix) > -1) {
      x--;
      continue;
    }
    if (this.cells[ix].breeders.length > 0) {
      x--;
      continue;
    }
    if (this.cells[ix].reactor) {
      x--;
      continue;
    }
    if (this.cells[ix].portal) {
      x--;
      continue;
    }
    this.cells[ix].addBreeder();
    break;
  }
};

Actors.Maze.prototype.addReactor = function (ix) {
  this.cells[ix].addReactor();
};

Actors.Maze.prototype.addHuman = function (ix) {
  var human = this.cells[ix].addHuman();
  return human;
};

Actors.Maze.prototype.addPortal = function (ix) {
  var portal = this.cells[ix].addPortal();
  return portal;
};

Actors.Maze.prototype.route = function (cell, other) {
  var from_i = cell.attrs.i;
  var to_i = other.attrs.i;

  function distanceFunction (pos0, pos1) {
    var d1 = Math.abs(pos1.attrs.x - pos0.attrs.x);
    var d2 = Math.abs(pos1.attrs.y - pos0.attrs.y);
    return d1 + d2;
  }

  var gridsize = this.attrs.rows * this.attrs.cols;

  var nodes = [];
  for (i = 0; i < gridsize; i++) {
    nodes[i] = {
      i: i,
      f: 0, // g + h
      g: 0, // cost
      h: 0, // heuristic
      parent: null,
      cell: this.cells[i]
    };
  }

  nodes[from_i].f = distanceFunction(this.cells[from_i], this.cells[to_i]);

  var astar = new Array(gridsize);
  var open = [from_i]; // discovered nodes to be evaluated
  var result = []; // final output
  var x; // node we are considering
  var path; // reference to a Node (that starts a path in question)
  var max, min, i, j;
  var exits;
  var gScore, gScoreIsBest;

  astar[from_i] = true;

  // iterate until the open list is empty
  while (open.length > 0) {
    max = gridsize;
    min = -1;
    for (i = 0; i < open.length; i++) {
      if (nodes[i].f < max) {
        max = nodes[i].f;
        min = i;
      }
    }

    // get next node and remove from open array
    x = open.splice(min, 1)[0];
    // is it the destination node?
    if (x === to_i) {
      path = nodes[to_i];
      nodes[from_i].parent = null;
      do {
        result.push(path.i);
      } while (path = path.parent);
      // we want to return start to finish
      result.reverse();
      break;
    } else {
      // find which nearby nodes are walkable
      exits = this.cells[x].exits;
      // test each one that hasn't been tried already
      for (i = 0, j = exits.length; i < j; i++) {
        // no other cell in that direction
        if (!exits[i]) {
          continue;
        }
        // 1 is the distance from a node to it's neighbor
        gScore = nodes[x].g + 1;
        gScoreIsBest = false;
        path = nodes[exits[i].attrs.i];
        if (!astar[path.i]) {
          astar[path.i] = true;
          gScoreIsBest = true;
          // estimated cost of this route so far
          nodes[path.i].h = 1;
          nodes[path.i].g = nodes[x].g + 1;
          // estimated cost of entire guessed route to the destination
          nodes[path.i].f = nodes[x].g + distanceFunction(exits[i], other);
          // remember this new path for testing above
          // mark this node in the world graph as visited
          open.push(path.i);
        } else if (gScore < nodes[path.i].g) {
          gScoreIsBest = true;
        }

        if (gScoreIsBest) {
          // Found an optimal (so far) path to this node.
          nodes[path.i].parent = nodes[x];
          nodes[path.i].g = gScore;
          nodes[path.i].f = nodes[path.i].g + 1;
        }
      }
    }
  }
  return result;
};

Actors.Maze.prototype.doGenPhase = function (delta) {
  if (this._steps.ttl >= 0) {
    this._steps.ttl -= delta;
    return;
  }

  this.env.play('computer');

  this._steps.ttl += this.attrs.ttl;

  if (this._steps.cell === -1) {
    this._steps.cell = pickOne(this.cells);
    return;
  }

  var n, i, j, c;
  var cell, pick, other;
  var flip = [2, 3, 0, 1];
  var plucked = false;

  if (this._steps.other) {
    this._steps.showCell = this._steps.cell;
    this._steps.cell.exits[this._steps.other_dir] = this._steps.other;
    this._steps.other.exits[flip[this._steps.other_dir]] = this._steps.cell;
    this._steps.stack.push(this._steps.cell);
    this._steps.cell = this._steps.other;
    this._steps.other = false;
    this._steps.visited ++;
    return;
  }

  cell = this._steps.cell;
  while (this._steps.visited < this._steps.total && !plucked) {
    n = [];
    // find all neighbors of Cell with all walls intact
    for (i = 0; i < 4; i++) {
      if (cell.gridmates[i]) {
        c = 0;
        other = cell.gridmates[i];
        for (j = 0; j < 4; j++) {
          if (!other.exits[j]) {
            c++;
          }
        }
        if (c === 4) {
          n.push([i, other]);
        }
      }
    }
    if (n.length > 0) {
      pick = pickOne(n);
      this._steps.other_dir = pick[0];
      this._steps.other = pick[1];
      plucked = true;
      break;
    } else {
      this._steps.cell = this._steps.stack.pop();
      break;
    }
  }

  if (this._steps.visited === this._steps.total) {
    if (this._steps.stack.length > 0) {
      this._steps.cell = this._steps.stack.pop();
      return;
    }

    if (this._steps.done) {
      if (!this.env.gameover) {
        this._steps.cell = false;
        if (this.attrs.rows < 24) {
          this.attrs.rows ++;
          this.attrs.cols ++;
          this.attrs.ttl *= 0.25;
          if (this.attrs.ttl < 0.1) {
            this.attrs.ttl = 0;
          }
        }
        this.init();
      }
      return;
    }

    if (this._steps.stack.length === 0) {
      this.attrs.phase = 'seed';
      this._steps.done = true;
      return;
    }
  }
};

Actors.Maze.prototype.update = function (delta) {
  if (this.attrs.phase === 'gen') {
    this.doGenPhase(delta);
    return;
  }

  if (this.attrs.phase === 'seed') {
    this.seedActors();
    this.attrs.phase = null;
    return;
  }

  if (this.attrs.humanCountdown > 0) {
    if (this.attrs.humanCountdown % 10 === 0) {
      this.env.play('rad-short');
    }

    this.attrs.humanCountdown --;

    if (this.attrs.humanCountdown === 15) {
      this.env.play('entry');
      this.booms.push(new Actors.Boom(
        this.env, {
        }, {
          style: 'decolonize',
          radius: 128,
          x: 0,
          y: 0,
          color: '0,255,255'
        }
      ));

      this.booms.push(new Actors.Boom(
        this.env, {
        }, {
          style: 'decolonize',
          radius: 132,
          x: 0,
          y: 0,
          color: '255,255,255',
          ttl: 20
        }
      ));

      this.booms.push(new Actors.Boom(
        this.env, {
        }, {
          style: 'decolonize',
          radius: 82,
          x: 0,
          y: 0,
          color: '255,255,255',
          ttl: 60
        }
      ));
    }

    if (this.attrs.humanCountdown === 0) {
      this.human = this.addHuman(this.attrs.entry_cell);
    }
  }

  if (this.attrs.escape_done && !this.human.attrs.escaped) {
    this.human.attrs.escaped = true;
    this.attrs.boom = true;
    this.attrs.boomCountdown = 60;
    this.env.play('warpout');

    this.booms.push(new Actors.Boom(
      this.env, {
      }, {
        style: 'colonize',
        radius: 128,
        x: 0,
        y: 0,
        color: '0,255,255'
      }
    ));

    this.booms.push(new Actors.Boom(
      this.env, {
      }, {
        style: 'colonize',
        radius: 132,
        x: 0,
        y: 0,
        color: '255,255,255',
        ttl: 20
      }
    ));

    this.booms.push(new Actors.Boom(
      this.env, {
      }, {
        style: 'colonize',
        radius: 82,
        x: 0,
        y: 0,
        color: '255,255,255',
        ttl: 60
      }
    ));
  }

  var i, ii;

  if (this.attrs.boom && this.attrs.boomCountdown === 15) {
    this.cells[this.attrs.reactor_cell].reactor.detonate();
  }

  if (this.attrs.boom && this.attrs.boomCountdown > 0) {
    this.attrs.boomCountdown --;
    if (this.attrs.boomCountdown === 0) {
      for (i = 0, ii = this.cells.length; i < ii; i++) {
        this.cells[i].killAllActors();
      }

      this.env.play('reactor-boom');

      setTimeout(this.env.restart, 2500);
    }
  }

  for (i = 0, ii = this.cells.length; i < ii; i++) {
    this.cells[i].update(delta);
  }

  for (i = 0, ii = this.booms.length; i < ii; i++) {
    if (this.booms[i]) {
      this.booms[i].update(delta);
    }
  }

  for (i = 0, ii = this.booms.length; i < ii; i++) {
    if (!this.booms[i] || this.booms[i].attrs.dead) {
      this.booms.splice(i, 1);
      i--;
      ii--;
    }
  }

  if (this.portal) {
    this.portal.update(delta);
  }
};

Actors.Maze.prototype.paint = function (gx, fx) {
  gx.ctx.save();
  fx.ctx.save();

  var cell_w = this.opts.max_x / this.attrs.cols;
  var cell_h = this.opts.max_y / this.attrs.rows;
  var mm = Math.min(cell_w, cell_h);

  var w = mm;
  var f = (w / this.opts.cell_w);

  var x, y, i, ii;
  var cell;

  if (this.attrs.phase === 'gen') {
    for (i = 0, ii = this.attrs.rows * this.attrs.cols; i < ii; i++) {
      x = i % this.attrs.rows;
      y = Math.floor(i / this.attrs.cols);

      cell = this.cells[i];
      gx.ctx.save();
      if (this._steps.stack.indexOf(cell) > -1) {
        gx.ctx.fillStyle = '#300';
        gx.ctx.strokeStyle = '#300';
        gx.ctx.beginPath();
        gx.ctx.rect((cell.attrs.x * w), (cell.attrs.y * w), w, w);
        gx.ctx.fill();
        gx.ctx.stroke();
      }

      if (this._steps.other && this._steps.other.attrs.i === i) {
        gx.ctx.fillStyle = '#ff0';
        gx.ctx.beginPath();
        gx.ctx.fillRect((cell.attrs.x * w), (cell.attrs.y * w), w, w);
      }

      if (this._steps.cell && this._steps.cell !== -1 && this._steps.cell.attrs.i === i) {
        gx.ctx.fillStyle = '#f00';
        gx.ctx.beginPath();
        gx.ctx.fillRect((cell.attrs.x * w), (cell.attrs.y * w), w, w);
      }

      gx.ctx.restore();
    }
  }

  for (i = 0, ii = this.cells.length; i < ii; i++) {
    x = i % this.attrs.cols;
    y = Math.floor(i / this.attrs.rows);

    cell = this.cells[i];
    gx.ctx.save();
    gx.ctx.translate(cell.attrs.x * w, cell.attrs.y * w);
    gx.ctx.scale(f, f);

    fx.ctx.save();
    fx.ctx.translate(cell.attrs.x * w, cell.attrs.y * w);
    fx.ctx.scale(f, f);

    cell.paint(gx, fx);
    gx.ctx.restore();
    fx.ctx.restore();
  }

  var routes, route, from, to;

  // show route
  if (this.human && this.human.attrs.route) {
    routes = this.human.attrs.route;

    if (!this._routeIndex) {
      this._routeIndex = 0;
    }

    if (this._routeIndex >= routes.length) {
      this._routeIndex = 0;
    }

    for (i = 0, ii < routes.length; i < ii; i++) {
      route = routes[i];

      if (this.cells[route] && this.cells[route].capacitor) {
        continue;
      }
      if (this.cells[route] && this.cells[route].capacitors) {
        continue;
      }

      x = routes[i] % this.attrs.cols;
      y = Math.floor(routes[i] / this.attrs.cols);

      from = this.cells[routes[i]];
      to = this.cells[routes[i + 1]];

      if (from && from.breeders.length > 0) {
        continue;
      }

      if (from && from.powerup) {
        continue;
      }

      if (from && to) {
        if (Math.floor(this._routeIndex) === i) {
          if (this.attrs.escape) {
            gx.ctx.strokeStyle = 'rgba(255,0,0,1)';
          } else {
            gx.ctx.strokeStyle = 'rgba(0,255,255,1)';
          }
        } else {
          if (this.attrs.escape) {
            gx.ctx.strokeStyle = 'rgba(255,0,0,0.75)';
          } else {
            gx.ctx.strokeStyle = 'rgba(0,255,255,0.5)';
          }
        }
        gx.ctx.lineWidth = 4;
        gx.ctx.beginPath();
        if (to.attrs.x > from.attrs.x) {
          gx.ctx.moveTo((x * w) + (w * 0.5), (y * w) + (w * 0.4));
          gx.ctx.lineTo((x * w) + (w * 0.6), (y * w) + (w * 0.5));
          gx.ctx.lineTo((x * w) + (w * 0.5), (y * w) + (w * 0.6));
        } else if (to.attrs.x < from.attrs.x) {
          gx.ctx.moveTo((x * w) + (w * 0.5), (y * w) + (w * 0.4));
          gx.ctx.lineTo((x * w) + (w * 0.4), (y * w) + (w * 0.5));
          gx.ctx.lineTo((x * w) + (w * 0.5), (y * w) + (w * 0.6));
        } else if (to.attrs.y > from.attrs.y) {
          gx.ctx.moveTo((x * w) + (w * 0.4), (y * w) + (w * 0.5));
          gx.ctx.lineTo((x * w) + (w * 0.5), (y * w) + (w * 0.6));
          gx.ctx.lineTo((x * w) + (w * 0.6), (y * w) + (w * 0.5));
        } else if (to.attrs.y < from.attrs.y) {
          gx.ctx.moveTo((x * w) + (w * 0.4), (y * w) + (w * 0.5));
          gx.ctx.lineTo((x * w) + (w * 0.5), (y * w) + (w * 0.4));
          gx.ctx.lineTo((x * w) + (w * 0.6), (y * w) + (w * 0.5));
        }
        gx.ctx.stroke();
      }
    }
    this._routeIndex += 0.2;
  }

  var boom;
  for (i = 0, ii = this.booms.length; i < ii; i++) {
    boom = this.booms[i];
    if (!boom) {
      continue;
    }
    gx.ctx.save();
    gx.ctx.translate(w / 2 + boom.attrs.x * w, w / 2 + boom.attrs.y * w);
    this.booms[i].paint(gx);
    gx.ctx.restore();
  }

  if (!this.attrs.phase && this.attrs.humanCountdown > 10) {
    gx.ctx.save();
    gx.ctx.fillStyle = '#0ff';
    gx.ctx.font = '36pt robotron';
    gx.ctx.textAlign = 'center';
    gx.ctx.textBaseline = 'middle';
    gx.ctx.fillText(Math.floor(this.attrs.humanCountdown / 10), w * 0.5, w * 0.5);
    gx.ctx.restore();
  }

  gx.ctx.restore();
  fx.ctx.restore();
};
