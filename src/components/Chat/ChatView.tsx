import { ConversationInfo, MessageItem } from "../../shared/types";
import {
  FC,
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  doc,
  limitToLast,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import AvatarFromId from "./AvatarFromId";
import Message from "../Message/Message";
import { Spinner } from "../Loading";
import { db } from "../../shared/firebase";
import { messagesCollection } from "../../shared/collections";
import { useCollectionQuery } from "../../hooks/useCollectionQuery";
import { useConversationId } from "../../hooks/useConversationId";
import { useStore } from "../../store";

interface ChatViewProps {
  conversation: ConversationInfo;
  setReplyInfo: (value: MessageItem | null) => void;
}

const ChatView: FC<ChatViewProps> = ({ conversation, setReplyInfo }) => {
  const conversationId = useConversationId()!;
  const uid = useStore((state) => state.currentUser?.uid);
  const [limitCount, setLimitCount] = useState(20);
  const { data, loading, error, retry } = useCollectionQuery(
    `messages-${conversationId}-${limitCount}`,
    query(
      messagesCollection(conversationId),
      orderBy("createdAt"),
      limitToLast(limitCount),
    ),
    { keepPrevious: true },
  );
  const container = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const previousHeight = useRef<number | null>(null);
  const atBottom = useRef(true);
  const lastId = useRef<string | undefined>(undefined);
  const messages = useMemo(
    () => data?.docs.map((item) => ({ ...item.data(), id: item.id })) || [],
    [data],
  );
  const newestId = messages.at(-1)?.id;
  const seen = new Map<string, string[]>();
  for (const [user, messageId] of Object.entries(conversation.seen || {})) {
    if (user !== uid)
      seen.set(messageId, [...(seen.get(messageId) || []), user]);
  }

  useLayoutEffect(() => {
    const el = container.current;
    if (!el || loading) return;
    if (previousHeight.current !== null) {
      el.scrollTop += el.scrollHeight - previousHeight.current;
      previousHeight.current = null;
    } else if (atBottom.current && newestId !== lastId.current) {
      el.scrollTop = el.scrollHeight;
    }
    lastId.current = newestId;
  }, [data, loading, newestId]);

  useEffect(() => {
    if (
      !sentinel.current ||
      !container.current ||
      loading ||
      error ||
      !data ||
      data.size < limitCount
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || !container.current) return;
        previousHeight.current = container.current.scrollHeight;
        setLimitCount((count) => count + 20);
        observer.disconnect();
      },
      { root: container.current, rootMargin: "100px 0px 0px" },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [data, loading, error, limitCount]);

  useEffect(() => {
    const updateSeen = () => {
      if (
        !uid ||
        !newestId ||
        document.visibilityState !== "visible" ||
        conversation.seen?.[uid] === newestId
      )
        return;
      void updateDoc(doc(db, "conversations", conversationId), {
        [`seen.${uid}`]: newestId,
      }).catch(console.error);
    };
    updateSeen();
    window.addEventListener("focus", updateSeen);
    document.addEventListener("visibilitychange", updateSeen);
    return () => {
      window.removeEventListener("focus", updateSeen);
      document.removeEventListener("visibilitychange", updateSeen);
    };
  }, [uid, newestId, conversationId, conversation.seen]);

  return (
    <div
      ref={container}
      aria-label="Messages"
      className="min-h-0 grow overflow-y-auto overscroll-contain [overflow-anchor:none]"
      onScroll={() => {
        const el = container.current;
        if (el)
          atBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      }}
      onLoad={() => {
        const el = container.current;
        if (el && atBottom.current && previousHeight.current === null)
          el.scrollTop = el.scrollHeight;
      }}
    >
      <div className="flex min-h-full flex-col justify-end">
        <div ref={sentinel} className="h-px" />
        {loading && (
          <div className="flex justify-center py-3">
            <Spinner />
          </div>
        )}
        {error && (
          <div className="p-4 text-center">
            Unable to load messages.{" "}
            <button onClick={retry} className="text-primary">
              Retry
            </button>
          </div>
        )}
        {data?.empty && (
          <p className="p-4 text-center text-gray-400">
            No messages yet. Start chatting now.
          </p>
        )}
        <div className="flex flex-col items-stretch gap-3 pt-6 pb-2">
          {messages.map((message, index) => (
            <Fragment key={message.id}>
              <Message
                message={message}
                side={message.sender === uid ? "right" : "left"}
                isGroup={conversation.users.length > 2}
                showAvatar={messages[index - 1]?.sender !== message.sender}
                setReplyInfo={setReplyInfo}
              />
              {seen.has(message.id) && (
                <div className="flex justify-end gap-px px-8">
                  {seen.get(message.id)!.map((user) => (
                    <AvatarFromId key={user} uid={user} size={14} />
                  ))}
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ChatView;
