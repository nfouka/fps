# DEAD LINE — Subway Station FPS

Scène 3D d'une station de métro (Three.js) qui démarre en visite libre
(`WASD` + souris + slider de luminosité) puis se transforme en FPS par vagues :
zombies humanoïdes, traces de balles, recul, flash de bouche, SFX procéduraux.

**100% procédural** : toutes les textures (Canvas2D), tous les modèles (primitives
Three.js) et tous les sons (Web Audio API) sont générés en code. Aucun asset externe,
aucun téléchargement, fonctionne hors-ligne.

---

## 1. Stack

| Besoin        | Choix                                   |
|---------------|-----------------------------------------|
| Rendu 3D      | `three` r160                            |
| Bundler/dev   | `vite` (ES modules, HMR)                |
| Audio         | Web Audio API (synthèse temps réel)     |
| Textures      | Canvas2D -> `THREE.CanvasTexture`       |
| HUD           | DOM overlay (HTML/CSS)                  |

Lancement : `npm install` puis `npm run dev` (http://localhost:5173).

---

## 2. Architecture MVC

Séparation stricte en 3 couches, découplées par un **EventBus** (pub/sub).
Le **Modèle** ne connaît ni Three.js ni le DOM ; la **Vue** lit le modèle et
rend ; le **Contrôleur** lit les entrées, mute le modèle et émet des événements.

```
                 ┌──────────────┐   mute    ┌──────────────┐
   input ───────▶│ CONTROLLER   │──────────▶│    MODEL     │
                 │ (clavier/souris│          │ (données +   │
                 │  /UI)          │◀──events─│  règles)     │
                 └──────┬───────┘  (EventBus)└──────┬───────┘
                        │ emit                       │ read
                        ▼                            ▼
                 ┌──────────────────────────────────────┐
                 │                 VIEW                  │
                 │  (meshes Three.js + HUD DOM + effets) │
                 └──────────────────────────────────────┘
```

**Boucle de jeu** (une seule `requestAnimationFrame` dans `main.js`) :
`controllers.update(dt)` → `views.update(dt)` → `engine.render()`.

---

## 3. Arborescence des fichiers

```
subway-fps/
├── index.html                 # canvas + HUD DOM (réticule, munitions, vie, slider)
├── package.json / vite.config.js
├── PLAN.md
└── src/
    ├── main.js                # bootstrap : instancie et câble M/V/C, lance la boucle
    ├── core/
    │   ├── Engine.js          # renderer, scène, caméra, horloge, boucle, resize
    │   ├── EventBus.js        # pub/sub (découple les couches)
    │   └── Procedural.js      # textures Canvas2D : carrelage, béton, ballast, métal,
    │                          #   graffitis, panneaux, affiches, flash de bouche
    ├── model/                 # DONNÉES + RÈGLES pures (ni THREE, ni DOM)
    │   ├── GameState.js       # racine : player, enemies[], score, wave, brightness, status
    │   ├── Player.js          # pv, position, yaw/pitch, arme, bob
    │   ├── Weapon.js          # cadence, dégâts, dispersion, recul, chargeur/réserve, reload
    │   ├── Enemy.js           # zombie : pv, vitesse, machine à états IA, hitFlash, mort
    │   └── Spawner.js         # composition des vagues + points d'apparition (tunnels)
    ├── view/                  # LIT le modèle, construit/met à jour les objets THREE
    │   ├── SubwayStation.js   # quai, voies, rails, traverses, ballast, colonnes, plafond,
    │   │                      #   murs de fond, tunnels  (exporte STATION + collidables)
    │   ├── Walls.js           # décor : panneaux de nom, "WAY OUT", affiches, graffitis,
    │   │                      #   tuyaux, bancs, poubelles, distributeur
    │   ├── Lighting.js        # spots de quai + émissifs + scintillement + multiplier luminosité
    │   ├── PlayerRig.js       # viewmodel arme (1re personne) + bob + recul + flash bouche
    │   ├── EnemyView.js       # mesh humanoïde zombie + animation de marche + chute + hit flash
    │   ├── EffectsView.js     # traces de balles, impacts, gerbes de sang, douilles
    │   └── HUD.js             # DOM : réticule, munitions, vie, vague, score, hitmarker, vignette
    ├── controller/            # INPUT -> mute modèle -> émet événements
    │   ├── PlayerController.js# WASD, mouse-look (pointer lock), collisions quai/colonnes, caméra
    │   ├── WeaponController.js# tir/reload, raycast hitscan, applique dégâts, déclenche effets+SFX
    │   ├── EnemyController.js # tick IA : poursuite/attaque, dégâts joueur, morts/nettoyage
    │   └── UIController.js    # slider luminosité, start/pause/restart, pointer lock
    └── audio/
        ├── AudioManager.js    # AudioContext, master gain, ambiance (hum de métro)
        └── SFX.js             # tir, reload, impact, grognement zombie, mort, pas
```

---

## 4. Flux de données (exemple : tir)

1. `WeaponController` détecte le clic → `Weapon.fire(now)` (modèle) décrémente le chargeur.
2. Émet l'impulsion de recul (caméra + `PlayerRig`) et `PlayerRig.flashNow()` (flash bouche).
3. Raycast hitscan depuis la caméra : contre les `collidables` du décor **et** les sphères
   des ennemis (test rayon/sphère dans le modèle).
4. Si ennemi touché → `Enemy.damage()` (modèle) + `EffectsView.spawnBlood()` + `SFX` ;
   sinon → `EffectsView.spawnImpact()` sur le mur.
5. `EffectsView.spawnTracer()` dessine la trace lumineuse de la bouche au point d'impact.
6. La `HUD` (Vue) lit le modèle chaque frame pour afficher munitions/vie/score.

---

## 5. Détails de la station

- Quai carrelé + ligne de sécurité jaune en bord de voie.
- Voies en contrebas : ballast, traverses, rails métalliques des deux côtés.
- Deux bouches de tunnel par voie plongeant dans le brouillard (`FogExp2`).
- Colonnes carrelées, murs de quai en carreaux biseautés, plafond béton.
- Panneaux de nom de station, enseignes « WAY OUT », caissons publicitaires, graffitis.
- Bancs, poubelles, distributeur, tuyauterie en hauteur.
- Réglettes fluorescentes au plafond (certaines grésillent), nappes de lumière chaude
  vs coins sombres.

## 6. Fonctionnalités FPS

- Viewmodel carabine, **flash de bouche** (sprite additif + point light), **recul**
  (ressort caméra + arme), **traces** lumineuses qui s'estompent, éjection de douilles.
- **Zombies humanoïdes** (primitives, bras tendus, marche saccadée), IA de poursuite,
  attaque au contact, gerbes de sang, effondrement à la mort.
- **Vagues** montantes (`Spawner`), headshots (×2.2), score.
- HUD : réticule, munitions, barre de vie, vague, score, hitmarker, vignette de dégâts.
- **Slider de luminosité** : pilote l'intensité des lumières + `toneMappingExposure`
  (aussi réglable au clavier `[` / `]` pendant le jeu, curseur capturé).

## 7. Contrôles

| Touche        | Action                         |
|---------------|--------------------------------|
| `WASD`        | Déplacement                    |
| `Souris`      | Viser (pointer lock)           |
| `Clic G`      | Tirer (auto)                   |
| `R`           | Recharger                      |
| `[` / `]`     | Luminosité − / +               |
| `Échap`       | Pause                          |
