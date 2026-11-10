import { limitToLast, onSnapshot, orderBy, query } from "firebase/firestore";

import { formatTimestamp } from "../shared/utils";
import { messagesCollection } from "../shared/collections";
import { useSubscription } from "./useSubscription";

interface LastMessage {
  lastMessageId: string | null;
  message: string;
}

const MAX_LENGTH = 30;

export const useLastMessage = (conversationId: string) =>
  useSubscription<LastMessage>(
    `last-message-${conversationId}`,
    (onNext, onError) =>
      onSnapshot(
        query(
          messagesCollection(conversationId),
          orderBy("createdAt"),
          limitToLast(1),
        ),
        (snapshot) => {
          const lastDoc = snapshot.docs[0];

          if (!lastDoc)
            return onNext({
              lastMessageId: null,
              message: "No message recently",
            });

          const message = lastDoc.data();

          const text =
            message.type === "image"
              ? "An image"
              : message.type === "file"
                ? `File: ${message.file?.name.split(".").slice(-1)[0]}`
                : message.type === "sticker"
                  ? "A sticker"
                  : message.type === "removed"
                    ? "Message removed"
                    : message.content || "";

          const formattedDate = formatTimestamp(message.createdAt);
          const maxLength = MAX_LENGTH - formattedDate.length;

          onNext({
            lastMessageId: lastDoc.id,
            message: `${
              text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
            } • ${formattedDate}`,
          });
        },
        onError,
      ),
  );
