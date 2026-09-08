# Blind Run Visual Language

## Current Split

The landing/product shell uses an intentional-looking paper grid, heavy black rules, offset shadows, acid yellow, cobalt blue, signal green, and danger red. The runtime uses dark procedural geometry, room accent colors, translucent HUD panels, labels, glow, and alert pulses. The result has energy, but the relationship between the two languages is not yet explicit. Promotional facility art is more cinematic and illustrative than the runtime.

## Design Decision: Signal Noir

Blind Run should present itself as a **live incident file entering a compromised signal network**:

- The landing page and lobby are the printed case file: paper, stamps, bold rules, evidence blocks, and imperfect alignment.
- The runtime is the facility feed: ink black, concrete gray, cobalt intelligence, warm yellow agency, and controlled red danger.
- The transition between them is an intentional act of opening the file and connecting to the facility.

This keeps the existing landing personality without pretending that the low-poly runtime is a cinematic AAA world.

## System

### Shapes

- Rectangles and beams: infrastructure, walls, racks, doors, and UI panels.
- Circles and arcs: locks, sensors, camera sweeps, sound sources, and objective beacons.
- Triangles and broken lines: directional signals, warning paths, and route confidence.
- Soft trailing forms: future Signal Echo effects only.

### Materials

- Matte concrete and painted steel for the building shell.
- Brushed metal and rubber for security equipment.
- Translucent glass and emissive screens for information surfaces.
- Wet asphalt and chain fencing for the extraction exterior.
- Avoid shiny surfaces everywhere; reflective surfaces should identify a functional object.

### Lighting

- Use motivated light sources: monitors, relays, floodlights, emergency strips, and vault lamps.
- Give each room one dominant light family and one transition cue.
- Reserve red for active danger or irreversible state.
- Keep interactable landmarks readable without outlining every object.
- Use darkness as a composition tool, not a way to hide collision or navigation.

### Color

| Meaning | Color direction | Additional cue |
| --- | --- | --- |
| Agency/objective | Warm hazard yellow | Shape, label, pulse |
| Intelligence/discovery | Cobalt/cyan | Scan arc, waveform, text |
| Active danger | Controlled red | Alarm rhythm, icon, audio |
| Safe/confirmed | Signal green used sparingly | Check shape, resolution sound |
| Echo/ghost | Pale violet/white | Trail, distortion, delayed sound |

Never make state legible through hue alone. Add brightness, shape, motion, text, or sound.

### Typography

- Keep Geist and Geist Mono unless user testing proves they fail at small sizes.
- Use large type for role, objective, and result.
- Use monospace for telemetry, room codes, timestamps, and comms.
- Avoid making every label uppercase and tiny. Instrumentation should be dense only where the player has chosen to inspect it.

### Effects

- Use scan sweeps to show discovery or system evaluation.
- Use a short signal arc or waveform to connect a message to a source.
- Use sparks, dust, and door weight for physicality.
- Use distortion only for detection, network failure, or echo abilities.
- Do not keep scanlines, chromatic aberration, vignette, and glitch on permanently.

## Identity Test

Before adding a visual element, ask:

1. Does it make the next player decision clearer?
2. Does it reinforce the facility's signal-processing fiction?
3. Does it distinguish a role, room, or state at a glance?
4. Does it work with the current primitive geometry and mobile performance budget?
5. Would Blind Run still own the idea if the neon color were removed?

If the answer is no to most of these, the element is decoration rather than design.

## Unified Blind Run Design System

1. **Visual identity:** Signal Noir; paper incident file outside the run, dark facility feed inside it.
2. **Character identity:** Signal Runner thief, rigid instrument-driven security, and a bounded trailing Signal Echo if the ghost role is added.
3. **Environment identity:** functional rooms with a landmark, material, light, sound, threat, and support task.
4. **UI identity:** sparse incident console with large role/objective statements and compact telemetry.
5. **Audio identity:** directional information, stable command vocabulary, room beds, meaningful silence, and captioned redundancy.
6. **Horror/tension:** uncertainty, commitment, sound, exposure, and recovery; not constant jumpscares or unreadable darkness.
7. **Spectator identity:** operators convert evidence into timely decisions; echoes provide limited post-death support.
8. **Gameplay identity:** a short asymmetric sensory heist with a clear infiltrate, escalate, and extract arc.
9. **Animation identity:** readable anticipation, state changes, weight, listening, alertness, and recovery using procedural motion where possible.
10. **Mobile identity:** role-specific touch controls, safe-area layout, readable labels, haptics as a second channel, and no accidental loss of core actions.
