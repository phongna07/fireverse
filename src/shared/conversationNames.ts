import type { ConversationInfo, SavedUser } from "./types";

export const getMemberName = (
  conversation: Pick<ConversationInfo, "nicknames">,
  user: Pick<SavedUser, "uid" | "displayName">,
) =>
  conversation.nicknames?.[user.uid]?.trim() ||
  user.displayName ||
  "Unknown user";

export const getConversationName = (
  conversation: ConversationInfo,
  users: SavedUser[] | null,
  currentUid?: string,
) =>
  conversation.group?.groupName ||
  users
    ?.filter((user) => user.uid !== currentUid)
    .slice(0, 3)
    .map((user) => getMemberName(conversation, user))
    .join(", ") ||
  "Conversation";
