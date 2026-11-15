import assert from "node:assert/strict";
import test from "node:test";
import {
  describeCall,
  formatCallDuration,
  isCallAlive,
  resolveEnd,
} from "../src/calls/callLogic.ts";

const at = (ms) => ({
  seconds: Math.floor(ms / 1000),
  nanoseconds: (ms % 1000) * 1e6,
});

test("a call is alive only while ringing or accepted and not expired", () => {
  const now = 1_000_000;
  assert.equal(
    isCallAlive({ status: "ringing", expiresAt: at(now + 1) }, now),
    true,
  );
  assert.equal(
    isCallAlive({ status: "accepted", expiresAt: at(now + 1) }, now),
    true,
  );
  // Abandoned: the caller's tab closed and nobody refreshed the deadline
  assert.equal(
    isCallAlive({ status: "ringing", expiresAt: at(now - 1) }, now),
    false,
  );
  assert.equal(
    isCallAlive({ status: "ended", expiresAt: at(now + 1) }, now),
    false,
  );
});

test("ending a ringing call records why it was not answered", () => {
  assert.deepEqual(resolveEnd("ringing", "declined", false), {
    status: "declined",
    outcome: "declined",
  });
  assert.deepEqual(resolveEnd("ringing", "missed", false), {
    status: "missed",
    outcome: "missed",
  });
  assert.deepEqual(resolveEnd("ringing", "busy", false), {
    status: "busy",
    outcome: "missed",
  });
  // The caller hanging up before an answer is a missed call for the callee
  assert.deepEqual(resolveEnd("ringing", "hangup", false), {
    status: "cancelled",
    outcome: "missed",
  });
});

test("ending an accepted call distinguishes failures from completed calls", () => {
  assert.deepEqual(resolveEnd("accepted", "failed", false), {
    status: "failed",
    outcome: "failed",
  });
  // Connection lost after talking: still a completed call
  assert.deepEqual(resolveEnd("accepted", "failed", true), {
    status: "ended",
    outcome: "completed",
  });
  assert.deepEqual(resolveEnd("accepted", "hangup", true), {
    status: "ended",
    outcome: "completed",
  });
});

test("call durations format as m:ss or h:mm:ss", () => {
  assert.equal(formatCallDuration(0), "0:00");
  assert.equal(formatCallDuration(65.9), "1:05");
  assert.equal(formatCallDuration(3600 + 2 * 60 + 3), "1:02:03");
  assert.equal(formatCallDuration(-5), "0:00");
});

test("call logs read differently for the caller and the callee", () => {
  const missed = {
    callId: "c",
    callType: "video",
    callerId: "me",
    calleeId: "other",
    outcome: "missed",
    durationSec: 0,
  };
  assert.deepEqual(describeCall(missed, "me"), {
    title: "Video call",
    subtitle: "No answer",
    isMissed: false,
  });
  assert.equal(describeCall(missed, "other").title, "Missed video call");
  assert.equal(describeCall(missed, "other").isMissed, true);

  const completed = {
    ...missed,
    callType: "audio",
    outcome: "completed",
    durationSec: 125,
  };
  assert.equal(describeCall(completed, "other").subtitle, "2:05");
});
