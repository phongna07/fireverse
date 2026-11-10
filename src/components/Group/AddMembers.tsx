import { toast } from "../../store/toast";
import { ConversationInfo, SavedUser } from "../../shared/types";
import {
  arrayUnion,
  collection,
  doc,
  query,
  updateDoc,
} from "firebase/firestore";

import { FC } from "react";
import { IMAGE_PROXY } from "../../shared/constants";
import { Spinner as Spin } from "../Loading";
import { db } from "../../shared/firebase";
import { useCollectionQuery } from "../../hooks/useCollectionQuery";
import { useConversationId } from "../../hooks/useConversationId";

interface AddMembersProps {
  conversations: ConversationInfo;
}

const AddMembers: FC<AddMembersProps> = ({ conversations }) => {
  const conversationId = useConversationId();

  const { data, loading, error, retry } = useCollectionQuery(
    "all-users-for-members",
    query(collection(db, "users")),
  );

  const handleAddMember = (uid: string) => {
    updateDoc(doc(db, "conversations", conversationId as string), {
      users: arrayUnion(uid),
    }).catch(() => toast.error("Could not add the member. Please try again."));
  };

  if (error)
    return (
      <p className="p-4 text-center">
        Unable to load people. <button onClick={retry}>Retry</button>
      </p>
    );

  if (loading)
    return (
      <div className="flex h-80 items-center justify-center">
        <Spin />
      </div>
    );

  const candidates =
    data?.docs
      .map((item) => item.data() as SavedUser)
      .filter((user) => !conversations.users.includes(user.uid)) || [];
  return (
    <div className="flex h-80 flex-col items-stretch gap-4 overflow-x-hidden overflow-y-auto py-4">
      {candidates.map((user) => (
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
          <button
            aria-label={`Add ${user.displayName || "member"}`}
            onClick={() => handleAddMember(user.uid)}
          >
            <i className="bx bx-plus text-2xl"></i>
          </button>
        </div>
      ))}
      {candidates.length === 0 && (
        <p className="text-center">No more user to add</p>
      )}
    </div>
  );
};

export default AddMembers;
