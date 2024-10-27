import { getDistance, getAngleBetweenPoints, toDegrees, easeOut, easeOutQuart, initControls, initStopPropagation } from "./sandbox-utils/utilities.js";
import { COLOR } from "./colors.js";

// CONFIGURATION
const ENABLE_BORDER_COLLISIONS = false;
const THIN_LINE_WIDTH = 1;
const THICK_LINE_WIDTH = 2.5;

const viewport = {
    width: 450,
    height: 450,
    offset: {},
    initial: {
        width: 450,
        height: 450
    },
    maxRatio: 1.4,
};

let ships = new Map();
let lastShipId = 0;
let dynamicEntities = new Map();
let lastDynamicEntityId = 0;
let planets = [];
const pointer = {
    graphics: null,
    radius: 2,
    borderWidth: 4,
    pos: { x: -100, y: -100 },
    isDown: false, // Left click
    deadzone: 3, // px
    direction: null, // false, vertical, horizontal
    initialClickPos: { x: 0, y: 0 },
    lastCLickPos: { x: 0, y: 0 },
    distanceFromInitialClick: 0,
    init: function () {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(COLOR.get('bg'), 1);
        graphics.drawCircle(0, 0, this.radius + this.borderWidth);
        graphics.endFill();
        graphics.beginFill(COLOR.get('main'), 1);
        graphics.drawCircle(0, 0, this.radius);
        graphics.endFill();
        graphics.setParent(app.stage);
        graphics.position.set(this.pos.x, this.pos.y);
        return graphics;
    },
    getDirection: function (x, y) {
        if (this.distanceFromInitialClick < this.deadzone) {
            return null;
        }

        let angle = getAngleBetweenPoints(this.initialClickPos, { x, y });

        if (angle < 0) {
            angle += Math.PI * 2
        }

        if (angle >= Math.PI * 0.25 && angle < Math.PI * 0.75 // Down
            || angle >= Math.PI * 1.25 && angle < Math.PI * 1.75) { // Up
            return 'vertical';
        } else {
            return 'horizontal';
        }
    }
};

/**
 * INIT PIXIJS APP
 */
const app = new PIXI.Application({
    background: COLOR.get('bg'),
    resizeTo: window,
    resolution: window.devicePixelRatio || 1,
    antialias: true,
});
const gameContainer = new PIXI.Container();
const otherContainer = new PIXI.Container();
const shipContainer = new PIXI.Container();
const planetContainer = new PIXI.Container();
const HUDContainer = new PIXI.Container();
app.stage.addChild(gameContainer);
gameContainer.addChild(otherContainer, shipContainer, planetContainer, HUDContainer);
document.body.appendChild(app.view);


class Game {
    constructor() {
        this.init();
    }

    _aimTimer = null;

    init() {
        initControls();
        initStopPropagation();

        this.evt.init();
        this.evt.onResize();

        debug.updateDebugBar();

        pointer.graphics = pointer.init();
    }

