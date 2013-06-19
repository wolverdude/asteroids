var Asteroids = (function() {

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

		// set game state
		this.asteroids = [];
		this.bullets = [];
		this.populate.call(this, numAsteroids);

		// set update loop
		var that = this;
		that.updateLoop = window.setInterval(function() {
			// respond to keyboard input
			if(key.isPressed("up")) { that.ship.power.call(that.ship, 0.4) };
			if(key.isPressed("down")) { that.ship.power.call(that.ship, -0.4) };
			if(key.isPressed("left")) {
				that.ship.rotate.call(that.ship, -Math.PI / 16)
			};
			if(key.isPressed("right")) {
				that.ship.rotate.call(that.ship, Math.PI / 16)
			};
			if(key.isPressed("space")) { that.ship.fireBullet.call(that.ship, that) };

			// update state
			that.update.call(that);
			that.draw.call(that);
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
			asteroid.updatePos.call(asteroid);
			asteroid.rotate()
			if (asteroid.offScreen.call(asteroid)) {
				asteroid.wrap.call(asteroid);
			}
		});
		that.ship.updatePos.call(that.ship);
		if (that.ship.offScreen.call(that.ship)) {
			that.ship.wrap.call(that.ship);
		}
		that.bullets = that.bullets.filter( function(bullet) {
			bullet.updatePos.call(bullet);
			if (bullet.isHit.call(bullet, that.asteroids, that)) {
				return false;
			}
			if (bullet.offScreen.call(bullet)) {
				return false;
			}
			return true
		});
		if (that.ship.isHit.call(that.ship, that.asteroids, that)) {
			that.stop.call(this, "You Lost!");
		} else if (that.asteroids.length === 0) {
			that.stop.call(this, "You Won!");
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

	function MovingObjectSurrogate() {
		this.constructor = Asteroid;
	}
	MovingObjectSurrogate.prototype = MovingObject.prototype;

	function Asteroid(pos, vel, rad) {
		MovingObject.call(this, pos, vel, rad);
	}

	Asteroid.randomAsteroid = function() {
		pos = Asteroid.randomEdgePos()
		var vel = {
			dx: 5 * (Math.random() * 2 - 1),
			dy: 5 * (Math.random() * 2 - 1)
		}
		asteroid = new Asteroid(pos, vel, 15)
		asteroid.rotVel = (Math.random() - 0.5) / 2
		return asteroid
	}

	Asteroid.randomEdgePos = function() {
		var x, y, edges = [MIN_X, MAX_X, MIN_Y, MAX_Y];

		index = Math.floor(4 * Math.random())
		index < 2 ? x = edges[index] : y = edges[index];

		x	= x || (MAX_X - MIN_X) * Math.random();
		y = y || (MAX_Y - MIN_Y) * Math.random();

		return {x: x, y: y};
	}

	Asteroid.prototype = new MovingObjectSurrogate();

	Asteroid.prototype.rotate = function() {
		this.rot += this.rotVel
		if (this.rot > Math.PI) {
			this.rot -= (Math.PI * 2)
		} else if (this.rot < -Math.PI){
			this.rot += (Math.PI * 2)
		}
	}

	Asteroid.prototype.draw = function(ctx) {
		ctx.beginPath();

		var vert1 = this._arcPos(0)
		var vert2 = this._arcPos(0.9)
		var vert3 = this._arcPos(1.3)
		var vert4 = this._arcPos(2)
		var vert5 = this._arcPos(-3)
		var vert6 = this._arcPos(-1.9)
		var vert7 = this._arcPos(-1.2)

		ctx.moveTo(vert1['x'], vert1['y']);
		ctx.lineTo(vert2['x'], vert2['y']);
		ctx.lineTo(vert3['x'], vert3['y']);
		ctx.lineTo(vert4['x'], vert4['y']);
		ctx.lineTo(vert5['x'], vert5['y']);
		ctx.lineTo(vert6['x'], vert6['y']);
		ctx.lineTo(vert7['x'], vert7['y']);
		ctx.lineTo(vert1['x'], vert1['y']);

		ctx.closePath();

		ctx.strokeStyle = "white"
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	function MovingObjectSurrogate() {
		this.constructor = Ship;
	}
	MovingObjectSurrogate.prototype = MovingObject.prototype;

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
	}

	Ship.prototype = new MovingObjectSurrogate()

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

	Ship.prototype.draw = function(ctx) {
		ctx.beginPath();

		var vert1 = this._arcPos(0)
		var vert2 = this._arcPos(2.5)
		var vert3 = this._arcPos(-2.5)

		ctx.moveTo(vert1['x'], vert1['y']);
		ctx.lineTo(vert2['x'], vert2['y']);
		ctx.lineTo(vert3['x'], vert3['y']);
		ctx.lineTo(vert1['x'], vert1['y']);

		ctx.closePath();

		ctx.strokeStyle = "white"
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	function MovingObjectSurrogate() {
		this.constructor = Bullet;
	}
	MovingObjectSurrogate.prototype = MovingObject.prototype;

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

	Bullet.prototype = new MovingObjectSurrogate()

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
