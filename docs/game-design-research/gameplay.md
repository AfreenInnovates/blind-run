# Gameplay Research And Decisions

## Current Implementation

### Core Loop

1. Create or join a 2-4 player SpacetimeDB room.
2. Wait for seats, then run a ten-second countdown and deterministic role draw.
3. One player becomes the thief. Other players become fixed-room spectators.
4. The thief enters from the street, passes the entrance, retrieves the security keycard, handles the alarm/keypad, takes optional valuables and vault loot, and escapes.
5. Spectators watch only their assigned room, switch between Watch and Discover, scan hidden objects through a roughly 20-second multiple-choice puzzle, gain intel, and send directional command signals.
6. Cameras, guards, traps, HP, alarm, score, inventory, and escape state are simulated on the thief client and published as snapshots.

### What Exists And What Does Not

- The thief has movement, look, sprint on keyboard, jump, proximity pickups, keypad and alarm interactions, damage, score, and two escape paths.
- The thief does not have a global round timer or stamina system.
- Spectators have a fixed camera, room-specific visibility, discovery puzzles, a command deck, a comms log, and a minimap.
- Commands currently display and play voice audio, but do not directly alter thief movement or world state.
- There is no implemented death-to-ghost transformation. Spectators are not dead players; they are assigned support players from the start.
- Solo mode exposes all views locally and is useful as a sandbox, but it does not prove the multiplayer information boundary.
- The multiplayer end card is local. The active frontend does not call the existing `end_run` reducer after escape or death, and there is no multiplayer rematch flow.

Evidence: `app/game/store.ts`, `app/game/components/Systems.tsx`, `app/game/components/NetSync.tsx`, `app/game/GameShell.tsx`, `app/room/[code]/RoomClient.tsx`, and `spacetime/src/index.ts`.

## Research Patterns

| Game | Core mechanic | Information received | Information hidden | Player decision | Risk | Reward | Feedback | Why it works | Blind Run adaptation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Keep Talking and Nobody Explodes | One defuser interacts with a bomb while experts use a manual | The defuser sees the device; experts see the rules and diagrams | Each side lacks the other side's view | Translate descriptions into the next safe action | Miscommunication and time pressure | Defuse before time expires; new modules and missions | Timer, strikes, module sounds, verbal confirmation | Every role owns a necessary piece of the solution; 2-4 is a deliberate social scale | Keep the thief as the only physical actor and give spectators reliable, room-scoped evidence packets rather than trivia |
| Operation: Tango | Agent and Hacker solve cooperative spy puzzles from different views | Each role sees tools and interfaces unavailable to the other | Neither player can complete the missions alone | Decide what to describe, when to trust, and how to coordinate | Voice-only ambiguity and incompatible views | Progress through missions together | Shared voice, clear task completion, distinct role tools | It makes communication a mechanic and keeps the team small | Give each spectator a complementary task and make commands context-sensitive, not duplicate buttons |
| Blind Drive | First-person action designed to be played with ears | Direction, distance, rhythm, voice, haptics, and a minimal visual layer | Most spatial detail is intentionally unavailable | React to an audio pattern and choose a lane/action | Misreading direction or timing | Progress, story, and survival | Directional traffic, speech, haptics, and distinct event sounds | Audio is not decoration; it is the input language | Build directional threat/objective cues before adding more visual polish |
| A Blind Legend | Action-adventure in darkness using 3D/binaural sound | Spatial sound landmarks and narration | Visual map and conventional visual affordances | Orient and act from audio | Losing orientation or reacting late | Navigation and combat progress | Binaural placement, narration, and event sounds | Landmarks let players build a mental map from repeated sound | Give each room a sound identity and support it with optional captions and a simple visual assist |
| Phasmophobia | Small investigation team gathers evidence about a dangerous ghost | Equipment readings, room behavior, teammate reports, CCTV and sensors | Ghost identity and exact danger state | Choose evidence tools, exposure, and retreat timing | Sanity, hunts, death, and incomplete evidence | Correct identification and extraction | Distinct equipment, voice recognition, hiding, radio, and escalating hunts | A remote support position can matter without making the field team passive | Give spectators evidence tools and a support station that can warn but not solve the route |
| Lethal Company | Crew gathers scrap under a quota while danger escalates | Teammate voice, ship radar, terminal controls, equipment, and environmental cues | Interior danger and exact creature behavior | Split up or stay together; carry risk back to extraction | Quota failure and leaving teammates behind | Scrap, upgrades, exploration, and emergent stories | Proximity voice, ship systems, creatures, time pressure | Remote operators and field players have different but valuable work | Add a meaningful extraction pressure and a remote operator layer without expanding the map too early |
| Among Us | Crew completes tasks while an impostor sabotages and kills | Task progress, cameras, map, meetings, bodies, and social testimony | Impostor identity and intent | Work, observe, accuse, vote, or deceive | Wrong vote, sabotage, and being isolated | Team or impostor victory | Meetings, role reveal, task bar, map cameras, and post-death Guardian Angel role | A simple objective supports a large social layer and keeps dead players partially engaged | Use the Guardian Angel idea only as a bounded inspiration; Blind Run should remain a sensory heist, not a deduction clone |
| Dead by Daylight | One Killer hunts four Survivors through an escape map | Survivors see local danger and objectives; Killer sees a different tactical layer | Each role's full information and intent | Hide, repair, rescue, chase, or commit to an escape | Exposure, chase, hooks, and resource tradeoffs | Escape, sacrifice, and role-specific score | Distinct silhouettes, chase audio, map landmarks, and role objectives | Strong roles, readable map purpose, and asymmetric pressure reinforce each other | Use distinct role silhouettes and map landmarks; do not copy its chase structure |

