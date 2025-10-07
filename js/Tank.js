import Unit from './Unit.js';

export default class Tank extends Unit {
    constructor(scene, x, y, team) {
        super(scene, x, y, team, 'tank');
        this.attackPower = 30;
        this.maxHealth = 150;
        this.health = this.maxHealth;
        this.cooldownTime = 2500; // 2.5 seconds
    }
    
    createVisual() {
        // Blue square for tank
        this.visual = this.scene.add.rectangle(this.x, this.y, 40, 40, 0x0066ff);
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
    }
}
