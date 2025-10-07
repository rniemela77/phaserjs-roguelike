import Unit from './Unit.js';

export default class Healer extends Unit {
    constructor(scene, x, y, team) {
        super(scene, x, y, team, 'healer');
        this.healPower = 25;
        this.maxHealth = 80;
        this.health = this.maxHealth;
        this.cooldownTime = 3000; // 3 seconds
    }
    
    createVisual() {
        // Green circle for healer
        this.visual = this.scene.add.circle(this.x, this.y, 20, 0x00ff00);
        this.visual.setStrokeStyle(2, 0xffffff);
    }
    
    performAction() {
        if (!this.isAlive) return;
        
        // Find the most damaged ally
        const allies = this.scene.getAllyUnits(this.team);
        const damagedAllies = allies.filter(ally => ally.isAlive && ally.health < ally.maxHealth);
        
        if (damagedAllies.length > 0) {
            const target = this.findMostDamagedAlly(damagedAllies);
            if (target) {
                this.healTarget(target);
            }
        } else {
            // If no allies need healing, attack enemies instead
            const enemies = this.scene.getEnemyUnits(this.team);
            if (enemies.length > 0) {
                const target = this.findClosestEnemy(enemies);
                if (target && target.isAlive) {
                    this.attack(target);
                }
            }
        }
        
        this.startCooldown();
    }
    
    findMostDamagedAlly(allies) {
        let mostDamaged = null;
        let lowestHealthPercent = 1;
        
        allies.forEach(ally => {
            const healthPercent = ally.health / ally.maxHealth;
            if (healthPercent < lowestHealthPercent) {
                lowestHealthPercent = healthPercent;
                mostDamaged = ally;
            }
        });
        
        return mostDamaged;
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
    
    healTarget(target) {
        const healAmount = Math.min(this.healPower, target.maxHealth - target.health);
        target.heal(healAmount);
        
        // Visual feedback for healing
        this.scene.tweens.add({
            targets: this.visual,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 150,
            yoyo: true,
            ease: 'Power2'
        });
        
        // Show heal number
        this.scene.showDamageNumber(target.x, target.y - 20, healAmount, 0x00ff00);
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
