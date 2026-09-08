# Recommendations And Hackathon Priorities

## Design Verdict

Blind Run has a real hook: one player is physically inside a facility while other players see a different truth and must help through communication. The hook is stronger than the current presentation because the runtime still behaves like a conventional low-poly stealth prototype with a command overlay. The next pass should make the information split, audio, and support agency unavoidable in the first minute.

Do not spend the next pass on generic polish first. If the thief can see the threat state, if commands do not matter, or if the round cannot finish and rematch, better materials will only make the prototype more expensive to misunderstand.

## Scorecard

| Category | Score | Honest assessment |
| --- | ---: | --- |
| Character design | 3/10 | The thief and guards are readable primitives, but there is no memorable silhouette, personality, cast differentiation, or death/echo language. |
| Environment | 5/10 | The fixed facility has a clear route and functional rooms, but room identity, landmarks, cover, and environmental storytelling are thin. |
| Gameplay | 6/10 | The heist route, pickups, detection, puzzle discovery, and extraction are playable; commands are not yet sufficiently causal and the route is mostly linear. |
| Audio | 2/10 | TTS and UI tones prove the communication idea, but there is no world soundscape, spatial threat language, ambience, or robust fallback. |
| UI/UX | 5/10 | There is substantial HUD and lobby work, but hierarchy, role transitions, network recovery, mobile onboarding, and rematch are incomplete. |
| Spectator experience | 5/10 | Fixed-room watching and discovery are a promising differentiator, but the action loop is shallow, the channel is narrow, and no ghost role exists. |
| Mobile | 4/10 | A touch prototype exists, but sprint, safe areas, onboarding, input hit regions, and readable spectator actions need work. |
| Visual identity | 5/10 | The landing page has personality and the runtime has a workable palette, but the product shell and game world are not yet one deliberate language. |
| Polish | 4/10 | The prototype has many visible systems, but stale docs, schema drift, rejected power-ups, room lifecycle bugs, and misleading end states threaten a live demo. |
| Demo impact | 7/10 | The premise is easy to explain and naturally social; a reliable four-device run with strong sound could be memorable. |

**Current design score: 46/100**

## Priority Matrix

| Priority | Recommendation | Player impact | Demo impact | Effort | Technical risk | Uniqueness | Time |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| P0 | Make hidden information actually hidden | 5 | 5 | 4 | 5 | 5 | 2-4 days |
| P0 | Add a four-event spatial audio vertical slice | 5 | 5 | 3 | 3 | 5 | 1-3 days |
| P0 | Make commands causal, contextual, and acknowledged | 5 | 5 | 3 | 4 | 5 | 1-3 days |
| P0 | Repair authoritative round end, reconnect, and rematch | 5 | 5 | 4 | 5 | 3 | 2-4 days |
| P0 | Fix mobile onboarding, sprint, safe areas, and HUD interception | 4 | 4 | 2 | 2 | 3 | 1-2 days |
| P1 | Give the thief a Signal Runner silhouette and state animation | 4 | 5 | 3 | 2 | 4 | 1-3 days |
| P1 | Give each existing room a landmark, sound, and gameplay identity | 4 | 4 | 3 | 3 | 4 | 1-3 days |
| P1 | Replace generic spectator buttons with an evidence/decision board | 5 | 5 | 3 | 4 | 5 | 2-4 days |
| P1 | Add one quiet/noisy route choice and readable cover pocket | 4 | 4 | 4 | 3 | 4 | 2-4 days |
| P2 | Add one bounded Signal Echo ability after death | 3 | 4 | 4 | 4 | 5 | 3-5 days |
| P2 | Add small map and evidence variation | 3 | 3 | 4 | 3 | 3 | 3-5 days |
| P3 | Build a 20-player single-room role model | 3 | 4 | 5 | 5 | 4 | Not before submission |
| P3 | Add full progression, cosmetics, and large content libraries | 2 | 2 | 5 | 4 | 2 | Not before submission |

## P0 - Must Implement

### 1. Restore The Information Boundary

The thief must not receive guard/camera locations, hidden-object data, or an exact security-state explanation simply because the renderer hides some of it. Redact state at the transport boundary and remove physical security meshes from the thief view when the premise requires them to be unseen.

### 2. Make Audio A Gameplay System

Implement guard footsteps, camera motor, objective beacon, and vault/exit landmark first. Add captions, separate volume controls, and a local fallback. This is the highest-identity change available within the current primitive-geometry budget.

### 3. Make Commands Matter

Replace the broad seven-button deck with two or three context-sensitive suggestions. Every command should have a sender, channel, delivery state, cooldown, and clear consequence. If the command remains advisory, make that explicit and design the thief's decision around it.

### 4. Make A Round Actually End

When the thief escapes or goes down, the server must transition the room, preserve the result, show a role-correct result screen, and offer rematch or leave. Add a reconnect policy that does not turn one spectator's temporary network problem into a dead match.

### 5. Make Mobile A First-Class Role

Provide mobile onboarding, sprint, safe-area padding, non-blocking look controls, readable command labels, and a performance profile. A four-device hackathon demo will likely include phones; this is demo reliability, not optional polish.

## P1 - High Value

### 6. Establish Signal Runner

Use the recommended original silhouette and add listening idle, run, alert, injury, interaction, and extraction states. The player should be recognizable in the spectator view and landing art without needing a detailed model.

### 7. Give The Three Rooms Identity

Make Intake, Security Control, and Vault Chamber visually, acoustically, and mechanically distinct. Security Control is the best first target because it already contains the keycard, camera, guard, alarm, and discovery loop.

### 8. Redesign Spectator Decisions

Use an evidence board with object, direction, confidence, last-seen time, and current action. Fix the power-up reducer path or remove the controls until they work. A spectator should understand how their action helps within ten seconds.

### 9. Add One Route Choice

Create a short/fast/noisy option and a long/quiet/information-rich option. Add a cover pocket and a landmark so stopping is a decision, not dead time.

## P2 - Nice To Have

### 10. Add A Bounded Signal Echo

After the live operator loop works, let a downed player spend one or two charges on discovered-anchor support. Keep the echo stationary or anchor-based for the first version.

## P3 - Do Not Touch Before Submission

- Do not turn one room into a 20-player match by raising a constant.
- Do not build a large free-roaming ghost system.
- Do not add full player progression, cosmetics, account inventory, or a content-heavy procedural map system.
- Do not replace the current renderer with a large asset pipeline before the information and audio loops are reliable.
- Do not add server-authoritative Rapier simulation and a new network architecture in the same hackathon pass as visual redesign unless multiplayer reliability is the explicit submission goal.

## Top 10 Changes That Would Make Blind Run Feel Like A Real, Polished Game

1. Hide security information at the data and rendering boundary.
2. Add directional guard, camera, objective, and extraction audio with captions.
3. Make spectator commands contextual, causal, acknowledged, and rate-limited.
4. Make escape/death authoritative and add a working multiplayer rematch.
5. Give the thief a Signal Runner silhouette and state-specific animation.
6. Give Intake, Security, and Vault distinct landmarks, materials, light, and sound.
7. Add one meaningful quiet-versus-fast route choice with cover.
8. Replace the spectator button wall with an evidence-and-confidence decision board.
9. Make mobile controls and onboarding role-correct, safe-area aware, and readable.
10. Make the paper case-file shell and dark facility feed feel like one Signal Noir product.