    evt = {
        init: () => {
            window.addEventListener('resize', this.evt.onResize);
            window.addEventListener('pointerdown', this.evt.onPointerDown)
            window.addEventListener('pointermove', this.evt.onPointerMove)
            window.addEventListener('pointerup', this.evt.onPointerUp)
            window.addEventListener('wheel', this.evt.onWheel)
            window.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        },

        onResize: () => {
            const initialRatio = viewport.initial.width / viewport.initial.height;
            const canvasRatio = app.screen.width / app.screen.height;

            if (initialRatio > canvasRatio) {
                var newRatio = Math.min(1 / viewport.initial.width * app.screen.width, viewport.maxRatio);
            } else {
                var newRatio = Math.min(1 / viewport.initial.height * app.screen.height, viewport.maxRatio);
            }

            viewport.width = viewport.initial.width * newRatio;
            viewport.height = viewport.initial.height * newRatio;
            viewport.offset.x = (app.screen.width - viewport.width) / 2;
            viewport.offset.y = (app.screen.height - viewport.height) / 2;
            viewport.ratio = newRatio;

            gameContainer.scale.set(newRatio, newRatio);
            gameContainer.position.set(Math.round((app.screen.width - viewport.width) / 2), Math.round((app.screen.height - viewport.height) / 2));
        },

        onPointerDown: (e) => {
            if (e.button == 0) { // left click
                pointer.isDown = true;

                pointer.initialClickPos = { x: e.clientX, y: e.clientY }
                pointer.lastCLickPos = { x: e.clientX, y: e.clientY }
                pointer.distanceFromInitialClick = 0
                clearTimeout(this._aimTimer)
            } else if (e.button == 2) { // Right click
                // if (pointer.isDown) {
                //   ship.cancelShot();
                // }
            }
        },

        onPointerMove: (e) => {
            pointer.pos = screenToViewport(e.clientX, e.clientY);
            pointer.graphics.position.set(e.clientX, e.clientY);

            if (!pointer.isDown) {
                return;
            }

            const clientPosition = {x: e.clientX, y: e.clientY};
            pointer.distanceFromInitialClick = Math.abs(getDistance(pointer.initialClickPos, clientPosition));
            pointer.direction ??= pointer.getDirection(e.clientX, e.clientY);

            if (pointer.direction == null) {
                return;
            }

            if (!playerShip) {
                return;
            }

            if (!playerShip.isAiming) {
                playerShip.aim();
            }

            if (pointer.direction == 'horizontal') {
                playerShip.updateCanonAngle(e.clientX - pointer.lastCLickPos.x);
            } else if (pointer.direction == 'vertical') {
                playerShip.updatePower(pointer.lastCLickPos.y - e.clientY);
            }

            pointer.lastCLickPos = clientPosition;
        },

        onPointerUp: (e) => {
            if (!playerShip) {
                return;
            }

            if (e.button == 0) { // Left click
                if (pointer.direction == null) {
                    playerShip.shoot(screenToViewport(e.clientX, e.clientY));
                } else {
                    this._aimTimer = setTimeout(() => {
                        playerShip.stopAiming();
                    }, 2000)
                }

                pointer.isDown = false;
                pointer.direction = null;
            } else if (e.button == 2 && !pointer.isDown) { // Right click
                playerShip.teleport(screenToViewport(e.clientX, e.clientY));
            }
        },

        onWheel: (e) => {
            if (!playerShip) {
                return;
            }

            playerShip.updatePower(-e.deltaY * 0.035);
            playerShip.updateCanonAngle(-e.deltaX * 0.5);
            clearTimeout(this._aimTimer)

            if (!playerShip.isAiming) {
                playerShip.aim();
            }

            this._aimTimer = setTimeout(() => {
                playerShip.stopAiming();
            }, 2000)
        }
    }
}

class Debug {
    #active = false;

    constructor(active) {
        if (active === true)
            this.#active = true;
    }

    #createDebugBar() {
        const $debugBar = document.createElement('div');
        $debugBar.setAttribute('id', 'debug-bar');
        $debugBar.innerHTML = `
            <p>Spaceship Angle: <span id="debug-spaceship-angle">0</span></p>
            <p>Spaceship Power: <span id="debug-spaceship-power">0</span></p>
            <p>Pointer X: <span id="debug-pointer-x">0</span></p>
            <p>Pointer Y: <span id="debug-pointer-y">0</span></p>`;
        document.body.appendChild($debugBar);

