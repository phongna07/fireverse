import { FC, useState } from "react";
import { collection, orderBy, query, where } from "firebase/firestore";

import FileIcon from "../FileIcon";
import { Spinner as Spin } from "../Loading";
import { db } from "../../shared/firebase";
import { formatFileSize } from "../../shared/utils";
import { useCollectionQuery } from "../../hooks/useCollectionQuery";
import { useConversationId } from "../../hooks/useConversationId";

const Files: FC = () => {
  const conversationId = useConversationId();

  const { data, loading, error } = useCollectionQuery(
    `files-${conversationId}`,
    query(
      collection(db, "conversations", conversationId as string, "messages"),
      where("type", "==", "file"),
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
        <p className="text-center">No file found</p>
      </div>
    );

  return (
    <div className="flex h-80 flex-col items-stretch gap-3 overflow-y-auto p-4">
      {data?.docs.map((file) => (
        <div key={file.id} className="flex items-center gap-4 p-2">
          <FileIcon
            className="h-6 w-6 object-cover"
            extension={file.data().file.name.split(".").slice(-1)[0]}
          />
          <div className="grow">
            <h1>{file.data()?.file?.name}</h1>
            <p>{formatFileSize(file.data()?.file?.size)}</p>
          </div>
          <a
            href={file.data().content}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <i className="bx bxs-download text-2xl"></i>
          </a>
        </div>
      ))}
    </div>
  );
};

export default Files;
