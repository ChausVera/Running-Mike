// game process

const canvas = document.querySelector('canvas');
const turn = document.getElementById("turn");
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const clockElement = document.getElementById('clock');
let startTime = Date.now();
let elapsedTime = 0;

function updateClock() { // game clock
    elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    clockElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

setInterval(updateClock, 1000);

class Boundary { //boundary block
    constructor({ position, side }) {
        this.position = position;
        this.side = side;
    }

    draw() {
        c.fillStyle = 'brown';
        c.fillRect(this.position.x, this.position.y, this.side, this.side);
    }
}

class Cracker { // allows mouse to hit spiders
    constructor({ position, radius }) {
        this.position = position;
        this.radius = radius;
        this.eaten = false;
    }

    draw() {
        if (!this.eaten) {
            c.beginPath();
            c.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI, false);
            c.fillStyle = 'rgb(250, 215, 135)';
            c.fill();
            c.lineWidth = 2;
            c.strokeStyle = 'rgb(175, 137, 61)';
            c.stroke();
        }
    }
}

class Crumble { // the goal is to eat them all
    constructor({ position, radius }) {
        this.position = position;
        this.radius = radius;
    }

    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI, false);
        c.fillStyle = 'white';
        c.fill();
    }
}

class Mouse { // user skin
    constructor({ position, color }) {
        this.position = position;
        this.color = color;
        this.direction = 'right';
        this.image = new Image();
        this.image.src = `images/${color}_${this.direction}.png`;
        this.width = side - 7;
        this.height = side - 7;
        this.speed = side * 0.05;
        this.isMoving = true;
        this.directionQueue = [];
    }

    draw() {
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
    }

    update() {
        if (this.isMoving) {
            this.move();
            this.eatCrumblesAndCrackers();
        }
        this.draw();
    }

    move() {
        if (this.directionQueue.length > 0) {
            this.handleDirectionQueue();
        }

        let newX = this.position.x;
        let newY = this.position.y;

        switch (this.direction) {
            case 'up':
                newY -= this.speed;
                break;
            case 'down':
                newY += this.speed;
                break;
            case 'left':
                newX -= this.speed;
                break;
            case 'right':
                newX += this.speed;
                break;
        }

        if (!this.isColliding(newX, newY)) {
            this.position.x = newX;
            this.position.y = newY;
        } else {
            this.handleDirectionQueue();
        }
    }

    isColliding(newX, newY) { // feces a boundary
        for (let boundary of boundaries) {
            if (newX < boundary.position.x + boundary.side &&
                newX + this.width > boundary.position.x &&
                newY < boundary.position.y + boundary.side &&
                newY + this.height > boundary.position.y) {
                return true;
            }
        }
        return false;
    }

    canTurn(direction) { // have free space at the required direction
        let newX = this.position.x;
        let newY = this.position.y;

        switch (direction) {
            case 'up':
                newY -= this.speed;
                break;
            case 'down':
                newY += this.speed;
                break;
            case 'left':
                newX -= this.speed;
                break;
            case 'right':
                newX += this.speed;
                break;
        }

        return !this.isColliding(newX, newY);
    }

    handleKeyPress(direction) { // add command to the command queue
        if (!this.directionQueue.includes(direction)) {
            this.directionQueue.push(direction);
        }
    }

    handleDirectionQueue() { // check if queued commands may execute
        while (this.directionQueue.length > 0) {
            const nextDirection = this.directionQueue.shift();
            if (this.canTurn(nextDirection)) {
                this.direction = nextDirection;
                this.image.src = `images/${this.color}_${this.direction}.png`;
                return;
            }
        }
    }