        window.addEventListener('pointermove', this.#onPointerMove);
        window.addEventListener('wheel', this.#onPointerMove);
    }

    #removeDebugBar() {
        document.getElementById('debug-bar')?.remove();
        window.removeEventListener('pointermove', this.#onPointerMove);
        window.removeEventListener('wheel', this.#onPointerMove);
    }

    #onPointerMove(e) {
        document.getElementById('debug-pointer-x').innerHTML = Math.round(pointer.pos.x);
        document.getElementById('debug-pointer-y').innerHTML = Math.round(pointer.pos.y);

        if (playerShip) {
            document.getElementById('debug-spaceship-angle').innerHTML = Math.round(toDegrees(playerShip.canonAngle));
            document.getElementById('debug-spaceship-power').innerHTML = Math.round(playerShip.shootingPower * 100);
        } else {
            document.getElementById('debug-spaceship-angle').innerHTML = "Dead";
            document.getElementById('debug-spaceship-power').innerHTML = "Dead";
        }

    }

    updateDebugBar() {
        if (this.#active) {
            this.#createDebugBar();
        } else {
            this.#removeDebugBar();
        }
    }

    debug() {
        this.#active = !this.#active;
        this.updateDebugBar();
    }
}

/**
 * SPACESHIP
 */
class Spaceship {
    constructor(options) {
        this.pos = options?.pos ? options.pos : { x: 0, y: 0 };
        this.radius = 16; // px
        this.colorName = options.colorName || COLOR.getRandomName();
        this.minPower = 1.25;
        this.maxPower = 5;

        this.bodyAngle = 0;
        this.canonAngle = 0; // radians
        this.canonAngleRange = 0; // radians
        this.canonLength = this.radius + 12;
        this.canonLengthMin = this.radius + 4;
        this.canonLengthMax = this.canonLength;
        this.canonEnd = {};
        this.landedOnPlanet = null; // Id in planets array
        this.sparksCount = 3;

        this.isAiming = false;
        this.isReloading = false;
        this.timeLastShotWasFired = null; // Date || null
        this.reloadTime = 1000; // ms
        this.shootingPower = 0.5; // 0 to 1
        this.shootingLineStart = this.canonLength + 15; // px
        this.shootingLineEnd = Math.min(viewport.initial.width, viewport.initial.height) * 0.5; // px
        this.shootingLineLength = this.shootingLineEnd - this.shootingLineStart; // px
        // this.shootingLineDashGap = 20;
        // this.shootingLineDashLength = 10;
        // this.shootingLineDashOffset = 0;

        this.init();
    }

    init() {
        this.id = lastShipId;
        ships.set(lastShipId, this);
        lastShipId++;

        this.graphics = {}
        this.graphics.container = new PIXI.Container();
        this.graphics.container.position.set(this.pos.x, this.pos.y);
        this.graphics.container.setParent(shipContainer);

        this.drawCanon();
        this.drawBody();
        this.prepareShootingLine();
    }

    update() {
        if (this.canonLength < this.canonLengthMax) {
            this.canonLength += 0.1;
        }

        this.graphics.canon.width = this.canonLength;

        this.tryToFinishReloading();
    }

    updatePower(distance) {
        this.shootingPower += distance * 0.003;
        this.shootingPower = Math.min(1, this.shootingPower);
        this.shootingPower = Math.max(0, this.shootingPower);

        this.graphics.powerLine.scale.set(this.shootingPower, 1);
        this.graphics.powerIndicator.position.set(this.shootingPower * this.shootingLineLength, 0);
    }

    updateCanonAngle(distance) {
        let futureAngle = this.canonAngle + distance * 0.003;
        let canonAngle = futureAngle;

        // Constraint aiming angle to spaceship canon range
        if (this.landedOnPlanet != null) {
            if (futureAngle < 0) {
                futureAngle += Math.PI * 2
            }

            canonAngle = futureAngle - this.bodyAngle;

            if (futureAngle > Math.PI + this.bodyAngle) {
                canonAngle -= (2 * Math.PI);
            }

            canonAngle = Math.max(Math.min(canonAngle, this.canonAngleRange), - this.canonAngleRange) + this.bodyAngle;
        }

        this.canonAngle = canonAngle;
        this.graphics.canon.rotation = canonAngle;
        this.graphics.guideContainer.rotation = canonAngle;
        this.canonEnd.x = this.pos.x + Math.cos(this.canonAngle) * (this.canonLengthMax)
        this.canonEnd.y = this.pos.y + Math.sin(this.canonAngle) * (this.canonLengthMax)
    }

