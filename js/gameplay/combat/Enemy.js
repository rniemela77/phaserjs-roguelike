import Combatant from './Combatant.js';

export default class Enemy extends Combatant {
    constructor(scene, {
        sprite,
        maxHealth = 100,
        swingDurationMs = 4000,
        swingBarWidth = 160,
        swingBarHeight = 8,
        onSwingComplete = () => {}
    } = {}) {
        super({ maxHealth });
        this.scene = scene;
        this.sprite = sprite;

        this.swingElapsedMs = 0;
        this.swingDurationMs = swingDurationMs;

        this.swingBarWidth = swingBarWidth;
        this.swingBarHeight = swingBarHeight;
        this.onSwingComplete = onSwingComplete;

        this.swingBarBg = scene.add.rectangle(0, 0, this.swingBarWidth, this.swingBarHeight, 0x300000)
            .setOrigin(0.5, 0.5)
            .setDepth(10);
        this.swingBarFill = scene.add.rectangle(0, 0, this.swingBarWidth, this.swingBarHeight, 0xff0000)
            .setOrigin(0, 0.5)
            .setDepth(11);
    }

    setSwingBarVisible(visible) {
        this.swingBarBg.setVisible(visible);
        this.swingBarFill.setVisible(visible);
    }

    resetSwing() {
        this.swingElapsedMs = 0;
        this.swingBarFill.scaleX = 0;
    }

    update(delta) {
        // Advance timer
        this.swingElapsedMs += delta;
        const progress = Phaser.Math.Clamp(this.swingElapsedMs / this.swingDurationMs, 0, 1);

        // Keep bar anchored above enemy sprite
        const enemyTopY = this.sprite.y - (this.sprite.displayHeight / 2);
        const barY = enemyTopY - 14;
        const barX = this.sprite.x;

        this.swingBarBg.setPosition(barX, barY);
        const leftX = barX - (this.swingBarWidth / 2);
        this.swingBarFill.setPosition(leftX, barY);
        this.swingBarFill.scaleX = progress;

        // Fire at 100%, then reset
        if (progress >= 1) {
            this.swingElapsedMs = 0;
            this.onSwingComplete();
        }
    }
}


