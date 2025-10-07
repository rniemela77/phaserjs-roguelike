export default class Unit {
    constructor(scene, x, y, team, unitType) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.team = team; // 'player' or 'enemy'
        this.unitType = unitType;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.attackPower = 20;
        this.cooldownTime = 2000; // 2 seconds
        this.currentCooldown = 0;
        this.isAlive = true;
        this.chillDebuffTime = 0;
        this.chillMultiplier = 1.0; // 1.0 = normal speed, 0.8 = 20% slower
        this.chillDebuffDuration = 3000; // 3 seconds
        this.burnDebuffTime = 0;
        this.burnDebuffDuration = 2000; // 2 seconds
        this.burnTickTime = 0;
        this.burnTickInterval = 300; // 0.3 seconds
        
        // Create visual representation
        this.createVisual();
        this.createHealthBar();
        this.createCooldownBar();
        this.createChillDebuffIndicator();
        this.createBurnDebuffIndicator();
    }
    
    createVisual() {
        // This will be overridden by subclasses
    }
    
    createHealthBar() {
        this.healthBarBg = this.scene.add.rectangle(this.x, this.y - 40, 60, 8, 0x333333);
        this.healthBar = this.scene.add.rectangle(this.x, this.y - 40, 60, 8, 0xff0000);
        this.healthBar.setOrigin(0, 0.5);
        this.healthBarBg.setOrigin(0, 0.5);
        this.healthBarBg.x = this.x - 30;
        this.healthBar.x = this.x - 30;
    }
    
    createCooldownBar() {
        this.cooldownBarBg = this.scene.add.rectangle(this.x, this.y - 50, 60, 6, 0x333333);
        this.cooldownBar = this.scene.add.rectangle(this.x, this.y - 50, 60, 6, 0xffffff);
        this.cooldownBar.setOrigin(0, 0.5);
        this.cooldownBarBg.setOrigin(0, 0.5);
        this.cooldownBarBg.x = this.x - 30;
        this.cooldownBar.x = this.x - 30;
    }
    
    createChillDebuffIndicator() {
        // Cyan square under the unit
        this.chillSquare = this.scene.add.rectangle(this.x, this.y + 30, 20, 20, 0x00ffff);
        this.chillSquare.setAlpha(0); // Initially hidden
        
        // Counter-clockwise cooldown indicator (like WoW)
        this.chillCooldownMask = this.scene.add.graphics();
        this.chillCooldownMask.setPosition(this.x, this.y + 30);
        this.chillCooldownMask.setAlpha(0); // Initially hidden
    }
    
    createBurnDebuffIndicator() {
        // Orange square under the unit
        this.burnSquare = this.scene.add.rectangle(this.x, this.y + 50, 20, 20, 0xff6600);
        this.burnSquare.setAlpha(0); // Initially hidden
        
        // Counter-clockwise cooldown indicator for burn
        this.burnCooldownMask = this.scene.add.graphics();
        this.burnCooldownMask.setPosition(this.x, this.y + 50);
        this.burnCooldownMask.setAlpha(0); // Initially hidden
    }
    
    update(delta) {
        if (!this.isAlive) return;
        
        // Update chill debuff
        if (this.chillDebuffTime > 0) {
            this.chillDebuffTime -= delta;
            this.updateChillDebuffVisual();
            if (this.chillDebuffTime <= 0) {
                this.chillDebuffTime = 0;
                this.chillMultiplier = 1.0;
                this.hideChillDebuffVisual();
            }
        }
        
        // Update burn debuff
        if (this.burnDebuffTime > 0) {
            this.burnDebuffTime -= delta;
            this.burnTickTime -= delta;
            this.updateBurnDebuffVisual();
            
            // Apply burn damage every 0.3 seconds
            if (this.burnTickTime <= 0) {
                this.burnTickTime = this.burnTickInterval;
                this.takeDamage(1);
                this.scene.showDamageNumber(this.x, this.y, 1, 0xff6600);
            }
            
            if (this.burnDebuffTime <= 0) {
                this.burnDebuffTime = 0;
                this.hideBurnDebuffVisual();
            }
        }
        
        // Update cooldown
        if (this.currentCooldown > 0) {
            // Apply chill debuff to cooldown speed
            const effectiveDelta = delta * this.chillMultiplier;
            this.currentCooldown -= effectiveDelta;
            this.updateCooldownBar();
            
            if (this.currentCooldown <= 0) {
                this.currentCooldown = 0;
                this.performAction();
            }
        }
    }
    
    updateCooldownBar() {
        const cooldownPercent = this.currentCooldown / this.cooldownTime;
        this.cooldownBar.width = 60 * cooldownPercent;
    }
    
    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.width = 60 * healthPercent;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        this.health = Math.max(0, this.health);
        this.updateHealthBar();
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    heal(amount) {
        this.health += amount;
        this.health = Math.min(this.maxHealth, this.health);
        this.updateHealthBar();
    }
    
    die() {
        this.isAlive = false;
        this.visual.setAlpha(0.3);
        this.healthBar.setAlpha(0.3);
        this.cooldownBar.setAlpha(0.3);
    }
    
    performAction() {
        // This will be overridden by subclasses
    }
    
    startCooldown() {
        this.currentCooldown = this.cooldownTime;
    }
    
    applyChillDebuff(duration) {
        this.chillDebuffTime = duration;
        this.chillMultiplier = 0.8; // 20% slower cooldown
        this.showChillDebuffVisual();
    }
    
    showChillDebuffVisual() {
        this.chillSquare.setAlpha(1);
        this.chillCooldownMask.setAlpha(1);
    }
    
    hideChillDebuffVisual() {
        this.chillSquare.setAlpha(0);
        this.chillCooldownMask.setAlpha(0);
    }
    
    updateChillDebuffVisual() {
        if (this.chillDebuffTime <= 0) return;
        
        // Calculate the remaining time as a percentage
        const remainingPercent = this.chillDebuffTime / this.chillDebuffDuration;
        
        // Clear the previous mask
        this.chillCooldownMask.clear();
        
        // Draw the counter-clockwise cooldown indicator
        this.chillCooldownMask.fillStyle(0x000000, 0.7);
        this.chillCooldownMask.beginPath();
        this.chillCooldownMask.arc(0, 0, 12, 0, Math.PI * 2 * remainingPercent, false);
        this.chillCooldownMask.lineTo(0, 0);
        this.chillCooldownMask.closePath();
        this.chillCooldownMask.fill();
    }
    
    applyBurnDebuff(duration) {
        this.burnDebuffTime = duration;
        this.burnTickTime = this.burnTickInterval; // Start ticking immediately
        this.showBurnDebuffVisual();
    }
    
    showBurnDebuffVisual() {
        this.burnSquare.setAlpha(1);
        this.burnCooldownMask.setAlpha(1);
    }
    
    hideBurnDebuffVisual() {
        this.burnSquare.setAlpha(0);
        this.burnCooldownMask.setAlpha(0);
    }
    
    updateBurnDebuffVisual() {
        if (this.burnDebuffTime <= 0) return;
        
        // Calculate the remaining time as a percentage
        const remainingPercent = this.burnDebuffTime / this.burnDebuffDuration;
        
        // Clear the previous mask
        this.burnCooldownMask.clear();
        
        // Draw the counter-clockwise cooldown indicator
        this.burnCooldownMask.fillStyle(0x000000, 0.7);
        this.burnCooldownMask.beginPath();
        this.burnCooldownMask.arc(0, 0, 12, 0, Math.PI * 2 * remainingPercent, false);
        this.burnCooldownMask.lineTo(0, 0);
        this.burnCooldownMask.closePath();
        this.burnCooldownMask.fill();
    }
    
    destroy() {
        this.visual.destroy();
        this.healthBar.destroy();
        this.healthBarBg.destroy();
        this.cooldownBar.destroy();
        this.cooldownBarBg.destroy();
        this.chillSquare.destroy();
        this.chillCooldownMask.destroy();
        this.burnSquare.destroy();
        this.burnCooldownMask.destroy();
    }
}
