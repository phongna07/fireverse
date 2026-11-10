import Modal from "../Modal";
import { FC } from "react";
import { IMAGE_PROXY } from "../../shared/constants";
import { useStore } from "../../store";

interface UserInfoProps {
  isOpened: boolean;
  setIsOpened: (value: boolean) => void;
}

const UserInfo: FC<UserInfoProps> = ({ isOpened, setIsOpened }) => {
  const currentUser = useStore((state) => state.currentUser);

  if (!isOpened) return null;

  return (
    <Modal title="Your Profile" onClose={() => setIsOpened(false)}>
      <div className="p-6">
        <div className="flex gap-4">
          <img
            loading="lazy"
            decoding="async"
            className="h-16 w-16 rounded-full object-cover"
            src={IMAGE_PROXY(currentUser?.photoURL as string)}
            alt=""
          />
          <div>
            <h1 className="text-xl">{currentUser?.displayName}</h1>
            <p>Email: {currentUser?.email || "None"}</p>
            <p>Phone Number: {currentUser?.phoneNumber || "None"}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UserInfo;
