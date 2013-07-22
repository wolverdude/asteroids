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
	const MIN_POS = { x: 0, y:0 }
	const MAX_POS = { x: CANVAS.width, y: CANVAS.height }

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
		var numAsteroids = ASTEROIDS.value;
		if (!numAsteroids || numAsteroids < 1 || numAsteroids > 500) {
			MESSAGE.innerHTML = 'You can do better than that!'
			return
		}

		// end previous game if exists
		this.end("Press 'up' to move forward,\n'down' to move backward,\n'left' or 'right' to rotate your spacecraft,\n or 'spacebar' to fire.")
		SCORE.innerHTML = "0"

		// easter egg
		if (numAsteroids == 500) {
			this.rapidFire = true;
			MESSAGE.innerHTML = 'Rapid-fire mode enabled. Good luck!';
		}

		// give focus to CANVAS
		BUTTON.blur();
		CANVAS.focus();
  
		// set game state
		this.asteroids = [];
		this.bullets = [];
		this.populate(numAsteroids);

		// set update loop
		var that = this;
		this.updateLoop = window.setInterval(function() {
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
			that.checkEnd();
		}, 30);
	}

	Game.prototype.end = function(message) {
		var that = this;
		clearInterval(that.updateLoop);
		MESSAGE.innerHTML = message
		BUTTON.innerHTML = "Play Again"
	}

	Game.prototype.populate = function(numAsteroids) {
		for (i = 0; i < numAsteroids; i++) {
			this.asteroids.push( Asteroid.randomAsteroid() );
		}
		this.ship = new Ship();
	}

	Game.prototype.update = function() {
		var that = this;

		// update ship
		this.ship.updatePos();
		var collisions = this.ship.collisions(this.asteroids)

		// update bullets
		this.bullets = this.bullets.filter( function(bullet) {
			bullet.updatePos(15);
			
			if (bullet.timeout === 0) { return false; }
			return true;
		});

		// update asteroids
		this.asteroids.forEach( function(asteroid, asteroidIndex) {
			asteroid.updatePos();
			asteroid.rotate()

			//check for bullet collisions
			var bulletIndices = asteroid.collisions(that.bullets)

			if (bulletIndices.length > 0) {
				bulletIndices.forEach(function(bulletIndex) {
					that.bullets.splice(bulletIndex, 1);
				});
				that.asteroids.splice(asteroidIndex, 1);
				SCORE.innerHTML ++
				return;
			}
		});
	}

	Game.prototype.draw = function() {
		var that = this;
		this.ctx.clearRect(MIN_POS.x, MIN_POS.y, MAX_POS.x, MAX_POS.y);

		this.ship.draw(this.ctx);
		this.asteroids.forEach( function(asteroid) {
			asteroid.draw(that.ctx);
		});

		this.bullets.forEach( function(bullets) {
			bullets.draw(that.ctx);
		});
	}

	Game.prototype.checkEnd = function() {
		if (this.asteroids.length === 0) { this.end("You Won!"); return; }

		var asteroidHits = this.ship.collisions(this.asteroids);
		if (asteroidHits.length > 0) { this.end("You Lost!"); }
	}

	//====================
	// MovingObject class
	//====================

	function MovingObject(pos, vel, rad, vertices, rot, rotVel) {
		this.pos = pos;
		this.vel = vel;
		this.rad = rad;
		this.vertices = vertices || [];
		this.rot = (typeof rot === "number") ? rot : -(Math.PI / 2);
		this.rotVel = rotVel || 0;
	}

	MovingObject.prototype.updatePos = function(offset) {
		this.pos['x'] += this.vel['dx'];
		this.pos['y'] += this.vel['dy'];
		this.wrapIfOffscreen(offset);
	}

	MovingObject.prototype.wrapIfOffscreen = function(offset) {
		if (typeof offset !== 'number') { offset = this.rad; }

		var that = this;
		['x', 'y'].forEach(function(coord) {
			if (that.pos[coord] > MAX_POS[coord] + offset) {
				that.pos[coord] -= (MAX_POS[coord] - MIN_POS[coord] + offset * 2);
			} else if (that.pos[coord] < (MIN_POS[coord] - offset)) {
				that.pos[coord] += (MAX_POS[coord] - MIN_POS[coord] + offset * 2);
			}
		});
	}

	MovingObject.prototype.draw = function(ctx) {
		ctx.beginPath();

		var lastVertex = this.vertices[this.vertices.length - 1];
		ctx.moveTo(lastVertex.x, lastVertex.y);

		var that = this;
		this.vertices.forEach(function(vertex) {
			var pos = that.arcPos(vertex)
			ctx.lineTo(pos.x, pos.y);
		});

		ctx.closePath();

		ctx.strokeStyle = "white";
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	MovingObject.prototype.collisions = function(objects) {
		var that = this, collisionIndices = [];

		objects.forEach(function(object, index) {
			if (that.isCollision(object)) { collisionIndices.push(index); }
		});

		return collisionIndices;
	}

	MovingObject.prototype.isCollision = function(object) {
		if (this.proximityCollision(object)) {
			return this.lineCollision(object);
		}
	}

	MovingObject.prototype.proximityCollision = function(object) {
		return (
			Math.sqrt(
				Math.pow(this.pos['x'] - object.pos['x'], 2) +
			  Math.pow(this.pos['y'] - object.pos['y'], 2)
			) <= (this.rad + object.rad)
		);
	}

	function segmentsIntersect(verts) {
		return true 
	}

	MovingObject.prototype.lineCollision = function(object) {
		var iMax = this.vertices.length, jMax = object.vertices.length;
		var iLast = iMax - 1, jLast = jMax - 1;

		for (var i = 0; i < iMax; i++) {
			for (var j = 0; j < jMax; j++) {
				var collision = segmentsIntersect([
					this.vertexPos(iLast),
					this.vertexPos(i),
					object.vertexPos(jLast),
					object.vertexPos(j)
				]);

				if (collision) { return true; }
				iLast = i, jLast = j;
			}
		}
	}

	MovingObject.prototype.arcPos = function(angle) {
		var x = this.pos['x'] + this.rad * Math.cos(this.rot + angle)
		var y = this.pos['y'] + this.rad * Math.sin(this.rot + angle)
		return {x: x, y: y}
	}

	MovingObject.prototype.vertexPos = function(index) {
		return this.arcPos(this.vertices[index]);
	}


	//================
	// Asteroid class
	//================

	function Asteroid() {
		MovingObject.apply(this, arguments);
	}

	extend(Asteroid, MovingObject);

	Asteroid.randomAsteroid = function() {
		var pos = Asteroid.randomEdgePos()

		var rot = Math.PI * (Math.random() * 2 - 1)

		var vel = {
			dx: 5 * (Math.random() * 2 - 1) * Math.cos(rot),
			dy: 5 * (Math.random() * 2 - 1) * Math.sin(rot)
		}

		var rad = Math.random() * 40 + 5

		var rotVel = (Math.random() - 0.5) / 4;

		var vertices = [];
		var numVertices = Math.random() * 10 + 10

		for (var i=0; i < numVertices; i++) {
			var vertex = Math.PI * (Math.random() * 2 - 1);
			vertices.push(vertex);
		}
		vertices = vertices.sort(function(a, b) { return a - b });

		var asteroid = new Asteroid(pos, vel, rad, vertices, rot, rotVel);

		return asteroid;
	}

	Asteroid.randomEdgePos = function() {
		var pos = {
			x: (MAX_POS.x - MIN_POS.x) * Math.random(),
			y: (MAX_POS.y - MIN_POS.y) * Math.random()
		};

		// proportionally pick x or y to be the edge coord
		var halfPerim = MAX_POS.x + MAX_POS.y;
		var coord = (Math.random() * halfPerim < MAX_POS.x) ? 'y' : 'x';

		pos[coord] = (Math.random() < 0.5) ? MIN_POS[coord] : MAX_POS[coord];

		return pos;
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
			x: ((MAX_POS.x - MIN_POS.x) / 2),
			y: ((MAX_POS.y - MIN_POS.y) / 2)
		};

		var vel = {
			dx: 0,
			dy: 0
		};

		MovingObject.call(this, pos, vel, 15, [-2.5, 0, 2.5]);
		this.canFire = true;
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
			var pos = this.arcPos(this.vertices[1]);

			var that = this;
			game.bullets.push(new Bullet(pos, that.vel, that.rot));
			if (!game.rapidFire) {
				that.canFire = false;
				window.setTimeout(function() { that.canFire = true }, 250);
			}
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
		}

		MovingObject.call(this, pos, vel, 3, [0, Math.PI], rot);
		this.timeout = 80
	}

	extend(Bullet, MovingObject);

	Bullet.prototype.updatePos = function() {
		this.timeout --
		MovingObject.prototype.updatePos.call(this, 15)
	}

	return {
		game: new Game()
	};
})();
