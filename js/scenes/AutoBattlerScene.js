import Tank from '../Tank.js';
import Healer from '../Healer.js';
import Chiller from '../Chiller.js';
import Torch from '../Torch.js';

export default class AutoBattlerScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AutoBattlerScene' });
        this.playerUnits = [];
        this.enemyUnits = [];
        this.battleActive = true;
    }
    
    create() {
        // Set up the battlefield
        this.createBattlefield();
        
        // Create player team (2 units)
        this.createPlayerTeam();
        
        // Create enemy team (3 units)
        this.createEnemyTeam();
        
        // Add UI
        this.createUI();
        
        // Start the battle
        this.startBattle();
    }
    
    createBattlefield() {
        // Draw battlefield lines
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xffffff, 0.5);
        
        // Vertical center line
        graphics.lineBetween(400, 0, 400, 600);
        
        // Player side background
        graphics.fillStyle(0x001122, 0.3);
        graphics.fillRect(0, 0, 400, 600);
        
        // Enemy side background
        graphics.fillStyle(0x220011, 0.3);
        graphics.fillRect(400, 0, 400, 600);
        
        // Add labels
        this.add.text(200, 30, 'PLAYER TEAM', { 
            fontSize: '24px', 
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(600, 30, 'ENEMY TEAM', { 
            fontSize: '24px', 
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }
    
    createPlayerTeam() {
        // Tank at position 1
        const tank = new Tank(this, 200, 120, 'player');
        this.playerUnits.push(tank);
        
        // Healer at position 2
        const healer = new Healer(this, 200, 240, 'player');
        this.playerUnits.push(healer);
        
        // Chiller at position 3
        const chiller = new Chiller(this, 200, 360, 'player');
        this.playerUnits.push(chiller);
        
        // Torch at position 4
        const torch = new Torch(this, 200, 480, 'player');
        this.playerUnits.push(torch);
    }
    
    createEnemyTeam() {
        // Tank at position 1
        const tank = new Tank(this, 600, 150, 'enemy');
        this.enemyUnits.push(tank);
        
        // Tank at position 2
        const tank2 = new Tank(this, 600, 300, 'enemy');
        this.enemyUnits.push(tank2);
    }
    
    createUI() {
        // Battle status text
        this.battleStatusText = this.add.text(400, 550, 'BATTLE IN PROGRESS...', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }
    
    startBattle() {
        // Start cooldowns for all units
        [...this.playerUnits, ...this.enemyUnits].forEach(unit => {
            unit.startCooldown();
        });
    }
    
    update(time, delta) {
        if (!this.battleActive) return;
        
        // Update all units
        [...this.playerUnits, ...this.enemyUnits].forEach(unit => {
            unit.update(delta);
        });
        
        // Check for battle end conditions
        this.checkBattleEnd();
    }
    
    getEnemyUnits(team) {
        return team === 'player' ? this.enemyUnits : this.playerUnits;
    }
    
    getAllyUnits(team) {
        return team === 'player' ? this.playerUnits : this.enemyUnits;
    }
    
    showDamageNumber(x, y, amount, color) {
        const damageText = this.add.text(x, y, amount.toString(), {
            fontSize: '16px',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Animate the damage number
        this.tweens.add({
            targets: damageText,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }
    
    showChillEffect(x, y) {
        // Create a cyan particle effect for chill
        const chillEffect = this.add.circle(x, y, 30, 0x00ffff, 0.3);
        
        this.tweens.add({
            targets: chillEffect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                chillEffect.destroy();
            }
        });
    }
    
    showBurnEffect(x, y) {
        // Create an orange particle effect for burn
        const burnEffect = this.add.circle(x, y, 25, 0xff6600, 0.4);
        
        this.tweens.add({
            targets: burnEffect,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                burnEffect.destroy();
            }
        });
    }
    
    checkBattleEnd() {
        const playerAlive = this.playerUnits.some(unit => unit.isAlive);
        const enemyAlive = this.enemyUnits.some(unit => unit.isAlive);
        
        if (!playerAlive) {
            this.endBattle('ENEMY WINS!');
        } else if (!enemyAlive) {
            this.endBattle('PLAYER WINS!');
        }
    }
    
    endBattle(result) {
        this.battleActive = false;
        this.battleStatusText.setText(result);
        this.battleStatusText.setColor('#ffff00');
        
        // Stop all unit cooldowns
        [...this.playerUnits, ...this.enemyUnits].forEach(unit => {
            unit.currentCooldown = 0;
        });
    }
}
