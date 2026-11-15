export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface ConversationInfo {
  users: string[];
  nicknames?: Record<string, string>;
  group?: {
    admins?: string[];
    groupName?: null | string;
    groupImage?: null | string;
  };
  seen: {
    [uid: string]: string;
  };
  updatedAt: FirestoreTimestamp | null;
  theme: string;
  defaultEmoji?: string;
  // Set while a call is ringing or in progress; prevents two calls at once
  activeCall?: ActiveCallRef | null;
}

export interface SavedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
}

export type MessageType =
  "text" | "image" | "file" | "sticker" | "removed" | "call";

export type CallType = "audio" | "video";

export type CallStatus =
  | "ringing"
  | "accepted"
  | "ended"
  | "declined"
  | "missed"
  | "cancelled"
  | "busy"
  | "failed";

export interface ActiveCallRef {
  callId: string;
  type: CallType;
  callerId: string;
}

export interface SessionDescription {
  type: RTCSdpType;
  sdp: string;
}

// calls/{callId}: signaling and lifecycle of one call
export interface CallData {
  conversationId: string;
  type: CallType;
  callerId: string;
  calleeId: string;
  // Everyone in the call; used by queries and security rules
  participants: string[];
  status: CallStatus;
  offer: SessionDescription;
  answer?: SessionDescription | null;
  // The callee tab that picked up, so the user's other tabs stop ringing
  answeredBy?: { uid: string; deviceId: string } | null;
  createdAt: FirestoreTimestamp | null;
  answeredAt?: FirestoreTimestamp | null;
  endedAt?: FirestoreTimestamp | null;
  endedBy?: string | null;
  // Client-set deadline. A ringing call expires unanswered; an active call is
  // kept alive by heartbeats. Past it, the call is treated as dead.
  expiresAt: FirestoreTimestamp;
}

export interface CallItem extends CallData {
  id: string;
}

export type CallOutcome = "completed" | "missed" | "declined" | "failed";

export interface CallLog {
  callId: string;
  callType: CallType;
  callerId: string;
  calleeId: string;
  outcome: CallOutcome;
  durationSec: number;
}

export interface MessageData {
  sender: string;
  content: string;
  isQuickEmoji?: boolean;
  replyTo?: string | null;
  file?: {
    name: string;
    size: number;
  } | null;
  // null while the server timestamp of a just-sent message is still pending
  createdAt: FirestoreTimestamp | null;
  type: MessageType;
  // Present on "call" messages
  call?: CallLog;
  reactions?: {
    [uid: string]: number;
  };
}

export interface MessageItem extends MessageData {
  id: string;
}

export interface StickerCollection {
  name: string;
  thumbnail: string;
  icon: string;
  id: string;
  stickers: {
    id: string;
    spriteURL: string;
  }[];
}

export type StickerCollections = StickerCollection[];

interface GiphyRendition {
  url: string;
  width?: string;
  height?: string;
}

export interface GiphyGif {
  id: string;
  title?: string;
  images: {
    original: GiphyRendition;
    fixed_height_small?: GiphyRendition;
    fixed_height?: GiphyRendition;
  };
}

export interface GiphyResponse {
  data: GiphyGif[];
}
