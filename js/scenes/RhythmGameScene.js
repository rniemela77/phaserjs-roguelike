class RhythmGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RhythmGameScene' });
        this.commands = [];
        this.currentCommandIndex = 0;
        this.commandText = null;
        this.commandTimer = null;
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
        this.commandText = this.add.text(400, 300, command, { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        this.commandTimer = this.time.delayedCall(2000, () => {
            this.endGame(false);
        });
    }

    handleInput(event) {
        if (event.key === this.commands[this.currentCommandIndex]) {
            this.currentCommandIndex++;
            this.commandTimer.remove();
            this.displayNextCommand();
        } else {
            this.endGame(false);
        }
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