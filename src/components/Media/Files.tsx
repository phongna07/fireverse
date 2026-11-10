import { messagesCollection } from "../../shared/collections";
import { FC } from "react";
import { orderBy, query, where } from "firebase/firestore";

import FileIcon from "../FileIcon";
import { Spinner as Spin } from "../Loading";
import { formatFileSize } from "../../shared/utils";
import { useCollectionQuery } from "../../hooks/useCollectionQuery";
import { useConversationId } from "../../hooks/useConversationId";

const Files: FC = () => {
  const conversationId = useConversationId();

  const { data, loading, error, retry } = useCollectionQuery(
    `files-${conversationId}`,
    query(
      messagesCollection(conversationId as string),
      where("type", "==", "file"),
      orderBy("createdAt", "desc"),
    ),
  );

  if (error)
    return (
      <p className="p-4 text-center">
        Unable to load files. <button onClick={retry}>Retry</button>
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
        <p className="text-center">No file found</p>
      </div>
    );

  return (
    <div className="flex h-80 flex-col items-stretch gap-3 overflow-y-auto p-4">
      {data?.docs.map((file) => (
        <div key={file.id} className="flex items-center gap-4 p-2">
          <FileIcon
            className="h-6 w-6 object-cover"
            extension={file.data().file?.name.split(".").slice(-1)[0] || ""}
          />
          <div className="grow">
            <h1>{file.data()?.file?.name}</h1>
            <p>{formatFileSize(file.data()?.file?.size)}</p>
          </div>
          <a
            aria-label="Download file"
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