    eatCrumblesAndCrackers() { // eating crumbles and a cracker
        const mouseCenterX = this.position.x + this.width / 2;
        const mouseCenterY = this.position.y + this.height / 2;

        crumbles.forEach((crumble, index) => {
            const distance = Math.hypot(mouseCenterX - crumble.position.x, mouseCenterY - crumble.position.y);
            if (distance < crumble.radius + this.width / 2) {
                crumbles.splice(index, 1);
                this.updateMapSymbol(crumble.position, ' ');
                if (crumbles.length === 0) { // win condition
                    const currentTime = clockElement.textContent;
                    localStorage.setItem('status', 'win');
                    localStorage.setItem('elapsed_time', currentTime);
                    window.location.href = 'finish.html';
                }
            }
        });

        if (cracker && !cracker.eaten) {
            const distance = Math.hypot(mouseCenterX - cracker.position.x, mouseCenterY - cracker.position.y);
            if (distance < cracker.radius + this.width / 2) { // fighting mode
                cracker.eaten = true;
                this.updateMapSymbol(cracker.position, ' ');
                spiders.forEach(spider => spider.turnBlue(10000));
            }
        }
    }

    updateMapSymbol(position, symbol) {
        const i = Math.floor((position.y - startY) / side);
        const j = Math.floor((position.x - startX) / side);
        if (savedLevel === '1') {
            map1[i][j] = symbol;
        } else if (savedLevel === '2') {
            map2[i][j] = symbol;
        }
    }
}

class Spider { // enemies can kill Mike
    constructor({ position }) {
        this.position = position;
        this.image = new Image();
        this.image.src = 'images/spider.png';
        this.width = side - 2;
        this.height = side - 2;
        this.speed = side * 0.05;
        this.direction = this.randomDirection();
        this.isMoving = true;
        this.isBlue = false;
        this.blueTimer = null;
    }

    draw() {
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
    }

    update() {
        if (this.isMoving) {
            this.move();
        }
        this.draw();
    }

    move() {
        let newX = this.position.x;
        let newY = this.position.y;

        switch (this.direction) {
            case 'up':
                newY -= this.speed;
                break;
            case 'down':
                newY += this.speed;
                break;
            case 'left':
                newX -= this.speed;
                break;
            case 'right':
                newX += this.speed;
                break;
        }

        if (!this.isColliding(newX, newY)) {
            this.position.x = newX;
            this.position.y = newY;
        } else {
            this.direction = this.randomDirection();
        }

        this.checkMouseCollision();
    }

