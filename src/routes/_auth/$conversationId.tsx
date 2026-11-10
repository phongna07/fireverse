import { FC, useEffect, useState } from "react";

import ChatHeader from "../../components/Chat/ChatHeader";
import ChatView from "../../components/Chat/ChatView";
import { ConversationInfo, MessageItem } from "../../shared/types";
import InputSection from "../../components/Input/InputSection";
import { conversationDoc } from "../../shared/collections";
import { useDocumentQuery } from "../../hooks/useDocumentQuery";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "../../store";

const Chat: FC<{ id: string }> = ({ id }) => {
  const { data, loading, error } = useDocumentQuery(
    `conversation-${id}`,
    conversationDoc(id),
  );

  const conversation = data?.data() as ConversationInfo;

  const currentUser = useStore((state) => state.currentUser);

  const [replyInfo, setReplyInfo] = useState<MessageItem | null>(null);

  useEffect(() => {
    if (conversation?.theme)
      document.body.style.setProperty("--primary-color", conversation.theme);
    return () => {
      document.body.style.removeProperty("--primary-color");
    };
  }, [conversation?.theme]);

  return (
    <div className="flex h-dvh min-w-0 grow flex-col items-stretch">
      {loading ? (
        <>
          <div className="h-20 border-b border-dark-lighten"></div>
          <div className="grow"></div>
          <InputSection disabled />
        </>
      ) : !conversation ||
        error ||
        !conversation.users.includes(currentUser?.uid as string) ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-6">
          <img
            loading="lazy"
            decoding="async"
            className="h-32 w-32 object-cover"
            src="/error.svg"
            alt=""
          />
          <p className="text-center text-lg">Conversation does not exists</p>
        </div>
      ) : (
        <>
          <ChatHeader conversation={conversation} />
          <ChatView setReplyInfo={setReplyInfo} conversation={conversation} />
          <InputSection
            replyInfo={replyInfo}
            setReplyInfo={setReplyInfo}
            disabled={false}
          />
        </>
      )}
    </div>
  );
};

export const Route = createFileRoute("/_auth/$conversationId")({
  component: () => {
    const { conversationId } = Route.useParams();
    return <Chat key={conversationId} id={conversationId} />;
  },
});
