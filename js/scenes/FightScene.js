import { UI_FONT_FAMILY } from '../ui/theme.js';
import Player from '../gameplay/combat/Player.js';
import Enemy from '../gameplay/combat/Enemy.js';
import Sniper from '../gameplay/combat/classes/Sniper.js';

class FightScene extends Phaser.Scene {
    constructor() {
        super('MyGame');
        this.enemy = null; // gameplay model
        this.player = null; // gameplay model
        this.enemySprite = null; // Phaser image
        this.sniper = null; // gameplay module
        this.isGameOver = false;
    }

    preload() {
        // Placeholder for the enemy PNG
        this.load.image('enemy', 'https://labs.phaser.io/assets/sprites/beholder.png');
    }

    create() {
        const { width, height } = this.scale;

        // 1. Setup combatants + enemy sprite
        this.player = new Player({ maxHealth: 100 });
        this.enemySprite = this.add.image(width / 2, height * 0.4, 'enemy').setInteractive();
        this.enemySprite.setScale(0.8);
        this.enemy = new Enemy(this, {
            sprite: this.enemySprite,
            maxHealth: 100,
            swingDurationMs: 4000,
            onSwingComplete: () => this.enemyAttack()
        });

        // 2. Setup UI Elements
        this.statusText = this.add.text(width / 2, height * 0.1, 'HOLD TO AIM', { 
            fontSize: '32px', 
            fontFamily: UI_FONT_FAMILY,
            fill: '#fff' 
        }).setOrigin(0.5);

        this.combatText = this.add.text(width / 2, height * 0.16, '', {
            fontSize: '18px',
            fontFamily: UI_FONT_FAMILY,
            fill: '#fff'
        }).setOrigin(0.5);

        this.enemyHpText = this.add.text(width / 2, height * 0.7, `ENEMY HP: ${this.enemy.health}`, { 
            fontSize: '24px', 
            fontFamily: UI_FONT_FAMILY,
            fill: '#ff0000' 
        }).setOrigin(0.5);

        this.playerHpText = this.add.text(width / 2, height * 0.75, `PLAYER HP: ${this.player.health}`, {
            fontSize: '24px',
            fontFamily: UI_FONT_FAMILY,
            fill: '#00ff66'
        }).setOrigin(0.5);

        // 3. Gameplay module: Sniper (aim/hold/fire/drag is fully owned here)
        this.sniper = new Sniper(this, {
            enemySprite: this.enemySprite,
            statusText: this.statusText,
            combatText: this.combatText,
            canAct: () => !this.isGameOver,
            onHit: ({ damage }) => {
                this.enemy.takeDamage(damage);
                this.enemyHpText.setText(`ENEMY HP: ${this.enemy.health}`);
                if (this.enemy.isDead) this.winGame();
            }
        });

        this.events.once('shutdown', () => {
            this.sniper?.destroy();
            this.enemy?.destroy?.();
        });
    }

    update(time, delta) {
        if (!this.isGameOver) this.enemy.update(delta);
        this.sniper?.update(delta);
    }

    enemyAttack() {
        if (this.isGameOver) return;

        const pointerDown = !!this.input?.activePointer?.isDown;
        if (pointerDown) {
            this.player.takeDamage(10);
            this.playerHpText.setText(`PLAYER HP: ${this.player.health}`);
            this.combatText.setText('HIT! (You were holding when it swung)');
            this.cameras.main.flash(120, 120, 0, 0);
            this.cameras.main.shake(120, 0.01);
            if (navigator.vibrate) navigator.vibrate(60);

            if (this.player.isDead) {
                this.loseGame();
            }
        } else {
            this.combatText.setText('DODGED! (Not holding when it swung)');
        }
    }

    loseGame() {
        this.isGameOver = true;
        this.statusText.setText("DEFEATED");
        this.combatText.setText('');
        this.enemy.setSwingBarVisible(false);
        this.add.text(this.scale.width/2, this.scale.height/2, "GAME OVER", {
            fontSize: '64px',
            fontFamily: UI_FONT_FAMILY,
            fill: '#ff4444'
        }).setOrigin(0.5);
    }

    winGame() {
        this.isGameOver = true;
        this.statusText.setText("TARGET ELIMINATED");
        this.combatText.setText('');
        this.enemySprite.setAlpha(0.5);
        this.enemy.setSwingBarVisible(false);
        this.add.text(this.scale.width/2, this.scale.height/2, "VICTORY", {
            fontSize: '64px',
            fontFamily: UI_FONT_FAMILY,
            fill: '#fff'
        }).setOrigin(0.5);
    }
}

export default FightScene;