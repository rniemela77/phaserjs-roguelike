import MainScene from './scenes/MainScene.js';
import RhythmGameScene from './scenes/RhythmGameScene.js';
import FightScene from './scenes/FightScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a1a',
    scene: [FightScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game',
        // full screen
        width: window.innerWidth,
        height: window.innerHeight,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
}; 

export default config; 