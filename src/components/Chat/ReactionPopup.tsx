import { toast } from "../../store/toast";
import { FC, RefObject, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { doc, updateDoc } from "firebase/firestore";

import { REACTIONS_UI } from "../../shared/constants";
import { db } from "../../shared/firebase";
import { useConversationId } from "../../hooks/useConversationId";
import { useStore } from "../../store";

interface ReactionPopupProps {
  forwardedRef: RefObject<HTMLDivElement | null>;
  anchorRef: RefObject<HTMLButtonElement | null>;
  setIsOpened: (value: boolean) => void;
  messageId: string;
  currentReaction: number;
}

const ReactionPopup: FC<ReactionPopupProps> = ({
  forwardedRef,
  anchorRef,
  setIsOpened,
  messageId,
  currentReaction,
}) => {
  const conversationId = useConversationId();

  const currentUser = useStore((state) => state.currentUser);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const popup = forwardedRef.current;
    if (!anchor || !popup) return;

    const messageList = anchor.closest("[data-message-list]");
    const updatePosition = () => {
      const button = anchor.getBoundingClientRect();
      const panel = popup.getBoundingClientRect();
      const bounds = messageList?.getBoundingClientRect();
      const leftEdge = Math.max(0, bounds?.left ?? 0) + 8;
      const rightEdge =
        Math.min(window.innerWidth, bounds?.right ?? window.innerWidth) - 8;
      const centeredLeft = button.left + button.width / 2 - panel.width / 2;
      const topEdge = Math.max(0, bounds?.top ?? 0) + 8;
      const above = button.top - panel.height - 5;

      setPosition({
        left: Math.max(
          leftEdge,
          Math.min(centeredLeft, rightEdge - panel.width),
        ),
        top: Math.max(
          8,
          Math.min(
            above >= topEdge ? above : button.bottom + 5,
            window.innerHeight - panel.height - 8,
          ),
        ),
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    const observer = new ResizeObserver(updatePosition);
    observer.observe(anchor);
    observer.observe(popup);
    if (messageList) observer.observe(messageList);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      observer.disconnect();
    };
  }, [anchorRef, forwardedRef]);

  const updateReaction = (value: number) => {
    updateDoc(
      doc(db, "conversations", conversationId as string, "messages", messageId),
      {
        [`reactions.${currentUser?.uid}`]: value,
      },
    ).catch(() =>
      toast.error("Could not update your reaction. Please try again."),
    );
  };

  return createPortal(
    <div
      ref={forwardedRef}
      onClick={(event) => event.stopPropagation()}
      style={{
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        visibility: position ? "visible" : "hidden",
      }}
      className="fixed z-50 flex w-max max-w-[calc(100vw-16px)] animate-fade-in gap-1 rounded-full bg-dark-lighten p-[6px] shadow"
    >
      {Object.entries(REACTIONS_UI).map(([key, value], index) => (
        <div
          key={key}
          className={`${
            index + 1 === currentReaction
              ? "relative after:absolute after:top-full after:left-1/2 after:h-[5px] after:w-[5px] after:-translate-x-1/2 after:rounded-full after:bg-primary"
              : ""
          }`}
        >
          <button
            aria-label={key}
            aria-pressed={index + 1 === currentReaction}
            onClick={() => {
              if (index + 1 === currentReaction) updateReaction(0);
              else updateReaction(index + 1);
              setIsOpened(false);
            }}
          >
            <img
              loading="lazy"
              decoding="async"
              title={key}
              className={`h-7 w-7 origin-bottom cursor-pointer transition duration-300 hover:scale-[115%]`}
              src={value.icon}
              alt=""
            />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
};

export default ReactionPopup;