    drawBody() {
        const body = new PIXI.Graphics();
        body.lineStyle(THICK_LINE_WIDTH, COLOR.player(this.colorName), 1, 0);
        body.beginFill(COLOR.get('bg'), 1);
        body.drawCircle(0, 0, this.radius);
        body.endFill();
        body.setParent(this.graphics.container);
        this.graphics.body = body;
    }

    drawCanon() {
        const canon = new PIXI.Graphics();
        canon.lineStyle({
            width: THICK_LINE_WIDTH,
            color: COLOR.player(this.colorName),
            cap: PIXI.LINE_CAP.ROUND
        });

        canon.moveTo(0, 0);
        canon.lineTo(this.canonLength, 0);
        canon.setParent(this.graphics.container);
        this.graphics.canon = canon;
    }

    prepareShootingLine() {
        const container = new PIXI.Container();
        const guide = new PIXI.Graphics();
        const powerLine = new PIXI.Graphics();
        const powerIndicator = new PIXI.Graphics();

        // guide.lineStyle(THIN_LINE_WIDTH + 2, this.COLOR.bg, 1);
        // guide.moveTo(this.shootingLineStart, 0);
        // guide.lineTo(this.shootingLineEnd, 0);

        // guide.lineStyle(THIN_LINE_WIDTH, this.COLOR.dark);
        // guide.moveTo(this.shootingLineEnd, -2);
        // guide.lineTo(this.shootingLineEnd, 2);

        guide.lineStyle(THIN_LINE_WIDTH, COLOR.player(this.colorName, 'dark'));
        guide.moveTo(this.shootingLineStart, 0);
        guide.lineTo(this.shootingLineEnd, 0);

        // guide.lineStyle(THIN_LINE_WIDTH, this.COLOR.main);
        // guide.moveTo(this.shootingLineStart, -2);
        // guide.lineTo(this.shootingLineStart, 2);

        powerLine.lineStyle(THICK_LINE_WIDTH, COLOR.player(this.colorName));
        powerLine.moveTo(0, 0);
        powerLine.lineTo(this.shootingLineLength, 0);
        powerLine.position.set(this.shootingLineStart, 0);
        powerLine.scale.set(this.shootingPower, 1);

        powerIndicator.lineStyle(THICK_LINE_WIDTH, COLOR.player(this.colorName));
        powerIndicator.moveTo(this.shootingLineStart, -3);
        powerIndicator.lineTo(this.shootingLineStart, 3);
        powerIndicator.position.set(this.shootingPower * this.shootingLineLength, 0);

        container.addChild(guide, powerLine, powerIndicator);
        this.graphics.powerLine = powerLine;
        this.graphics.powerIndicator = powerIndicator;
        this.graphics.guideContainer = container;
    }

    drawShootingLine() {
        this.graphics.guideContainer.position.set(this.pos.x, this.pos.y);
        HUDContainer.addChild(this.graphics.guideContainer);
    }

    removeShootingLine() {
        HUDContainer.removeChild(this.graphics.guideContainer);
    }

    teleport(targetPos) {
        for (const planet of planets) {
            const distanceToPlanet = getDistance(targetPos, planet.pos);

            if (distanceToPlanet < planet.radius + this.radius) {
                const angle = getAngleBetweenPoints(planet.pos, targetPos);
                return this.land(planet.id, angle);
            }
        }

        this.pos.x = targetPos.x;
        this.pos.y = targetPos.y;
        this.graphics.container.position.set(this.pos.x, this.pos.y);
        this.landedOnPlanet = null;
        this.stopAiming();
    }

    land(planetId, angle = 0) {
        const planet = planets[planetId];

        if (!planet) {
            console.error('No planet found to land on.');
        }

        this.landedOnPlanet = planetId;
        this.pos = planet.getHorizonPointFromAngle(angle);
        this.graphics.container.position.set(this.pos.x, this.pos.y);

        this.canonAngleRange = Math.PI / 2;
        this.bodyAngle = angle;
        this.updateCanonAngle(0);
        this.stopAiming();
    }

