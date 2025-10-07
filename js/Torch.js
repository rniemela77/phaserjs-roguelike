import Unit from './Unit.js';

export default class Torch extends Unit {
    constructor(scene, x, y, team) {
        super(scene, x, y, team, 'torch');
        this.attackPower = 12; // Low damage
        this.maxHealth = 60;
        this.health = this.maxHealth;
        this.cooldownTime = 1800; // 1.8 seconds
        this.burnDebuffDuration = 2000; // 2 seconds
    }
    
    createVisual() {
        // Orange triangle for torch
        this.visual = this.scene.add.triangle(this.x, this.y, 0, -20, -15, 15, 15, 15, 0xff6600);
        this.visual.setStrokeStyle(2, 0xffffff);
    }
    
    performAction() {
        if (!this.isAlive) return;
        
        // Find the closest enemy unit
        const enemies = this.scene.getEnemyUnits(this.team);
        if (enemies.length > 0) {
            const target = this.findClosestEnemy(enemies);
            if (target && target.isAlive) {
                this.attack(target);
            }
        }
        
        this.startCooldown();
    }
    
    findClosestEnemy(enemies) {
        let closest = null;
        let closestDistance = Infinity;
        
        enemies.forEach(enemy => {
            if (enemy.isAlive) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closest = enemy;
                }
            }
        });
        
        return closest;
    }
    
    attack(target) {
        target.takeDamage(this.attackPower);
        
        // Apply burn debuff
        target.applyBurnDebuff(this.burnDebuffDuration);
        
        // Visual feedback for attack
        this.scene.tweens.add({
            targets: this.visual,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
        
        // Show damage number
        this.scene.showDamageNumber(target.x, target.y, this.attackPower, 0xff0000);
        
        // Show burn effect
        this.scene.showBurnEffect(target.x, target.y);
    }
}
