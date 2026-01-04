import Combatant from './Combatant.js';

export default class Player extends Combatant {
    constructor({ maxHealth = 100 } = {}) {
        super({ maxHealth });
    }
}


