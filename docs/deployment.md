# Deployment

Blind Run's authoritative multiplayer deployment is split into a frontend and a long-lived
Colyseus match service.

## Frontend

Build and run the Next.js application with:

```bash
npm ci
npm run build
npm run start
```

Required public variables:

```text
NEXT_PUBLIC_MATCH_TRANSPORT=colyseus
NEXT_PUBLIC_COLYSEUS_URL=https://match.example.com
```

The URL must be the public HTTPS origin of the Colyseus service. The browser client uses the
corresponding secure WebSocket endpoint for the room connection.

## Match Service

Run the same server entrypoint in development and production:

```bash
npm ci
npm run server:start
```

The process listens on `HOST` and `PORT` and exposes:

```text
GET /healthz
```

The default values are `HOST=0.0.0.0` and `PORT=2567`. Production platforms should inject their
own `PORT` and use `/healthz` for readiness checks. The process handles `SIGINT` and `SIGTERM`
through Colyseus graceful shutdown so active rooms are not abandoned during a normal restart.

## Environment

`.env.example` contains the complete variable names without credentials. Provider secrets belong in
the deployment platform, not in git. `NEXT_PUBLIC_COLYSEUS_URL` has a localhost fallback only in
development; a production build fails clearly instead of silently trying to connect to localhost.

The match service must be a persistent WebSocket-capable process. Do not deploy it as a stateless
serverless function: active room state and the fixed-timestep simulation live in that process.

## Smoke Checks

Before switching traffic:

1. Fetch `/healthz` and verify HTTP 200.
2. Open the frontend from a different device or network.
3. Create a full Crew room and verify the countdown and role draw.
4. Complete the keycard, keypad, loot, and vent route.
5. Disconnect a spectator briefly and verify the same seat rejoins.
6. Send `SIGTERM` to the match process and verify the platform restarts it cleanly.
