import MainScene from './scenes/MainScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a1a',
    scene: MainScene,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game',
        width: 800,
        height: 600,
        min: {
            width: 320,
            height: 240
        },  
    }
}; 

export default config; 