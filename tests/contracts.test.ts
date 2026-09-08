import assert from "node:assert/strict";
import test from "node:test";
import { drawRoles, parseInputFrame } from "../packages/contracts/src";

test("parseInputFrame bounds untrusted movement and preserves valid controls", () => {
  const input = parseInputFrame({
    seq: 4,
    moveX: 8,
    moveZ: -3,
    yaw: 1.25,
    run: true,
    jump: false,
    interact: true,
  });

  assert.deepEqual(input, {
    seq: 4,
    moveX: 1,
    moveZ: -1,
    yaw: 1.25,
    run: true,
    jump: false,
    interact: true,
  });
});

test("parseInputFrame rejects missing or unsafe sequence numbers", () => {
  assert.equal(parseInputFrame({ moveX: 0 }), null);
  assert.equal(parseInputFrame({ seq: -1 }), null);
  assert.equal(parseInputFrame({ seq: Number.MAX_SAFE_INTEGER + 1 }), null);
});

test("drawRoles is deterministic and assigns exactly one thief", () => {
  const first = drawRoles(["b", "a", "c"], 1234);
  const second = drawRoles(["c", "b", "a"], 1234);

  assert.deepEqual([...first.entries()], [...second.entries()]);
  assert.equal([...first.values()].filter((role) => role === "thief").length, 1);
});
