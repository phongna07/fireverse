import { FC, useMemo, useState } from "react";
import { query, where } from "firebase/firestore";

import Modal from "./Modal";
import { messagesCollection } from "../shared/collections";
import { useCollectionQuery } from "../hooks/useCollectionQuery";
import { useConversationId } from "../hooks/useConversationId";

interface ImageViewProps {
  src: string;
  isOpened: boolean;
  setIsOpened: (value: boolean) => void;
}

const controlClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait disabled:opacity-50 sm:h-12 sm:w-12";

// Mount the gallery subscription only while the viewer is open.
const OpenImageView: FC<Omit<ImageViewProps, "isOpened">> = ({
  src,
  setIsOpened,
}) => {
  const conversationId = useConversationId();
  const [currentSrc, setCurrentSrc] = useState(src);
  const [status, setStatus] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const { data } = useCollectionQuery(
    `images-by-type-${conversationId}`,
    query(messagesCollection(conversationId), where("type", "==", "image")),
  );
  const images = useMemo(() => {
    const shared = (data?.docs ?? [])
      .map((image) => ({ id: image.id, ...image.data() }))
      .sort(
        (a, b) =>
          (a.createdAt?.seconds ?? Infinity) -
            (b.createdAt?.seconds ?? Infinity) ||
          (a.createdAt?.nanoseconds ?? 0) - (b.createdAt?.nanoseconds ?? 0) ||
          a.id.localeCompare(b.id),
      )
      .map((image) => image.content);
    return shared.includes(currentSrc) ? shared : [currentSrc, ...shared];
  }, [data, currentSrc]);
  const index = images.indexOf(currentSrc);
  const close = () => setIsOpened(false);
  const navigate = (offset: number) => {
    const next = images[index + offset];
    if (next) {
      setCurrentSrc(next);
      setStatus("");
    }
  };

  const download = async () => {
    setDownloading(true);
    setStatus("");
    try {
      const response = await fetch(currentSrc);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const extension =
        blob.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
      link.href = url;
      link.download = `shared-image.${extension}`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setStatus("Unable to download this image. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const share = async () => {
    setStatus("");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Shared image", url: currentSrc });
      } else {
        await navigator.clipboard.writeText(currentSrc);
        setStatus("Image link copied");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setStatus("Unable to share this image. Please try again.");
    }
  };

  return (
    <Modal
      title="Image viewer"
      onClose={close}
      fullScreen
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <div className="relative isolate h-full overflow-hidden text-white">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <img
            src={currentSrc}
            alt=""
            className="h-full w-full scale-110 object-cover opacity-55 blur-[40px]"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div
          className="flex h-full items-center justify-center px-3 py-20 sm:px-20 sm:py-3"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          {failedSrc === currentSrc ? (
            <p
              role="alert"
              className="rounded-xl bg-black/50 px-6 py-4 text-center"
            >
              Unable to load this image.
            </p>
          ) : (
            <img
              key={currentSrc}
              src={currentSrc}
              alt="Shared image"
              decoding="async"
              onError={() => setFailedSrc(currentSrc)}
              className="block max-h-full max-w-full object-contain select-none"
            />
          )}
        </div>

        <div className="absolute top-3 right-3 flex gap-2 sm:top-4 sm:right-5">
          <button
            type="button"
            aria-label="Download image"
            title="Download image"
            disabled={downloading}
            onClick={download}
            className={controlClass}
          >
            <i aria-hidden="true" className="bx bx-download text-[28px]" />
          </button>
          <button
            type="button"
            aria-label="Share image"
            title="Share image"
            onClick={share}
            className={controlClass}
          >
            <i aria-hidden="true" className="bx bx-export text-[26px]" />
          </button>
          <button
            type="button"
            aria-label="Close image viewer"
            title="Close (Esc)"
            onClick={close}
            className={controlClass}
          >
            <i aria-hidden="true" className="bx bx-x text-[36px]" />
          </button>
        </div>

        {index > 0 && (
          <button
            type="button"
            aria-label="Previous image"
            title="Previous image (Left arrow)"
            onClick={() => navigate(-1)}
            className={`${controlClass} absolute top-1/2 left-3 -translate-y-1/2 sm:left-5`}
          >
            <i aria-hidden="true" className="bx bx-chevron-left text-[36px]" />
          </button>
        )}
        {index < images.length - 1 && (
          <button
            type="button"
            aria-label="Next image"
            title="Next image (Right arrow)"
            onClick={() => navigate(1)}
            className={`${controlClass} absolute top-1/2 right-3 -translate-y-1/2 sm:right-5`}
          >
            <i aria-hidden="true" className="bx bx-chevron-right text-[36px]" />
          </button>
        )}
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-4 bottom-5 flex justify-center"
        >
          {status && (
            <p className="rounded-full bg-black/75 px-5 py-2 text-sm">
              {status}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

const ImageView: FC<ImageViewProps> = ({ isOpened, ...props }) =>
  isOpened ? <OpenImageView {...props} /> : null;

export default ImageView;
