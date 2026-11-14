import { useUsersInfo } from "../../hooks/useUsersInfo";
import { IMAGE_PROXY } from "../../shared/constants";
import ViewGroup from "../Group/ViewGroup";
import { ChangeEvent, FC, FormEvent, useEffect, useRef, useState } from "react";
import { arrayRemove, doc, updateDoc } from "firebase/firestore";
import { db } from "../../shared/firebase";
import configs, { UPLOADS_DISABLED_MESSAGE } from "../../shared/configs";
import { uploadToStorage } from "../../shared/upload";
import ConfirmDialog from "../ConfirmDialog";
import { useNavigate } from "@tanstack/react-router";
import { useConversationId } from "../../hooks/useConversationId";

import { toast } from "../../store/toast";
import { ConversationInfo } from "../../shared/types";
import { THEMES } from "../../shared/constants";
import { useStore } from "../../store";

interface ConversationConfigProps {
  conversation: ConversationInfo;
  setIsOpened: (value: boolean) => void;
  setMediaViewOpened: (value: boolean) => void;
}

const ConversationSettings: FC<ConversationConfigProps> = ({
  conversation,
  setIsOpened,
  setMediaViewOpened,
}) => {
  const conversationId = useConversationId();
  const { data: users } = useUsersInfo(conversation.users);
  const [membersOpened, setMembersOpened] = useState(false);
  const [saving, setSaving] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("[role=dialog]"))
        setIsOpened(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [setIsOpened]);

  const currentUser = useStore((state) => state.currentUser);

  const navigate = useNavigate();

  const [isChangeChatNameOpened, setIsChangeChatNameOpened] = useState(false);
  const [chatNameInputValue, setChatNameInputValue] = useState(
    conversation?.group?.groupName || "",
  );

  const [isChangeThemeOpened, setIsChangeThemeOpened] = useState(false);

  const [confirmLeave, setConfirmLeave] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatNameInputValue.trim() || saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "conversations", conversationId as string), {
        "group.groupName": chatNameInputValue.trim(),
      });
      setIsChangeChatNameOpened(false);
    } catch {
      toast.error("Could not rename the group. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!configs.enableUploads) {
      toast.info(UPLOADS_DISABLED_MESSAGE);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image")) {
      toast.info("File is not an image");

      return;
    }

    const FIVE_MB = 1024 * 1024 * 5;

    if (file.size > FIVE_MB) {
      toast.info("Max image size is 5MB");

      return;
    }

    setSaving(true);

    try {
      const downloadURL = await uploadToStorage(file);

      await updateDoc(doc(db, "conversations", conversationId as string), {
        "group.groupImage": downloadURL,
      });
    } catch {
      toast.error("Could not change the group photo. Please try again.");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  };

  const changeTheme = (value: string) => {
    updateDoc(doc(db, "conversations", conversationId as string), {
      theme: value,
    }).catch(() =>
      toast.error("Could not change the theme. Please try again."),
    );
  };

  const leaveGroup = async () => {
    if (
      conversation.group?.admins?.length === 1 &&
      conversation.group.admins[0] === currentUser?.uid
    ) {
      toast.info("Choose another admin before leaving.");
      return;
    }
    try {
      await updateDoc(doc(db, "conversations", conversationId as string), {
        users: arrayRemove(currentUser?.uid as string),
        "group.admins": arrayRemove(currentUser?.uid as string),
      });

      await navigate({ to: "/" });
    } catch {
      toast.error("Unable to leave the group. Please try again.");
    }
  };

  return (
    <aside
      id="conversation-settings"
      aria-label="Conversation settings"
      className="settings-sidebar"
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <h2 className="font-semibold">Conversation settings</h2>
        <button
          ref={closeButton}
          className="icon-button"
          aria-label="Close conversation settings"
          onClick={() => setIsOpened(false)}
        >
          <i className="bx bx-x text-2xl" />
        </button>
      </div>
      <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-8 text-center">
        <img
          className="h-20 w-20 rounded-full object-cover"
          src={
            conversation.group?.groupImage ||
            IMAGE_PROXY(
              users?.find((user) => user.uid !== currentUser?.uid)?.photoURL,
            )
          }
          alt=""
        />
        <h3 className="text-lg font-semibold break-words">
          {conversation.group?.groupName ||
            users
              ?.filter((user) => user.uid !== currentUser?.uid)
              .map((user) => user.displayName)
              .join(", ") ||
            "Conversation"}
        </h3>
      </div>
      <div className="settings-content">
        <details open className="settings-section">
          <summary>
            Customize chat
            <i className="bx bx-chevron-down text-xl" />
          </summary>
          <div className="settings-section-body">
            {conversation.users.length > 2 && (
              <>
                <button
                  aria-expanded={isChangeChatNameOpened}
                  onClick={() => setIsChangeChatNameOpened((prev) => !prev)}
                  className="settings-row"
                >
                  <div className="flex items-center gap-3">
                    <i className="bx bx-edit-alt text-2xl"></i>
                    <span>Change chat name</span>
                  </div>

                  <i
                    className={`bx bx-chevron-down text-xl ${
                      isChangeChatNameOpened ? "rotate-180" : ""
                    }`}
                  ></i>
                </button>
                {isChangeChatNameOpened && (
                  <form onSubmit={handleFormSubmit} className="settings-form">
                    <div className="min-w-0 grow">
                      <input
                        aria-label="Chat name"
                        value={chatNameInputValue}
                        onChange={(e) => setChatNameInputValue(e.target.value)}
                        className="text-field h-full w-full rounded-lg bg-dark p-2"
                        type="text"
                        placeholder="Chat name"
                      />
                    </div>
                    <button
                      disabled={saving || !chatNameInputValue.trim()}
                      className="rounded-lg bg-primary px-4 py-2 font-semibold"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </form>
                )}
                <button
                  disabled={!configs.enableUploads || saving}
                  title={
                    configs.enableUploads
                      ? "Change group photo"
                      : UPLOADS_DISABLED_MESSAGE
                  }
                  onClick={() => fileInputRef.current?.click()}
                  className="settings-row"
                >
                  <i className="bx bx-image-alt text-2xl"></i>
                  <span>Change group photo</span>
                </button>

                <input
                  hidden
                  className="hidden"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                />
              </>
            )}
            <button
              aria-expanded={isChangeThemeOpened}
              onClick={() => setIsChangeThemeOpened((prev) => !prev)}
              className="settings-row"
            >
              <div className="flex items-center gap-3">
                <i className="bx bx-palette text-2xl"></i>
                <span>Change theme</span>
              </div>

              <i
                className={`bx bx-chevron-down text-xl ${
                  isChangeThemeOpened ? "rotate-180" : ""
                }`}
              ></i>
            </button>

            {isChangeThemeOpened && (
              <div className="flex flex-wrap gap-3 p-4">
                {THEMES.map((theme) => (
                  <button
                    aria-label={`Use theme ${theme}`}
                    aria-pressed={conversation.theme === theme}
                    key={theme}
                    style={{ background: theme }}
                    onClick={() => changeTheme(theme)}
                    className={`h-10 w-10 cursor-pointer rounded-full ${
                      conversation.theme === theme ? "check-overlay" : ""
                    }`}
                  ></button>
                ))}
              </div>
            )}
          </div>
        </details>
        <details className="settings-section">
          <summary>
            Media & files
            <i className="bx bx-chevron-down text-xl" />
          </summary>
          <div className="settings-section-body">
            <button
              onClick={() => {
                setMediaViewOpened(true);
              }}
              className="settings-row"
            >
              <i className="bx bxs-file text-2xl"></i>
              <span>View images & files</span>
            </button>
          </div>
        </details>
        {conversation.users.length > 2 && (
          <details className="settings-section">
            <summary>
              Chat members
              <i className="bx bx-chevron-down text-xl" />
            </summary>
            <div className="settings-section-body">
              <button
                className="settings-row"
                onClick={() => setMembersOpened(true)}
              >
                <i className="bx bxs-group text-2xl" />
                View members
              </button>
              <button
                onClick={() => setConfirmLeave(true)}
                className="settings-row"
              >
                <div className="flex items-center gap-3">
                  <i className="bx bx-log-out text-2xl"></i>
                  <span>Leave group</span>
                </div>
              </button>
            </div>
          </details>
        )}
      </div>
      {membersOpened && (
        <ViewGroup conversation={conversation} setIsOpened={setMembersOpened} />
      )}
      {confirmLeave && (
        <ConfirmDialog
          title="Leave group?"
          message="You will need to be added again to rejoin."
          confirmText="Leave group"
          onClose={() => setConfirmLeave(false)}
          onConfirm={leaveGroup}
        />
      )}
    </aside>
  );
};

export default ConversationSettings;
