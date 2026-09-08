---
name: blind-run-game-design
description: Use when researching, reviewing, designing, or implementing Blind Run gameplay, audio, characters, environments, spectator systems, UI/UX, maps, or mobile interaction.
---

# Blind Run Game Design Skill

## Purpose

Use this skill to make design decisions for Blind Run without losing the game's central promise: one player must move through a dangerous space with incomplete information while other players turn partial knowledge into useful guidance.

This skill is a design reference, not permission to copy another game's art, characters, maps, interface, branding, or assets. External games are references for principles only.

## Game Context

Repository evidence shows the following current experience:

- The active product is called Blind Run; older documents call it One Heist, Two Realities.
- A match currently supports 2-4 players through SpacetimeDB.
- One player is the thief. The others are fixed-room spectators assigned to lobby, security, or vault.
- The thief enters from the street, moves through a small facility, finds a keycard, handles the alarm and keypad, takes optional valuables, and escapes through the entrance or a vault vent.
- Spectators use Watch and Discover views, scan hidden objects through short multiple-choice puzzles, earn intel, and send directional command signals.
- Only the spectator assigned to the thief's current room has a live command channel.
- Solo mode reuses the same simulation and exposes the thief, spectator, and discovery views locally.
- The map and characters are procedural low-poly Three.js/Rapier geometry. There are no imported 3D characters, skeletal animations, local sound assets, music, or ambience.
- Web Audio currently provides short UI tones. Smallest.ai provides intro and command TTS. OpenAI can provide optional puzzle text.
- The landing page uses a paper/brutalist case-file language. The game uses dark industrial spaces, neon room accents, translucent HUD panels, and monospaced labels.
- There is currently no implemented death-to-ghost transformation. Multiplayer spectators are assigned before the round, and the multiplayer end card is not a complete rematch flow.

Important implementation evidence:

- `app/game/level.ts` is the map and room truth.
- `app/game/store.ts` is the local game state and role visibility policy.
- `app/game/components/Systems.tsx` owns local detection, damage, and terminal conditions.
- `app/game/components/NetSync.tsx` publishes the thief-owned snapshot.
- `app/game/net/spacetimeNet.ts` adapts SpacetimeDB updates, commands, and discoveries.
- `spacetime/src/index.ts` owns room reducers and persistence, but the thief client still owns physics, guards, detection, HP, score, and outcomes.
- `app/game/GameShell.tsx` contains the gameplay HUD, spectator deck, onboarding, end card, and much of the interaction policy.
- `app/game/components/TouchControls.tsx` contains the mobile thief controls.
- `app/game/audio.ts` and `app/lib/voice.ts` contain the current audio paths.

Do not trust older design documents over executable code. In particular, the repository documents 20-50 participants and a server-authoritative simulation, but the active implementation is a 2-4 player client-authoritative prototype.

## Design Principles

1. Make the information asymmetry the game, not a decorative premise. The thief should lack threat state and route certainty; the support players should lack direct physical control.
2. Every player must have a repeated decision loop. A spectator who only watches is an audience member, not a player.
3. Information must arrive in packets that can be understood under pressure: source, direction, confidence, urgency, and suggested action.
4. Preserve agency on both sides. A command should create a meaningful choice, not silently steer the thief or become a button spam contest.
5. Tension comes from committing with incomplete information. Do not solve tension with arbitrary damage, unreadable UI, or constant jump scares.
6. Rooms need gameplay identities. A room is memorable when its layout, landmark, light, sound, threat, and spectator task reinforce the same purpose.
7. Feedback must be redundant. Critical state should use at least two channels among sound, text, shape, motion, haptics, and color.
8. A short demo needs a reliable first round. Teach the core interaction before adding lore, progression, or procedural complexity.
9. Use the smallest stable match size until the role design supports more people. Do not increase the capacity constant without defining what additional players do.
10. Prefer original principles over visual imitation. Cyberpunk, anime, horror, and stealth references may inform contrast, rhythm, silhouette, and material choices, but Blind Run needs its own signal-noir identity.

## Character Design Principles

- Design the silhouette before the face or texture.
- Give every role one high-confidence identifying shape visible at a distance.
- Encode role in silhouette, posture, motion, and prop language; never rely on color alone.
- Use one primary shape family per role: the thief is compact and directional, security is rigid and angular, a future ghost is soft, broken, and trailing.
- Use three value groups and one accent color per character. The accent should support gameplay readability, not become a floating marker.
- Add one animated personality cue to every important character: breathing, head scanning, shoulder tension, radio adjustment, limping, or a distinct idle shift.
- Prefer procedural pose changes over expensive animation systems for the current MVP.
- A ghost, if introduced, must be a new role with an objective and constraints, not a translucent copy of the dead body.
- Enemies must communicate threat before contact through posture, movement rhythm, light, and sound.

