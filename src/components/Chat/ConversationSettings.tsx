import Modal from "../Modal";
import { ChangeEvent, FC, FormEvent, useRef, useState } from "react";
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

  const currentUser = useStore((state) => state.currentUser);

  const navigate = useNavigate();

  const [isChangeChatNameOpened, setIsChangeChatNameOpened] = useState(false);
  const [chatNameInputValue, setChatNameInputValue] = useState(
    conversation?.group?.groupName || "",
  );

  const [isChangeThemeOpened, setIsChangeThemeOpened] = useState(false);

  const [confirmLeave, setConfirmLeave] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!chatNameInputValue.trim()) return;
    setIsOpened(false);
    updateDoc(doc(db, "conversations", conversationId as string), {
      "group.groupName": chatNameInputValue.trim(),
    }).catch(() =>
      toast.error("Could not rename the group. Please try again."),
    );
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

    setIsOpened(false);

    try {
      const downloadURL = await uploadToStorage(file);

      updateDoc(doc(db, "conversations", conversationId as string), {
        "group.groupImage": downloadURL,
      });
    } catch {
      toast.error("Could not change the group photo. Please try again.");
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
    <Modal title="Conversation settings" onClose={() => setIsOpened(false)}>
      <div className="flex flex-col items-stretch p-3">
        {conversation.users.length > 2 && (
          <>
            <button
              onClick={() => setIsChangeChatNameOpened((prev) => !prev)}
              className="flex items-center justify-between gap-3 rounded-lg bg-dark px-3 py-2 transition duration-300 hover:brightness-125"
            >
              <div className="flex items-center gap-3">
                <i className="bx bx-edit-alt text-2xl"></i>
                <span>Change chat name</span>
              </div>

              <i
                className={`bx bx-chevron-down text-3xl ${
                  isChangeChatNameOpened ? "rotate-180" : ""
                }`}
              ></i>
            </button>
            {isChangeChatNameOpened && (
              <form onSubmit={handleFormSubmit} className="my-2 flex gap-3">
                <div className="grow">
                  <input
                    value={chatNameInputValue}
                    onChange={(e) => setChatNameInputValue(e.target.value)}
                    className="h-full w-full rounded-lg border border-dark-lighten bg-dark p-2 outline-hidden transition duration-300 focus:border-gray-500"
                    type="text"
                    placeholder="Chat name"
                  />
                </div>
                <button className="shrink-0 rounded-sm bg-primary px-3 transition duration-300 hover:brightness-110">
                  Change
                </button>
              </form>
            )}
            <button
              disabled={!configs.enableUploads}
              title={
                configs.enableUploads
                  ? "Change group photo"
                  : UPLOADS_DISABLED_MESSAGE
              }
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 rounded-lg bg-dark px-3 py-2 transition duration-300 hover:brightness-125"
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
          onClick={() => setIsChangeThemeOpened((prev) => !prev)}
          className="flex items-center justify-between gap-3 rounded-lg bg-dark px-3 py-2 transition duration-300 hover:brightness-125"
        >
          <div className="flex items-center gap-3">
            <i className="bx bx-palette text-2xl"></i>
            <span>Change theme</span>
          </div>

          <i
            className={`bx bx-chevron-down text-3xl ${
              isChangeThemeOpened ? "rotate-180" : ""
            }`}
          ></i>
        </button>

        {isChangeThemeOpened && (
          <div className="flex flex-wrap gap-3 p-4">
            {THEMES.map((theme) => (
              <button
                aria-label={`Use theme ${theme}`}
                key={theme}
                style={{ background: theme }}
                onClick={() => changeTheme(theme)}
                className={`h-14 w-14 cursor-pointer rounded-full ${
                  conversation.theme === theme ? "check-overlay" : ""
                }`}
              ></button>
            ))}
          </div>
        )}
        <button
          onClick={() => {
            setIsOpened(false);
            setMediaViewOpened(true);
          }}
          className="flex items-center gap-3 rounded-lg bg-dark px-3 py-2 transition duration-300 hover:brightness-125"
        >
          <i className="bx bxs-file text-2xl"></i>
          <span>View images & files</span>
        </button>

        {conversation.users.length > 2 && (
          <button
            onClick={() => setConfirmLeave(true)}
            className="flex items-center justify-between gap-3 rounded-lg bg-dark px-3 py-2 transition duration-300 hover:brightness-125"
          >
            <div className="flex items-center gap-3">
              <i className="bx bx-log-out text-2xl"></i>
              <span>Leave group</span>
            </div>
          </button>
        )}
      </div>
      {confirmLeave && (
        <ConfirmDialog
          title="Leave group?"
          message="You will need to be added again to rejoin."
          confirmText="Leave group"
          onClose={() => setConfirmLeave(false)}
          onConfirm={leaveGroup}
        />
      )}
    </Modal>
  );
};

export default ConversationSettings;
