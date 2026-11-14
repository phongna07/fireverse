import { conversationsCollection } from "../../shared/collections";
import { DEFAULT_AVATAR, IMAGE_PROXY } from "../../shared/constants";
import { FC, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { orderBy, query, where } from "firebase/firestore";

import ClickAwayListener from "../ClickAwayListener";
import { ConversationInfo } from "../../shared/types";
import CreateConversation from "./CreateConversation";
import SelectConversation from "./SelectConversation";
import Skeleton from "../Skeleton";
import UserInfo from "./UserInfo";
import { auth } from "../../shared/firebase";
import { signOut } from "firebase/auth";
import { useCollectionQuery } from "../../hooks/useCollectionQuery";
import { useStore } from "../../store";

const SideBar: FC = () => {
  const currentUser = useStore((state) => state.currentUser);

  const [isDropdownOpened, setIsDropdownOpened] = useState(false);
  const [createConversationOpened, setCreateConversationOpened] =
    useState(false);
  const [isUserInfoOpened, setIsUserInfoOpened] = useState(false);

  const { data, error, loading, retry } = useCollectionQuery(
    `conversations-${currentUser?.uid}`,
    query(
      conversationsCollection,
      orderBy("updatedAt", "desc"),
      where("users", "array-contains", currentUser?.uid),
    ),
  );

  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <>
      <div
        className={`conversation-list shrink-0 overflow-x-hidden overflow-y-auto ${
          pathname !== "/"
            ? "hidden w-[350px] md:block!"
            : "w-full md:w-[350px]!"
        }`}
      >
        <div className="flex h-20 items-center justify-between gap-3 px-5">
          <Link to="/" className="flex items-center gap-3">
            <img
              loading="lazy"
              decoding="async"
              className="h-8 w-8"
              src="/icon.svg"
              alt=""
            />
            <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateConversationOpened(true)}
              aria-label="New conversation"
              className="icon-button bg-dark-lighten"
            >
              <i className="bx bxs-edit text-xl"></i>
            </button>

            <ClickAwayListener onClickAway={() => setIsDropdownOpened(false)}>
              {(ref) => (
                <div ref={ref} className="relative z-10">
                  <button
                    aria-label="Profile menu"
                    aria-expanded={isDropdownOpened}
                    onClick={() => setIsDropdownOpened((prev) => !prev)}
                  >
                    <img
                      loading="lazy"
                      decoding="async"
                      className="h-8 w-8 cursor-pointer rounded-full object-cover"
                      src={
                        currentUser?.photoURL
                          ? IMAGE_PROXY(currentUser.photoURL)
                          : DEFAULT_AVATAR
                      }
                      alt=""
                    />
                  </button>

                  <div
                    className={`absolute top-full right-0 flex w-max origin-top-right flex-col items-stretch overflow-hidden rounded-md border border-dark-lighten bg-dark py-1 shadow-lg transition-all duration-200 ${
                      isDropdownOpened
                        ? "visible scale-100 opacity-100"
                        : "invisible scale-0 opacity-0"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setIsUserInfoOpened(true);
                        setIsDropdownOpened(false);
                      }}
                      className="flex items-center gap-1 px-3 py-1 transition duration-300 hover:bg-dark-lighten"
                    >
                      <i className="bx bxs-user text-xl"></i>
                      <span className="whitespace-nowrap">Profile</span>
                    </button>
                    <button
                      onClick={() => signOut(auth)}
                      className="flex items-center gap-1 px-3 py-1 transition duration-300 hover:bg-dark-lighten"
                    >
                      <i className="bx bx-log-out text-xl"></i>
                      <span className="whitespace-nowrap">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </ClickAwayListener>
          </div>
        </div>

        {loading ? (
          <div
            className="flex flex-col gap-5 p-5"
            role="status"
            aria-label="Loading conversations"
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="flex items-center gap-3"
                aria-hidden="true"
              >
                <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
                <div className="flex grow flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="my-6 flex justify-center">
            <p className="text-center">
              Unable to load conversations.{" "}
              <button onClick={retry}>Retry</button>
            </p>
          </div>
        ) : data?.empty ? (
          <div className="my-6 flex flex-col items-center justify-center">
            <p className="text-center">No conversation found</p>
            <button
              onClick={() => setCreateConversationOpened(true)}
              className="text-center text-primary"
            >
              Create one
            </button>
          </div>
        ) : (
          <div>
            {data?.docs.map((item) => (
              <SelectConversation
                key={item.id}
                conversation={item.data() as ConversationInfo}
                conversationId={item.id}
              />
            ))}
          </div>
        )}
      </div>

      {createConversationOpened && (
        <CreateConversation setIsOpened={setCreateConversationOpened} />
      )}

      <UserInfo isOpened={isUserInfoOpened} setIsOpened={setIsUserInfoOpened} />
    </>
  );
};

export default SideBar;
