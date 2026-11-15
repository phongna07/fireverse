import assert from "node:assert/strict";
import test from "node:test";
import {
  getConversationName,
  getMemberName,
} from "../src/shared/conversationNames.ts";

const users = [
  { uid: "me", displayName: "My profile" },
  { uid: "other", displayName: "Other profile" },
  { uid: "third", displayName: "Third profile" },
];
const conversation = { users: users.map((user) => user.uid) };

test("nicknames are scoped to a conversation and include the current member", () => {
  const renamed = {
    ...conversation,
    nicknames: { me: "My nickname", other: "Buddy" },
  };
  assert.equal(getMemberName(renamed, users[0]), "My nickname");
  assert.equal(getMemberName(renamed, users[1]), "Buddy");
  assert.equal(getMemberName(conversation, users[1]), "Other profile");
});

test("missing and cleared nicknames fall back to the profile name", () => {
  for (const nickname of [undefined, "", "  "]) {
    assert.equal(
      getMemberName({ nicknames: { other: nickname } }, users[1]),
      "Other profile",
    );
  }
  assert.equal(
    getMemberName({}, { uid: "missing", displayName: null }),
    "Unknown user",
  );
});

test("direct and unnamed group titles use nicknames and exclude the viewer", () => {
  const renamed = {
    ...conversation,
    nicknames: { me: "Me", other: " Buddy " },
  };
  assert.equal(getConversationName(renamed, users.slice(0, 2), "me"), "Buddy");
  assert.equal(
    getConversationName(renamed, users, "me"),
    "Buddy, Third profile",
  );
  assert.equal(
    getConversationName(renamed, users, "other"),
    "Me, Third profile",
  );
});

test("custom group names take precedence and unresolved members have a fallback", () => {
  assert.equal(
    getConversationName(
      {
        ...conversation,
        group: { groupName: "Our group" },
        nicknames: { other: "Buddy" },
      },
      users,
      "me",
    ),
    "Our group",
  );
  assert.equal(getConversationName(conversation, null, "me"), "Conversation");
});
