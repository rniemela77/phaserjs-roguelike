class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.gridSize = 32;
        this.player = null;
        this.cursors = null;
        this.canMove = true;
        this.walls = [];
        this.gridWidth = Math.floor(800 / this.gridSize);
        this.gridHeight = Math.floor(600 / this.gridSize);
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(0));
        this.visibilityGrid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(false));
        this.visionRange = 3;
        this.fogGraphics = null;
    }

    create() {
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

        this.createWalls();

        this.player = this.add.rectangle(
            this.gridSize / 2,
            this.gridSize / 2,
            this.gridSize - 4,
            this.gridSize - 4,
            0x00ff00
        );
        this.player.setDepth(2);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.updateVisibility();
    }

    createWalls() {
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, this.gridWidth - 1);
            const y = Phaser.Math.Between(0, this.gridHeight - 1);
            if (x === 0 && y === 0) continue;
            this.grid[y][x] = 1;
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

    isWall(x, y) {
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return true;
        }
        return this.grid[gridY][gridX] === 1;
    }

    updateVisibility() {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.visibilityGrid[y][x] = false;
            }
        }

        const playerGridX = Math.floor(this.player.x / this.gridSize);
        const playerGridY = Math.floor(this.player.y / this.gridSize);

        for (let dy = -this.visionRange; dy <= this.visionRange; dy++) {
            for (let dx = -this.visionRange; dx <= this.visionRange; dx++) {
                const tx = playerGridX + dx;
                const ty = playerGridY + dy;
                if (tx < 0 || tx >= this.gridWidth || ty < 0 || ty >= this.gridHeight) continue;
                if (this.hasLineOfSight(playerGridX, playerGridY, tx, ty)) {
                    this.visibilityGrid[ty][tx] = true;
                }
            }
        }

        this.walls.forEach(w => {
            w.sprite.visible = this.visibilityGrid[w.y][w.x];
        });

        this.renderFogOfWar();
    }

    hasLineOfSight(x1, y1, x2, y2) {
        let dx = Math.abs(x2 - x1);
        let dy = Math.abs(y2 - y1);
        let sx = x1 < x2 ? 1 : -1;
        let sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            if (x1 === x2 && y1 === y2) break;
            if (this.grid[y1][x1] === 1) return false;
            let e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
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
        let newX = this.player.x;
        let newY = this.player.y;

        if (this.cursors.left.isDown)      { newX -= this.gridSize; moved = true; }
        else if (this.cursors.right.isDown){ newX += this.gridSize; moved = true; }
        else if (this.cursors.up.isDown)   { newY -= this.gridSize; moved = true; }
        else if (this.cursors.down.isDown) { newY += this.gridSize; moved = true; }

        if (moved) {
            if (!this.isWall(newX, newY)) {
                this.player.x = Phaser.Math.Clamp(newX, this.gridSize/2, this.game.config.width - this.gridSize/2);
                this.player.y = Phaser.Math.Clamp(newY, this.gridSize/2, this.game.config.height - this.gridSize/2);
            }
            this.updateVisibility();
            this.canMove = false;
            this.time.delayedCall(100, () => { this.canMove = true; });
        }
    }
}

export default MainScene;
