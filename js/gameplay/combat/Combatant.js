export default class Combatant {
    constructor({ maxHealth }) {
        this.maxHealth = maxHealth;
        this.health = maxHealth;
    }

    get isDead() {
        return this.health <= 0;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + Math.max(0, amount));
        return this.health;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - Math.max(0, amount));
        return this.health;
    }
}


