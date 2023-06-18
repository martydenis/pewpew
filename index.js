// CONFIGURATION
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const enableBorderCollisions = false;
const FPS = 60;
const INTERVAL = Math.round(1000 / FPS) // ms
const THIN_LINE_WIDTH = dpi(1);
const THICK_LINE_WIDTH = dpi(2);
const colors = {
  bg: '#000000',
  main: '#ffffff',
  helper: '#777777'
}
const viewport = {
  initial: { x: 450, y: 450 },
  maxRatio: 1.4,
  size: {},
  offset: {}
};

// Variables
let bullets = new Map();
let lastBulletId = 0;
let sparks = new Map();
let lastSparkId = 0;
let planets = new Map();
let lastPlanetId = 0;
let mouse = { x: 0, y: 0 };
let mouseClicking = false;

var spaceship = {
  pos: {
    x: innerWidth / 2, // px
    y: innerHeight / 2  // px
  },
  radius: 16, // px
  color: colors.main,
  minForce: 1.25,
  maxForce: 3,

  loading: false,
  lastShot: null, // Date
  reloadTime: 1000, // ms
  loadingPower: 0, // 0 to 1
  loadingDistanceMin: 0, // px
  loadingDistanceMax: 0, // px
  loadingAnimationProgress: 0, // 0 to 1
  shootingEffect: -1,
  shootingLineDashGap: 20,
  shootingLineDashLength: 10,
  shootingLineDashOffset: 0,

  bodyAngle: 0,
  canonAngle: 0, // radians
  canonAngleRange: 0, // radians
  canonLengthMin: 4,
  canonLengthMax: 10,
  canonLength: 10,
  canonEnd: {},
  landedOnPlanet: null, // Id in planets array
  sparksCount: 0,

  update: function () {
    let mouseAngle = getAngleBetweenPoints(this.pos, mouse);
    let angle = mouseAngle;

    if (this.landedOnPlanet != null) {
      if (mouseAngle < 0) {
        mouseAngle = Math.PI * 2 + mouseAngle
      }

      if (mouseAngle > 0 && mouseAngle > Math.PI + this.bodyAngle) {
        angle = mouseAngle - (2 * Math.PI) - this.bodyAngle;
      } else {
        angle = mouseAngle - this.bodyAngle;
      }

      angle = Math.max(Math.min(angle, this.canonAngleRange), - this.canonAngleRange) + this.bodyAngle;
    }

    this.canonAngle = angle;

    if (this.canonLength < this.canonLengthMax)
      this.canonLength += 0.1;

    if (this.loading) { // We are currently loading. Var is not null
      this.loadingPower = roundToTwo(Math.max(Math.min(getDistance(mouse.x, mouse.y, this.pos.x, this.pos.y), this.loadingDistanceMax) - this.loadingDistanceMin, 0) / (this.loadingDistanceMax - this.loadingDistanceMin));          
    } else {
      this.loadingPower = 0;
      if (this.shootingEffect >= 0 && this.shootingEffect < (this.radius - 2)) {
        this.shootingEffect += 0.6;
      } else if (mouseClicking) {
        spaceship.load();
      }
    }

    if (this.shootingLineDashOffset < this.shootingLineDashLength + this.shootingLineDashGap) {
      this.shootingLineDashOffset += (0.3 * this.loadingPower);
    } else {
      this.shootingLineDashOffset = 0;
    }

    if (this.loadingAnimationProgress == this.loadingPower) {
    } else if (this.loadingAnimationProgress < this.loadingPower) {
      this.loadingAnimationProgress = roundToTwo(this.loadingAnimationProgress + 0.01);
    } else if (this.loadingAnimationProgress > 0) {
      this.loadingAnimationProgress = roundToTwo(this.loadingAnimationProgress - 0.01);
    }
  },

  draw: function() {
    this.drawCanon();
    this.drawBody();

    if (this.loading) {
      this.drawShootingLine();
      this.drawInnerLoader();
    } else if (this.shootingEffect >= 0) {
      this.drawInnerLoader();
      this.drawShootingEffect();
    }
  },

  drawBody: function () {
    ctx.beginPath();
    ctx.arc(offsetX(this.pos.x), offsetY(this.pos.y), offsetSize(this.radius), 0, 2 * Math.PI);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = THICK_LINE_WIDTH;
    ctx.fillStyle = colors.bg;
    ctx.fill();
    ctx.stroke();
  },

  drawCanon: function () {
    this.canonEnd.x = this.pos.x + Math.cos(this.canonAngle) * (this.radius + this.canonLength)
    this.canonEnd.y = this.pos.y + Math.sin(this.canonAngle) * (this.radius + this.canonLength)

    ctx.beginPath();
    ctx.moveTo(offsetX(this.pos.x), offsetY(this.pos.y));
    ctx.lineTo(offsetX(this.canonEnd.x), offsetY(this.canonEnd.y))
    ctx.strokeStyle = this.color;
    ctx.lineWidth = THICK_LINE_WIDTH;
    ctx.stroke();
  },

  drawShootingLine: function () {
    const shootingLineStartX = this.pos.x + Math.cos(this.canonAngle) * this.loadingDistanceMin;
    const shootingLineStartY = this.pos.y + Math.sin(this.canonAngle) * this.loadingDistanceMin;
    const shootingLineEndX = shootingLineStartX + Math.cos(this.canonAngle) * this.loadingPower * (this.loadingDistanceMax - this.loadingDistanceMin);
    const shootingLineEndY = shootingLineStartY + Math.sin(this.canonAngle) * this.loadingPower * (this.loadingDistanceMax - this.loadingDistanceMin);

    ctx.beginPath();
    ctx.fillStyle = colors.helper;
    ctx.fillRect(offsetX(shootingLineStartX - 1), offsetY(shootingLineStartY - 1), THICK_LINE_WIDTH, THICK_LINE_WIDTH);
    ctx.fill();

    ctx.fillRect(offsetX(shootingLineEndX - 1), offsetY(shootingLineEndY - 1), THICK_LINE_WIDTH, THICK_LINE_WIDTH);
    ctx.fill();

    ctx.beginPath();
    ctx.setLineDash([offsetSize(this.shootingLineDashLength), offsetSize(this.shootingLineDashGap)]);
    ctx.lineDashOffset = offsetSize(-this.shootingLineDashOffset);
    ctx.moveTo(offsetX(shootingLineStartX), offsetY(shootingLineStartY));
    ctx.lineTo(offsetX(shootingLineEndX), offsetY(shootingLineEndY));
    ctx.strokeStyle = colors.helper;
    ctx.lineWidth = THIN_LINE_WIDTH;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.closePath();
  },

  drawInnerLoader: function () { 
    ctx.beginPath();
    ctx.arc(offsetX(this.pos.x), offsetY(this.pos.y), offsetSize(this.loadingAnimationProgress * (this.radius - 3 - dpi(1))), 0, 2 * Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
  },

  drawShootingEffect: function () {
    ctx.beginPath();
    ctx.arc(offsetX(this.pos.x), offsetY(this.pos.y), offsetSize(this.shootingEffect), 0, 2 * Math.PI);
    ctx.fillStyle = colors.bg;
    ctx.fill();
  },

  teleport: function (newPos) {
    for (const planet of planets.values()) {
      if (getDistance(newPos.x, newPos.y, planet.pos.x, planet.pos.y) < planet.radius + this.radius) {
        const angle = getAngleBetweenPoints(planet.pos, newPos);
        this.landOnPlanet(planet.id, angle);
        return;
      }
    }

    this.pos.x = newPos.x;
    this.pos.y = newPos.y;
    this.landedOnPlanet = null;
  },

  landOnPlanet: function (planetId, angle) {
    const planet = planets.get(planetId);
    this.landedOnPlanet = planetId;
    this.pos = {
      x: planet.pos.x + (Math.cos(angle) * planet.radius),
      y: planet.pos.y + (Math.sin(angle) * planet.radius),
    }

    this.canonAngleRange = Math.PI / 2;
    this.bodyAngle = angle;
  },

  load: function () {
    const now = new Date();

    if (!this.lastShot || now - this.lastShot > this.reloadTime) {
      spaceship.loading = true;
    }
  },

  shoot: function () {
    if (!this.loading) return;

    const force = this.minForce + this.loadingPower * this.maxForce;

    new Bullet(this.canonAngle, force)

    for (let i = 0; i < this.sparksCount; i++) {
      let angle = ((i + 0.5) / this.sparksCount) * Math.PI - (Math.PI / 2) + this.canonAngle;
      new Spark(this.canonEnd, angle, force / 2)
    }

    this.lastShot = new Date();
    this.canonLength = this.canonLengthMin;
    this.loading = false;
    this.shootingEffect = 0;
  },

  cancelShot: function () {
    this.lastShot = null;
    this.loading = false;
    this.loadingPower = 0;
    mouseClicking = false;
  },

  kill: function () {

  }
};

class Projectile {
  constructor(id, angle, force) {
    this.id = id;
    this.angle = angle;
    this.force = force;
    this.vel = {}
    this.birthday = new Date();
    this.lifeExpectancy = 12000;
  }

  update() {
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
  }

  draw() {
    // console.log('updateGameDisplay');
  }

  // Returns false if no collision detected
  // Else, returns the angle at which the explosion should occure
  checkCollision() {
    for (const planet of planets.values()) {
      const distance = Math.hypot((this.pos.x + (this.vel.x) - planet.pos.x), (this.pos.y + (this.vel.y) - planet.pos.y));

      if (distance <= planet.radius) {
        const offset = getAngleBetweenPoints(this.pos, planet.pos);
        return offset;
      }
    }

    if (enableBorderCollisions) {
      return this.isOutsideViewport();
    }

    return false;
  }

  isOutsideCanvas() {
    const x = offsetX(this.pos.x + (this.vel.x), false);
    const y = offsetY(this.pos.y + (this.vel.y), false);

    return this.getCollisionAngle(x, y, canvas.clientWidth, canvas.clientHeight);
  }

  isOutsideViewport() {
    const x = this.pos.x + (this.vel.x);
    const y = this.pos.y + (this.vel.y);

    return this.getCollisionAngle(x, y, viewport.initial.x, viewport.initial.y);
  }

  getCollisionAngle(x, y, width, height) {
    if (x > width) { // Right border
      return 0;
    } else if (x < 0) { // Left border
      return -Math.PI;
    } else if (y > height) { // Bottom border
      return Math.PI / 2;
    } else if (y < 0) { // Top border
      return -Math.PI / 2;
    }

    return false;
  }

  kill() {
    this.array.delete(this.id);
  }
}

class Bullet extends Projectile {
  constructor(angle, force) {
    super(lastBulletId, angle, force);

    this.vel.x = Math.cos(this.angle) * this.force;
    this.vel.y = Math.sin(this.angle) * this.force;
    this.pos = {
      x: spaceship.canonEnd.x,
      y: spaceship.canonEnd.y
    };
    this.mass = 1 + this.force / 4;
    this.radius = this.mass;
    this.color = colors.main;
    this.sparksCount = 5 + Math.round(this.force);
    this.array = bullets;

    bullets.set(lastBulletId, this);
    lastBulletId++;
  }

  update() {
    const lifetime = new Date() - this.birthday;
    
    if (lifetime > this.lifeExpectancy) {
      if (this.isOutsideCanvas()) {
        super.kill();
      } else {
        this.kill();
      }
      
      return;
    }

    const normal = this.checkCollision();
    if (normal !== false) {
      this.kill(normal + Math.PI / 2);
      return;
    }

    const gravityField = this.getGravitationVector();
    if (gravityField) {
      this.vel.x += gravityField.x;
      this.vel.y += gravityField.y;
    }

    super.update();
  }

  // Returns a vector in direction of attraction
  getGravitationVector() {
    if (planets.size == 0) return false;

    const vector = { x: 0, y: 0 };

    for (const planet of planets.values()) {
      const distance = Math.hypot((this.pos.x - planet.pos.x), (this.pos.y - planet.pos.y));
      const distanceSq = Math.round(Math.max(5, distance * distance));
      const angle = getAngleBetweenPoints(this.pos, planet.pos);
      const force = (this.mass * planet.mass) / (distanceSq);

      vector.x += Math.cos(angle) * force;
      vector.y += Math.sin(angle) * force;
    }

    return vector;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(offsetX(this.pos.x), offsetY(this.pos.y), dpi(this.radius), 0, 2 * Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  kill(angleOffset) {
    let sparksCount = this.sparksCount / 2;
    let fullCircle = false;

    if (angleOffset == undefined) {
      sparksCount = this.sparksCount;
      fullCircle = true;
      angleOffset = 0;
    }

    for (let i = 0; i < sparksCount; i++) {
      let angle = ((i + 0.5) / sparksCount) * Math.PI;
      if (fullCircle) {
        angle *= 2;
      }

      angle += angleOffset;
      new Spark(this.pos, angle, this.force, ((fullCircle) ? this.vel : undefined));
    }

    super.kill();
  }
}

class Spark extends Projectile {
  constructor(pos, angle, force, initialVelocity) {
    super(lastSparkId, angle, force);
    this.pos = {
      x: pos.x,
      y: pos.y
    };
    this.initialVelocity = initialVelocity ? initialVelocity : { x: 0, y: 0 };
    this.vel.x = Math.cos(this.angle) / 4 * force + this.initialVelocity.x / 2;
    this.vel.y = Math.sin(this.angle) / 4 * force + this.initialVelocity.y / 2;
    this.length = 0;
    this.lifeExpectancy = 400 + Math.random() * 400;
    this.color = colors.main;
    this.array = sparks;

    sparks.set(lastSparkId, this);
    lastSparkId++;
  }

  update() {
    const lifetime = new Date() - this.birthday;
    if (lifetime > this.lifeExpectancy) {
      this.kill();
      return;
    }

    const offset = this.checkCollision();
    if (offset !== false) {
      const normal = {
        x: Math.cos(offset),
        y: Math.sin(offset)
      }
      const ndotv = normal.x * this.vel.x + normal.y * this.vel.y * 0.7;
      this.vel.x = this.vel.x - 2 * ndotv * normal.x;
      this.vel.y = this.vel.y - 2 * ndotv * normal.y;
    }

    if (lifetime / this.lifeExpectancy < 0.5)
      this.length += 0.1;
    else
      this.length -= 0.1;

    super.update();
  }

  draw() {
    const tipX = this.pos.x + Math.cos(this.angle) * this.length;
    const tipY = this.pos.y + Math.sin(this.angle) * this.length;

    ctx.beginPath();
    ctx.moveTo(offsetX(this.pos.x), offsetY(this.pos.y));
    ctx.lineTo(offsetX(tipX), offsetY(tipY));
    ctx.closePath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = THICK_LINE_WIDTH;
    ctx.stroke();
  }
}

class Planet {
  constructor(pos, radius, mass) {
    this.id = lastPlanetId;
    this.pos = {
      x: pos.x,
      y: pos.y
    }

    this.mass = Math.max(100, mass);
    this.color = colors.main;
    this.radius = radius;
    this.outerRadius = radius + (this.mass * 0.25);
    this.lineAngle = 0;
    this.linesCount = Math.max(8, Math.round(this.outerRadius / 6));
    this.lineArea = 2 * Math.PI / this.linesCount;
    this.lineLength = 0.2; // 0 to 1. Relative to the space available

    planets.set(lastPlanetId, this);
    lastPlanetId++;
  }

  update() {
    if (this.lineAngle > 2 * Math.PI)
      this.lineAngle = 0
    else
      this.lineAngle += 0.09 / this.outerRadius;
  }

  draw() {
    this.drawBody();
    this.drawGravity();
  }

  drawBody() {
    ctx.beginPath();
    ctx.arc(offsetX(this.pos.x), offsetY(this.pos.y), offsetSize(this.radius), 0, 2 * Math.PI);
    ctx.fillStyle = colors.bg;
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = THICK_LINE_WIDTH;
    ctx.stroke();
    ctx.closePath();
  }

  drawGravity() {
    for (let i = 0; i < this.linesCount; i++) {
      ctx.beginPath();
      ctx.arc(offsetX(this.pos.x), offsetY(this.pos.y), offsetSize(this.outerRadius), i * this.lineArea + this.lineAngle, (i * this.lineArea) + (this.lineArea * this.lineLength) + this.lineAngle);
      ctx.strokeStyle = colors.helper;
      ctx.lineWidth = THIN_LINE_WIDTH;
      ctx.stroke();
      ctx.closePath();
    }
  }
}

// new Planet({
//   x: viewport.initial.x / 3,
//   y: viewport.initial.y / 3
// }, 50, 120);

// new Planet({
//    x: viewport.initial.x / 4.5 * 3,
//    y: viewport.initial.y / 4.5 * 3
// }, 30, 100);

new Planet({
  x: 20,
  y: viewport.initial.y - 20
}, 50, 200);

new Planet({
  x: viewport.initial.x / 2 + 30,
  y: viewport.initial.y / 2 + 30
}, 15, 250);

new Planet({
  x: viewport.initial.x - 20,
  y: 20
}, 30, 100);

spaceship.landOnPlanet(0, -1);

function updateGameLogic() {
  spaceship.update();

  planets.forEach(planet => {
    planet.update();
  });

  bullets.forEach(bullet => {
    bullet.update();
  });

  sparks.forEach(spark => {
    spark.update();
  });
}

function updateGameDisplay() {
  ctx.clearRect(0, 0, dpi(canvas.width), dpi(canvas.height));

  spaceship.draw();

  planets.forEach(planet => {
    planet.draw();
  });

  bullets.forEach(bullet => {
    bullet.draw();
  });

  sparks.forEach(spark => {
    spark.draw();
  });

  // DEBUG VIEWPORT
  // ctx.strokeStyle = '#777';
  // ctx.lineWidth = 1;
  // ctx.strokeRect(dpi(viewport.offset.x + 5), dpi(viewport.offset.y + 5), dpi(viewport.size.x - 10), dpi(viewport.size.y - 10));

  requestAnimationFrame(updateGameDisplay);
}

onResize();

let gameLogicInterval = new AdjustingInterval(updateGameLogic, INTERVAL);
gameLogicInterval.start();
updateGameDisplay();

/**
 * TOOLS
 */

function offsetSize(size, withDpi) {
  const result = size * viewport.ratio;
  return (withDpi === false ? result : dpi(result));
}

function offsetX(x, withDpi) {
  const result = viewport.offset.x + offsetSize(x, false);
  return (withDpi === false ? result : dpi(result));
}

function offsetY(y, withDpi) {
  const result = viewport.offset.y + offsetSize(y, false);
  return (withDpi === false ? result : dpi(result));
}


/**
 * EVENTS
 */

function onResize() {
  const initalRatio = viewport.initial.x / viewport.initial.y;
  const canvasRatio = canvas.clientWidth / canvas.clientHeight;

  if (initalRatio > canvasRatio) {
    var newRatio = Math.min(1 / viewport.initial.x * canvas.clientWidth, viewport.maxRatio);
  } else {
    var newRatio = Math.min(1 / viewport.initial.y * canvas.clientHeight, viewport.maxRatio);
  }

  viewport.size.x = viewport.initial.x * newRatio;
  viewport.size.y = viewport.initial.y * newRatio;
  viewport.offset.x = (canvas.clientWidth - viewport.size.x) / 2;
  viewport.offset.y = (canvas.clientHeight - viewport.size.y) / 2;
  viewport.ratio = newRatio;

  spaceship.loadingDistanceMin = Math.min(viewport.initial.x, viewport.initial.y) * 0.09;
  spaceship.loadingDistanceMax = Math.min(viewport.initial.x, viewport.initial.y) * 0.5;

  canvas.width = dpi(canvas.clientWidth);
  canvas.height = dpi(canvas.clientHeight);
}

function onMouseDown(x, y) {
  mouseClicking = true;
  onMouseMove(x, y);
}

function onMouseMove(x, y) {
  mouse.x = (x - (viewport.offset.x)) / viewport.ratio;
  mouse.y = (y - (viewport.offset.y)) / viewport.ratio;
}

function onMouseUp(x, y) {
  mouseClicking = false;
  spaceship.shoot({
    x: (x - (viewport.offset.x)) / viewport.ratio,
    y: (y - (viewport.offset.y)) / viewport.ratio
  });
}

window.addEventListener('resize', function () {
  onResize();
});

window.addEventListener('mousedown', function (e) {
  if (e.which == 1) { // left click
    onMouseDown(e.clientX, e.clientY);
  } else if (e.which == 3) { // Right click
    if (!mouseClicking) {
      spaceship.teleport({
        x: (e.clientX - (viewport.offset.x)) / viewport.ratio,
        y: (e.clientY - (viewport.offset.y)) / viewport.ratio
      });
    } else {
      spaceship.cancelShot();
    }
  }
});

window.addEventListener('touchstart', function (e) {
  if (e.targetTouches.length > 0) {
    onMouseDown(e.targetTouches[0].pageX, e.targetTouches[0].pageY);
  }
});

window.addEventListener('mousemove', function (e) {
  onMouseMove(e.clientX, e.clientY);
});

window.addEventListener('touchmove', function (e) {
  if (e.targetTouches.length > 0) {
    onMouseMove(e.targetTouches[0].pageX, e.targetTouches[0].pageY);
  }
});

window.addEventListener('mouseup', function (e) {
  if (e.which == 1) { // left click
    onMouseUp(e.clientX, e.clientY);
  }
});

window.addEventListener('touchend', function (e) {
  e.preventDefault();
  if (e.changedTouches.length > 0) {
    onMouseUp(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
  }
});

window.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  return false;
});