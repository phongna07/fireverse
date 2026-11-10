import Modal from "../Modal";
import { FC, useState } from "react";

import AddMembers from "./AddMembers";
import Admin from "./Admin";
import { ConversationInfo } from "../../shared/types";
import Members from "./Members";

interface ViewGroupProps {
  setIsOpened: (value: boolean) => void;
  conversation: ConversationInfo;
}

const ViewGroup: FC<ViewGroupProps> = ({ setIsOpened, conversation }) => {
  enum Sections {
    members,
    admins,
    addMembers,
  }
  const [selectedSection, setSelectedSection] = useState(Sections.members);

  return (
    <Modal title="Group Members" onClose={() => setIsOpened(false)}>
      <div className="flex items-stretch border-b border-dark-lighten">
        <button
          onClick={() => setSelectedSection(Sections.members)}
          className={`flex-1 py-2 text-center ${
            selectedSection === Sections.members ? "bg-dark-lighten" : ""
          }`}
        >
          Members
        </button>
        <button
          onClick={() => setSelectedSection(Sections.admins)}
          className={`flex-1 py-2 text-center ${
            selectedSection === Sections.admins ? "bg-dark-lighten" : ""
          }`}
        >
          Admins
        </button>
        <button
          onClick={() => setSelectedSection(Sections.addMembers)}
          className={`flex-1 py-2 text-center ${
            selectedSection === Sections.addMembers ? "bg-dark-lighten" : ""
          }`}
        >
          Add members
        </button>
      </div>

      {selectedSection === Sections.members ? (
        <Members conversation={conversation} />
      ) : selectedSection === Sections.admins ? (
        <Admin conversation={conversation} />
      ) : selectedSection === Sections.addMembers ? (
        <AddMembers conversations={conversation} />
      ) : (
        <></>
      )}
    </Modal>
  );
};

export default ViewGroup;
