import Modal from "../Modal";
import { FC, useMemo, useState } from "react";
import { IMAGE_PROXY, THEMES } from "../../shared/constants";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { Spinner as Spin } from "../Loading";
import { db } from "../../shared/firebase";
import { useAllUsers } from "../../hooks/useAllUsers";
import { toast } from "../../store/toast";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "../../store";
import { indexName, matchesName, normalizeName } from "../../shared/nameSearch";

interface CreateConversationProps {
  setIsOpened: (value: boolean) => void;
}

const CreateConversation: FC<CreateConversationProps> = ({ setIsOpened }) => {
  const { data, error, loading, retry } = useAllUsers();

  const [isCreating, setIsCreating] = useState(false);

  const currentUser = useStore((state) => state.currentUser);

  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const people = useMemo(
    () =>
      (data?.docs ?? [])
        .map((doc) => doc.data())
        .filter((user) => user.uid !== currentUser?.uid)
        .map((user) => ({ user, name: indexName(user.displayName) })),
    [data, currentUser?.uid],
  );
  const normalizedQuery = normalizeName(search);
  const visiblePeople = people.filter(({ name }) =>
    matchesName(name, normalizedQuery),
  );

  const navigate = useNavigate();

  const handleToggle = (uid: string) => {
    if (selected.includes(uid)) {
      setSelected(selected.filter((item) => item !== uid));
    } else {
      setSelected([...selected, uid]);
    }
  };

  const handleCreateConversation = async () => {
    if (!currentUser || !selected.length || isCreating) return;
    setIsCreating(true);
    try {
      const sorted = [...selected, currentUser.uid].sort();

      const q = query(
        collection(db, "conversations"),
        where("users", "==", sorted),
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const created = await addDoc(collection(db, "conversations"), {
          users: sorted,
          group:
            sorted.length > 2
              ? {
                  admins: [currentUser?.uid],
                  groupName: null,
                  groupImage: null,
                }
              : {},
          updatedAt: serverTimestamp(),
          seen: {},
          theme: THEMES[0],
        });

        setIsCreating(false);

        setIsOpened(false);

        navigate({
          to: "/$conversationId",
          params: { conversationId: created.id },
        });
      } else {
        setIsOpened(false);

        navigate({
          to: "/$conversationId",
          params: { conversationId: querySnapshot.docs[0].id },
        });

        setIsCreating(false);
      }
    } catch {
      toast.error("Could not create the conversation. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal title="New conversation" onClose={() => setIsOpened(false)}>
      <div className="border-b border-dark-lighten px-5 py-3">
        <div className="input-surface flex items-center gap-2 rounded-lg bg-dark-lighten px-3 py-1">
          <i className="bx bx-search" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search people by name or initials"
            placeholder="Search by name or initials"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="grow"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
              className="flex items-center rounded p-1 hover:brightness-125"
            >
              <i className="bx bx-x" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Spin />
        </div>
      ) : error ? (
        <div className="flex h-96 items-center justify-center">
          <p className="text-center">
            Unable to load people. <button onClick={retry}>Retry</button>
          </p>
        </div>
      ) : (
        <>
          {isCreating && (
            <div className="absolute top-0 left-0 z-20 flex h-full w-full items-center justify-center bg-[#00000080]">
              <Spin />
            </div>
          )}
          <div className="flex h-96 flex-col items-stretch gap-2 overflow-y-auto py-2">
            {visiblePeople.length === 0 && (
              <p
                role="status"
                className="px-5 py-8 text-center text-sm opacity-70"
              >
                {normalizedQuery
                  ? "No people match your search."
                  : "No people available."}
              </p>
            )}
            {visiblePeople.map(({ user }) => (
              <label
                key={user.uid}
                className="flex cursor-pointer items-center gap-2 px-5 py-2 transition hover:bg-dark-lighten"
              >
                <input
                  className="shrink-0 cursor-pointer"
                  type="checkbox"
                  checked={selected.includes(user.uid)}
                  onChange={() => handleToggle(user.uid)}
                />
                <img
                  loading="lazy"
                  decoding="async"
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                  src={IMAGE_PROXY(user.photoURL)}
                  alt=""
                />
                <p>{user.displayName}</p>
              </label>
            ))}
          </div>
          <div className="flex justify-end border-t border-dark-lighten p-3">
            {selected.length > 0 && (
              <p
                role="status"
                className="mr-auto self-center text-sm opacity-70"
              >
                {selected.length} selected
              </p>
            )}
            <button
              disabled={selected.length === 0}
              onClick={handleCreateConversation}
              className="rounded-lg bg-dark-lighten px-3 py-2 transition duration-300 hover:brightness-125 disabled:brightness-80!"
            >
              Start conversation
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default CreateConversation;
