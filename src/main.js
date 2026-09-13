import { Engine } from './core/Engine.js';
import { EventBus } from './core/EventBus.js';
import { GameState } from './model/GameState.js';
import { SubwayStation } from './view/SubwayStation.js';
import { Walls } from './view/Walls.js';
import { Lighting } from './view/Lighting.js';
import { PlayerRig } from './view/PlayerRig.js';
import { ProjectileView } from './view/ProjectileView.js';
import { EnemyView } from './view/EnemyView.js';
import { EffectsView } from './view/EffectsView.js';
import { HUD } from './view/HUD.js';
import { PlayerController } from './controller/PlayerController.js';
import { WeaponController } from './controller/WeaponController.js';
import { EnemyController } from './controller/EnemyController.js';
import { UIController } from './controller/UIController.js';
import { AudioManager } from './audio/AudioManager.js';
import { SFX } from './audio/SFX.js';

const bus = new EventBus();
const state = new GameState();

const engine = new Engine(document.getElementById('c'));
const station = new SubwayStation(engine.scene);
const walls = new Walls(engine.scene, station.collidables);
const lighting = new Lighting(engine.scene, engine.renderer);
lighting.setBrightness(state.brightness);
const rig = new PlayerRig(engine.camera, engine.scene);
const projectiles = new ProjectileView(engine.scene);
const enemyViews = new EnemyView(engine.scene);
const effects = new EffectsView(engine.scene);
const hud = new HUD();

const audio = new AudioManager();
const sfx = new SFX(audio);

const playerCtrl = new PlayerController(engine, state, station.collidables, bus);
const weaponCtrl = new WeaponController(engine, state, bus, rig, station.collidables);
const enemyCtrl = new EnemyController(state, bus, station.collidables);
const uiCtrl = new UIController(state, bus, audio, engine.renderer.domElement);

bus.on('shot', () => {
  const kind = state.player.weapon.def.kind;
  if (kind === 'mg') {
    rig.flashNow();
    sfx.mgFire();
  } else {
    sfx.shot();
    rig.flashNow();
    if (kind !== 'rocket') rig.ejectShell(engine.camera);
  }
});
bus.on('tracer', (d) => effects.tracer(d.a, d.b));
bus.on('enemyShot', (d) => effects.tracer(d.a, d.b));
bus.on('enemyFlash', (d) => effects.muzzleFlash(d.x, d.y, d.z));
bus.on('rocketLaunch', (d) => effects.tracer(d.a, { x: d.a.x, y: d.a.y, z: d.a.z - 0.0001 }));
bus.on('explosion', (d) => effects.explosion(d.x, d.y, d.z, d.r));
bus.on('napalmLaunch', () => sfx.flame());
bus.on('napalmImpact', (d) => {
  effects.napalmPool(d.x, d.y, d.z, 2.6);
  sfx.splash();
});
bus.on('impact', (d) => {
  effects.impact(d.pos, d.normal);
  sfx.impact();
});
bus.on('hit', (d) => {
  effects.blood(d.pos);
  hud.hit(d.killed);
  sfx.blood();
});
bus.on('playerHit', () => sfx.hurt());
bus.on('growl', (d) => sfx.growl(d));
bus.on('step', () => sfx.step());
bus.on('reloadStart', () => sfx.reloadStart());
bus.on('reloadEnd', () => sfx.reloadEnd());
bus.on('enemyKilled', () => sfx.death());
bus.on('waveStart', (n) => hud.wave(n));
bus.on('resetViews', () => {
  enemyViews.clear();
  projectiles.clear();
  effects.clear();
  rig.clearShells();
});
bus.on('gameover', () => { weaponCtrl.firing = false; });

let time = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(engine.clock.getDelta(), 0.05);
  if (state.status === 'playing') time += dt;

  playerCtrl.update(dt);
  weaponCtrl.update(dt, time);
  enemyCtrl.update(dt, time);

  lighting.update(dt, time);
  rig.update(dt, state.player, time);
  projectiles.update(dt, state.projectiles);
  enemyViews.update(dt, state.enemies);
  effects.update(dt, state.firePools);
  hud.update(state, dt);

  engine.step(dt);
  engine.render();
}
loop();
