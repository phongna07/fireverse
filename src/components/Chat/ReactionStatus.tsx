import Modal from "../Modal";
import { FC, useState } from "react";
import { IMAGE_PROXY, REACTIONS_UI } from "../../shared/constants";

import { MessageItem } from "../../shared/types";
import { Spinner as Spin } from "../Loading";
import { useUsersInfo } from "../../hooks/useUsersInfo";

interface ReactionStatusProps {
  position: "left" | "right" | "left-tab";
  message: MessageItem;
}

const ReactionStatus: FC<ReactionStatusProps> = ({ message, position }) => {
  const {
    data: usersInfo,
    loading,
    error,
    retry,
  } = useUsersInfo(Object.keys(message.reactions || {}));

  const [isReactionStatusOpened, setIsReactionStatusOpened] = useState(false);

  return (
    <>
      <button
        aria-label="View reactions"
        onClick={() => setIsReactionStatusOpened(true)}
        className={`absolute top-full flex -translate-y-1/2 cursor-pointer items-center gap-[2px] rounded-lg border border-dark bg-dark-lighten px-2 text-sm ${
          position === "right"
            ? "right-8"
            : position === "left-tab"
              ? "left-[70px]"
              : "left-8"
        }`}
      >
        {Object.entries(
          Object.entries(message.reactions || {}).reduce(
            (acc, [key, value]) => {
              if (value) acc[value] = (acc[value] || 0) + 1;
              return acc;
            },
            {} as { [key: number]: number },
          ),
        )
          .sort(([key1, value1], [key2, value2]) => value2 - value1)
          .slice(0, 3)
          .map(([key, value]) => (
            <img
              loading="lazy"
              decoding="async"
              key={key}
              className="h-3 w-3"
              src={Object.entries(REACTIONS_UI)[Number(key) - 1][1].icon}
              alt=""
            />
          ))}

        <span>
          {
            Object.entries(message.reactions || {}).filter(
              ([key, value]) => value,
            ).length
          }
        </span>
      </button>

      {isReactionStatusOpened && (
        <Modal
          title="Reactions"
          onClose={() => setIsReactionStatusOpened(false)}
          maxWidth="max-w-[400px]"
        >
          {error ? (
            <p className="p-4 text-center">
              Unable to load reactions. <button onClick={retry}>Retry</button>
            </p>
          ) : loading ? (
            <div className="flex grow items-center justify-center">
              <Spin />
            </div>
          ) : (
            <div className="grow overflow-x-hidden overflow-y-auto">
              {Object.entries(message.reactions || {})
                .filter(([key, value]) => value)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-5 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        loading="lazy"
                        decoding="async"
                        className="h-10 w-10 rounded-full object-cover"
                        src={IMAGE_PROXY(
                          usersInfo?.find((user) => user.uid === key)?.photoURL,
                        )}
                        alt=""
                      />
                      <p>
                        {
                          usersInfo?.find((user) => user.uid === key)
                            ?.displayName
                        }
                      </p>
                    </div>

                    <img
                      loading="lazy"
                      decoding="async"
                      className="h-5 w-5"
                      src={Object.values(REACTIONS_UI)[value - 1].icon}
                      alt=""
                    />
                  </div>
                ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
};

export default ReactionStatus;
