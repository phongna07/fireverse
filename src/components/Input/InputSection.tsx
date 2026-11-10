import {
  ChangeEvent,
  ClipboardEventHandler,
  FC,
  FormEvent,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../shared/firebase";
import configs, { UPLOADS_DISABLED_MESSAGE } from "../../shared/configs";
import { uploadToStorage } from "../../shared/upload";
import { MessageItem } from "../../shared/types";

import { toast } from "../../store/toast";
import ClickAwayListener from "../ClickAwayListener";
import { EMOJI_REPLACEMENT } from "../../shared/constants";
import GifIcon from "../Icon/GifIcon";
const GifPicker = lazy(() => import("./GifPicker"));
import ReplyIcon from "../Icon/ReplyIcon";
import { Spinner as Spin } from "../Loading";
import StickerIcon from "../Icon/StickerIcon";
const StickerPicker = lazy(() => import("./StickerPicker"));
import { useConversationId } from "../../hooks/useConversationId";
import { useStore } from "../../store";

const Picker = lazy(() => import("./EmojiPicker"));

interface InputSectionProps {
  disabled: boolean;
  replyInfo?: MessageItem | null;
  setReplyInfo?: (value: MessageItem | null) => void;
}

const InputSection: FC<InputSectionProps> = ({
  disabled,
  replyInfo,
  setReplyInfo,
}) => {
  const [inputValue, setInputValue] = useState("");

  const [fileUploading, setFileUploading] = useState(false);

  const [previewFiles, setPreviewFiles] = useState<string[]>([]);

  const [isStickerPickerOpened, setIsStickerPickerOpened] = useState(false);
  const [isIconPickerOpened, setIsIconPickerOpened] = useState(false);
  const [isGifPickerOpened, setIsGifPickerOpened] = useState(false);

  const conversationId = useConversationId();
  const currentUser = useStore((state) => state.currentUser);

  const textInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewsRef = useRef(previewFiles);
  useEffect(() => {
    for (const url of previewsRef.current)
      if (!previewFiles.includes(url)) URL.revokeObjectURL(url);
    previewsRef.current = previewFiles;
  }, [previewFiles]);
  useEffect(
    () => () => {
      for (const url of previewsRef.current) URL.revokeObjectURL(url);
    },
    [],
  );

  const [fileDragging, setFileDragging] = useState(false);

  const updateTimestamp = () => {
    updateDoc(doc(db, "conversations", conversationId as string), {
      updatedAt: serverTimestamp(),
    }).catch(() =>
      toast.error("Could not update the conversation. Please try again."),
    );
  };

  useEffect(() => {
    const handler = () => {
      if (!disabled && !document.querySelector("[role=dialog]"))
        textInputRef.current?.focus();
    };
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [disabled]);

  useEffect(() => {
    textInputRef.current?.focus();
  }, [conversationId]);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (disabled || fileUploading || !currentUser || !conversationId) return;

    if (previewFiles.length > 0) {
      for (let i = 0; i < previewFiles.length; i++) {
        const url = previewFiles[i];
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], "image.png", {
          type: res.headers.get("content-type") as string,
        });
        await uploadFile(file);
      }
      setPreviewFiles([]);
    } else {
      if (fileUploading) return;
    }

    if (!inputValue.trim()) return;

    setInputValue("");

    let replacedInputValue = ` ${inputValue} `;

    Object.entries(EMOJI_REPLACEMENT).map(([key, value]) => {
      value.forEach((item) => {
        replacedInputValue = replacedInputValue
          .split(` ${item} `)
          .join(` ${key} `);
      });
    });

    setReplyInfo && setReplyInfo(null);

    addDoc(
      collection(db, "conversations", conversationId as string, "messages"),
      {
        sender: currentUser?.uid,
        content: replacedInputValue.trim(),
        type: "text",
        createdAt: serverTimestamp(),
        replyTo: replyInfo?.id || null,
      },
    ).catch(() => {
      toast.error("Unable to send your message. Please try again.");
      setInputValue((current) => current || inputValue);
    });

    updateTimestamp();
  };

  const sendSticker = (url: string) => {
    addDoc(
      collection(db, "conversations", conversationId as string, "messages"),
      {
        sender: currentUser?.uid,
        content: url,
        type: "sticker",
        createdAt: serverTimestamp(),
      },
    ).catch(() => toast.error("Unable to send the sticker. Please try again."));

    updateTimestamp();
  };

  const uploadFile = async (file: File) => {
    if (!configs.enableUploads) {
      toast.info(UPLOADS_DISABLED_MESSAGE);
      return;
    }
    try {
      const TWENTY_MB = 1024 * 1024 * 20;

      if (file.size > TWENTY_MB) {
        toast.info("Max file size is 20MB");

        return;
      }

      setFileUploading(true);

      const downloadURL = await uploadToStorage(file);

      await addDoc(
        collection(db, "conversations", conversationId as string, "messages"),
        {
          sender: currentUser?.uid,
          content: downloadURL,
          type: file.type.startsWith("image") ? "image" : "file",
          file: file.type.startsWith("image")
            ? null
            : {
                name: file.name,
                size: file.size,
              },
          createdAt: serverTimestamp(),
        },
      );

      setFileUploading(false);
      updateTimestamp();
    } catch (error) {
      toast.error("Unable to send the file. Please try again.");
      setFileUploading(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    void uploadFile(file);
    e.target.value = "";
  };

  const addIconToInput = (value: string) => {
    const start = textInputRef.current?.selectionStart as number;
    const end = textInputRef.current?.selectionEnd as number;
    const splitted = inputValue.split("");
    splitted.splice(start, end - start, value);
    setInputValue(splitted.join(""));
  };

  const handleReplaceEmoji = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " ") {
      if (e.currentTarget.selectionStart !== e.currentTarget.selectionEnd)
        return;

      const lastWord = inputValue
        .slice(0, e.currentTarget.selectionStart ?? 0)
        .split(" ")
        .slice(-1)[0];

      if (lastWord.length === 0) return;

      Object.entries(EMOJI_REPLACEMENT).map(([key, value]) => {
        value.forEach((item) => {
          if (item === lastWord) {
            const splitted = inputValue.split("");
            splitted.splice(
              (e.currentTarget.selectionStart ?? 0) - lastWord.length,
              lastWord.length,
              key,
            );
            setInputValue(splitted.join(""));
          }
        });
      });
    }
  };

  const sendGif = (url: string) => {
    addDoc(
      collection(db, "conversations", conversationId as string, "messages"),
      {
        sender: currentUser?.uid,
        content: url,
        type: "image",
        file: null,
        createdAt: serverTimestamp(),
      },
    ).catch(() => toast.error("Unable to send the GIF. Please try again."));
    updateTimestamp();
  };

  const handlePaste: ClipboardEventHandler<HTMLInputElement> = (e) => {
    const file = e?.clipboardData?.files?.[0];
    if (!file) return;

    if (!configs.enableUploads) {
      e.preventDefault();
      toast.info(UPLOADS_DISABLED_MESSAGE);
      return;
    }
    const url = URL.createObjectURL(file);

    setPreviewFiles([...previewFiles, url]);
  };

  useEffect(() => {
    const dragBlurHandler = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setFileDragging(false);
    };

    const dragFocusHandler = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      setFileDragging(true);
    };

    const dropFileHandler = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setFileDragging(false);

      if (disabled) return;
      if (!configs.enableUploads) {
        toast.info(UPLOADS_DISABLED_MESSAGE);
        return;
      }
      for (const file of Array.from(e.dataTransfer?.files || []))
        await uploadFile(file);
    };

    addEventListener("dragenter", dragFocusHandler);
    addEventListener("dragover", dragFocusHandler);
    addEventListener("dragleave", dragBlurHandler);
    addEventListener("drop", dropFileHandler);

    return () => {
      removeEventListener("dragenter", dragFocusHandler);
      removeEventListener("dragover", dragFocusHandler);
      removeEventListener("dragleave", dragBlurHandler);
      removeEventListener("drop", dropFileHandler);
    };
  }, [conversationId, disabled]);

  return (
    <>
      {fileDragging && (
        <div className="pointer-events-none fixed top-0 left-0 z-20 flex h-full w-full items-center justify-center backdrop-blur-xs select-none">
          <h1 className="text-3xl">
            {configs.enableUploads
              ? "Drop file to send"
              : "Uploads are disabled"}
          </h1>
        </div>
      )}
      {previewFiles.length > 0 && (
        <div className="flex h-32 shrink-0 items-center gap-2 border-t border-dark-lighten px-4">
          {previewFiles.map((preview) => (
            <div key={preview} className="relative">
              <img
                loading="lazy"
                decoding="async"
                className="h-28 w-28 object-cover"
                src={preview}
                alt=""
              />
              <button
                onClick={() =>
                  setPreviewFiles(
                    previewFiles.filter((item) => item !== preview),
                  )
                }
                className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-100"
              >
                <i className="bx bx-x text-lg text-dark"></i>
              </button>
            </div>
          ))}
        </div>
      )}
      {previewFiles.length === 0 && !!replyInfo && (
        <div className="flex h-[76px] shrink-0 justify-between border-t border-dark-lighten p-4">
          <div>
            <div className="flex items-center gap-2">
              <ReplyIcon />
              <p>
                Replying
                {currentUser?.uid === replyInfo.sender ? " to yourself" : ""}
              </p>
            </div>
            {replyInfo.type === "text" ? (
              <p className="max-w-[calc(100vw-65px)] overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[calc(100vw-420px)]">
                {replyInfo.content}
              </p>
            ) : replyInfo.type === "image" ? (
              "An image"
            ) : replyInfo.type === "file" ? (
              "A file"
            ) : replyInfo.type === "sticker" ? (
              "A sticker"
            ) : (
              "Message has been removed"
            )}
          </div>

          <button onClick={() => setReplyInfo && setReplyInfo(null)}>
            <i className="bx bx-x text-3xl"></i>
          </button>
        </div>
      )}
      <div
        className={`flex h-16 items-stretch gap-1 border-t border-dark-lighten px-4 ${
          disabled ? "pointer-events-none select-none" : ""
        }`}
      >
        <button
          aria-label="Attach image"
          title={
            configs.enableUploads ? "Attach image" : UPLOADS_DISABLED_MESSAGE
          }
          disabled={!configs.enableUploads || disabled}
          onClick={() => imageInputRef.current?.click()}
          className="flex shrink-0 items-center text-2xl text-primary"
        >
          <i className="bx bxs-image-add"></i>
        </button>
        <input
          ref={imageInputRef}
          hidden
          className="hidden"
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
        />
        <button
          aria-label="Attach file"
          title={
            configs.enableUploads ? "Attach file" : UPLOADS_DISABLED_MESSAGE
          }
          disabled={!configs.enableUploads || disabled}
          onClick={() => fileInputRef.current?.click()}
          className="flex shrink-0 items-center text-2xl text-primary"
        >
          <i className="bx bx-link-alt"></i>
        </button>
        <input
          ref={fileInputRef}
          hidden
          className="hidden"
          type="file"
          onChange={handleFileInputChange}
        />
        <div className="relative flex shrink-0 items-center">
          {isStickerPickerOpened && (
            <Suspense fallback={<Spin />}>
              <StickerPicker
                setIsOpened={setIsStickerPickerOpened}
                onSelect={sendSticker}
              />
            </Suspense>
          )}

          <button
            onClick={() => setIsStickerPickerOpened(true)}
            className="flex items-center"
          >
            <StickerIcon />
          </button>
        </div>

        <div className="relative flex shrink-0 items-center">
          {isGifPickerOpened && (
            <Suspense fallback={<Spin />}>
              <GifPicker
                setIsOpened={setIsGifPickerOpened}
                onSelect={sendGif}
              />
            </Suspense>
          )}

          <button
            onClick={() => setIsGifPickerOpened(true)}
            className="flex items-center"
          >
            <GifIcon />
          </button>
        </div>

        <form
          onSubmit={handleFormSubmit}
          className="flex min-w-0 grow items-stretch gap-1"
        >
          <div className="relative flex min-w-0 grow items-center">
            <input
              maxLength={1000}
              disabled={disabled}
              ref={textInputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
              onKeyDown={handleReplaceEmoji}
              onPaste={handlePaste}
              className="h-9 w-full rounded-full bg-dark-lighten pr-10 pl-3 outline-hidden"
              type="text"
              placeholder="Message..."
            />
            <button
              type="button"
              onClick={() => setIsIconPickerOpened(true)}
              className="absolute top-1/2 right-2 -translate-y-1/2"
            >
              <i className="bx bxs-smile text-2xl text-primary"></i>
            </button>

            {isIconPickerOpened && (
              <ClickAwayListener
                onClickAway={() => setIsIconPickerOpened(false)}
              >
                {(ref) => (
                  <div ref={ref} className="picker-panel emoji-panel">
                    <Suspense
                      fallback={
                        <div className="flex h-[357px] w-[348px] items-center justify-center rounded-lg border-2 border-[#555453] bg-[#222222]">
                          <Spin />
                        </div>
                      }
                    >
                      <Picker
                        onSelect={(emoji: { native: string }) =>
                          addIconToInput(emoji.native)
                        }
                      />
                    </Suspense>
                  </div>
                )}
              </ClickAwayListener>
            )}
          </div>
          {fileUploading ? (
            <div className="ml-1 flex items-center">
              <Spin size={24} />
            </div>
          ) : (
            <button
              aria-label="Send message"
              className="flex shrink-0 items-center text-2xl text-primary"
            >
              <i className="bx bxs-send"></i>
            </button>
          )}
        </form>
      </div>
    </>
  );
};

export default InputSection;