    tryToFinishReloading() {
        const now = new Date();

        if (!this.timeLastShotWasFired || now - this.timeLastShotWasFired > this.reloadTime) {

            this.isReloading = false;
        }
    }

    aim() {
        this.drawShootingLine();
        this.isAiming = true;
    }

    stopAiming() {
        this.removeShootingLine();
        this.isAiming = false;
    }

    shoot() {
        if (this.isReloading) {
            return this.stopAiming();
        }

        const power = this.minPower + this.shootingPower * this.maxPower;

        new Bullet({ ...this.canonEnd }, this.canonAngle, power, this.colorName);

        for (let i = 0; i < this.sparksCount; i++) {
            let angle = ((i + 0.5) / this.sparksCount) * Math.PI - (Math.PI / 2) + this.canonAngle;
            new Spark({ ...this.canonEnd }, angle, power * 0.75, null, COLOR.player(this.colorName, 'light'))
        }

        this.timeLastShotWasFired = new Date();
        this.canonLength = this.canonLengthMin;
        this.isReloading = true;
        this.stopAiming();
    }

    cancelShot() {
        this.isReloading = false
        this.stopAiming()
    }

    kill() {
        this.graphics.container.destroy();
        ships.delete(this.id);

        if (this.id == playerShip.id) {
            playerShip = null;
        }

        new Explosion(this.pos, 8, this.bodyAngle, false, this.colorName);
    }
};

class DynamicEntity {
    constructor() {
        this.id = this.addEntityToGlobalMap();
    }

    addEntityToGlobalMap() {
        lastDynamicEntityId++;
        dynamicEntities.set(lastDynamicEntityId, this);
        return lastDynamicEntityId;
    }

    kill() {
        this.graphics?.destroy();
        dynamicEntities.delete(this.id);
    }
}

class Projectile extends DynamicEntity {
    constructor(angle, power) {
        super();

        this.angle = angle;
        this.power = power;
        this.vel = {}
        this.birthday = new Date();
        this.lifeExpectancy = 1000;
        this.radius = 1;
    }

    update(delta) {
        this.pos.x += this.vel.x * delta;
        this.pos.y += this.vel.y * delta;

        this.graphics?.position?.set(this.pos.x, this.pos.y);
    }

    getCollision() {
        // Check for collision with viewport border
        const borderCollision = this.isOutsideViewport();
        if (ENABLE_BORDER_COLLISIONS && borderCollision) {
            return borderCollision;
        }

        // Check for collision with a spaceship
        const ship = this.getCircleCollision(ships);
        if (ship) {
            return {
                object: ship,
                pos: ship.pos,
                angle: ship.bodyAngle
            }
        }

        // Check for collision with a planet
        const planet = this.getCircleCollision(planets);
        if (planet) {
            const angle = getAngleBetweenPoints(planet.pos, this.pos);
            return {
                object: planet,
                pos: planet.getHorizonPointFromAngle(angle),
                angle: angle
            }
        }

        return false;
    }

    isOutsideCanvas() {
        const nextPos = viewportToScreen(this.pos.x + this.vel.x, this.pos.y + this.vel.y);

        return this.getBorderCollision(nextPos.x, nextPos.y, app.screen.width, app.screen.height);
    }

    isOutsideViewport() {
        const x = this.pos.x + this.vel.x;
        const y = this.pos.y + this.vel.y;

        return this.getBorderCollision(x, y, viewport.initial.width, viewport.initial.height);
    }

    getShipCollision() {
      for (const ship of ships) {
        const futurePos = {
          x: this.pos.x + this.vel.x,
          y: this.pos.y + this.vel.y
        }
        const futureDistance = getDistance(futurePos, ship.pos);

        if (futureDistance > ship.radius) {
          continue;
        }

        return {
          object: ship,
          pos: ship.pos,
          angle: ship.bodyAngle
        }
      }
    }

