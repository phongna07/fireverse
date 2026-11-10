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
      maxWidth="max-w-[90vw]"
    >
      <img
        src={src}
        alt="Shared image"
        decoding="async"
        className="mx-auto max-h-[80dvh] max-w-full object-contain"
      />
    </Modal>
  );
};
export default ImageView;
