# Audio Design Language

## Current Audio Baseline

The repository has three audio paths:

- `app/game/audio.ts` synthesizes short Web Audio command and alert tones.
- `app/lib/voice.ts` requests cached WAV speech from Smallest.ai for the intro and seven command phrases.
- `app/game/GameShell.tsx` queues valid command clips for the thief and retries onboarding narration after a user gesture.

There are no local footsteps, room ambience, enemy sounds, music layers, material impacts, injury sounds, or spatialized world emitters. The current audio is therefore a communication feature, not yet an audio-first game language.

## Research Findings

- Blind Drive describes itself as a first-person audio game and combines two-button play, voice acting, haptics, and text-to-speech accessibility. Its useful lesson is that a small, repeatable sound vocabulary can carry the interaction loop.
- A Blind Legend describes using 3D/binaural audio as the navigation space. The useful lesson is that repeated audio landmarks can substitute for a conventional map.
- Keep Talking and Nobody Explodes uses a small, urgent vocabulary of spoken descriptions, confirmation, strikes, and timer feedback. The useful lesson is to make communication structured enough to work under stress.
- The GDC overview for The Neuroscience of Game Audio discusses startle response, reaction time, creature audio, emotional associations, and the damage caused by low-quality or unsynchronized audio.
- The GDC overview for A Plague Tale: Innocence frames audio as a way to strengthen scenes, support gameplay, help players focus, and understand a level.
- The GDC overview for The Division 2 covers ray-cast audio, near-field space estimation, early reflections, generated impulse responses, and procedural ambiences. Blind Run should not copy that technology, but it supports the principle that room acoustics can communicate space.
- MDN documents `PannerNode`, listener orientation, HRTF panning, distance models, rolloff, and source cones as the browser primitives for spatial audio.
- Game Accessibility Guidelines recommend distinct sounds for important events, separate volume controls, subtitles, visual communication, stereo/mono options, and audio description or voiced navigation where appropriate.

Sources: `sources.md` entries A2, A5, A6, A14, A15, A16, A17, A18, and A26.

## Design Decisions

### The Signal Stack

Use four layers, each with a different job:

1. **Room bed:** HVAC hum, fluorescent buzz, exterior rain, server fans, or vault resonance. This anchors the player in a place.
2. **Navigation landmarks:** a PA loop, relay click, water drip, rotating fan, or machine rhythm that identifies a room or corridor.
3. **Threat and objective emitters:** footsteps, camera motors, guard radio, alarm relay, keypad pulse, vent draft, and loot lock tone. These should have direction and distance.
4. **Decision stingers:** short non-spatial confirmations for scans, injury, detection, objective completion, elimination, victory, and defeat.

Do not let every layer compete at the same loudness. When speech plays, duck the room bed and non-critical effects. When danger rises, narrow the vocabulary instead of stacking more alerts.

### Audio Accessibility

- Every important sound has a caption or visual equivalent.
- Add speech, effects, ambience, and music sliders independently.
- Provide stereo/mono and reduced dynamic range options.
- TTS failure falls back to a local synthesized or text-only command.
- Do not require voice input, headphones, or perfect hearing to complete the round.
- Caption directional events as `GUARD: LEFT / NEAR` or `CAMERA: AHEAD / SWEEPING`, not as a paragraph.

## Event Matrix

| Event | Audio cue | Direction | Distance behavior | Intensity | Player interpretation |
| --- | --- | --- | --- | --- | --- |
| Enemy nearby | Irregular footstep/gear pulse with a low breath layer | From the enemy's position | Louder, brighter, and less filtered as distance closes | High | Turn, hide, or stop moving |
| Enemy far away | Sparse radio chirp or muffled steps | Broad direction only | Low-pass and slower cadence at distance | Low | Threat exists but is not immediate |
| Objective nearby | Two-tone beacon matched to the objective family | From the objective | Repetition rate increases near the target | Medium | Orient toward the useful landmark |
| Objective reached | Short three-note resolution plus tactile click | Centered | No distance modulation | Medium-high | The action registered |
| Wall collision | Material-specific dull impact | Local front/side | Immediate and dry | Low | Adjust heading and build a mental map |
| Player movement | Footstep loop chosen by material and speed | Local/centered | Volume and cadence track speed | Low-medium | Confirm movement and terrain |
| Player injured | Heartbeat, breath, and a brief filtered pulse | Centered | No direction; intensity follows HP | Medium-high | Slow down and seek recovery |
| Player detected | Alarm relay, camera tick, or guard radio burst | Source direction plus centered danger stinger | Source grows with detection confidence | High | Break line of sight or change route |
| Player hidden | Threat layer falls away, replaced by close breath and room bed | Centered | Calm returns gradually, never instantly | Low-medium | Hiding worked, but danger may remain |
| Ghost interaction | Reversed radio texture with a clean confirm tick | From the echo anchor | Fades with anchor distance | Medium | A bounded supernatural support action occurred |
| Spectator interaction | Comms chirp with room-coded pitch and sender name in text | Non-spatial comm channel | No distance modulation | Medium | A teammate has sent usable information |
| Round start | Radio boot, short briefing voice, then room bed | Centered | No distance modulation | Medium | The run has begun |
| Countdown | Metronomic pulse that accelerates at the final three beats | Centered | No distance modulation | Rising | Commit to the next action |
| Elimination | Audio bed cuts, low unresolved tone, then a short signal loss | Centered | No distance modulation | High | The living loop ended; a new role may begin |
| Victory | Clean ascending resolution with a quiet room tail | Centered | No distance modulation | Medium-high | Extraction succeeded |
| Defeat | Descending unresolved tone followed by diagnostic text | Centered | No distance modulation | Medium-high | The team should review and rematch |

## Implementation Direction

The first audio vertical slice should add only four spatial emitters: guard footsteps, camera motor, objective beacon, and vault/exit landmark. Use a browser `AudioListener` aligned to the thief camera and `PannerNode` or the three.js audio abstraction. Add captions and local fallbacks in the same change. More sounds without this semantic structure will produce noise, not tension.
