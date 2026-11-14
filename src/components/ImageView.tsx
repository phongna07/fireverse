import Modal from "./Modal";
import { FC } from "react";

interface ImageViewProps {
  src: string;
  isOpened: boolean;
  setIsOpened: (value: boolean) => void;
}

const ImageView: FC<ImageViewProps> = ({ src, isOpened, setIsOpened }) => {
  if (!isOpened) return null;
  return (
    <Modal
      title="Image"
      onClose={() => setIsOpened(false)}
      maxWidth="max-w-[calc(100vw-32px)]"
      className="w-auto!"
    >
      <div className="flex items-center justify-center p-4">
        <img
          src={src}
          alt="Shared image"
          decoding="async"
          className="block h-auto max-h-[calc(100dvh-144px)] w-auto max-w-[calc(100vw-64px)] object-contain"
        />
      </div>
    </Modal>
  );
};
export default ImageView;
