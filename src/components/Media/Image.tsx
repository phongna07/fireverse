import { messagesCollection } from "../../shared/collections";
import { FC, useState } from "react";
import { orderBy, query, where } from "firebase/firestore";

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
        onClick={() => setIsImageViewOpened(true)}
      >
        <img
          loading="lazy"
          decoding="async"
          onClick={() => setIsImageViewOpened(true)}
          className="h-[100px] w-[100px] cursor-pointer object-cover transition duration-300 hover:brightness-75"
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
    `images-${conversationId}`,
    query(
      messagesCollection(conversationId as string),
      where("type", "==", "image"),
      orderBy("createdAt", "desc"),
    ),
  );

  if (error)
    return (
      <p className="p-4 text-center">
        Unable to load images. <button onClick={retry}>Retry</button>
      </p>
    );

  if (loading)
    return (
      <div className="flex h-80 items-center justify-center">
        <Spin />
      </div>
    );

  if (data?.empty)
    return (
      <div className="h-80 py-3">
        <p className="text-center">No image found</p>
      </div>
    );

  return (
    <div className="flex h-80 flex-wrap content-start gap-4 overflow-x-hidden overflow-y-auto p-4">
      {data?.docs.map((image) => (
        <ImageItem key={image.id} src={image.data().content} />
      ))}
    </div>
  );
};

export default Image;
