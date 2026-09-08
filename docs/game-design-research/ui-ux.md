# UI/UX Research And Audit

## Research Basis

- Keep Talking uses a short role explanation, a clear defuser/expert split, and a recommended 2-4 player group. The lesson is to establish the social contract before the round.
- Among Us provides a clear role reveal, task framing, map/camera screens, meetings, and an official Guardian Angel post-death role. The lesson is to make state transitions visible and give eliminated players a bounded new purpose.
- Nielsen Norman Group's heuristics emphasize system status, match to the real world, user control, recognition over recall, minimalist information, recoverable errors, and contextual help.
- Game Accessibility Guidelines call for clear language, interactive tutorials, persistent objective/control reminders, distinct event sounds, visual multiplayer communication, captions, high contrast, and large touch targets.
- W3C WCAG guidance defines a 4.5:1 minimum contrast ratio for normal text and 3:1 for large text. This is a useful baseline even for stylized game overlays.
- Web.dev recommends about 48 device-independent pixels for touch targets and spacing between targets.

Sources: `sources.md` entries A2, A9, A26, A28, A29, and A30.

## Screen Audit

| Screen | Purpose | Information | Primary action | Visual hierarchy | Current problem | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| Landing page | Explain the fantasy and start a session | One thief, crew guidance, facility, controls | Play or join | Hero promise, visual, CTA | Strong paper/brutalist shell, but three cards stay narrow on phones and mascot overlap can obscure copy | Make the social contract the hero sentence and stack cards on small screens |
| Create room | Choose match size and create a code | Capacity, expected roles, privacy | Open room | Capacity choice, create CTA | Capacity is honest at 2-4 but does not explain why; older docs promise a larger crowd | Show role preview and explicitly state "one thief, up to three operators" |
| Join room | Enter a shared code | Code rules, name | Join | Code field, join CTA, error | Manual code only, weak length validation, no QR path | Add camera/QR join for the host and strict code feedback |
| QR flow | Remove friction for a group in one place | Room URL, scan state, fallback code | Scan or copy | QR image, short instruction | No QR screen or component exists | Generate QR from the actual room URL and retain copy/share fallback |
| Lobby | Confirm people and readiness | Room code, players, host, capacity, connection state | Start or leave | Player list, room code, start CTA | No strong role expectation, stale presence display, no rematch design | Show "waiting for X operators", connection state, and a role reveal preview |
| Countdown | Create anticipation and give time to orient | Seconds, role draw | Wait | Countdown, role hint | It is a small card inside the lobby and lacks a dramatic audio/visual transition | Use a short full-width transition with room identity, audio tick, and role reveal |
| Gameplay HUD | Keep the player oriented without solving the game | Objective, HP, alarm, inventory, score, map, comms | Move, interact, send/interpret information | Objective and current danger first | Too many panels compete; thief sees alarm/threat information that weakens blindness | Split critical state from optional telemetry and remove hidden security state from thief view |
| Death screen | Make failure understandable | Cause, score, next role | Continue, observe, rematch | Cause, new role, CTA | End card can appear for spectators and multiplayer has no useful action | Make the thief result and spectator result role-specific; offer observe/rematch/leave |
| Spectator mode | Give operators an active job | Room feed, discoveries, current channel, commands | Scan, mark, warn | Current channel and next action first | Seven cryptic commands, OFF AIR waiting, and puzzle scanning can feel detached from the thief | Show a contextual evidence board with confidence and two or three current actions |
| Game over | Close the round and preserve the social moment | Team result, route, loot, support score | Rematch or return | Result, team summary, rematch | Room can remain `playing`; no multiplayer rematch | Make result authoritative, show a short replay summary, and let the same group rematch |

## HUD Rules

- One primary objective, one current danger interpretation, one next action.
- Metrics such as score and intel should collapse or move into a secondary panel on mobile.
- The minimap should show enough structure to orient support players without exposing hidden security information to the thief.
- Use `LEFT`, `RIGHT`, and `FORWARD` only with a room-relative label and confidence context.
- Every command should show sent, received, acknowledged, expired, or ignored.
- Use red for active danger only. Do not use red for generic attention.
- Use icons plus text and shape. Do not encode role or state with color alone.

## UI Decision

The game should feel like a **live incident console**, not a SaaS dashboard. The console language should be sparse and urgent, with large role/objective typography, compact instrumentation, and meaningful transitions. The landing page can remain a printed case file if the transition into the dark runtime is framed as opening the facility feed.
