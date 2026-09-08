# Mobile Experience Research And Audit

## Current Implementation

The game detects coarse pointers and provides a left virtual stick, a full-screen look pad, an E/use button, and a jump/exit button. The touch controls are shown for the thief view. Spectators use a bottom command deck and tappable discovery markers.

Current weaknesses:

- Mobile thieves have no sprint button, so the meaningful run state is unavailable.
- Thief onboarding still describes WASD, Shift, and pointer lock.
- The full-screen look pad can intercept taps intended for top-level HUD controls.
- Bottom controls do not consistently account for safe-area insets.
- Alert and command banners can overlap on small screens.
- Spectator command descriptions are hidden on mobile, leaving cryptic codes.
- Discovery markers are 3D click targets rather than keyboard/touch-accessible semantic controls.
- There is no explicit portrait/landscape decision or performance profile.

Evidence: `app/game/components/TouchControls.tsx`, `app/game/GameShell.tsx`, `app/game/components/Thief.tsx`, `app/game/useCoarsePointer.ts`, and `app/layout.tsx`.

## Research Findings

- Game Accessibility Guidelines recommend large, well-spaced virtual controls, simple alternatives, adjustable sensitivity, remapping where possible, avoiding simultaneous complex inputs, and support for more than one input device.
- Web.dev recommends approximately 48 device-independent pixels for touch targets and about 8 pixels of spacing.
- AbleGamers APX frames accessibility as removing barriers while preserving the intended challenge. This is especially useful for Blind Run because audio should add a second channel rather than become an access gate.
- Phasmophobia and Lethal Company show that small, repeated actions and clear tools can support cooperative tension without requiring a complex mobile HUD.

Sources: `sources.md` entries A8, A26, A27, and A28.

## Mobile Control Proposal

### Thief

- Left thumb: movement stick with a lockable run toggle or press-forward-to-sprint option.
- Right side: look pad that excludes the top HUD and action buttons.
- Right lower corner: large use/interact button with contextual label.
- Secondary action: jump or exit, with the exit label taking priority near the vent.
- Optional quick action: hide/stop only when the current interaction supports it.
- Haptics: wall bump, objective reached, detection pulse, and extraction confirm, all independently toggleable.

### Spectator

- Bottom rail: two or three current actions, each with label, icon, room, and cooldown.
- Center/right panel: evidence card with object, confidence, direction, and last-seen time.
- Discovery tap targets: semantic HTML overlay or accessible list fallback, not only invisible Three.js meshes.
- Voice commands: transcript, sender, delivery state, and replay button.

## Implementation Rules

- Use safe-area environment variables for all bottom controls.
- Test at narrow portrait width, landscape phone width, tablet width, and a coarse-pointer laptop.
- Keep the look pad from covering leave, room, pause, or result controls.
- Never hide the command meaning solely because the viewport is small.
- Add a low-performance mode that reduces shadows, emissive effects, and pixel ratio before adding visual complexity.
- Test with audio muted. Every objective and critical threat must still have a visual or haptic path.
