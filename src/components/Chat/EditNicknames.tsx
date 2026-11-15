import { useRef, useState, type FormEvent } from "react";
import { deleteField, doc, FieldPath, writeBatch } from "firebase/firestore";
import { useUsersInfo } from "../../hooks/useUsersInfo";
import { db } from "../../shared/firebase";
import { IMAGE_PROXY } from "../../shared/constants";
import type { ConversationInfo } from "../../shared/types";
import { useStore } from "../../store";
import { toast } from "../../store/toast";
import Modal from "../Modal";
import { Spinner } from "../Loading";

interface EditNicknamesProps {
  conversation: ConversationInfo;
  conversationId: string;
  onClose: () => void;
}

const EditNicknames = ({
  conversation,
  conversationId,
  onClose,
}: EditNicknamesProps) => {
  const {
    data: users,
    loading,
    error,
    retry,
  } = useUsersInfo(conversation.users);
  const currentUid = useStore((state) => state.currentUser?.uid);
  const [initial] = useState(() => ({ ...conversation.nicknames }));
  const [drafts, setDrafts] = useState(initial);
  const [saving, setSaving] = useState(false);
  const inProgress = useRef(false);
  const changed = conversation.users.filter(
    (uid) => (drafts[uid] || "").trim() !== (initial[uid] || "").trim(),
  );

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (inProgress.current || loading || error || !changed.length) return;
    inProgress.current = true;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const reference = doc(db, "conversations", conversationId);
      // Update only edited members, preserving other members' concurrent edits.
      for (const uid of changed) {
        batch.update(
          reference,
          new FieldPath("nicknames", uid),
          drafts[uid]?.trim() || deleteField(),
        );
      }
      await batch.commit();
      onClose();
    } catch {
      toast.error("Could not save nicknames. Please try again.");
    } finally {
      inProgress.current = false;
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Edit nicknames"
      onClose={() => {
        if (!inProgress.current) onClose();
      }}
    >
      <form
        onSubmit={save}
        className="flex flex-col gap-4 p-5"
        aria-busy={saving}
      >
        <p className="text-sm text-gray-400">
          Nicknames are visible to everyone in this chat. Leave a field empty to
          use their profile name.
        </p>
        {loading ? (
          <div className="flex justify-center p-4">
            <Spinner />
          </div>
        ) : error ? (
          <p role="alert">
            Unable to load members.{" "}
            <button type="button" onClick={retry} className="text-primary">
              Retry
            </button>
          </p>
        ) : (
          users?.map((user) => (
            <label key={user.uid} className="flex min-w-0 items-center gap-3">
              <img
                src={IMAGE_PROXY(user.photoURL)}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
              <span className="flex min-w-0 grow flex-col gap-1">
                <span className="text-sm break-words">
                  {user.displayName || "Unknown user"}
                  {user.uid === currentUid ? " (you)" : ""}
                </span>
                <input
                  type="text"
                  aria-label={`Nickname for ${user.displayName || "Unknown user"}${user.uid === currentUid ? " (you)" : ""}`}
                  value={drafts[user.uid] || ""}
                  placeholder={user.displayName || "Nickname"}
                  maxLength={80}
                  disabled={saving}
                  onChange={(event) =>
                    setDrafts((previous) => ({
                      ...previous,
                      [user.uid]: event.target.value,
                    }))
                  }
                  className="text-field w-full rounded-lg bg-dark-lighten p-2"
                />
              </span>
            </label>
          ))
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg bg-dark-lighten px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || loading || error || !changed.length}
            className="rounded-lg bg-primary px-4 py-2 font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditNicknames;
