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
  } = useUsersInfo(Object.keys(message.reactions || {}));

  const [isReactionStatusOpened, setIsReactionStatusOpened] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsReactionStatusOpened(true)}
        className={`bg-dark-lighten border-dark absolute top-full flex -translate-y-1/2 cursor-pointer items-center gap-[2px] rounded-lg border px-2 text-sm ${
          position === "right"
            ? "right-8"
            : position === "left-tab"
            ? "left-[70px]"
            : "left-8"
        }`}
      >
        {Object.entries(
          Object.entries(message.reactions).reduce((acc, [key, value]) => {
            if (value) acc[value] = (acc[value] || 0) + 1;
            return acc;
          }, {} as { [key: number]: number })
        )
          .sort(([key1, value1], [key2, value2]) => value1 - value2)
          .slice(0, 3)
          .map(([key, value]) => (
            <img
              key={key}
              className="h-3 w-3"
              src={Object.entries(REACTIONS_UI)[Number(key) - 1][1].icon}
              alt=""
            />
          ))}

        <span>
          {
            Object.entries(message.reactions).filter(([key, value]) => value)
              .length
          }
        </span>
      </div>

      {isReactionStatusOpened && (
        <div
          onClick={() => setIsReactionStatusOpened(false)}
          className="animate-fade-in fixed top-0 left-0 z-20 flex h-full w-full items-center justify-center bg-[#00000080]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-dark flex h-96 w-screen max-w-[400px] flex-col rounded-lg"
          >
            <div className="border-dark-lighten flex shrink-0 items-center border-b p-4">
              <div className="flex-1"></div>
              <div className="flex-1">
                <h1 className="text-center text-2xl">Reactions</h1>
              </div>
              <div className="flex flex-1 justify-end">
                <button
                  onClick={() => setIsReactionStatusOpened(false)}
                  className="bg-dark-lighten flex h-8 w-8 items-center justify-center rounded-full transition duration-300 hover:brightness-125"
                >
                  <i className="bx bx-x text-3xl"></i>
                </button>
              </div>
            </div>

            {loading || error ? (
              <div className="flex grow items-center justify-center">
                <Spin />
              </div>
            ) : (
              <div className="grow overflow-y-auto overflow-x-hidden">
                {Object.entries(message.reactions)
                  .filter(([key, value]) => value)
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between px-5 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={IMAGE_PROXY(
                            usersInfo?.find((user) => user.id === key)?.data()
                              ?.photoURL
                          )}
                          alt=""
                        />
                        <p>
                          {
                            usersInfo?.find((user) => user.id === key)?.data()
                              ?.displayName
                          }
                        </p>
                      </div>

                      <img
                        className="h-5 w-5"
                        src={Object.values(REACTIONS_UI)[value - 1].icon}
                        alt=""
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReactionStatus;