Recommended direction: **Signal Runner**. A compact thief silhouette with a hood or high collar, asymmetric utility layer, visible receiver/ear hardware, and a small warm signal accent. The figure should read as a person who navigates by listening and carrying information, not as a generic cyberpunk soldier.

## Environment Design Principles

- Treat the facility as a signal system: every room produces a different kind of evidence.
- Give each room one landmark that can be described without a screenshot.
- Use color as a secondary cue after shape, light direction, and sound.
- Build routes with one safe option, one fast option, and one risky information-rich option where possible.
- Provide cover and readable danger zones. A blind player needs spaces to test, pause, and recover.
- Use doors, windows, racks, pipes, lights, and signage as navigation grammar, not decoration.
- Keep the MVP compact. A memorable three-room route with meaningful choices is better than a large empty facility.
- Make spectator sightlines intentional. A spectator view should reveal useful relationships without turning the thief's movement into a solved diagram.
- Environmental story should explain the facility's function through props, damage, logs, and sound, not through walls of text.

## Audio Design Principles

- Audio is a primary mechanic. Start with directional footsteps, threat distance, objective direction, wall contact, injury, detection, and room landmarks before music.
- Every critical audio event needs a clear semantic role and a visual or text fallback.
- Use a stable vocabulary: short command phrases, distinct stingers, and repeatable sound shapes.
- Direction tells the player where to orient; distance tells the player how urgently to act; timbre tells the player what kind of thing is happening.
- Let silence be a state. A sudden removal of an established bed is stronger than adding another alert layer.
- Separate speech, effects, ambience, and music volume controls. Include captions or a live comms transcript.
- Prefer local, deterministic fallback cues when TTS or network audio is unavailable.
- Do not require microphone speech to play. Voice is a support channel, not an accessibility gate.
- Use Web Audio spatialization or an equivalent abstraction only after event semantics are defined.

## UI/UX Principles

- The first screen should explain the social contract in one sentence: one person moves, the others help them survive.
- Show role, current objective, current information confidence, and the next useful action before secondary metrics.
- The thief HUD should not expose hidden security state that the premise says they cannot know.
- Spectator controls should be contextual. Disable or replace actions that cannot affect the current situation.
- Use readable labels alongside codes and icons, especially on mobile.
- Every network state needs a visible state and a recovery action: connecting, waiting, rejoining, disconnected, ended, and rematch.
- Use role-specific onboarding. Never show keyboard and pointer-lock instructions to a touch-only player.
- Use motion to confirm state changes, not to make every panel constantly move.
- Keep the game UI visually related to the briefing UI through shared colors, type rhythm, and signal motifs, but do not make gameplay look like a dashboard.
- Preserve focus, contrast, captions, touch target size, and non-color indicators.

## Spectator Design

Current spectators are pre-round support operators, not ghosts. Future dead-player mechanics must be designed separately.

The preferred post-death direction is a constrained **Signal Echo** role:

- Death transforms the player into an information-oriented role.
- The echo can revisit or observe only previously discovered anchors.
- It can spend limited charges on route pings, short sensor distortion, or landmark emphasis.
- It cannot directly move the thief, spawn damage, reveal the entire map, or issue unlimited commands.
- Every intervention is telegraphed and has a cooldown.
- Its objective is to improve the team's extraction odds while earning a separate support score.
- The living player remains the final decision-maker.

Use the loop `death -> transformation -> bounded ability -> visible consequence -> new objective -> round result`. Do not add a ghost simply because horror games have ghosts.

## Mobile Design

- Treat coarse-pointer devices as a separate input profile, not a scaled desktop profile.
- Keep movement, look, use, sprint, and exit actions available without simultaneous precision gestures.
- Reserve safe-area space for bottom controls and exclude the top HUD from the look pad.
- Use touch targets around 48 device-independent pixels with clear spacing.
- Provide a sprint toggle or context sprint on mobile; do not silently remove a meaningful movement choice.
- Keep spectator actions in a bottom rail with readable labels, cooldowns, and one-thumb reach.
- Give mobile players a mobile-specific onboarding card and a persistent controls reminder.
- Support haptics as an optional second channel, never as the only feedback.
- Test portrait and landscape decisions deliberately; do not let the layout accidentally choose for the player.

## Visual Language

