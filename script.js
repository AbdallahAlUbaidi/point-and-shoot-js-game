/**@type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const collisionCanvas = document.getElementById("collisionCanvas");
const collisionCtx = collisionCanvas.getContext("2d");

const CANVAS_WIDTH = canvas.width = collisionCanvas.width = window.innerWidth;
const CANVAS_HEIGHT = canvas.height = collisionCanvas.height = window.innerHeight;

ctx.font = "40px Impact";

const enemeySpwanInterval = 3000; //ms
let timeToNextEnemeySpawn = enemeySpwanInterval;
let lastTime = 0;
let score = 0;

let enemies = [];
let explosions = [];


class Enemey {
    constructor() {
        this.spriteWidth = 271;
        this.spriteHeight = 194;
        this.sizeModifier = Math.random() * .4 + .4;
        this.width = this.spriteWidth * this.sizeModifier;
        this.height = this.spriteHeight * this.sizeModifier;
        this.x = CANVAS_WIDTH;
        this.y = Math.random() * (CANVAS_HEIGHT - this.height);
        this.image = new Image();
        this.image.src = "./assets/enemy.png";
        this.directionX = Math.random() * 5 + 3;
        this.directionY = Math.random() * 5 - 2.5;
        this.frame = 0;
        this.flapInterval = Math.random() * 60 + 30;
        this.timeSinceLastFlap = this.flapInterval;
        let red = Math.floor(Math.random() * 255);
        let green = Math.floor(Math.random() * 255);
        let blue = Math.floor(Math.random() * 255);
        this.hitBoxColor = `rgb(${red},${green},${blue})`;
        this.hitBoxRGB = [red, green, blue];
        this.markedForDelete = false;
    }

    move() {
        if (this.y < 0 || this.y > CANVAS_HEIGHT - this.height)
            this.directionY *= -1
        this.x -= this.directionX;
        this.y += this.directionY;
        if (this.x + this.width < 0)
            this.markedForDelete = true;
    }

    update(deltaTime) {
        this.move();
        this.timeSinceLastFlap -= deltaTime;
        if (this.timeSinceLastFlap <= 0) {
            this.timeSinceLastFlap = this.flapInterval;
            this.frame = this.frame < 5 ? this.frame + 1 : 0;
        }
    }

    draw() {
        let { image, x, y, width, height, spriteWidth, spriteHeight } = this;
        ctx.drawImage(image, this.frame * spriteWidth, 0, spriteWidth, spriteHeight, x, y, width, height);
        collisionCtx.fillStyle = this.hitBoxColor;
        collisionCtx.fillRect(x, y, width, height);
    }
}

class Explosion {
    constructor(x, y) {
        this.spriteWidth = 200;
        this.spriteHeight = 179;
        this.width = this.spriteWidth * .9;
        this.height = this.spriteHeight * .9;
        this.x = x;
        this.y = y;
        this.image = new Image();
        this.image.src = "./assets/ExplosionEffect.png";
        this.sound = new Audio();
        this.sound.src = "./assets/ExplosionSoundEffect.wav";
        this.frame = 0;
        this.frameInterval = 80;
        this.timeSinceLastFrame = this.frameInterval;
        this.angle = Math.random() * 6.2;
    }

    draw() {
        ctx.save();
        let { x, y, width, height, spriteWidth, spriteHeight, image, frame, angle } = this;
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.drawImage(image, frame * spriteWidth, 0, spriteWidth, spriteHeight,
            - width / 2, - height / 2, width, height);
        ctx.restore();
    }

    update(deltaTime) {
        if (this.frame === 0) this.sound.play();
        if (this.frame >= 5) delete this;
        this.timeSinceLastFrame -= deltaTime;
        if (this.timeSinceLastFrame <= 0) {
            this.frame++;
            this.timeSinceLastFrame = this.frameInterval;
        }
    }
}



function drawScore(score) {
    ctx.fillStyle = "black";
    ctx.fillText("Score: " + score, 50, 75);
    ctx.fillStyle = "white";
    ctx.fillText("Score: " + score, 55, 80);
}

function animate(timestamp) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    collisionCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    timeToNextEnemeySpawn -= deltaTime;
    if (timeToNextEnemeySpawn <= 0) {
        timeToNextEnemeySpawn = enemeySpwanInterval;
        enemies.push(new Enemey());
        enemies = enemies.filter(v => !v.markedForDelete);
        enemies.sort((e1, e2) => e1.width - e2.width);
    }
    let arrOfEntities = [...explosions, ...enemies];
    drawScore(score);
    arrOfEntities
        .filter(entity => !entity.markedForDelete)
        .forEach(entity => {
            entity.update(deltaTime);
            entity.draw();
        });
    requestAnimationFrame(animate);
}

function compareColors(color1, color2) {
    for (let i = 0; i < Math.min(color1.length, color2.length); i++)
        if (color1[i] !== color2[i]) return false;
    return true;
}

const handleClick = event => {
    const detectPixleColor = collisionCtx.getImageData(event.x, event.y, 1, 1);
    const pixelColor = detectPixleColor.data;
    for (let i = 0; i < enemies.length; i++) {
        let { hitBoxRGB, x, y, width, height } = enemies[i];
        if (compareColors(hitBoxRGB, pixelColor)) {
            enemies[i].markedForDelete = true;
            explosions.push(new Explosion(x + width / 2, y + height / 2));
            score++;
        }
    };
}

canvas.addEventListener("click", handleClick);

animate(0);