    randomDirection() {
        const directions = ['up', 'down', 'left', 'right'];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    isColliding(newX, newY) { // not to cross boundaries
        for (let boundary of boundaries) {
            if (newX < boundary.position.x + boundary.side &&
                newX + this.width > boundary.position.x &&
                newY < boundary.position.y + boundary.side &&
                newY + this.height > boundary.position.y) {
                return true;
            }
        }
        return false;
    }

    checkMouseCollision() { // interraction with a mouse
        const mouseCenterX = mouse.position.x + mouse.width / 2;
        const mouseCenterY = mouse.position.y + mouse.height / 2;
        const spiderCenterX = this.position.x + this.width / 2;
        const spiderCenterY = this.position.y + this.height / 2;
        const distance = Math.hypot(mouseCenterX - spiderCenterX, mouseCenterY - spiderCenterY);

        if (distance < (mouse.width + this.width) / 2) {
            if (this.isBlue) { // Mike has a cracker power
                spiders.splice(spiders.indexOf(this), 1);
            } else { // spider kills Mike
                mouse.isMoving = false;
                this.isMoving = false;
                cancelAnimationFrame(animationId);
                localStorage.setItem('status', 'loss');
                window.location.href = 'finish.html';
            }
        }
    }

    turnBlue(duration) { // weak mode
        this.image.src = 'images/spider_blue.png';
        this.isBlue = true;
        clearTimeout(this.blueTimer);
        this.blueTimer = setTimeout(() => {
            this.image.src = 'images/spider.png';
            this.isBlue = false;
        }, duration);
    }
}


const map1 = [
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-'],
    ['-', '.', '.', '.', '.', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '.', '-', '-', '.', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '-', '-', '.', '-', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '-', '-', '.', '-', '-', '.', '-'],
    ['-', '.', '-', '.', '*', '.', '-', '-', '.', '-'],
    ['-', '.', '.', '.', '-', '.', '.', '.', '.', '-'],
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
];

const map2 = [
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'],
    ['-', '.', '.', '.', '.', '.', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '.', '-', '-', '-', '.', '-', '.', '-'],
    ['-', '.', '-', '.', '.', '-', '.', '.', '-', '.', '-'],
    ['-', '.', '-', '-', '.', '.', '.', '-', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '-', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '.', '-', '-', '-', '-', '.', '-', '-'],
    ['-', '.', '-', '*', '.', '-', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '-', '.', '-', '.', '-', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '.', '.', '.', '.', '.', '-'],
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
];

const boundaries = [];
const crumbles = [];
let cracker = null;
const spiders = [];
const side = canvas.width <= canvas.height ? canvas.width * 0.8 / 12 : canvas.width * 0.4 / 12;

function draw_map(map) { // draw the map corresponding to the cosen level
    const startX = (canvas.width - map[0].length * side) / 2;
    const startY = (canvas.height - map.length * side) / 2;

    map.forEach((row, i) => {
        row.forEach((symbol, j) => {
            if (symbol === '-') {
                const boundary = new Boundary({
                    position: {
                        x: startX + j * side,
                        y: startY + i * side
                    },
                    side: side
                });
                boundaries.push(boundary);
            } else if (symbol === '*') {
                cracker = new Cracker({
                    position: {
                        x: startX + (j + 0.5) * side,
                        y: startY + (i + 0.5) * side
                    },
                    radius: side * 0.4
                });
            } else if (symbol === '.') {
                const crumble = new Crumble({
                    position: {
                        x: startX + (j + 0.5) * side,
                        y: startY + (i + 0.5) * side
                    },
                    radius: side * 0.1
                });
                crumbles.push(crumble);
            }
        });
    });

    boundaries.forEach(boundary => {
        boundary.draw();
    });

    crumbles.forEach(crumble => {
        crumble.draw();
    });

    if (cracker) {
        cracker.draw();
    }
}

const savedLevel = localStorage.getItem('selected_level') || '1';
const savedColor = localStorage.getItem('mouse_color') || 'brown';
let startX, startY;

if (savedLevel === '1') { // game initialization
    draw_map(map1);
    startX = (canvas.width - map1[0].length * side) / 2;
    startY = (canvas.height - map1.length * side) / 2;
    spiders.push(new Spider({
        position: {
            x: startX + 6 * side,
            y: startY + 5 * side
        }
    }));
} else if (savedLevel === '2') {
    draw_map(map2);
    startX = (canvas.width - map2[0].length * side) / 2;
    startY = (canvas.height - map2.length * side) / 2;
    spiders.push(
        new Spider({ position: { x: startX + 6 * side, y: startY + 5 * side } }),
        new Spider({ position: { x: startX + 2 * side, y: startY + 9 * side } }),
        new Spider({ position: { x: startX + 8 * side, y: startY + 7 * side } })
    );
}

const mouse = new Mouse({ // add player
    position: { x: startX + side, y: startY + side },
    color: savedColor
});

let animationId;

function animate() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    if (savedLevel === '1') {
        draw_map(map1);
    } else if (savedLevel === '2') {
        draw_map(map2);
    }
    mouse.update();
    spiders.forEach(spider => spider.update());
    animationId = requestAnimationFrame(animate);
}

animate(); // start moving

window.addEventListener('keydown', (event) => { //commands
    const soundCheck = localStorage.getItem('sounds_checked') === 'true';
    if (soundCheck) {
        turn.load();
        turn.play();
    }
    switch (event.key) {
        case 'w':
            mouse.handleKeyPress('up');
            break;
        case 'a':
            mouse.handleKeyPress('left');
            break;
        case 's':
            mouse.handleKeyPress('down');
            break;
        case 'd':
            mouse.handleKeyPress('right');
            break;
    }
});

window.addEventListener('resize', () => { // responsive maps
    canvas.width = window.innerWidth * 0.8; 
    canvas.height = window.innerHeight * 0.8;
    if (savedLevel === '1') {
        draw_map(map1);
    } else if (savedLevel === '2') {
        draw_map(map2);
    }
});