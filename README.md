# DEAD LINE — Subway Station FPS

Un jeu FPS 3D développé avec **Three.js**, se déroulant dans une station de métro procédurale.
La scène démarre en visite libre (`WASD` + souris + slider de luminosité), puis se transforme en
FPS par vagues de zombies humanoïdes : traces de balles, recul, flash de bouche, SFX procéduraux.

**100 % procédural** : toutes les textures (Canvas2D), tous les modèles (primitives Three.js) et
tous les sons (Web Audio API) sont générés en code. Aucun asset externe, aucun téléchargement,
fonctionne hors-ligne.

---

## 🎮 Contrôles

| Touche        | Action                         |
|---------------|--------------------------------|
| `WASD`        | Déplacement                    |
| `Souris`      | Viser (pointer lock)           |
| `Clic gauche` | Tirer (auto)                   |
| `Clic droit`  | Viseur / zoom (ADS)            |
| `Clic milieu` | Viseur / zoom (ADS, touchpad)  |
| `R`           | Recharger                      |
| `Molette`     | Changer d'arme                 |
| `[` / `]`     | Luminosité − / +               |
| `Échap`       | Pause                          |

## 🔫 Armes

| Arme      | Type    | Spécialité                          |
|-----------|---------|-------------------------------------|
| Carabine 1911 | Fusil | Équilibrée, viseur zoom x1.85       |
| M16       | Fusil   | Cadence élevée, précision moyenne   |
| Bazooka   | Rocket  | Dégâts de zone (AoE), lente         |
| Napalm    | Project.| Flammes persistantes, dégâts continu |
| Minigun M134 | Fusil | 1000 balles, cadence très élevée, canons rotatifs |

Le viseur (clic droit / clic milieu) s'applique sur **toutes les armes** et affiche le
grossissement calculé depuis le FOV.

## 🧟 Ennemis

Zombies humanoïdes (primitives), IA de poursuite, attaque au contact pour les méchants non-armés,
tir à distance pour les armés. Ils suivent le joueur entre les deux niveaux (quai + voies) via les
rampes/escaliers. Headshots ×2.2, score, vagues montantes.

---

## 🚀 Installation

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173 dans un navigateur supportant WebGL et le pointer lock.

```bash
npm run build    # compilation de production (dossier `dist/`)
npm run preview  # prévisualisation du build
```

## 🏗️ Architecture (MVC)

Séparation stricte en 3 couches, découplées par un **EventBus** (pub/sub) :

```
 input ───────▶ CONTROLLER   ──────────▶     MODEL
 (clavier/souris/UI)        mute           (données + règles)
                ▲                          │
                │ emit (events)            │ read
                ▼                          ▼
            VIEW  (meshes Three.js + HUD DOM + effets)
```

- **Boucle de jeu** (une seule `requestAnimationFrame` dans `main.js`) :
  `playerCtrl.update(dt)` → `weaponCtrl.update(dt, time)` → `enemyCtrl.update(dt, time)` →
  `views.update(dt)` → `engine.render()`.

### Arborescence

```
src/
├── main.js                # bootstrap : instancie et câble M/V/C, lance la boucle
├── core/
│   ├── Engine.js          # renderer, scène, caméra, horloge, boucle, resize
│   ├── EventBus.js        # pub/sub (découple les couches)
│   ├── Level.js           # height field du niveau (quai + voies + rampes)
│   ├── PostProc.js        # post-processing cinématique (bloom, tirage, vignette, grain)
│   └── Procedural.js      # textures Canvas2D : carrelage, béton, ballast, métal...
├── model/                 # DONNÉES + RÈGLES pures (ni THREE, ni DOM)
│   ├── GameState.js       # racine : player, enemies[], score, wave, brightness, status
│   ├── Player.js          # pv, position, yaw/pitch, arme, bob
│   ├── Weapon.js          # cadence, dégâts, dispersion, recul, chargeur/réserve, reload
│   ├── Enemy.js           # zombie : pv, vitesse, machine à états IA, hitFlash, mort
│   └── Spawner.js         # composition des vagues + points d'apparition (tunnels)
├── view/                  # LIT le modèle, construit/met à jour les objets THREE
│   ├── SubwayStation.js   # quai, voies, rails, traverses, ballast, colonnes, plafond...
│   ├── Walls.js           # décor : panneaux, affiches, graffitis, tuyaux, bancs...
│   ├── Lighting.js        # spots de quai + émissifs + luminosité
│   ├── PlayerRig.js       # viewmodel arme (1re personne) + bob + recul + flash bouche
│   ├── EnemyView.js       # mesh humanoïde zombie + animation de marche + chute + hit flash
│   ├── ProjectileView.js  # vol des rockets/bombes (mesh + traînée)
│   ├── EffectsView.js     # traces de balles, impacts, gerbes de sang, flammes napalm
│   └── HUD.js             # DOM : réticule, munitions, vie, vague, score, hitmarker, vignette
├── controller/            # INPUT -> mute modèle -> émet événements
│   ├── PlayerController.js# WASD, mouse-look (pointer lock), collisions, caméra
│   ├── WeaponController.js# tir/reload, raycast hitscan, applique dégâts, effets+SFX
│   ├── EnemyController.js # tick IA : poursuite/attaque, dégâts joueur, morts/nettoyage
│   └── UIController.js    # slider luminosité, start/pause/restart, pointer lock
└── audio/
    ├── AudioManager.js    # AudioContext, master gain, ambiance (hum de métro)
    └── SFX.js             # tir, reload, impact, grognement zombie, mort, pas
```

## 🛠️ Stack

| Besoin        | Choix                                   |
|---------------|-----------------------------------------|
| Rendu 3D      | `three` r160                            |
| Bundler/dev   | `vite` (ES modules, HMR)                |
| Audio         | Web Audio API (synthèse temps réel)     |
| Textures      | Canvas2D → `THREE.CanvasTexture`        |
| HUD           | DOM overlay (HTML/CSS)                  |

## 📄 Licence

Projet privé — tous droits réservés.
