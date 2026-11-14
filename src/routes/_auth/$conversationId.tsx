import { FC, useEffect, useState } from "react";

import ConversationSettings from "../../components/Chat/ConversationSettings";
import ViewMedia from "../../components/Media/ViewMedia";
import Skeleton from "../../components/Skeleton";
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

  const [settingsOpened, setSettingsOpened] = useState(
    () => window.matchMedia("(min-width: 1200px)").matches,
  );
  const [mediaOpened, setMediaOpened] = useState(false);
  const [replyInfo, setReplyInfo] = useState<MessageItem | null>(null);

  useEffect(() => {
    if (conversation?.theme)
      document.body.style.setProperty("--primary-color", conversation.theme);
    return () => {
      document.body.style.removeProperty("--primary-color");
    };
  }, [conversation?.theme]);

  return (
    <div className="chat-workspace relative flex min-h-0 min-w-0 grow gap-3">
      <div className="chat-panel flex min-h-0 min-w-0 grow flex-col overflow-hidden">
        {loading ? (
          <>
            <div
              className="chat-header flex items-center gap-3 px-4 py-3"
              role="status"
              aria-label="Loading conversation"
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div
              className="flex grow flex-col justify-end gap-4 p-6"
              aria-hidden="true"
            >
              <Skeleton className="h-10 w-2/5 rounded-full" />
              <Skeleton className="h-16 w-3/5 self-end rounded-2xl" />
              <Skeleton className="h-10 w-1/3 rounded-full" />
            </div>
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
            <ChatHeader
              conversation={conversation}
              settingsOpened={settingsOpened}
              onToggleSettings={() => setSettingsOpened((opened) => !opened)}
            />
            <ChatView setReplyInfo={setReplyInfo} conversation={conversation} />
            <InputSection
              replyInfo={replyInfo}
              setReplyInfo={setReplyInfo}
              disabled={false}
            />
          </>
        )}
      </div>
      {settingsOpened &&
        conversation &&
        !loading &&
        !error &&
        conversation.users.includes(currentUser?.uid as string) && (
          <ConversationSettings
            conversation={conversation}
            setIsOpened={setSettingsOpened}
            setMediaViewOpened={setMediaOpened}
          />
        )}
      {mediaOpened && <ViewMedia setIsOpened={setMediaOpened} />}
    </div>
  );
};

export const Route = createFileRoute("/_auth/$conversationId")({
  component: () => {
    const { conversationId } = Route.useParams();
    return <Chat key={conversationId} id={conversationId} />;
  },
});
