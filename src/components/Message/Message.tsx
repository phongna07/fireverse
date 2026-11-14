import AvatarFromId from "../Chat/AvatarFromId";
import ConfirmDialog from "../ConfirmDialog";
import { toast } from "../../store/toast";
import { FC, Fragment, memo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import {
  formatDate,
  formatFileSize,
  splitLinkFromMessage,
} from "../../shared/utils";

import ClickAwayListener from "../ClickAwayListener";
import { EMOJI_REGEX } from "../../shared/constants";
import FileIcon from "../FileIcon";
import ImageView from "../ImageView";
import { MessageItem } from "../../shared/types";
import ReactionPopup from "../Chat/ReactionPopup";
import ReactionStatus from "../Chat/ReactionStatus";
import ReplyBadge from "../Chat/ReplyBadge";
import ReplyIcon from "../Icon/ReplyIcon";
import SpriteRenderer from "../SpriteRenderer";
import { db } from "../../shared/firebase";
import { useConversationId } from "../../hooks/useConversationId";
import { useStore } from "../../store";

interface MessageProps {
  message: MessageItem;
  side: "left" | "right";
  showAvatar?: boolean;
  isGroup?: boolean;
  setReplyInfo: (value: MessageItem | null) => void;
}

const Message: FC<MessageProps> = ({
  message,
  side,
  showAvatar,
  isGroup,
  setReplyInfo,
}) => {
  const own = side === "right";
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isSelectReactionOpened, setIsSelectReactionOpened] = useState(false);

  const conversationId = useConversationId();

  const currentUser = useStore((state) => state.currentUser);

  const [isImageViewOpened, setIsImageViewOpened] = useState(false);

  const removeMessage = (messageId: string) => {
    updateDoc(
      doc(db, "conversations", conversationId as string, "messages", messageId),
      {
        type: "removed",
        file: null,
        content: "",
        reactions: {},
      },
    ).catch(() =>
      toast.error("Unable to remove the message. Please try again."),
    );
  };

  const formattedDate = formatDate(
    message.createdAt?.seconds ? message.createdAt?.seconds * 1000 : Date.now(),
  );

  return (
    <div id={`message-${message.id}`}>
      {confirmRemove && (
        <ConfirmDialog
          title="Remove message?"
          message="This message will be removed for everyone."
          confirmText="Remove"
          onClose={() => setConfirmRemove(false)}
          onConfirm={() => removeMessage(message.id)}
        />
      )}
      <div
        className={`-mb-2 flex px-4 ${own ? "justify-end" : isGroup ? "pl-[54px]" : ""}`}
      >
        {!!message.replyTo && (
          <ReplyBadge messageId={message.replyTo as string} />
        )}
      </div>
      <div
        onClick={(e) => {
          if (e.detail === 2 && message.type !== "removed") {
            setReplyInfo(message);
          }
        }}
        className={`group relative flex items-stretch gap-2 px-4 ${own ? "flex-row-reverse" : ""} ${
          Object.keys(message.reactions || {}).length > 0 ? "mb-2" : ""
        }`}
      >
        {!own && isGroup && (
          <div className="w-[30px] shrink-0 py-1">
            {showAvatar && <AvatarFromId uid={message.sender} />}
          </div>
        )}
        {message.type === "text" ? (
          <>
            {EMOJI_REGEX.test(message.content) ? (
              <div
                onClick={(e) => e.stopPropagation()}
                title={formattedDate}
                className="text-4xl"
              >
                {message.content}
              </div>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                title={formattedDate}
                className={`max-w-[min(75%,560px)] rounded-[20px] px-3 py-2 break-words text-white ${own ? "bg-primary" : "bg-dark-lighten"}`}
              >
                {splitLinkFromMessage(message.content).map((item, index) => (
                  <Fragment key={index}>
                    {typeof item === "string" ? (
                      <span>{item}</span>
                    ) : (
                      <a
                        className="mx-1 inline underline"
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.link}
                      </a>
                    )}
                  </Fragment>
                ))}
              </div>
            )}
          </>
        ) : message.type === "image" ? (
          <>
            <button
              aria-label="View image"
              className="max-w-[60%]"
              onClick={() => setIsImageViewOpened(true)}
            >
              <img
                loading="lazy"
                decoding="async"
                onClick={(e) => {
                  setIsImageViewOpened(true);
                  e.stopPropagation();
                }}
                title={formattedDate}
                className="max-h-96 w-auto cursor-pointer transition duration-300 hover:brightness-85"
                src={message.content}
                alt="Shared image"
              />
            </button>
            <ImageView
              src={message.content}
              isOpened={isImageViewOpened}
              setIsOpened={setIsImageViewOpened}
            />
          </>
        ) : message.type === "file" ? (
          <div
            onClick={(e) => e.stopPropagation()}
            title={formattedDate}
            className="flex items-center gap-2 overflow-hidden rounded-lg bg-dark-lighten px-5 py-3"
          >
            <FileIcon
              className="h-4 w-4 object-cover"
              extension={message.file?.name.split(".").slice(-1)[0] as string}
            />
            <div>
              <p className="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
                {message.file?.name}
              </p>

              <p className="text-sm text-gray-400">
                {formatFileSize(message.file?.size as number)}
              </p>
            </div>

            <a
              aria-label="Download file"
              href={message.content}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="bx bxs-download text-2xl"></i>
            </a>
          </div>
        ) : message.type === "sticker" ? (
          <SpriteRenderer
            onClick={(e) => e.stopPropagation()}
            title={formattedDate}
            src={message.content}
            size={130}
          />
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            title={formattedDate}
            className="rounded-lg border border-dark-lighten p-3 text-gray-400"
          >
            Message has been removed
          </div>
        )}

        {message.type !== "removed" && (
          <>
            <button
              aria-label="React to message"
              onClick={() => setIsSelectReactionOpened(true)}
              className="message-action text-lg text-gray-500 transition hover:text-gray-300"
            >
              <i className="bx bx-smile"></i>
            </button>

            <button
              aria-label="Reply to message"
              onClick={(e) => {
                setReplyInfo(message);
                e.stopPropagation();
              }}
              className="message-action text-gray-500 transition hover:text-gray-300"
            >
              <ReplyIcon />
            </button>

            {own && (
              <button
                aria-label="Remove message"
                onClick={(e) => {
                  setConfirmRemove(true);
                  e.stopPropagation();
                }}
                className="message-action text-lg text-gray-500 transition hover:text-gray-300"
              >
                <i className="bx bxs-trash"></i>
              </button>
            )}

            {isSelectReactionOpened && (
              <ClickAwayListener
                onClickAway={() => setIsSelectReactionOpened(false)}
              >
                {(ref) => (
                  <ReactionPopup
                    position={own ? "right" : "left"}
                    forwardedRef={ref}
                    setIsOpened={setIsSelectReactionOpened}
                    messageId={message.id as string}
                    currentReaction={
                      message.reactions?.[currentUser?.uid as string] || 0
                    }
                  />
                )}
              </ClickAwayListener>
            )}

            {Object.keys(message.reactions || {}).length > 0 && (
              <ReactionStatus
                message={message}
                position={own ? "right" : isGroup ? "left-tab" : "left"}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default memo(Message);
