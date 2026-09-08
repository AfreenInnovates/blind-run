# Map Design Research

## Current Map

The current level is a small fixed facility:

```text
                 [Vault Annex / Vent]
                         |
[Security / Keycard] - [Lobby] - [Vault / Keypad]
                         |
                  [Entrance / Street]
```

The actual layout uses west and east wings, short corridors, a central lobby, an external starting area, and a vault annex. The thief begins outside, enters through the front, and normally travels from lobby to security to vault before returning or using the vent.

## Evaluation

### Keep

- The compact facility. It is appropriate for a first-session asymmetric game.
- The three spectator rooms. They create a clear information partition.
- The west/east contrast between security and vault.
- The entrance and vault as understandable objectives.
- The minimap and room assignment concept.
- Fixed guard routes as a baseline that spectators can learn.

### Change

- Add one meaningful route choice in each high-risk wing.
- Add a quiet route and a fast/noisy route instead of more corridors everywhere.
- Add two or three cover pockets where the thief can stop and listen.
- Give every room a landmark that can be described in one phrase and heard from a short distance.
- Make the extraction vent physically legible and animate the route instead of changing only a flag.
- Use doors as decisions: delay, noise, visibility, or safety.

### Remove Or De-emphasize

- Decorative labels and discovery overlays in the thief view.
- Threat information that is hidden only by a React renderer while still present in the data or physical scene.
- Long empty approach space that adds walking without adding orientation or risk.
- Automatic interactions that remove opportunities for a clear player decision. Automatic pickups are fine for low-value objects; key moments should announce and confirm.

### Add Later

- Service Spine as a connecting shortcut.
- Environmental storytelling that explains why the facility has a public intake, security control, and sealed vault.
- A second extraction route with a distinct audio and risk profile.
- Small map variants only after the fixed map has strong navigation landmarks.

## Desired Conceptual Map

```text
                         [Vault / Loot]
                         /            \
                [Quiet route]      [Vent / Exit]
                       |                |
[Street] -> [Intake / Lobby] -> [Security Control]
      \          |                  /
       \---- [Service Spine] -------
```

This is a design direction, not a request to redraw the map immediately. The key properties are a readable main route, one optional loop, a landmark at every junction, and a meaningful choice between speed and information.

## Design Rule

The map should let the thief form a mental model from repeated signals. A spectator may know the exact layout, but the thief should know enough to choose: "the relay hum is behind me, the vent draft is ahead, and the guard radio is close on the left."
