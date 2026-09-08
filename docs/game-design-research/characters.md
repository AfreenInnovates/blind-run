# Character Design Research

## Current Character Baseline

The thief and guards are assembled from boxes, cylinders, and simple materials in `app/game/components/Thief.tsx` and `app/game/components/Guard.tsx`. The thief has movement bobbing, a capsule physics body, and remote interpolation. Guards have patrol, chase, vision cones, and simple procedural movement. There are no imported models, faces, masks, skeletal rigs, character customization, death animation, ghost form, or role-specific animation sets.

The current geometry is readable enough to communicate "person" and "security", but it does not yet communicate a memorable character, a personal history, or a distinct animation personality.

## Research Findings

- The official Hades page pairs a simple premise with a strong cast of illustrated faces, silhouettes, costumes, and color relationships. The transferable lesson is not the Greek style; it is that character identity is carried by shape, costume, gesture, and color together.
- The official VALORANT agent roster is a useful study in giving every role a distinct name, silhouette, costume system, and ability language. Blind Run should use the principle of role readability without adopting its visual language.
- Dead by Daylight's official overview separates Killer and Survivor roles and supports them with distinct character presentation and map fiction. The transferable lesson is that role identity must survive across gameplay, UI, and map language.
- The GDC Cuphead session describes a process and philosophy for hand-drawn animation. The relevant principle for Blind Run is to decide what motion language communicates personality before adding animation volume.
- Cyberpunk's official franchise page is useful as a reference for high-contrast urban technology, but its assets and exact visual motifs must not be copied.

Sources: `sources.md` entries A10, A11, A12, A13, and A21.

## Character Design Principles

### Player

- The thief should read as a compact moving signal source, not a military hero.
- The head and shoulder profile should be clear in a small minimap or spectator camera.
- One asymmetric prop should explain the fantasy: receiver collar, ear unit, glove, folded map, or cable.
- Clothing should create motion arcs during turning, running, stopping, and injury.
- The face can stay obscured for the MVP. A strong mask/hood/visor is more useful than a low-detail face.
- The thief's posture should become more compressed under danger and more open after a successful objective.
- A short idle loop should show listening: head tilt, receiver check, or hand near the earpiece.

### Spectator And Future Echo

- A live spectator is primarily represented through a comms identity, room badge, and signal color, not a 3D body in the facility.
- A Signal Echo should have a trailing silhouette, delayed motion, broken edges, and a quiet audio signature. It should never be a white translucent clone with no interaction language.
- Echo abilities should use visible anchors, limited charges, and a readable cooldown shape.

### Enemy

- Guards should be identifiable by a broad shoulder/light/radio silhouette before the player is close.
- Cameras should be read as a moving lens/light/sweep rather than a generic box on a pole.
- Threat animation should communicate state: routine patrol, suspicion, confirmed detection, search, and recovery.
- Enemy variation should initially come from behavior and audio, not five expensive models.

## Original Character Directions

### 1. Signal Runner - Recommended

- **Visual concept:** A courier who moves through a compromised facility by listening to a remote crew.
- **Silhouette:** Compact hood or high collar, one raised receiver/ear shape, asymmetric shoulder layer, small pack.
- **Shape language:** Forward-leaning triangles balanced by a soft hood and rounded receiver.
- **Color palette:** Charcoal and concrete, warm signal yellow, a small cobalt reflection.
- **Materials:** Matte technical fabric, rubber, brushed receiver metal, one reflective strip.
- **Face:** Mostly hidden by shadow or a low-profile mask; no detailed face required.
- **Clothing:** Short utility jacket, flexible trousers, gloves, receiver hardware.
- **Animation style:** Quick head checks, controlled stops, shoulder tension when detected, loose recovery after success.
- **Audio identity:** Cloth rustle, quiet receiver clicks, breath that becomes more present under danger.
- **Why it fits Blind Run:** It makes listening visible and gives procedural geometry a distinctive profile.
- **Implementation difficulty:** Low-medium. Can be built from existing primitives and a few emissive/material changes.

### 2. Null Courier

- **Visual concept:** An anonymous infiltrator designed to disappear into industrial shadow.
- **Silhouette:** Long straight coat, narrow head shape, one rectangular satchel, minimal exposed skin.
- **Shape language:** Vertical bars and hard corners, with one moving coat hem.
- **Color palette:** Blackened blue, dirty gray, one muted amber seam.
- **Materials:** Waxed fabric, dull polymer, worn metal.
- **Face:** Smooth half-mask with no readable expression.
- **Clothing:** Coat, satchel, narrow gloves, soft-soled boots.
- **Animation style:** Deliberate, low center of gravity, almost no idle movement until danger.
- **Audio identity:** Quiet footfalls, coat snaps, dry radio static.
- **Why it fits Blind Run:** Strong stealth identity and easy low-poly construction.
- **Implementation difficulty:** Medium. Coat motion and silhouette need more geometry or a simple rig.

### 3. Patchwork Listener

- **Visual concept:** A self-taught runner carrying modified consumer hardware and improvised tools.
- **Silhouette:** Uneven backpack, visible cable, large glove, patched knee, tilted headset.
- **Shape language:** Mismatched rectangles and circles, intentionally asymmetrical.
- **Color palette:** Warm gray, faded orange, cyan diagnostic lights.
- **Materials:** Fabric patches, tape, plastic, scratched metal.
- **Face:** Open face with a strong brow/eye shadow treatment if a face is later added.
- **Clothing:** Layered vest, hoodie, utility straps, improvised receiver.
- **Animation style:** Nervous idle adjustments, quicker turns, visible stumble recovery.
- **Audio identity:** Small hardware rattles, cable taps, noisy receiver tuning.
- **Why it fits Blind Run:** Gives the social improvisation of the team a physical character identity.
- **Implementation difficulty:** Low-medium. Most identity comes from props and procedural offsets.

### 4. Relay Diver

- **Visual concept:** A facility specialist who uses signal leaks and maintenance routes to cross the building.
- **Silhouette:** Rounded helmet/visor, broad utility harness, compact light source at the chest.
- **Shape language:** Circles and arcs around a compact body, contrasted with rigid security shapes.
- **Color palette:** Deep teal, graphite, pale white light, controlled red only under detection.
- **Materials:** Rubberized suit panels, glass visor, oxidized fasteners.
- **Face:** Hidden behind a reflective visor.
- **Clothing:** Utility suit, harness, short tool modules.
- **Animation style:** Weighted movement, deliberate crouch, strong light/head orientation.
- **Audio identity:** Filtered breathing, suit servo ticks, chest light relay.
- **Why it fits Blind Run:** Makes room acoustics and light direction part of the character.
- **Implementation difficulty:** Medium-high. Helmet and breathing systems need additional assets and state work.

## Animation Set For The Recommended Direction

The smallest useful set is:

- listening idle
- walk and sprint with readable footfall cadence
- turn and stop anticipation
- wall bump and correction
- keycard pickup
- keypad/alarm interaction
- threat flinch and injured movement
- hide/recover state
- vault/vent extraction
- defeat and role transition

This set has more player impact than adding several cosmetic characters with identical motion.

## Decision

Use Signal Runner for the first character pass. Keep the geometry procedural, but establish a strong hood/collar/receiver silhouette, a warm signal accent, listening idle, and state-specific movement. Make guards more readable through shoulder/light silhouettes and patrol/search poses. Defer detailed faces, customization, and a full ghost mesh until the core role language works.
