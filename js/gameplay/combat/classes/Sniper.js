export default class Sniper {
    constructor(scene, {
        enemySprite,
        statusText,
        combatText,
        canAct = () => true,
        onHit = () => {},
        onMiss = () => {},
        // Tuning
        aimScaleStart = 3.0,
        aimScaleFail = 0.2,
        aimFadeInMs = 3000,
        sweetSpotTolerancePx = 10,
        aimPositionTolerancePx = 28,
        aimPullStrength = 1,
        aimDriftSpeedPxPerSec = 55,
        aimDriftMaxOffsetPx = 550,
        aimRampDurationMs = 1000,
        aimShrinkRateStart = 0.05,
        aimShrinkRateEnd = 4
    } = {}) {
        this.scene = scene;
        this.enemySprite = enemySprite;
        this.statusText = statusText;
        this.combatText = combatText;

        this.canAct = canAct;
        this.onHit = onHit;
        this.onMiss = onMiss;

        this.isAiming = false;
        this.aimScale = aimScaleStart;

        this.aimScaleStart = aimScaleStart;
        this.aimScaleFail = aimScaleFail;
        this.aimFadeInMs = aimFadeInMs;

        this.sweetSpotTolerancePx = sweetSpotTolerancePx;
        this.aimPositionTolerancePx = aimPositionTolerancePx;
        this.aimPullStrength = aimPullStrength;

        this.aimDriftOffsetX = 0;
        this.aimDriftOffsetY = 0;
        this.aimUserOffsetX = 0;
        this.aimUserOffsetY = 0;
        this.lastPointerX = 0;
        this.lastPointerY = 0;
        this.aimDriftDirX = 1;
        this.aimDriftDirY = 0;
        this.aimDriftSpeedPxPerSec = aimDriftSpeedPxPerSec;
        this.aimDriftMaxOffsetPx = aimDriftMaxOffsetPx;

        this.aimHoldElapsedMs = 0;
        this.aimRampDurationMs = aimRampDurationMs;
        this.aimShrinkRateStart = aimShrinkRateStart;
        this.aimShrinkRateEnd = aimShrinkRateEnd;

        this.aimFadeTween = null;

        // Visuals owned by Sniper (not FightScene)
        const { width, height } = scene.scale;
        this.aimCircle = scene.add.circle(width / 2, height * 0.4, 50);
        this.aimCircle.setStrokeStyle(4, 0xffffff);
        this.aimCircle.setVisible(false);

        this.targetRing = scene.add.circle(width / 2, height * 0.4, 50);
        this.targetRing.setStrokeStyle(2, 0x00ff00, 0.5);
        this.targetRing.setVisible(false);

        // Input listeners owned by Sniper
        this._onPointerDown = (pointer) => this.startAiming(pointer);
        this._onPointerUp = (pointer) => this.fireShot(pointer);
        this._onPointerMove = (pointer) => this.onPointerMove(pointer);

        scene.input.on('pointerdown', this._onPointerDown);
        scene.input.on('pointerup', this._onPointerUp);
        scene.input.on('pointermove', this._onPointerMove);
    }

    destroy() {
        // Defensive (scene might already be shutting down)
        if (this.scene?.input) {
            this.scene.input.off('pointerdown', this._onPointerDown);
            this.scene.input.off('pointerup', this._onPointerUp);
            this.scene.input.off('pointermove', this._onPointerMove);
        }
        if (this.aimFadeTween) this.aimFadeTween.stop();
        this.aimCircle?.destroy();
        this.targetRing?.destroy();
    }

    onPointerMove(pointer) {
        if (!this.isAiming || !this.canAct()) return;

        const dx = pointer.worldX - this.lastPointerX;
        const dy = pointer.worldY - this.lastPointerY;
        this.lastPointerX = pointer.worldX;
        this.lastPointerY = pointer.worldY;

        // Dragging applies a counter-offset. Player "pulls back" against drift.
        this.aimUserOffsetX += dx * this.aimPullStrength;
        this.aimUserOffsetY += dy * this.aimPullStrength;

        // Cap total offset (drift + user) so it stays controllable.
        const totalX = this.aimDriftOffsetX + this.aimUserOffsetX;
        const totalY = this.aimDriftOffsetY + this.aimUserOffsetY;
        const totalLen = Math.hypot(totalX, totalY);
        if (totalLen > this.aimDriftMaxOffsetPx) {
            const s = this.aimDriftMaxOffsetPx / totalLen;
            // Keep drift as-is, scale user contribution to fit within cap.
            this.aimUserOffsetX = (totalX * s) - this.aimDriftOffsetX;
            this.aimUserOffsetY = (totalY * s) - this.aimDriftOffsetY;
        }
    }

    update(delta) {
        if (!this.isAiming || !this.canAct()) return;

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
        const distToEnemyPx = Phaser.Math.Distance.Between(
            this.aimCircle.x,
            this.aimCircle.y,
            this.enemySprite.x,
            this.enemySprite.y
        );
        const onTarget = distToEnemyPx <= this.aimPositionTolerancePx;

        if (inSweetSpot && onTarget) {
            this.aimCircle.setStrokeStyle(16, 0x00ff00); // Green for "Ready"
        } else {
            this.aimCircle.setStrokeStyle(2, 0xffffff);
        }

        // Drift the aim circle away so the player must "pull against" it with pointer drag
        const dt = delta / 1000;
        this.aimDriftOffsetX += this.aimDriftDirX * this.aimDriftSpeedPxPerSec * dt;
        this.aimDriftOffsetY += this.aimDriftDirY * this.aimDriftSpeedPxPerSec * dt;

        // Cap total offset (drift + user)
        const totalX = this.aimDriftOffsetX + this.aimUserOffsetX;
        const totalY = this.aimDriftOffsetY + this.aimUserOffsetY;
        const totalLen = Math.hypot(totalX, totalY);
        if (totalLen > this.aimDriftMaxOffsetPx) {
            const s = this.aimDriftMaxOffsetPx / totalLen;
            this.aimDriftOffsetX = totalX * s;
            this.aimDriftOffsetY = totalY * s;
            this.aimUserOffsetX = 0;
            this.aimUserOffsetY = 0;
        }

        // Reticle is anchored to the enemy; drift pushes it off, dragging pulls it back.
        this.aimCircle.setPosition(
            this.enemySprite.x + this.aimDriftOffsetX + this.aimUserOffsetX,
            this.enemySprite.y + this.aimDriftOffsetY + this.aimUserOffsetY
        );

        // Failure condition: Held too long
        if (this.aimScale < this.aimScaleFail) {
            this.missShot('TOO LATE!');
        }
    }

    startAiming(pointer) {
        if (!this.canAct()) return;
        this.isAiming = true;
        this.aimScale = this.aimScaleStart;
        this.aimHoldElapsedMs = 0;

        // Track pointer deltas only (pointer never directly sets reticle position)
        this.lastPointerX = pointer?.worldX ?? this.enemySprite.x;
        this.lastPointerY = pointer?.worldY ?? this.enemySprite.y;

        // Initialize drift direction (randomized per aim attempt)
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.aimDriftDirX = Math.cos(angle);
        this.aimDriftDirY = Math.sin(angle);
        this.aimDriftOffsetX = 0;
        this.aimDriftOffsetY = 0;
        this.aimUserOffsetX = 0;
        this.aimUserOffsetY = 0;

        // Reset/fade in the aim circle
        if (this.aimFadeTween) this.aimFadeTween.stop();
        this.aimCircle.setAlpha(0);
        this.aimCircle.setVisible(true);
        this.targetRing.setVisible(true);

        // Target ring stays fixed on the enemy (what you're trying to pull toward)
        this.targetRing.setPosition(this.enemySprite.x, this.enemySprite.y);
        // Reticle starts centered on the enemy
        this.aimCircle.setPosition(this.enemySprite.x, this.enemySprite.y);

        this.statusText?.setText('FOCUS...');
        this.combatText?.setText('');

        this.aimFadeTween = this.scene.tweens.add({
            targets: this.aimCircle,
            alpha: 1,
            duration: this.aimFadeInMs,
            ease: 'Sine.easeOut'
        });
    }

    fireShot() {
        if (!this.isAiming || !this.canAct()) return;
        this.isAiming = false;

        if (this.aimFadeTween) this.aimFadeTween.stop();

        // Check if the aim circle matched the static ring at release time
        const aimRadiusPx = this.aimCircle.radius * this.aimCircle.scaleX;
        const targetRadiusPx = this.targetRing.radius * this.targetRing.scaleX;
        const inSweetSpot = Math.abs(aimRadiusPx - targetRadiusPx) <= this.sweetSpotTolerancePx;
        const distToEnemyPx = Phaser.Math.Distance.Between(
            this.aimCircle.x,
            this.aimCircle.y,
            this.enemySprite.x,
            this.enemySprite.y
        );
        const onTarget = distToEnemyPx <= this.aimPositionTolerancePx;

        if (inSweetSpot && onTarget) {
            this.directHit();
        } else {
            if (inSweetSpot && !onTarget) {
                this.missShot('OFF TARGET!');
            } else {
                this.missShot('MISSED!');
            }
        }

        this.aimCircle.setVisible(false);
        this.aimCircle.setAlpha(1);
        this.targetRing.setVisible(false);
    }

    directHit() {
        this.statusText?.setText('DIRECT HIT!');
        this.combatText?.setText('');

        if (navigator.vibrate) navigator.vibrate(50);

        // Juice: Screen Shake & Enemy Tint
        this.scene.cameras.main.shake(200, 0.02);
        this.enemySprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => this.enemySprite.clearTint());

        this.onHit({ damage: 25 });
    }

    missShot(reason) {
        this.isAiming = false;
        if (this.aimFadeTween) this.aimFadeTween.stop();

        this.statusText?.setText(reason);
        this.combatText?.setText('');
        this.scene.cameras.main.flash(200, 50, 0, 0);

        // A "Double-Thud" (100ms on, 50ms off, 100ms on) signals a mistake.
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        this.onMiss({ reason });
    }
}


