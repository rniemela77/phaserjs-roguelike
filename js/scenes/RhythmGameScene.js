class RhythmGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RhythmGameScene' });
        this.commands = [];
        this.currentCommandIndex = 0;
        this.commandText = null;
        this.commandTimer = null;
        this.ball = null;
        this.line = null;
        this.hitArea = null;
        this.ballTween = null;
    }

    preload() {
        // Load any assets needed for the rhythm game
    }

    create() {
        this.generateCommands();
        this.displayNextCommand();
        this.input.keyboard.on('keydown', this.handleInput, this);
    }

    generateCommands() {
        const possibleCommands = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        for (let i = 0; i < 5; i++) {
            const command = Phaser.Utils.Array.GetRandom(possibleCommands);
            this.commands.push(command);
        }
    }

    displayNextCommand() {
        if (this.currentCommandIndex >= this.commands.length) {
            this.endGame(true);
            return;
        }

        const command = this.commands[this.currentCommandIndex];
        if (this.commandText) this.commandText.destroy();
        this.commandText = this.add.text(400, 50, command, { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        this.createLineAndBall();
    }

    createLineAndBall() {
        if (this.line) this.line.destroy();
        if (this.ball) this.ball.destroy();
        if (this.hitArea) this.hitArea.destroy();

        this.line = this.add.rectangle(400, 300, 600, 5, 0xffffff);
        this.hitArea = this.add.rectangle(700, 300, 50, 50, 0xff0000, 0.5);
        this.ball = this.add.circle(100, 300, 10, 0x00ff00);

        this.ballTween = this.tweens.add({
            targets: this.ball,
            x: 750,
            duration: 2000,
            onComplete: () => this.endGame(false)
        });
    }

    handleInput(event) {
        if (event.key === this.commands[this.currentCommandIndex] && this.isBallInHitArea()) {
            this.currentCommandIndex++;
            this.ballTween.stop();
            this.ball.destroy();
            this.displayNextCommand();
        } else if (!this.isBallInHitArea()) {
            this.endGame(false);
        }
    }

    isBallInHitArea() {
        return Phaser.Geom.Intersects.RectangleToRectangle(this.ball.getBounds(), this.hitArea.getBounds());
    }

    endGame(success) {
        if (success) {
            console.log('Player wins!');
        } else {
            console.log('Player loses!');
        }
        this.scene.stop();
        this.scene.get('MainScene').resumeScene(success);
    }

    update() {
        // Update game logic
    }
}

export default RhythmGameScene; 