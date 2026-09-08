# Spectator And Ghost Design

## Current State

Blind Run has a promising spectator concept but not a dead-player or ghost system.

- Spectators are selected during role draw and assigned to lobby, security, or vault.
- Their physics is paused; they receive the thief-owned snapshot and render a room-specific view.
- They can switch between Watch and Discover, scan hidden objects, earn intel, and send directional commands.
- Only the spectator whose room contains the thief has a live command channel.
- Commands are primarily displayed and voiced; they do not currently steer the thief or directly change the simulation.
- The visible Heal and Invis power-up path is not accepted by the checked-in reducer.
- When the thief dies or escapes, the shared end state can be shown through the spectator UI even though it is not that spectator's personal outcome.
- There is no ghost transformation, ghost movement, afterlife map, or post-death objective.

Evidence: `app/game/store.ts`, `app/game/GameShell.tsx`, `app/game/components/NetSync.tsx`, `app/game/components/Markers.tsx`, `app/game/net/spacetimeNet.ts`, and `spacetime/src/index.ts`.

## Research Patterns

- Among Us demonstrates that a dead player can remain socially engaged through a constrained Guardian Angel role while no longer participating in the main accusation loop.
- Phasmophobia demonstrates a useful remote support position: the truck operator can monitor cameras and sensors while the field team takes physical risk.
- Lethal Company demonstrates that a remote ship operator can guide field players through radar and terminal actions while the rest of the crew explores.
- Dead by Daylight demonstrates the value of role-specific goals and strong visual identity, but its direct chase structure is not a fit for Blind Run.

The transferable pattern is **bounded influence after removal**. The removed player should gain a new task, but not unlimited power over the living player's outcome.

## Proposed Spectator Loop

### Live Operator

`observe -> scan -> interpret -> mark -> warn -> confirm -> reposition attention`

- Observe a room through a useful fixed camera.
- Scan only objects that matter to the current route or objective.
- Interpret a clue as direction, danger, or route confidence.
- Mark the clue for the team with a time/confidence label.
- Warn only when the thief can act on it.
- Confirm whether the message was seen, heard, or ignored.
- Reposition attention as the thief moves between channels.

### Signal Echo After Death

`death -> transform -> choose an anchor -> spend a charge -> produce a bounded effect -> receive a new objective -> round result`

Recommended first abilities:

- **Echo Ping:** highlight one already-discovered landmark for the thief for a short time.
- **Sensor Blur:** reduce one camera's confidence or delay one warning; it cannot erase an active detection.
- **Route Memory:** leave a short directional audio marker at a discovered junction.

The echo should not:

- move the thief
- spawn an enemy or damage source
- reveal the full map
- issue unlimited commands
- hide its intervention from the living team
- affect an objective that was never discovered

## Fairness Rules

- Every echo effect has a visible sender, cooldown, and cost.
- Effects help the team read a choice; they do not choose for the thief.
- The thief always has a non-ghost route to success.
- A living spectator's information role and a dead spectator's echo role must not stack into unlimited simultaneous support.
- If there are multiple spectators, use an action queue or room captain rather than allowing a command flood.
- Give the echo a personal score for useful, timely support so death feels like transformation rather than punishment.

## MVP Recommendation

Do not implement free-roaming ghosts before the live operator loop is causally useful. First fix discovery, command acknowledgement, power-up reducers, and the spectator result screen. Then add one Signal Echo ability with one anchor and one cooldown as a small P1 experiment.
