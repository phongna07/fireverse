import { messageDoc } from "../../shared/collections";
import { FC } from "react";

import { toast } from "../../store/toast";
import { useDocumentQuery } from "../../hooks/useDocumentQuery";
import { useConversationId } from "../../hooks/useConversationId";

interface ReplyBadgeProps {
  messageId: string;
}

const ReplyBadge: FC<ReplyBadgeProps> = ({ messageId }) => {
  const conversationId = useConversationId();

  const { data, loading, error } = useDocumentQuery(
    `message-${messageId}`,
    messageDoc(conversationId as string, messageId),
  );

  if (loading || error)
    return <div className="h-10 w-20 rounded-lg bg-[#4E4F50]"></div>;

  return (
    <>
      <button
        aria-label="Go to original message"
        onClick={() => {
          const el = document.getElementById(`message-${messageId}`);
          if (el) el.scrollIntoView({ behavior: "smooth" });
          else toast.info("Scroll up to load the original message.");
        }}
        className="cursor-pointer rounded-lg bg-[#4E4F50] p-2 opacity-60"
      >
        {data?.data()?.type === "text" ? (
          <p>{data?.data()?.content}</p>
        ) : data?.data()?.type === "image" ? (
          "An image"
        ) : data?.data()?.type === "file" ? (
          "A file"
        ) : data?.data()?.type === "sticker" ? (
          "A sticker"
        ) : (
          "Message has been removed"
        )}
      </button>
    </>
  );
};

export default ReplyBadge;