- Working name: **Signal Noir**.
- Palette: ink charcoal and concrete neutrals, cobalt/cyan for intelligence, warm hazard yellow for agency and objectives, controlled red for active danger, and a small ghost violet/white accent if the echo role exists.
- Shapes: modular industrial rectangles for infrastructure, circles for sensors and locks, triangular or waveform motifs for signals, and soft trailing shapes for echoes.
- Materials: matte concrete, brushed metal, rubber, painted hazard panels, translucent screens, wet asphalt, and restrained emissive elements.
- Lighting: motivated pools of light, room-specific accents, deep but readable shadows, and clear contrast at interactable landmarks.
- Effects: scan sweeps, small signal arcs, dust, sparks, door weight, and restrained distortion during danger or ghost events. Avoid permanent glitch overlays.
- Typography: use the existing Geist/Geist Mono system; reserve monospace for instrumentation and use larger, calmer type for role and objective statements.
- Animation: use anticipation, impact, recovery, and readable pauses. Procedural low-poly animation is acceptable when timing and silhouettes are intentional.

## Anti-Patterns

- Generic neon added without a gameplay meaning.
- Copying Cyberpunk 2077, an anime, or another game's exact palette, HUD, character, map, logo, or asset.
- Permanent screen shake, chromatic aberration, scanlines, glitch, or red vignette.
- A thief HUD that reveals cameras, guard positions, or an exact threat meter while claiming blindness.
- Trivia puzzles that interrupt the action but do not help a spectator make a spatial decision.
- Seven always-available command buttons with no context, priority, acknowledgement, or cooldown.
- A ghost role that can grief the living player without counterplay.
- Color-only role or danger communication.
- Networked state hidden behind the UI instead of being modeled and validated.
- Scaling a room to 20 players before defining the additional roles.
- Adding progression, cosmetics, or lore before the first five minutes are readable and tense.

## Research References

Use the curated source notes in `docs/game-design-research/sources.md`. The most relevant references are:

- Keep Talking and Nobody Explodes: https://keeptalkinggame.com/how-to-play-remotely/
- Operation: Tango: https://store.steampowered.com/app/1335790/Operation_Tango/
- Blind Drive: https://www.blinddrivegame.com/
- A Blind Legend: https://www.dowino.com/realisations/serious-game-ablindlegend/
- Phasmophobia: https://store.steampowered.com/app/739630/Phasmophobia/
- Lethal Company: https://store.steampowered.com/app/1966720/Lethal_Company/
- Among Us: https://www.innersloth.com/games/among-us/
- Dead by Daylight: https://deadbydaylight.com/game/
- MDN spatial audio: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics
- Game Accessibility Guidelines: https://gameaccessibilityguidelines.com/full-list/
- AbleGamers APX: https://accessible.games/accessible-player-experiences/
- Web touch targets: https://web.dev/articles/accessible-tap-targets
- Cyberpunk universe reference: https://www.cyberpunk.net/us/en/

## Implementation Guidelines

1. Read the current repository evidence before proposing a change. Confirm whether a feature exists in executable code, only in a document, or only in a generated/stale artifact.
2. State the design problem, player consequence, proposed rule, and smallest vertical slice before touching code.
3. Preserve `level.ts` as the map source of truth and keep visibility rules centralized.
4. Keep the current primitive-geometry constraint in mind. Prefer better silhouette, lighting, materials, timing, and sound before demanding new art assets.
5. Treat `spacetime/src/index.ts` and generated bindings as a pair. Any schema or reducer change requires a deployment/binding plan.
6. Keep high-frequency movement separate from durable match state when redesigning synchronization.
7. Never put hidden threat information in a public payload merely because React hides it in one renderer.
8. Add one complete feedback loop at a time: event, player decision, result, audio, UI, network behavior, and mobile behavior.
9. Test with at least one thief and one spectator on separate devices, then test reconnect, room end, rematch, and provider failure.
10. If a request asks for research only, stop after research artifacts and roadmap. Do not implement speculative changes.

## Decision Framework

When two designs seem valid, score each from 1 to 5 against:

- Clarity: can a new player understand the next decision?
- Tension: does uncertainty create pressure without feeling arbitrary?
- Fun: does the player make a meaningful choice repeatedly?
- Identity: could this belong to Blind Run rather than any neon horror game?
- Multiplayer interaction: does it create useful asymmetry and communication?
- Spectator interaction: does a non-thief have agency and a reason to stay engaged?
- Implementation complexity: can the current stack support it safely?
- Performance: does it preserve mobile and low-end browser performance?
- Demo reliability: does it survive a live four-device demonstration?

Prefer the design with the higher total, but reject any option that scores below 3 on clarity, multiplayer interaction, or demo reliability.
