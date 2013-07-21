var Asteroids = (function() {

	//==================
	// persistent state
	//==================

	const CANVAS = document.getElementById('gameCanvas')
	CANVAS.width = window.innerWidth - 20
	CANVAS.height = window.innerHeight - 150

	const BUTTON = document.getElementById('playButton')
	const MESSAGE = document.getElementById('messageArea')
	const SCORE = document.getElementById('scoreArea')
	const ASTEROIDS = document.getElementById('numAsteroids')
	const MIN_X = -15
	const MIN_Y = -15
	const MAX_X = CANVAS.width + 15
	const MAX_Y = CANVAS.height + 15

	//=============
	// inheritance
	//=============

	function Surrogate(child) {
		this.constructor = child;
	}

	function extend(child, parent) {
		Surrogate.prototype = parent.prototype;
		child.prototype = new Surrogate(child);
	}

	//============
	// Game class
	//============

	function Game() {
		this.ctx = CANVAS.getContext("2d");
	}

	Game.prototype.start = function() {
		// get number of asteroids
		var numAsteroids = ASTEROIDS.value.valueOf()
		if (!numAsteroids || numAsteroids < 1 || numAsteroids > 1000) {
			MESSAGE.innerHTML = 'You can do better than that!'
			return
		}

		// end previous game if exists
		this.stop("Press 'up' to move forward,\n'down' to move backward,\n'left' or 'right' to rotate your spacecraft,\n or 'spacebar' to fire.")
		SCORE.innerHTML = "0"

		// give focus to CANVAS
		BUTTON.blur();
		CANVAS.focus();
  
		// set game state
		this.asteroids = [];
		this.bullets = [];
		this.populate(numAsteroids);

		// set update loop
		var that = this;
		that.updateLoop = window.setInterval(function() {
			// respond to keyboard input
			if(key.isPressed("up")) { that.ship.power(0.4) };
			if(key.isPressed("down")) { that.ship.power(-0.4) };
			if(key.isPressed("left")) {
				that.ship.rotate(-Math.PI / 16)
			};
			if(key.isPressed("right")) {
				that.ship.rotate(Math.PI / 16)
			};
			if(key.isPressed("space")) { that.ship.fireBullet(that) };

			// update state
			that.update();
			that.draw();
		}, 30);
	}

	Game.prototype.stop = function(message) {
		that = this;
		clearInterval(that.updateLoop);
		MESSAGE.innerHTML = message
		BUTTON.innerHTML = "Play Again"
	}

	Game.prototype.populate = function(numAsteroids) {
		for (i = 0; i < numAsteroids; i++) {
			this.asteroids.push( Asteroid.randomAsteroid() );
		}
		this.ship = new Ship();
		this.ship.canFire = true
	}

	Game.prototype.update = function() {
		var that = this
		that.asteroids.forEach( function(asteroid) {
			asteroid.updatePos();
			asteroid.rotate()
			if (asteroid.offScreen()) {
				asteroid.wrap();
			}
		});
		that.ship.updatePos();
		if (that.ship.offScreen()) {
			that.ship.wrap();
		}
		that.bullets = that.bullets.filter( function(bullet) {
			bullet.updatePos();
			if (bullet.isHit(that.asteroids, that)) {
				return false;
			}
			if (bullet.offScreen()) {
				return false;
			}
			return true
		});
		if (that.ship.isHit(that.asteroids, that)) {
			that.stop("You Lost!");
		} else if (that.asteroids.length === 0) {
			that.stop("You Won!");
		}
	}

	Game.prototype.draw = function() {
		var that = this
		that.ctx.clearRect(MIN_X, MIN_Y, MAX_X, MAX_Y);

		that.ship.draw(that.ctx);
		that.asteroids.forEach( function(asteroid) {
			asteroid.draw(that.ctx);
		});

		that.bullets.forEach( function(bullets) {
			bullets.draw(that.ctx);
		});
	}

	//====================
	// MovingObject class
	//====================

	function MovingObject(pos, vel, rad) {
		this.pos = pos;
		this.vel = vel;
		this.rad = rad;

		var rot = Math.atan( this.vel['dy'] / this.vel['dx'] )
		if (rot !== rot) rot = -(Math.PI / 2)
		this.rot = rot
	}

	MovingObject.prototype.updatePos = function() {
		this.pos['x'] += this.vel['dx'];
		this.pos['y'] += this.vel['dy'];
	}

	MovingObject.prototype.offScreen = function() {
		return this.pos['x'] > MAX_X || this.pos['x'] < MIN_X
		|| this.pos['y'] > MAX_Y || this.pos['y'] < MIN_Y;
	}

	MovingObject.prototype.wrap = function() {
		if (this.pos['x'] > MAX_X) {
			this.pos['x'] -= (MAX_X - MIN_X)
		} else if (this.pos['x'] < MIN_X) {
			this.pos['x'] += (MAX_X - MIN_X)
		}
		if (this.pos['y'] > MAX_Y) {
			this.pos['y'] -= (MAX_Y - MIN_Y)
		} else if (this.pos['y'] < MIN_Y) {
			this.pos['y'] += (MAX_Y - MIN_Y)
		}
	}

	MovingObject.prototype.draw = function(ctx) {
		ctx.beginPath();

		var lastVertex = this.vertices[this.vertices.length - 1]
		ctx.moveTo(lastVertex.x, lastVertex.y)

		var that = this;
		this.vertices.forEach(function(vertex) {
			var pos = that._arcPos(vertex)
			ctx.lineTo(pos.x, pos.y);
		});

		ctx.closePath();

		ctx.strokeStyle = "white"
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	MovingObject.prototype.isHit = function(asteroids, game) {
		that = this
		var len = asteroids.length
		var result = asteroids.filter(function(asteroid) {
			var hit = Math.sqrt(
				Math.pow(that.pos['x'] - asteroid.pos['x'], 2) +
			  Math.pow(that.pos['y'] - asteroid.pos['y'], 2)) <=
				(that.rad + asteroid.rad);
			if (hit) { SCORE.innerHTML = (parseInt(SCORE.innerHTML) + 1) }
			return !hit;
		});
		game.asteroids = result;

		if (len !== result.length) return true;
	}

	MovingObject.prototype._arcPos = function(angle) {
		var x = this.pos['x'] + this.rad * Math.cos(this.rot + angle)
		var y = this.pos['y'] + this.rad * Math.sin(this.rot + angle)
		return {x: x, y: y}
	}

	//================
	// Asteroid class
	//================

	function Asteroid(pos, vel, rad, rotVel, vertices) {
		MovingObject.call(this, pos, vel, rad);
		this.rot = 0
		this.rotVel = (rotVel || 0);
		this.vertices = (vertices || []);
	}

	extend(Asteroid, MovingObject);

	Asteroid.randomAsteroid = function() {
		pos = Asteroid.randomEdgePos()

		var vel = {
			dx: 5 * (Math.random() * 2 - 1),
			dy: 5 * (Math.random() * 2 - 1)
		}

		var rad = Math.random() * 25 + 5

		var rotVel = (Math.random() - 0.5) / 4;

		var vertices = [];
		var numVertices = Math.random() * 10 + 10

		for (var i=0; i < numVertices; i++) {
			var vertex = Math.PI * (Math.random() * 2 - 1);
			vertices.push(vertex);
		}
		vertices = vertices.sort(function(a, b) { return (a < b) });

		var asteroid = new Asteroid(pos, vel, rad, rotVel, vertices);

		return asteroid;
	}

	Asteroid.randomEdgePos = function() {
		var x, y, edges = [MIN_X, MAX_X, MIN_Y, MAX_Y];

		var index = Math.floor(4 * Math.random())
		index < 2 ? x = edges[index] : y = edges[index];

		x	= x || (MAX_X - MIN_X) * Math.random();
		y = y || (MAX_Y - MIN_Y) * Math.random();

		return {x: x, y: y};
	}

	Asteroid.prototype.rotate = function() {
		this.rot += this.rotVel
		if (this.rot > Math.PI) {
			this.rot -= (Math.PI * 2)
		} else if (this.rot < -Math.PI){
			this.rot += (Math.PI * 2)
		}
	}

	//============
	// Ship class
	//============

	function Ship() {
		var pos = {
			x: ((MAX_X - MIN_X) / 2),
			y: ((MAX_Y - MIN_Y) / 2)
		};

		var vel = {
			dx: 0,
			dy: 0
		};

		MovingObject.call(this, pos, vel, 10);
		this.vertices = [-2.5, 0, 2.5]
	}

	extend(Ship, MovingObject);

	Ship.prototype.rotate = function(d0) {
		this.rot += d0
		if (this.rot > Math.PI) {
			this.rot -= (Math.PI * 2)
		} else if (this.rot < -Math.PI){
			this.rot += (Math.PI * 2)
		}
	}

	Ship.prototype.power = function(dr) {
		this.vel['dx'] += Math.cos(this.rot) * dr;
		this.vel['dy'] += Math.sin(this.rot) * dr;
	}

	Ship.prototype.fireBullet = function(game) {
		if (this.canFire) {
			that = this
			game.bullets.push(new Bullet(that.pos, that.vel, that.rot));
			that.canFire = false
			window.setTimeout(function() { that.canFire = true }, 250)
		};
	}

	//==============
	// Bullet class
	//==============

	function Bullet(basePos, baseVel, rot) {
		var pos = {
			x: basePos['x'],
			y: basePos['y']
		}

		var vel = {
			dx: baseVel['dx'] + 5 * Math.cos(rot),
			dy: baseVel['dy'] + 5 * Math.sin(rot)
		};

		MovingObject.call(this, pos, vel, 2);
	}

	extend(Bullet, MovingObject);

	Bullet.prototype.draw = function(ctx) {
		ctx.fillStyle = "white"
		ctx.beginPath();

		ctx.arc(
			this.pos['x'],
			this.pos['y'],
			this.rad,
			0,
			2 * Math.PI,
			false
		);

		ctx.fill();
	}
	return {
		game: new Game()
	};
})();
