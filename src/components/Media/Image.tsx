import { FC, useState } from "react";
import { collection, orderBy, query, where } from "firebase/firestore";

import ImageView from "../ImageView";
import { Spinner as Spin } from "../Loading";
import { db } from "../../shared/firebase";
import { useCollectionQuery } from "../../hooks/useCollectionQuery";
import { useParams } from "react-router-dom";

const ImageItem: FC<{ src: string }> = ({ src }) => {
  const [isImageViewOpened, setIsImageViewOpened] = useState(false);

  return (
    <>
      <img
        onClick={() => setIsImageViewOpened(true)}
        className="h-[100px] w-[100px] cursor-pointer object-cover transition duration-300 hover:brightness-75"
        src={src}
        alt=""
      />
      <ImageView
        src={src}
        isOpened={isImageViewOpened}
        setIsOpened={setIsImageViewOpened}
      />
    </>
  );
};

const Image: FC = () => {
  const { id: conversationId } = useParams();

  const { data, loading, error } = useCollectionQuery(
    `images-${conversationId}`,
    query(
      collection(db, "conversations", conversationId as string, "messages"),
      where("type", "==", "image"),
      orderBy("createdAt", "desc")
    )
  );

  if (loading || error)
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
    <div className="flex h-80 flex-wrap content-start gap-4 overflow-y-auto overflow-x-hidden p-4">
      {data?.docs.map((image) => (
        <ImageItem key={image.id} src={image.data().content} />
      ))}
    </div>
  );
};

export default Image;
