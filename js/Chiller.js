import Unit from './Unit.js';

export default class Chiller extends Unit {
    constructor(scene, x, y, team) {
        super(scene, x, y, team, 'chiller');
        this.attackPower = 15; // Low damage
        this.maxHealth = 70;
        this.health = this.maxHealth;
        this.cooldownTime = 2000; // 2 seconds
        this.chillDebuffDuration = 3000; // 3 seconds
    }
    
    createVisual() {
        // Cyan triangle for chiller
        this.visual = this.scene.add.triangle(this.x, this.y, 0, -20, -15, 15, 15, 15, 0x00ffff);
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
        
        // Apply chill debuff
        target.applyChillDebuff(this.chillDebuffDuration);
        
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
        
        // Show chill effect
        this.scene.showChillEffect(target.x, target.y);
    }
}