## Reusable Design Decisions

### The Target Experience

Blind Run should feel like a short **asymmetric sensory heist**. The thief is not merely blind; they are forced to make physical commitments without reliable threat information. Support players do not merely spectate; they filter a noisy security picture into short, timely, confidence-aware guidance.

### Proposed Round Shape

- **Brief:** show the room code, role, one sentence of the social contract, and the first objective.
- **Infiltrate:** the thief learns the facility through landmarks and low-risk movement.
- **Escalate:** alarm, guard routes, and incomplete discoveries create competing priorities.
- **Extract:** the team chooses loot, safety, and route under increasing pressure.

The current map can support this shape without becoming a large level. A short run should target a memorable five-to-eight-minute first session rather than an undefined wandering session.

### Information Budget

- The thief should receive physical affordances, audio cues, interaction feedback, and consequences.
- The thief should not receive guard positions, camera cones, exact alarm causes, or a perfect threat meter.
- Spectators should receive a security view, room identity, limited discovery information, and confidence markers.
- No role should receive every answer for free. Discovery should reduce uncertainty, not remove decision-making.

### Command Design

Commands should be suggestions with context and acknowledgement, not remote movement controls. The live channel should present the best two or three actions for the current situation, for example `HIDE`, `WAIT`, `MOVE LEFT`, or `RUN TO DOOR`, with a visible sender, confidence, cooldown, and delivery state. If the team wants a free-form command mode later, it needs arbitration and rate limits.

### Replayability

For the MVP, vary evidence placement, camera sweep phase, guard route timing, puzzle wording, and extraction tradeoffs. Do not introduce procedural room geometry until the fixed map has readable landmarks and more than one meaningful route.

## Implementation Boundary

The highest-value gameplay work is not adding more objectives. It is making the existing loop honest:

- Redact hidden security information from the thief's payload and renderer.
- Add a real audio navigation/threat layer.
- Make spectator actions causally affect the run or clearly describe them as information only.
- End multiplayer rounds authoritatively and provide rematch/reconnect behavior.
- Keep the advertised match size at 2-4 until a larger role design exists.
