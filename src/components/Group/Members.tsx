import { ConversationInfo, SavedUser } from "../../shared/types";
import { FC, useState } from "react";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

import Alert from "../Alert";
import { IMAGE_PROXY } from "../../shared/constants";
import { Spinner as Spin } from "../Loading";
import { db } from "../../shared/firebase";
import { useStore } from "../../store";
import { useUsersInfo } from "../../hooks/useUsersInfo";

interface MembersProps {
  conversation: ConversationInfo;
}

const Members: FC<MembersProps> = ({ conversation }) => {
  const { id: conversationId } = useParams();

  const currentUser = useStore((state) => state.currentUser);

  const { data, loading, error } = useUsersInfo(conversation.users);

  const navigate = useNavigate();

  const [isAlertOpened, setIsAlertOpened] = useState(false);
  const [alertText, setAlertText] = useState("");

  const handleRemoveFromGroup = (uid: string) => {
    if (
      conversation.group?.admins.length === 1 &&
      conversation.group.admins[0] === uid
    ) {
      setAlertText("You must set another one to be an admin");
      setIsAlertOpened(true);
    } else {
      updateDoc(doc(db, "conversations", conversationId as string), {
        users: arrayRemove(uid),
        "group.admins": arrayRemove(uid),
        "group.groupImage": conversation.group?.groupImage,
        "group.groupName": conversation.group?.groupName,
      });

      if (currentUser?.uid === uid) {
        navigate("/");
      }
    }
  };

  const handleMakeAdmin = (uid: string) => {
    updateDoc(doc(db, "conversations", conversationId as string), {
      "group.admins": arrayUnion(uid),
      "group.groupImage": conversation.group?.groupImage,
      "group.groupName": conversation.group?.groupName,
    });
    setIsAlertOpened(true);
    setAlertText("Done making an admin");
  };

  if (loading || error)
    return (
      <div className="flex h-80 items-center justify-center">
        <Spin />
      </div>
    );

  return (
    <>
      <div className="flex h-80 flex-col items-stretch gap-4 overflow-y-auto overflow-x-hidden py-4">
        {data
          ?.map((item) => item.data() as SavedUser)
          .map((user) => (
            <div key={user.uid} className="flex items-center gap-3 px-4">
              <img
                className="h-10 w-10 shrink-0 rounded-full object-cover"
                src={IMAGE_PROXY(user.photoURL)}
                alt=""
              />

              <div className="grow">
                <h1>{user.displayName}</h1>
              </div>

              {conversation.group?.admins?.includes(
                currentUser?.uid as string
              ) && (
                <div className="group relative shrink-0" tabIndex={0}>
                  <button>
                    <i className="bx bx-dots-horizontal-rounded text-2xl"></i>
                  </button>

                  <div className="bg-dark-lighten border-dark-lighten invisible absolute top-full right-0 z-1 flex w-max flex-col items-stretch rounded-lg border py-1 opacity-0 transition-all duration-300 group-focus-within:visible! group-focus-within:opacity-100!">
                    {conversation.users.length > 3 && (
                      <button
                        onClick={() => handleRemoveFromGroup(user.uid)}
                        className="bg-dark-lighten flex items-center gap-1 px-3 py-1 transition duration-300 hover:brightness-125"
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
                        className="bg-dark-lighten flex items-center gap-1 px-3 py-1 transition duration-300 hover:brightness-125"
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

      <Alert
        isOpened={isAlertOpened}
        setIsOpened={setIsAlertOpened}
        text={alertText}
      />
    </>
  );
};

export default Members;
