import { FC, useState } from "react";

import { FILE_ICON } from "../shared/constants";

interface FileIconProps {
  extension: string;
  className?: string;
}

const FileIcon: FC<FileIconProps> = ({ extension, className }) => {
  const [isError, setIsError] = useState(false);

  if (isError) return <i className={`bx bxs-file ${className || ""}`}></i>;

  return (
    <img
      loading="lazy"
      decoding="async"
      className={className || ""}
      onError={() => setIsError(true)}
      src={FILE_ICON(extension)}
    ></img>
  );
};

export default FileIcon;
