# Blind Run Game Design Research

This directory is the design research baseline for Blind Run. It was produced from the executable repository and a focused external research pass. It is intentionally separate from gameplay implementation.

## How To Read It

- **Research** records what the cited games, talks, standards, and documentation say or demonstrate.
- **Design decisions** translate those observations into original rules for Blind Run.
- **Implementation** identifies repository changes without applying them.

Do not treat a recommendation as an implemented feature. The current code remains unchanged by this pass.

## Documents

- `gameplay.md` - current loop and reusable asymmetric/incomplete-information patterns.
- `audio.md` - audio design language, spatial cues, event matrix, and accessibility.
- `characters.md` - current character audit, original directions, and recommended silhouette system.
- `environments.md` - room identity, atmosphere, landmarks, and room concepts.
- `maps.md` - current map evaluation and a compact map direction.
- `ui-ux.md` - screen-by-screen audit from landing through rematch.
- `spectator.md` - current spectator role and a bounded post-death Signal Echo proposal.
- `mobile.md` - touch control audit and mobile design rules.
- `visual-language.md` - unified Signal Noir system and visual anti-patterns.
- `recommendations.md` - scorecard, priorities, and top ten changes.
- `implementation-roadmap.md` - file-level implementation plan for future work.
- `sources.md` - cited external references and what was actually extracted from each.

## Current Design Score

**46/100**

This is a design and player-experience score, not a code-quality score. The prototype has a strong premise, a presentable landing page, a coherent small map, and a credible first asymmetric loop. It loses points because the audio premise is mostly unimplemented, the character and animation language is generic, the spectator role is shallow, the mobile flow is incomplete, and multiplayer lifecycle/authority issues can break a live demo.

## Baseline In One Paragraph

Blind Run is currently a 2-4 player asymmetric heist prototype. One thief navigates a procedural low-poly facility from a first-person view while spectators are fixed to lobby, security, or vault views. Spectators scan objects through timed puzzles, gain intel, and send short directional commands; the live command channel follows the thief's current room. The thief retrieves a keycard, handles security, reaches the vault, collects loot, and exits. The game has procedural Web Audio tones and network TTS, but not a full environmental or directional soundscape. There is no implemented ghost transformation, no complete multiplayer rematch lifecycle, and no server-authoritative simulation.

## Current Game Experience

### Core Loop

Create/join a small room, draw one thief and fixed-room operators, infiltrate the facility, discover or communicate useful information, survive cameras/guards/traps, take the vault risk, and extract.

### Player Role

The thief owns first-person movement, physics, interactions, detection consequences, inventory, score, and the local terminal outcome.

### Spectator Role

Operators watch one assigned room, scan hidden objects through timed puzzles, earn intel, and send directional guidance. They are not currently dead players or ghosts.

### Gameplay

The current game has a deterministic fixed map, keycard/alarm/keypad/loot interactions, cameras, two guards, traps, HP, alarm, discovery, voice commands, and two logical escape paths. It has no global round timer, no physical vent traversal, and no complete multiplayer end state.

### Audio

Short synthesized UI signals and cached Smallest.ai intro/command TTS exist. Footsteps, room ambience, material impacts, enemy audio, objective beacons, music, and spatial audio do not exist yet.

### Visual Style

The runtime is low-poly procedural industrial geometry with dark surfaces, neon room accents, translucent panels, labels, glow, and lightweight procedural effects.

### Character Style

The thief and guards are primitive box-built figures with basic movement and procedural behavior. There are no authored silhouettes, faces, imported models, skeletal animations, or ghost forms.

### Room/Map Style

One compact facility connects street, entrance, lobby, security, vault, corridors, and a vault annex. The three spectator rooms are the main information partitions. The route is readable but mostly linear and under-landmarked.

### UI Style

The landing and lobby use a paper/case-file visual language. Gameplay uses a dark incident-console HUD with minimap, objective, HP/alarm/inventory/score, discovery panel, comms log, command deck, and end card.

### Mobile Experience

The thief has a virtual stick, look pad, use button, and jump/exit button. Spectators have a bottom command deck and discovery taps. Sprint, role-correct onboarding, safe-area handling, command readability, and touch hit-region isolation are incomplete.

### Current Weaknesses

- The advertised blindness is weakened by leaked or visible security state.
- Audio is not yet the primary navigation/threat language.
- Commands are not reliably causal and power-up events can be rejected by the module.
- Spectator engagement is narrower than the core premise suggests.
- There is no death-to-ghost loop.
- The map has limited choice, cover, landmarks, and environmental storytelling.
- Character identity and animation are generic.
- Multiplayer escape, reconnect, and rematch behavior is incomplete.
- Mobile controls and onboarding are not production-ready.

## Technical Reality

- The active browser transport is SpacetimeDB. The README's older in-memory/SSE server transport is not the active factory path.
- The room reducer clamps capacity to 2-4 and rejects new identities after play begins. A 20-person room is not implemented.
- `game_room`, `player`, `thief_state`, `discovered_item`, and `game_event` are the active multiplayer concepts, with additional profile, landing, and spectator-grace tables in the module source.
- The thief browser runs Rapier physics, guards, detection, HP, score, inventory, and terminal outcomes. SpacetimeDB validates the sender and stores snapshots but does not simulate or fully validate the world.
- The thief publishes a large snapshot about 12 times per second. Spectators apply the latest snapshot locally and render room-scoped views.
- The public thief-state payload includes more security information than the intended information asymmetry should allow.
- Per-round score, intel, loot, and result exist; persistent progression, unlocks, cosmetics, and account progression do not.
- `public/facility.png` and the mascot artwork support the product shell/onboarding. The runtime uses procedural geometry rather than those images as world assets.
- There are no local 3D models, animation clips, audio files, music tracks, or video files.
- Provider-backed TTS and optional AI puzzle generation are useful demo dependencies, so provider failure must have deterministic local fallbacks.