    getCircleCollision(objects) {
        for (const object of objects.values()) {
            const futurePos = {
                x: this.pos.x + this.vel.x,
                y: this.pos.y + this.vel.y
            }
            const futureDistance = getDistance(futurePos, object.pos);

            if (futureDistance > object.radius) {
                continue;
            }

            return object;
        }

        return false;
    }

    getBorderCollision(x, y, width, height) {
        const collision = { object: 'border' }

        if (x > width) { // Right border
            return {
                ...collision, ... {
                    pos: { x: width, y },
                    angle: 0
                }
            };
        } else if (x < 0) { // Left border
            return {
                ...collision, ... {
                    pos: { x: 0, y },
                    angle: -Math.PI
                }
            };
        } else if (y > height) { // Bottom border
            return {
                ...collision, ... {
                    pos: { x, y: height },
                    angle: Math.PI / 2
                }
            };
        } else if (y < 0) { // Top border
            return {
                ...collision, ... {
                    pos: { x, y: 0 },
                    angle: -Math.PI / 2
                }
            };
        }

        return false;
    }
}

class Bullet extends Projectile {
    constructor(pos, angle, power, colorName) {
        super(angle, power);
        this.vel.x = Math.cos(this.angle) * this.power;
        this.vel.y = Math.sin(this.angle) * this.power;
        this.pos = pos;
        this.mass = 3;
        this.radius = THIN_LINE_WIDTH + this.power / 3;
        this.lifeExpectancy = 12000;
        this.colorName = colorName;

        this.init();
    }

    init() {
        this.graphics = new PIXI.Graphics();
        this.graphics.lineStyle(0, 0);
        this.graphics.beginFill(COLOR.player(this.colorName), 1);
        this.graphics.drawCircle(0, 0, this.radius);
        this.graphics.endFill();
        this.graphics.position.set(this.pos.x, this.pos.y);
        this.graphics.setParent(otherContainer);
    }

    update(delta) {
        const lifetime = new Date() - this.birthday;
        if (lifetime > this.lifeExpectancy) {
            return this.kill();
        }

        const collision = this.getCollision();
        if (collision !== false) {
            if (collision.object?.constructor.name == 'Spaceship') {
                collision.object.kill();
                return super.kill();
            }

            return this.kill(collision.pos, collision.angle);
        }

        const gravitationalVector = this.getGravitationalVector();
        if (gravitationalVector) {
            this.vel.x += gravitationalVector.x * delta;
            this.vel.y += gravitationalVector.y * delta;
        }

        super.update(delta);
    }

    // Returns the resulting vector of all planets gravity
    getGravitationalVector() {
        if (planets.length == 0) return false;

        const vector = { x: 0, y: 0 };

        for (const planet of planets) {
            const distance = Math.hypot((this.pos.x - planet.pos.x), (this.pos.y - planet.pos.y));
            const distanceSq = Math.round(Math.max(5, distance * distance));
            const angle = getAngleBetweenPoints(this.pos, planet.pos);
            const force = (this.mass * planet.mass) / (distanceSq);

            vector.x += easeOutQuart(Math.cos(angle) * force);
            vector.y += easeOutQuart(Math.sin(angle) * force);
        }

        return vector;
    }

    kill(pos, normalAngle) {
        pos = pos || { ...this.pos }
        if (this.isOutsideCanvas() === false) {
            new Explosion(pos, this.power, normalAngle, normalAngle === undefined ? this.vel : null, this.colorName);
        }

        super.kill();
    }
}

class Spark extends Projectile {
    constructor(pos, angle, power, initialVelocity, color) {
        super(angle, power);
        this.pos = { ...pos };
        this.power = (power * 4 / 5) + (power * Math.random() / 5);
        this.initialVelocity = initialVelocity || { x: 0, y: 0 };
        this.vel.x = Math.cos(this.angle) / 3 * this.power + this.initialVelocity.x;
        this.vel.y = Math.sin(this.angle) / 3 * this.power + this.initialVelocity.y;
        this.length = (2 + Math.random() * 2) * this.power;
        this.lifeExpectancy = 300 + Math.random() * 400;
        this.color = color || COLOR.get('main');

        this.init();
    }

