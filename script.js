window.addEventListener("load", () => {
    const ctx = canvas.getContext("2d");
    canvas.width = 600;
    canvas.height = 800;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.fillStyle = "white";
    ctx.font = "30px Impact";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    class Asteroid {
        constructor(game) {
            this.game = game;
            this.radius = 75;
            this.spriteWidth = 150;
            this.spriteHeight = 155;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.x = -this.radius;
            this.y = Math.random() * this.game.height;
            this.image = asteroidImage;
            this.speedX = Math.random() * 5 + 1;
            this.angle = 0;
            this.va = Math.random() * 0.1 - 0.05;
            this.free = true;
        }
        start() {
            this.x = -this.radius;
            this.y = Math.random() * this.game.height;
            this.free = false;
        }
        reset() {
            this.free = true;
        }
        draw(ctx) {
            if (!this.free) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                if (this.game.debug) {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.drawImage(
                    this.image,
                    -this.width * 0.5,
                    -this.height * 0.5,
                    this.width,
                    this.height
                );
                ctx.restore();
            }
        }
        update() {
            if (!this.free) {
                this.angle += this.va;
                this.x += this.speedX;
                if (this.x + this.radius > this.game.width) {
                    // asteroid explosion when hitting right side
                    this.reset();
                    const explosion = this.game.getFreeObj(
                        this.game.explosionPool
                    );
                    if (explosion) {
                        explosion.start(this.x, this.y, 0);
                    }
                }
            }
        }
    }

    class Explosion {
        constructor(game) {
            this.game = game;
            this.image = explosionImage;
            this.spriteWidth = 301;
            this.spriteHeight = 303;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.frameX = 0;
            this.frameY = Math.floor(Math.random() * 3);
            this.maxFrame = 21;
            this.free = true;
            this.x = 0;
            this.y = 0;
            this.speed = 0;
            this.frameTimer = 0;
            this.frameInterval = 20;
            this.sound;
        }
        playSound() {
            this.sound.currentTime = 0;
            this.sound.play();
        }
        start(x, y, speed) {
            this.sound =
                this.game.soundContainer[
                    Math.floor(Math.random() * this.game.soundContainer.length)
                ];
            this.frameX = 0;
            this.frameY = Math.floor(Math.random() * 3);
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.playSound();
            this.free = false;
        }
        reset() {
            this.free = true;
        }
        draw(ctx) {
            if (!this.free) {
                ctx.drawImage(
                    this.image,
                    this.frameX * this.spriteWidth,
                    this.frameY * this.spriteHeight,
                    this.spriteWidth,
                    this.spriteHeight,
                    this.x - this.width * 0.5,
                    this.y - this.height * 0.5,
                    this.width,
                    this.height
                );
            }
        }
        update(deltaTime) {
            if (!this.free) {
                this.x += this.speed;
                if (this.frameTimer > this.frameInterval) {
                    if (this.frameX < this.maxFrame) this.frameX++;
                    else this.reset();
                    this.frameTimer = 0;
                } else {
                    this.frameTimer += deltaTime;
                }
            }
        }
    }

    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.asteroidPool = [];
            this.explosionPool = [];
            this.max = 20;
            this.asteroidTimer = 0;
            this.asteroidInterval = 500;
            this.debug = false;
            this.mouse = {
                x: undefined,
                y: undefined,
                radius: 20,
            };
            this.score = 0;
            this.winningScore = 10;
            this.soundContainer = [
                explosion1Sound,
                explosion2Sound,
                explosion3Sound,
                explosion4Sound,
                explosion5Sound,
                explosion6Sound,
            ];
            this.createObjPool();

            window.addEventListener("keydown", (e) => {
                if (e.key === "d") this.debug = !this.debug;
            });
            window.addEventListener("mousemove", (e) => {
                this.mouse.x = e.offsetX;
                this.mouse.y = e.offsetY;
            });
            window.addEventListener("click", (e) => {
                this.mouse.x = e.offsetX;
                this.mouse.y = e.offsetY;
                // explosion when hit click asteroid
                this.asteroidPool.forEach((asteroid) => {
                    if (
                        !asteroid.free &&
                        this.checkCollision(asteroid, this.mouse)
                    ) {
                        const explosion = this.getFreeObj(this.explosionPool);
                        if (explosion)
                            explosion.start(
                                asteroid.x,
                                asteroid.y,
                                asteroid.speedX * 0.4
                            );
                        asteroid.reset();
                        if (this.score < this.winningScore) this.score++;
                    }
                });
            });
        }
        fillTextStatus(ctx) {
            ctx.fillText(`Score: ${this.score}`, 20, 30);
            if (this.score >= this.winningScore) {
                ctx.save();
                ctx.textBaseline = "middle";
                ctx.font = "80px Impact";
                ctx.textAlign = "center";
                ctx.shadowOffsetX = 10;
                ctx.shadowOffsetY = 10;
                ctx.shadowColor = "black";
                ctx.shadowBlur = 10;
                ctx.fillText("You Win!!!", this.width * 0.5, this.height * 0.5);
                ctx.restore();
            }
        }
        render(ctx, deltaTime) {
            [...this.asteroidPool, ...this.explosionPool].forEach((obj) => {
                obj.draw(ctx);
                obj.update(deltaTime);
            });
            // draw mouse
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,255,0,0.1)";
            ctx.arc(
                this.mouse.x,
                this.mouse.y,
                this.mouse.radius,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
            this.fillTextStatus(ctx);
            // create periodic asteroid
            if (this.asteroidTimer > this.asteroidInterval) {
                const asteroid = this.getFreeObj(this.asteroidPool);
                if (asteroid) asteroid.start();
                this.asteroidTimer = 0;
            } else {
                this.asteroidTimer += deltaTime;
            }
        }
        createObjPool() {
            for (let i = 0; i < this.max; i++) {
                this.asteroidPool.push(new Asteroid(this));
                this.explosionPool.push(new Explosion(this));
            }
        }
        getFreeObj(objPool) {
            return objPool.find((obj) => obj.free);
        }
        checkCollision(a, b) {
            const sumOfRadius = a.radius + b.radius;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distance = Math.hypot(dx, dy);
            return distance <= sumOfRadius;
        }
    }

    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.render(ctx, deltaTime);
        requestAnimationFrame(animate);
    }
    animate(0);
});
