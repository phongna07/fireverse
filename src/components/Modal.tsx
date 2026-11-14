import { FC, ReactNode, useEffect, useId, useRef } from "react";

import { createPortal } from "react-dom";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width class for the dialog */
  maxWidth?: string;
  className?: string;
}

const openDialogs: HTMLElement[] = [];
let originalOverflow = "";

const Modal: FC<ModalProps> = ({
  title,
  onClose,
  children,
  maxWidth = "max-w-[500px]",
  className = "",
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;

    if (openDialogs.length === 0)
      originalOverflow = document.body.style.overflow;
    dialog?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only the topmost dialog reacts
      if (!dialog || openDialogs[openDialogs.length - 1] !== dialog) return;

      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab") return;

      // Keep keyboard focus inside the dialog
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    if (dialog) openDialogs.push(dialog);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      if (dialog) openDialogs.splice(openDialogs.indexOf(dialog), 1);
      if (openDialogs.length === 0)
        document.body.style.overflow = originalOverflow;

      previouslyFocused?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      data-modal
      // React events bubble through portals: keep clicks inside the modal from
      // reaching handlers of the element that opened it
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-20 flex animate-fade-in items-center justify-center bg-[#00000080] px-2"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[calc(100dvh-16px)] w-full flex-col overflow-hidden rounded-2xl bg-dark outline-hidden ${maxWidth} ${className}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-dark-lighten px-5 py-4">
          <div className="w-9 shrink-0"></div>
          <div className="flex min-w-0 grow items-center justify-center">
            <h1 id={titleId} className="text-center text-xl font-bold">
              {title}
            </h1>
          </div>
          <div className="flex w-9 shrink-0 items-center justify-end">
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-lighten transition duration-300 hover:brightness-125"
            >
              <i className="bx bx-x text-2xl"></i>
            </button>
          </div>
        </div>

        <div className="modal-content min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