    init() {
        this.graphics = new PIXI.Graphics();
        this.graphics.setParent(otherContainer);
        this.graphics.rotation = this.angle;
        this.graphics.position.set(this.pos.x, this.pos.y);

        this.graphics
            .lineStyle({
                width: THIN_LINE_WIDTH,
                color: this.color,
                cap: PIXI.LINE_CAP.ROUND
            })
            .moveTo(this.length / -2, 0)
            .lineTo(this.length / 2, 0)
    }

    update(delta) {
        const lifetime = new Date() - this.birthday;
        if (lifetime > this.lifeExpectancy) {
            this.kill();
            return;
        }

        const collision = this.getCollision();
        if (collision !== false) {
            const normalVector = {
                x: Math.cos(collision.angle),
                y: Math.sin(collision.angle)
            }
            const ndotv = normalVector.x * this.vel.x + normalVector.y * this.vel.y;
            this.vel.x -= 2 * ndotv * normalVector.x;
            this.vel.y -= 2 * ndotv * normalVector.y;

            this.angle = getAngleBetweenPoints({ x: 0, y: 0 }, this.vel);
            this.graphics.rotation = this.angle;
        }

        if (lifetime / this.lifeExpectancy < 0.5) {
            this.graphics.scale.set(2 * lifetime / this.lifeExpectancy, 1);
        } else {
            this.graphics.scale.set(2 - (2 * lifetime / this.lifeExpectancy), 1);
        }

        super.update(delta);
    }
}

class Explosion extends DynamicEntity {
    constructor(pos, power, angle, vel, colorName) {
        super();
        this.pos = { ...pos };
        if (vel) {
            this.vel = { ...vel };
        }
        this.power = Math.max(2, power);
        this.angle = angle === undefined ? undefined : angle - Math.PI / 2;
        this.radius = Math.round(this.power * 5);
        this.colorName = colorName || COLOR.getRandomName();

        this.birthday = new Date();
        this.lifeExpectancy = 600;
        this.sparksCount = 3 + Math.round(this.power * 2);
        this.graphics = new PIXI.Graphics();

        this.init();
    }

    init() {
        this.graphics.setParent(otherContainer);
        this.graphics.position.set(this.pos.x, this.pos.y);

        this.createSparks();
    }

    createSparks() {
        let sparksCount = Math.ceil(this.sparksCount / 2);
        let fullCircle = false;

        if (this.angle == undefined) {
            sparksCount = this.sparksCount;
            fullCircle = true;
            this.angle = 0;
        }

        for (let i = 0; i < sparksCount; i++) {
            let angle = ((i + 0.5) / sparksCount) * Math.PI;
            if (fullCircle) {
                angle *= 2;
            }

            angle += this.angle;
            new Spark({ ...this.pos }, angle, this.power, ((fullCircle) ? this.vel : undefined), COLOR.player(this.colorName), -100);
        }
    }

    update(delta) {
        const lifetime = new Date() - this.birthday;
        if (lifetime > this.lifeExpectancy) {
            this.kill();
            return;
        }

        const scale = lifetime / this.lifeExpectancy;
        const alpha = Math.min(1, 2 * (1 - scale));
        this.graphics.alpha = alpha;
        this.graphics.clear();

        this.graphics.beginFill(COLOR.player(this.colorName, 'dark'), 1);
        this.graphics.drawCircle(0, 0, easeOutQuart(scale) * this.radius)
        this.graphics.endFill();

        this.graphics.beginFill(COLOR.player(this.colorName), 1);
        this.graphics.drawCircle(0, 0, easeOut(scale) * this.radius * 0.6)
        this.graphics.endFill();

        if (!!this.vel) {
            this.pos.x += this.vel.x * delta;
            this.pos.y += this.vel.y * delta;
            this.graphics.position.set(this.pos.x, this.pos.y);
        }
    }
}

class Planet {
    constructor(pos, radius, mass) {
        this.id = planets.length
        this.pos = { ...pos };
        this.mass = Math.max(100, mass);
        this.radius = radius;
        this.outerRingRadius = radius + (this.mass * 0.5);
        this.linesCount = Math.max(15, Math.round(this.outerRingRadius / 4));
        this.lineArea = 2 * Math.PI / this.linesCount;
        this.lineLength = 0.15; // 0 to 1. Relative to the space available
        this.init();
    }

