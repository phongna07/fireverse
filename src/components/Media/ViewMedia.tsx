import Modal from "../Modal";
import { FC, useState } from "react";

import Files from "./Files";
import Image from "./Image";

interface ViewMediaProps {
  setIsOpened: (value: boolean) => void;
}

const ViewMedia: FC<ViewMediaProps> = ({ setIsOpened }) => {
  enum Sections {
    images,
    files,
  }
  const [selectedSection, setSelectedSection] = useState(Sections.images);

  return (
    <Modal title="View images and files" onClose={() => setIsOpened(false)}>
      <div className="flex items-stretch border-b border-dark-lighten">
        <button
          onClick={() => setSelectedSection(Sections.images)}
          className={`flex-1 py-2 text-center ${
            selectedSection === Sections.images ? "bg-dark-lighten" : ""
          }`}
        >
          Images
        </button>
        <button
          onClick={() => setSelectedSection(Sections.files)}
          className={`flex-1 py-2 text-center ${
            selectedSection === Sections.files ? "bg-dark-lighten" : ""
          }`}
        >
          Files
        </button>
      </div>

      {selectedSection === Sections.images ? (
        <Image />
      ) : selectedSection === Sections.files ? (
        <Files />
      ) : (
        <></>
      )}
    </Modal>
  );
};

export default ViewMedia;
