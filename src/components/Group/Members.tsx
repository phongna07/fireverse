import ConfirmDialog from "../ConfirmDialog";
import { ConversationInfo } from "../../shared/types";
import { FC, useState } from "react";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "@tanstack/react-router";
import { useConversationId } from "../../hooks/useConversationId";

import { toast } from "../../store/toast";
import { IMAGE_PROXY } from "../../shared/constants";
import { Spinner as Spin } from "../Loading";
import { db } from "../../shared/firebase";
import { useStore } from "../../store";
import { useUsersInfo } from "../../hooks/useUsersInfo";

interface MembersProps {
  conversation: ConversationInfo;
}

const Members: FC<MembersProps> = ({ conversation }) => {
  const conversationId = useConversationId();

  const currentUser = useStore((state) => state.currentUser);

  const { data, loading, error, retry } = useUsersInfo(conversation.users);

  const navigate = useNavigate();

  const [confirmUid, setConfirmUid] = useState<string | null>(null);

  const handleRemoveFromGroup = async (uid: string) => {
    try {
      if (
        conversation.group?.admins?.length === 1 &&
        conversation.group.admins[0] === uid
      ) {
        toast.info("You must set another one to be an admin");
      } else {
        await updateDoc(doc(db, "conversations", conversationId as string), {
          users: arrayRemove(uid),
          "group.admins": arrayRemove(uid),
        });

        if (currentUser?.uid === uid) {
          navigate({ to: "/" });
        }
      }
    } catch {
      toast.error("Unable to remove the member. Please try again.");
    }
  };

  const handleMakeAdmin = async (uid: string) => {
    try {
      await updateDoc(doc(db, "conversations", conversationId as string), {
        "group.admins": arrayUnion(uid),
      });

      toast.info("Admin updated");
    } catch {
      toast.error("Unable to update the admin. Please try again.");
    }
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
    <>
      {confirmUid && (
        <ConfirmDialog
          title={
            confirmUid === currentUser?.uid ? "Leave group?" : "Remove member?"
          }
          message="They will need to be added again to rejoin."
          confirmText="Confirm"
          onClose={() => setConfirmUid(null)}
          onConfirm={() => handleRemoveFromGroup(confirmUid)}
        />
      )}
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

            {conversation.group?.admins?.includes(
              currentUser?.uid as string,
            ) && (
              <div className="group relative shrink-0" tabIndex={0}>
                <button aria-label="Member actions">
                  <i className="bx bx-dots-horizontal-rounded text-2xl"></i>
                </button>

                <div className="invisible absolute top-full right-0 z-1 flex w-max flex-col items-stretch rounded-lg border border-dark-lighten bg-dark-lighten py-1 opacity-0 transition-all duration-300 group-focus-within:visible! group-focus-within:opacity-100!">
                  {conversation.users.length > 3 && (
                    <button
                      onClick={() => setConfirmUid(user.uid)}
                      className="flex items-center gap-1 bg-dark-lighten px-3 py-1 transition duration-300 hover:brightness-125"
                    >
                      <i className="bx bx-user-x text-2xl"></i>
                      <span>
                        {user.uid === currentUser?.uid
                          ? "Leave group"
                          : "Kick from group"}
                      </span>
                    </button>
                  )}
                  {user.uid !== currentUser?.uid && (
                    <button
                      onClick={() => handleMakeAdmin(user.uid)}
                      className="flex items-center gap-1 bg-dark-lighten px-3 py-1 transition duration-300 hover:brightness-125"
                    >
                      <i className="bx bx-user-check text-2xl"></i>
                      <span>Make an admin</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default Members;
