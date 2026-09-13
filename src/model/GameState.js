import { Player } from './Player.js';

export class GameState {
  constructor() {
    this.player = new Player();
    this.enemies = [];
    this.projectiles = [];
    this.firePools = [];
    this.score = 0;
    this.wave = 0;
    this.brightness = 0.6;
    this.status = 'menu';
    this.nextEnemyId = 1;
  }

  reset() {
    this.player = new Player();
    this.enemies.length = 0;
    this.projectiles.length = 0;
    this.firePools.length = 0;
    this.score = 0;
    this.wave = 0;
    this.nextEnemyId = 1;
  }
}
