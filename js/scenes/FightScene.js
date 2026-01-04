class FightScene extends Phaser.Scene {
    constructor() {
        super('MyGame');
        this.isAiming = false;
        this.aimScale = 3.0; // Start large
        this.minScale = 0.5; // The "Perfect" size
        this.enemyHealth = 100;
        this.isGameOver = false;
        // Aim-speed ramp (slow -> fast) while holding to aim
        this.aimHoldElapsedMs = 0;
        this.aimRampDurationMs = 500; // how quickly it ramps from slow to fast
        this.aimShrinkRateStart = 0.05; // scale units per second (slow)
        this.aimShrinkRateEnd = 5; // scale units per second (fast)
        // Sweet spot is when aim circle radius matches the static ring (in pixels)
        this.sweetSpotTolerancePx = 7;
        // Aim circle visual: fade in from 0 -> 1 when aiming starts
        this.aimFadeInMs = 3000;
        this.aimFadeTween = null;
    }

    preload() {
        // Placeholder for the enemy PNG
        this.load.image('enemy', 'https://labs.phaser.io/assets/sprites/beholder.png');
    }

    create() {
        const { width, height } = this.scale;

        // 1. Setup Enemy
        this.enemy = this.add.image(width / 2, height * 0.4, 'enemy').setInteractive();
        this.enemy.setScale(0.8);

        // 2. Setup UI Elements
        this.statusText = this.add.text(width / 2, height * 0.1, 'HOLD TO AIM', { 
            fontSize: '32px', 
            fill: '#fff' 
        }).setOrigin(0.5);

        this.hpText = this.add.text(width / 2, height * 0.7, `HP: ${this.enemyHealth}`, { 
            fontSize: '24px', 
            fill: '#ff0000' 
        }).setOrigin(0.5);

        // 3. The Aiming Circle (The core mechanic UI)
        this.aimCircle = this.add.circle(width / 2, height * 0.4, 50);
        this.aimCircle.setStrokeStyle(4, 0xffffff);
        this.aimCircle.setVisible(false);

        // The "Sweet Spot" Indicator (A static faint ring)
        this.targetRing = this.add.circle(width / 2, height * 0.4, 50);
        this.targetRing.setStrokeStyle(2, 0x00ff00, 0.5);
        this.targetRing.setVisible(false);

        // 4. Touch Listeners
        this.input.on('pointerdown', () => this.startAiming());
        this.input.on('pointerup', () => this.fireShot());
    }

    update(time, delta) {
        if (this.isAiming && !this.isGameOver) {
            // Shrink the circle over time (slow -> fast ramp, frame-rate independent)
            this.aimHoldElapsedMs += delta;
            const t = Phaser.Math.Clamp(this.aimHoldElapsedMs / this.aimRampDurationMs, 0, 1);
            const eased = t * t; // ease-in ramp
            const shrinkPerSecond = Phaser.Math.Linear(this.aimShrinkRateStart, this.aimShrinkRateEnd, eased);
            this.aimScale -= shrinkPerSecond * (delta / 1000);
            this.aimCircle.setScale(this.aimScale);

            // Change color if in the "Sweet Spot"
            const aimRadiusPx = this.aimCircle.radius * this.aimCircle.scaleX;
            const targetRadiusPx = this.targetRing.radius * this.targetRing.scaleX;
            const inSweetSpot = Math.abs(aimRadiusPx - targetRadiusPx) <= this.sweetSpotTolerancePx;
            if (inSweetSpot) {
                this.aimCircle.setStrokeStyle(6, 0x00ff00); // Green for "Ready"            
            } else {
                this.aimCircle.setStrokeStyle(4, 0xffffff);
            }

            // Failure condition: Held too long
            if (this.aimScale < 0.2) {
                this.missShot("TOO LATE!");
            }
        }
    }

    startAiming() {
        if (this.isGameOver) return;
        this.isAiming = true;
        this.aimScale = 3.0;
        this.aimHoldElapsedMs = 0;

        // Reset/fade in the aim circle
        if (this.aimFadeTween) this.aimFadeTween.stop();
        this.aimCircle.setAlpha(0);
        this.aimCircle.setVisible(true);
        this.targetRing.setVisible(true);
        this.statusText.setText("FOCUS...");

        this.aimFadeTween = this.tweens.add({
            targets: this.aimCircle,
            alpha: 1,
            duration: this.aimFadeInMs,
            ease: 'Sine.easeOut'
        });
    }

    fireShot() {
        if (!this.isAiming || this.isGameOver) return;
        this.isAiming = false;

        if (this.aimFadeTween) this.aimFadeTween.stop();

        // Check if the aim circle matched the static ring at release time
        const aimRadiusPx = this.aimCircle.radius * this.aimCircle.scaleX;
        const targetRadiusPx = this.targetRing.radius * this.targetRing.scaleX;
        const inSweetSpot = Math.abs(aimRadiusPx - targetRadiusPx) <= this.sweetSpotTolerancePx;
        if (inSweetSpot) {
            this.hitEnemy();
        } else {
            this.missShot("MISSED!");
        }

        this.aimCircle.setVisible(false);
        this.aimCircle.setAlpha(1);
        this.targetRing.setVisible(false);
    }

    hitEnemy() {
        this.enemyHealth -= 25;
        this.hpText.setText(`HP: ${this.enemyHealth}`);

        // 2. ADD: Heavy Impact Vibration
        // A single, strong 100ms vibration feels like a solid thud.
        if (navigator.vibrate) navigator.vibrate(100);
        
        // Juice: Screen Shake & Enemy Tint
        this.cameras.main.shake(200, 0.02);
        this.enemy.setTint(0xff0000);
        this.statusText.setText("DIRECT HIT!");

        this.time.delayedCall(200, () => this.enemy.clearTint());

        if (this.enemyHealth <= 0) {
            this.winGame();
        }
    }

    missShot(reason) {
        this.isAiming = false;
        if (this.aimFadeTween) this.aimFadeTween.stop();
        this.statusText.setText(reason);
        this.cameras.main.flash(500, 100, 0, 0); // Red flash for failure

        // 3. ADD: Failure Vibration
        // A "Double-Thud" (50ms on, 50ms off, 50ms on) signals a mistake.
        if (navigator.vibrate) navigator.vibrate([30, 70, 30]);
    }

    winGame() {
        this.isGameOver = true;
        this.statusText.setText("TARGET ELIMINATED");
        this.enemy.setAlpha(0.5);
        this.add.text(this.scale.width/2, this.scale.height/2, "VICTORY", { fontSize: '64px' }).setOrigin(0.5);
    }
}

export default FightScene;