    init() {
        planets.push(this);

        this.graphics = {
            horizon: this.drawHorizon(),
            outerRing: this.drawOuterRing()
        };
    }

    update(delta) {
        this.graphics.outerRing.rotation += 0.1 / this.outerRingRadius * delta;
    }

    getHorizonPointFromAngle(angle, offset = 1) {
        return {
            x: this.pos.x + (Math.cos(angle) * (this.radius + offset)),
            y: this.pos.y + (Math.sin(angle) * (this.radius + offset)),
        }
    }

    drawHorizon() {
        const horizon = new PIXI.Graphics();

        horizon.lineStyle(THICK_LINE_WIDTH, COLOR.get(), 1, 0);
        horizon.beginFill(COLOR.get('bg'), 1);
        horizon.drawCircle(0, 0, this.radius);
        horizon.endFill();
        horizon.position.set(this.pos.x, this.pos.y);
        horizon.setParent(planetContainer);
        horizon.eventMode = 'static';

        return horizon;
    }

    drawOuterRing() {
        const outerRing = new PIXI.Graphics();

        outerRing.position.set(this.pos.x, this.pos.y);
        outerRing.setParent(otherContainer);
        for (let i = 0; i < this.linesCount; i++) {
            outerRing.lineStyle({
                width: THIN_LINE_WIDTH,
                color: COLOR.get('muted'),
                cap: PIXI.LINE_CAP.ROUND
            });
            outerRing.arc(0, 0, this.outerRingRadius, (i * this.lineArea), (i * this.lineArea) + (this.lineArea * this.lineLength));
            outerRing.endFill();
        }

        return outerRing;
    }
}



/**
 * VARIOUS INITIALIZATIONS
 */

new Planet({
    x: viewport.initial.width / 2,
    y: viewport.initial.height / 2
}, 50, 100);

// new Planet({
//    x: viewport.initial.width / 4.5 * 3,
//    y: viewport.initial.height / 4.5 * 3
// }, 30, 100);

new Planet({
    x: 20,
    y: viewport.initial.height - 20
}, 50, 80);

// new Planet({
//   x: viewport.initial.width / 2 + 30,
//   y: viewport.initial.height / 2 + 30
// }, 15, 200);

new Planet({
    x: viewport.initial.width - 20,
    y: 20
}, 30, 100);


let playerShip = new Spaceship({
    colorName: 'blue'
});
const debug = new Debug(false);
const game = new Game();
const enemy = new Spaceship({
    colorName: 'orange'
})

playerShip.land(1, -1);
enemy.land(2, Math.PI * 0.75);

app.ticker.add((delta) => {
    ships.forEach(ship => {
        ship.update(delta);
    });

    dynamicEntities.forEach(entity => {
        entity.update(delta);
    });

    planets.forEach(planet => {
        planet.update(delta);
    });
});

/**
 * EVENTS
 */
function screenToViewport(x, y) {
    return {
        x: (x - (viewport.offset.x)) / viewport.ratio,
        y: (y - (viewport.offset.y)) / viewport.ratio
    }
}

function viewportToScreen(x, y) {
    return {
        x: (x + viewport.offset.x) * viewport.ratio,
        y: (y + viewport.offset.y) * viewport.ratio
    }
}
