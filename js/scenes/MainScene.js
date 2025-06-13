class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.gridSize = 32;
        this.gridWidth = Math.floor(800 / this.gridSize);
        this.gridHeight = Math.floor(600 / this.gridSize);
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(1)); // 1 = wall, 0 = floor
        this.visibilityGrid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(false));
        this.visionRange = 3;
        this.player = null;
        this.cursors = null;
        this.canMove = true;
        this.fogGraphics = null;
        this.walls = [];
        this.enemy = null;
        this.storedPlayerPosition = null;
    }

    create() {
        this.generateDungeon();

        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x333333);
        for (let x = 0; x < this.game.config.width; x += this.gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.game.config.height);
        }
        for (let y = 0; y < this.game.config.height; y += this.gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.game.config.width, y);
        }
        graphics.strokePath();

        this.fogGraphics = this.add.graphics();
        this.fogGraphics.setDepth(0);

        this.drawWalls();

        const start = this.findFirstFloor();
        this.player = this.add.rectangle(
            start.x * this.gridSize + this.gridSize / 2,
            start.y * this.gridSize + this.gridSize / 2,
            this.gridSize - 4,
            this.gridSize - 4,
            0x00ff00
        );
        this.player.setDepth(2);

        const enemyPosition = {
            x: Phaser.Math.Clamp(start.x + 2, 0, this.gridWidth - 1),
            y: Phaser.Math.Clamp(start.y + 2, 0, this.gridHeight - 1)
        };
        this.enemy = this.add.rectangle(
            enemyPosition.x * this.gridSize + this.gridSize / 2,
            enemyPosition.y * this.gridSize + this.gridSize / 2,
            this.gridSize - 4,
            this.gridSize - 4,
            0xff0000
        );
        this.enemy.setDepth(2);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.updateVisibility();
    }

    generateDungeon() {
        const maxRooms = 8;
        const roomMin = 3;
        const roomMax = 8;
        let rooms = [];

        for (let i = 0; i < maxRooms; i++) {
            const w = Phaser.Math.Between(roomMin, roomMax);
            const h = Phaser.Math.Between(roomMin, roomMax);
            const x = Phaser.Math.Between(1, this.gridWidth - w - 1);
            const y = Phaser.Math.Between(1, this.gridHeight - h - 1);
            const newRoom = { x, y, w, h };

            let overlaps = rooms.some(r => (
                x < r.x + r.w + 1 && x + w + 1 > r.x &&
                y < r.y + r.h + 1 && y + h + 1 > r.y
            ));
            if (overlaps) continue;

            this.carveRoom(newRoom);

            if (rooms.length > 0) {
                const prev = Phaser.Utils.Array.GetRandom(rooms);
                const prevCenter = { x: Math.floor(prev.x + prev.w / 2), y: Math.floor(prev.y + prev.h / 2) };
                const newCenter = { x: Math.floor(x + w / 2), y: Math.floor(y + h / 2) };
                this.carveCorridor(prevCenter, newCenter);
            }

            rooms.push(newRoom);
        }
    }

    carveRoom(room) {
        for (let i = room.y; i < room.y + room.h; i++) {
            for (let j = room.x; j < room.x + room.w; j++) {
                this.grid[i][j] = 0;
            }
        }
    }

    carveCorridor(a, b) {
        let x = a.x;
        let y = a.y;
        while (x !== b.x) {
            this.grid[y][x] = 0;
            x += x < b.x ? 1 : -1;
        }
        while (y !== b.y) {
            this.grid[y][x] = 0;
            y += y < b.y ? 1 : -1;
        }
    }

    drawWalls() {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x] === 1) {
                    const wall = this.add.rectangle(
                        x * this.gridSize + this.gridSize / 2,
                        y * this.gridSize + this.gridSize / 2,
                        this.gridSize - 4,
                        this.gridSize - 4,
                        0xff0000
                    );
                    wall.visible = false;
                    wall.setDepth(1);
                    this.walls.push({ x, y, sprite: wall });
                }
            }
        }
    }

    findFirstFloor() {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x] === 0) return { x, y };
            }
        }
        return { x: 1, y: 1 };
    }

    isWall(x, y) {
        const gx = Math.floor(x / this.gridSize);
        const gy = Math.floor(y / this.gridSize);
        if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) return true;
        return this.grid[gy][gx] === 1;
    }

    updateVisibility() {
        for (let y = 0; y < this.gridHeight; y++)
            for (let x = 0; x < this.gridWidth; x++)
                this.visibilityGrid[y][x] = false;

        const pgx = Math.floor(this.player.x / this.gridSize);
        const pgy = Math.floor(this.player.y / this.gridSize);

        for (let dy = -this.visionRange; dy <= this.visionRange; dy++) {
            for (let dx = -this.visionRange; dx <= this.visionRange; dx++) {
                const tx = pgx + dx;
                const ty = pgy + dy;
                if (tx < 0 || tx >= this.gridWidth || ty < 0 || ty >= this.gridHeight) continue;
                if (this.hasLineOfSight(pgx, pgy, tx, ty))
                    this.visibilityGrid[ty][tx] = true;
            }
        }

        this.walls.forEach(w => w.sprite.visible = this.visibilityGrid[w.y][w.x]);
        this.renderFogOfWar();
    }

    hasLineOfSight(x1, y1, x2, y2) {
        let dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
        let sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        while (true) {
            if (x1 === x2 && y1 === y2) break;
            if (this.grid[y1][x1] === 1) return false;
            let e2 = err * 2;
            if (e2 > -dy) { err -= dy; x1 += sx; }
            if (e2 < dx) { err += dx; y1 += sy; }
        }
        return true;
    }

    renderFogOfWar() {
        this.fogGraphics.clear();
        this.fogGraphics.fillStyle(0x000000, 0.8);
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (!this.visibilityGrid[y][x]) {
                    this.fogGraphics.fillRect(
                        x * this.gridSize,
                        y * this.gridSize,
                        this.gridSize,
                        this.gridSize
                    );
                }
            }
        }
    }

    update() {
        if (!this.canMove) return;
        let moved = false;
        let nx = this.player.x;
        let ny = this.player.y;

        if (this.cursors.left.isDown)      { nx -= this.gridSize; moved = true; }
        else if (this.cursors.right.isDown){ nx += this.gridSize; moved = true; }
        else if (this.cursors.up.isDown)   { ny -= this.gridSize; moved = true; }
        else if (this.cursors.down.isDown) { ny += this.gridSize; moved = true; }

        if (moved) {
            if (!this.isWall(nx, ny)) {
                this.player.x = Phaser.Math.Clamp(nx, this.gridSize/2, this.game.config.width - this.gridSize/2);
                this.player.y = Phaser.Math.Clamp(ny, this.gridSize/2, this.game.config.height - this.gridSize/2);
            }
            this.updateVisibility();
            this.canMove = false;
            this.time.delayedCall(100, () => { this.canMove = true; });
        }

        if (this.enemy && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.enemy.getBounds())) {
            this.startRhythmGame();
        }
    }

    pauseScene() {
        this.storedPlayerPosition = { x: this.player.x, y: this.player.y };
        this.scene.pause();
    }

    startRhythmGame() {
        this.pauseScene();
        this.scene.launch('RhythmGameScene', { mainScene: this });
    }

    removeEnemy() {
        if (this.enemy) {
            this.enemy.destroy();
            this.enemy = null;
        }
    }

    resumeScene(playerWon) {
        if (playerWon) {
            this.removeEnemy();
        }
        this.player.x = this.storedPlayerPosition.x;
        this.player.y = this.storedPlayerPosition.y;
        this.scene.resume();
    }
}

export default MainScene;
