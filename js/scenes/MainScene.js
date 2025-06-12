class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.gridSize = 32; // Size of each grid cell
        this.player = null;
        this.cursors = null;
        this.canMove = true;
        this.walls = [];
        // Convert game dimensions to grid coordinates
        this.gridWidth = Math.floor(800 / this.gridSize);
        this.gridHeight = Math.floor(600 / this.gridSize);
        // Initialize empty grid
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(0));
    }

    create() {
        // Create grid visualization
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x333333);

        // Draw vertical lines
        for (let x = 0; x < this.game.config.width; x += this.gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.game.config.height);
        }

        // Draw horizontal lines
        for (let y = 0; y < this.game.config.height; y += this.gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.game.config.width, y);
        }
        graphics.strokePath();

        // Create some random walls
        this.createWalls();

        // Create player (a simple rectangle)
        this.player = this.add.rectangle(
            this.gridSize / 2,
            this.gridSize / 2,
            this.gridSize - 4,
            this.gridSize - 4,
            0x00ff00
        );

        // Setup keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    createWalls() {
        // Create some random walls
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, this.gridWidth - 1);
            const y = Phaser.Math.Between(0, this.gridHeight - 1);
            
            // Don't place walls at player start position
            if (x === 0 && y === 0) continue;
            
            this.grid[y][x] = 1; // Mark as wall in grid
            const wall = this.add.rectangle(
                x * this.gridSize + this.gridSize / 2,
                y * this.gridSize + this.gridSize / 2,
                this.gridSize - 4,
                this.gridSize - 4,
                0xff0000
            );
            this.walls.push(wall);
        }
    }

    isWall(x, y) {
        // Convert pixel coordinates to grid coordinates
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        
        // Check if coordinates are within bounds
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return true; // Treat out of bounds as walls
        }
        
        return this.grid[gridY][gridX] === 1;
    }

    update() {
        if (!this.canMove) return;

        let moved = false;
        const currentX = this.player.x;
        const currentY = this.player.y;
        let newX = currentX;
        let newY = currentY;

        if (this.cursors.left.isDown) {
            newX = currentX - this.gridSize;
            moved = true;
        } else if (this.cursors.right.isDown) {
            newX = currentX + this.gridSize;
            moved = true;
        } else if (this.cursors.up.isDown) {
            newY = currentY - this.gridSize;
            moved = true;
        } else if (this.cursors.down.isDown) {
            newY = currentY + this.gridSize;
            moved = true;
        }

        // Check for wall collision before moving
        if (moved && !this.isWall(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            
            // Keep player within bounds
            this.player.x = Phaser.Math.Clamp(
                this.player.x,
                this.gridSize / 2,
                this.game.config.width - this.gridSize / 2
            );
            this.player.y = Phaser.Math.Clamp(
                this.player.y,
                this.gridSize / 2,
                this.game.config.height - this.gridSize / 2
            );

            // Add movement cooldown
            this.canMove = false;
            this.time.delayedCall(100, () => {
                this.canMove = true;
            });
        }
    }
} 