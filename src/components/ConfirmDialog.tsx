import { FC } from "react";
import Modal from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText,
  onConfirm,
  onClose,
}) => (
  <Modal title={title} onClose={onClose} maxWidth="max-w-[400px]">
    <p className="p-5 text-center">{message}</p>
    <div className="flex justify-end gap-2 border-t border-dark-lighten p-3">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg bg-dark-lighten px-3 py-2 transition duration-300 hover:brightness-125"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onConfirm();
        }}
        className="rounded-lg bg-red-500 px-3 py-2 text-white transition duration-300 hover:brightness-110"
      >
        {confirmText}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
