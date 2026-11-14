import { FC, useState } from "react";

import { ConversationInfo } from "../../shared/types";
import { IMAGE_PROXY } from "../../shared/constants";
import { Link } from "@tanstack/react-router";
import Skeleton from "../Skeleton";
import ViewGroup from "../Group/ViewGroup";
import { useStore } from "../../store";
import { useUsersInfo } from "../../hooks/useUsersInfo";

interface ChatHeaderProps {
  conversation: ConversationInfo;
  settingsOpened: boolean;
  onToggleSettings: () => void;
}

const ChatHeader: FC<ChatHeaderProps> = ({
  conversation,
  settingsOpened,
  onToggleSettings,
}) => {
  const { data: users, loading } = useUsersInfo(conversation.users);
  const currentUser = useStore((state) => state.currentUser);

  const filtered = users?.filter((user) => user.uid !== currentUser?.uid);

  const [isGroupMembersOpened, setIsGroupMembersOpened] = useState(false);

  return (
    <>
      <div className="chat-header flex shrink-0 items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 grow items-center gap-3">
          <Link to="/" aria-label="Back to conversations" className="md:hidden">
            <i className="bx bxs-chevron-left text-3xl text-primary"></i>
          </Link>
          {loading ? (
            <Skeleton className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <>
              {conversation.users.length === 2 ? (
                <img
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                  src={IMAGE_PROXY(filtered?.[0]?.photoURL)}
                  alt=""
                />
              ) : (
                <>
                  {conversation?.group?.groupImage ? (
                    <img
                      loading="lazy"
                      decoding="async"
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                      src={conversation.group.groupImage}
                      alt=""
                    />
                  ) : (
                    <div className="relative h-10 w-10 shrink-0">
                      <img
                        loading="lazy"
                        decoding="async"
                        className="absolute top-0 right-0 h-7 w-7 shrink-0 rounded-full object-cover"
                        src={IMAGE_PROXY(filtered?.[0]?.photoURL)}
                        alt=""
                      />
                      <img
                        loading="lazy"
                        decoding="async"
                        className={`absolute bottom-0 left-0 z-1 h-7 w-7 shrink-0 rounded-full border-2 border-dark object-cover transition duration-300`}
                        src={IMAGE_PROXY(filtered?.[1]?.photoURL)}
                        alt=""
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {loading ? (
            <Skeleton className="h-6 w-1/4" />
          ) : (
            <p className="truncate font-semibold">
              {conversation.users.length > 2 && conversation?.group?.groupName
                ? conversation.group.groupName
                : filtered
                    ?.map((user) => user.displayName)
                    .slice(0, 3)
                    .join(", ")}
            </p>
          )}
        </div>

        {!loading && (
          <>
            {conversation.users.length > 2 && (
              <button
                className="icon-button text-primary"
                aria-label="View group members"
                onClick={() => setIsGroupMembersOpened(true)}
              >
                <i className="bx bxs-group text-2xl text-primary"></i>
              </button>
            )}

            <button
              className="icon-button text-primary"
              aria-label="Conversation settings"
              aria-expanded={settingsOpened}
              aria-controls="conversation-settings"
              onClick={onToggleSettings}
            >
              <i className="bx bxs-info-circle text-2xl text-primary"></i>
            </button>
          </>
        )}
      </div>

      {isGroupMembersOpened && (
        <ViewGroup
          setIsOpened={setIsGroupMembersOpened}
          conversation={conversation}
        />
      )}
    </>
  );
};

export default ChatHeader;
