import { toast } from "../../store/toast";
import { ConversationInfo } from "../../shared/types";
import { FC } from "react";
import { arrayRemove, doc, updateDoc } from "firebase/firestore";

import { IMAGE_PROXY } from "../../shared/constants";
import { Spinner as Spin } from "../Loading";
import { db } from "../../shared/firebase";
import { useConversationId } from "../../hooks/useConversationId";
import { useStore } from "../../store";
import { useUsersInfo } from "../../hooks/useUsersInfo";

interface AdminProps {
  conversation: ConversationInfo;
}

const Admin: FC<AdminProps> = ({ conversation }) => {
  const conversationId = useConversationId();

  const currentUser = useStore((state) => state.currentUser);

  const { data, loading, error, retry } = useUsersInfo(
    conversation.group?.admins as string[],
  );

  const handleRemoveAdminPosition = (uid: string) => {
    updateDoc(doc(db, "conversations", conversationId as string), {
      "group.admins": arrayRemove(uid),
    }).catch(() =>
      toast.error("Unable to update the admin. Please try again."),
    );
  };

  if (error)
    return (
      <p className="p-4 text-center">
        Unable to load members. <button onClick={retry}>Retry</button>
      </p>
    );

  if (loading)
    return (
      <div className="flex h-80 items-center justify-center">
        <Spin />
      </div>
    );

  return (
    <div className="flex h-80 flex-col items-stretch gap-4 overflow-x-hidden overflow-y-auto py-4">
      {data?.map((user) => (
        <div key={user.uid} className="flex items-center gap-3 px-4">
          <img
            loading="lazy"
            decoding="async"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
            src={IMAGE_PROXY(user.photoURL)}
            alt=""
          />

          <div className="grow">
            <h1>{user.displayName}</h1>
          </div>

          {conversation.group?.admins?.includes(currentUser?.uid as string) &&
            user.uid !== currentUser?.uid && (
              <div className="group relative shrink-0" tabIndex={0}>
                <button aria-label="Member actions">
                  <i className="bx bx-dots-horizontal-rounded text-2xl"></i>
                </button>

                <div className="invisible absolute top-full right-0 z-1 flex w-max flex-col items-stretch rounded-lg border border-dark-lighten bg-dark-lighten py-1 opacity-0 transition-all duration-300 group-focus-within:visible! group-focus-within:opacity-100!">
                  <button
                    onClick={() => handleRemoveAdminPosition(user.uid)}
                    className="flex items-center gap-1 bg-dark-lighten px-3 py-1 transition duration-300 hover:brightness-125"
                  >
                    <i className="bx bx-user-x text-2xl"></i>
                    <span>Remove admin position</span>
                  </button>
                </div>
              </div>
            )}
        </div>
      ))}
    </div>
  );
};

export default Admin;
