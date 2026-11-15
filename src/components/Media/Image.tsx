import { messagesCollection } from "../../shared/collections";
import { FC, useMemo, useState } from "react";
import { query, where } from "firebase/firestore";

import ImageView from "../ImageView";
import { Spinner as Spin } from "../Loading";
import { useCollectionQuery } from "../../hooks/useCollectionQuery";
import { useConversationId } from "../../hooks/useConversationId";

const ImageItem: FC<{ src: string }> = ({ src }) => {
  const [isImageViewOpened, setIsImageViewOpened] = useState(false);

  return (
    <>
      <button
        aria-label="View image"
        className="aspect-square w-full overflow-hidden rounded-lg"
        onClick={() => setIsImageViewOpened(true)}
      >
        <img
          loading="lazy"
          decoding="async"
          className="h-full w-full cursor-pointer object-cover transition duration-300 hover:brightness-75"
          src={src}
          alt=""
        />
      </button>
      <ImageView
        src={src}
        isOpened={isImageViewOpened}
        setIsOpened={setIsImageViewOpened}
      />
    </>
  );
};

const Image: FC = () => {
  const conversationId = useConversationId();

  const { data, loading, error, retry } = useCollectionQuery(
    `images-by-type-${conversationId}`,
    query(
      messagesCollection(conversationId as string),
      where("type", "==", "image"),
    ),
  );

  // Keep the server query on a single field so no composite index is needed.
  const images = useMemo(
    () =>
      data?.docs
        .map((image) => ({ id: image.id, ...image.data() }))
        .sort((a, b) => {
          // Pending server timestamps belong with the newest images.
          if (!a.createdAt && b.createdAt) return -1;
          if (a.createdAt && !b.createdAt) return 1;
          return (
            (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0) ||
            (b.createdAt?.nanoseconds ?? 0) - (a.createdAt?.nanoseconds ?? 0) ||
            b.id.localeCompare(a.id)
          );
        }) ?? [],
    [data],
  );

  if (error)
    return (
      <p role="alert" className="p-4 text-center">
        Unable to load images.{" "}
        <button className="underline" onClick={retry}>
          Retry
        </button>
      </p>
    );

  if (loading)
    return (
      <div
        role="status"
        aria-label="Loading images"
        className="flex h-32 items-center justify-center"
      >
        <Spin />
      </div>
    );

  if (data?.empty)
    return (
      <div className="px-3 py-6">
        <p className="text-center">No images found</p>
      </div>
    );

  return (
    <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto p-3">
      {images.map((image) => (
        <ImageItem key={image.id} src={image.content} />
      ))}
    </div>
  );
};

export default Image;
