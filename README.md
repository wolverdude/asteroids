# Asteroids!

My version of the classic arcade game built with object-oriented JavaScript and HTML5's `canvas` element.

I originally built this with [Drew](https://github.com/infecto) when we were first learning JavaScript at App Academy.  I've since heavily modified and refactored the code.

All of the game functionality is in [app.js](https://github.com/wolverdude/asteroids/blob/master/app.js).

Features:
* `Ship`, `Asteroid`, and `Bullet` classes that inherit from the `MovinObject` superclass
* [collision detection](https://github.com/wolverdude/asteroids/blob/master/app.js#L217) algorithm based on line segment interesctions

## [Try it out!](http://wolverdude.github.io/asteroids)