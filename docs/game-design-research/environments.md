# Environment Design Research

## Current Environment Baseline

The active map is a fixed procedural facility made from wall runs, floor slabs, doors, rooms, corridors, furniture, lights, cameras, guards, traps, pickups, a vault, and an exterior street. The route is centered on a lobby with a west security room and an east vault room. A small annex sits behind the round vault door.

The spectator view cuts away or hides parts of the building and adds labels, cones, discovery markers, and a minimap. The thief view removes some overlays, but physical guard/camera meshes and parts of the security state remain visible. The map is legible as a prototype but has limited room identity, few route choices, and little environmental storytelling.

## Research Findings

- Phasmophobia's official description emphasizes unique locations, hiding spots, layouts, evidence equipment, and a truck that can monitor CCTV and motion sensors. The useful pattern is that a remote support position has a concrete job and a distinct information interface.
- Lethal Company's official description combines abandoned industrial locations, a quota, remote ship tools, hazards, and extraction. The useful pattern is risk/reward pressure tied to returning through the same space.
- Dead by Daylight's official map descriptions give locations a distinct fiction, material, landmark, and threat history rather than treating maps as neutral arenas.
- The GDC environment-art overview for Fatshark describes a workflow that connects concept art, level design, and environment art. The transferable lesson is to design visual landmarks together with gameplay purpose.
- The GDC wayfinding overview describes using architecture and detail to convey navigation and narrative. The useful pattern is to make the route understandable through spatial grammar, not only UI labels.
- The GDC Firewatch overview emphasizes world structure, goals, gating, encounter design, exploration, and choice without relying on combat. This is relevant to Blind Run's small stealth route.

Sources: `sources.md` entries A7, A8, A10, A22, A23, and A24.

## Blind Run Environment Language

The facility should feel like a **signal-processing building that was designed for people who trust instruments more than people**. It is industrial, but each object should explain a function: intake, monitoring, storage, routing, containment, or extraction.

Each room must have:

- a visual identity
- a gameplay purpose
- a navigation identity
- an audio identity
- a danger level
- a landmark that can be named in one phrase
- at least one spectator opportunity

Do not make every room dark, wet, neon, and damaged. Contrast is what makes danger readable.

## Room Concepts

### Intake Atrium

- **Purpose:** Orientation, first movement lesson, and a visible transition from street to controlled space.
- **Layout:** Broad entry, central security gate, two visible wing approaches, one simple cover object.
- **Landmark:** A suspended facility clock or intake scanner that audibly cycles.
- **Lighting:** Warm exterior spill against cold interior strips.
- **Materials:** Concrete, painted steel, rubber matting, worn glass.
- **Color:** Neutral gray with a single yellow entry signal.
- **Audio:** PA loop, gate relay, footstep reflections, distant server hum.
- **Gameplay:** Teach movement, wall contact, first landmark, and the meaning of room transitions.
- **Threat:** Low. The player should learn before the first serious risk.
- **Player decisions:** Move quickly into a wing or pause to build orientation.
- **Spectator opportunities:** Mark the next wing, reveal a safe landmark, or confirm a route.

### Security Control

- **Purpose:** Information and risk management; the place where alarm state and camera knowledge become concrete.
- **Layout:** Main control desk, side racks, a narrow guard lane, one cover pocket, one loud shortcut.
- **Landmark:** A rotating camera wall or large relay spine with a distinct sweep sound.
- **Lighting:** Cobalt task light, white monitor glow, occasional amber relay flash.
- **Materials:** Brushed steel, dark screens, cable trays, glass partitions.
- **Color:** Cobalt and white, with red reserved for active alarm.
- **Audio:** Relay clicks, fan harmonics, camera servo, guard radio, low electrical buzz.
- **Gameplay:** Find the keycard, choose whether to disable the alarm, and decide how much information to risk.
- **Threat:** Medium. Cameras and a guard teach detection without requiring combat.
- **Player decisions:** Take the fast exposed route, use cover, or spend time disabling a system.
- **Spectator opportunities:** Scan cameras, mark guard movement, reveal the keycard, or spend a limited support action.

### Vault Chamber

- **Purpose:** Payoff, commitment, and extraction decision.
- **Layout:** Round door, keypad, loot center, side cover, and a visible but not immediately usable vent.
- **Landmark:** A heavy circular lock with a low resonant rotation sound.
- **Lighting:** Amber pools and a dark perimeter; bright only when the lock state changes.
- **Materials:** Heavy steel, ceramic floor, warning glass, sealed storage.
- **Color:** Amber and black, with white keypad feedback.
- **Audio:** Lock resonance, air pressure, distant guard movement, vent draft after release.
- **Gameplay:** Convert earlier information and keycard progress into loot versus safe extraction.
- **Threat:** High. The player should feel committed but retain at least one readable escape option.
- **Player decisions:** Take loot, use the vent, return through the known route, or retreat before detection peaks.
- **Spectator opportunities:** Confirm the lock state, reveal the vent, call a route, or conserve support resources.

### Service Spine

- **Purpose:** Optional route and landmark-building space; recommended as a future addition.
- **Layout:** Narrow maintenance corridor linking the wings with one noisy shortcut and one quiet, longer bend.
- **Landmark:** Repeating coolant pipes and a leaking pressure valve.
- **Lighting:** Thin overhead strips with occasional dead sections.
- **Materials:** Pipes, grating, insulation, damp concrete, service labels.
- **Color:** Desaturated teal with warning yellow at junctions.
- **Audio:** Water drip, pipe vibration, vent rush, footsteps with strong reflections.
- **Gameplay:** Create a choice between speed, sound, and cover.
- **Threat:** Medium-high because sightlines are short and wrong turns cost time.
- **Player decisions:** Use the route to bypass a room, risk a noisy door, or stay on the safer main axis.
- **Spectator opportunities:** Read a route landmark, warn about the shortcut's sound, or reveal a junction.

### Extraction Yard

- **Purpose:** Make escape feel like a physical return to the outside rather than a boolean state.
- **Layout:** Exterior service lane, extraction pad, one light pool, and a final exposed crossing.
- **Landmark:** A rotating floodlight and extraction beacon.
- **Lighting:** Open darkness with one readable safe direction.
- **Materials:** Wet asphalt, chain fencing, concrete barriers, utility lamps.
- **Color:** Cold blue night with a warm extraction beacon.
- **Audio:** Wind, distant city noise, fence rattle, beacon pulse, fading facility alarm.
- **Gameplay:** A final commitment and social payoff visible to spectators.
- **Threat:** Low after a successful route, but exposed and emotionally important.
- **Player decisions:** Sprint directly or take a slower covered edge.
- **Spectator opportunities:** Confirm the extraction direction and celebrate the team result.

## MVP Recommendation

Make **Security Control** the strongest room first. It already contains the keycard, alarm panel, cameras, guard, and discovery content. A clear control-room landmark and a richer audio identity would improve gameplay, spectator value, and demo memorability at once. Do not build five new rooms before this room teaches the complete information loop.
