import { defineRoom, defineServer } from "colyseus";
import { HeistRoom } from "./match/HeistRoom";

type HealthResponse = {
  status: (code: number) => {
    json: (body: { ok: boolean; service: string }) => void;
  };
};

export const server = defineServer({
  greet: false,
  express: (app) => {
    app.get("/healthz", (_request: unknown, response: HealthResponse) => {
      response.status(200).json({ ok: true, service: "blind-run-match" });
    });
  },
  rooms: {
    heist: defineRoom(HeistRoom).filterBy(["code"]),
  },
});
