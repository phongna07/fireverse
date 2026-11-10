import { FC, useEffect } from "react";

interface AlertProps {
  isOpened: boolean;
  setIsOpened: (value: boolean) => void;
  text: string;
  isError?: boolean;
  duration?: number;
}

const Alert: FC<AlertProps> = ({
  isOpened,
  setIsOpened,
  text,
  isError = false,
  duration = 5000,
}) => {
  useEffect(() => {
    if (isOpened) {
      setTimeout(() => {
        setIsOpened(false);
      }, duration);
    }
  }, [isOpened]);

  return (
    <div
      className={`fixed top-5 right-5 ${
        isError ? "bg-red-500" : "bg-[#323232]"
      } z-9999 w-[calc(100vw-40px)] max-w-[300px] scale-100 rounded p-4 text-white transition-all duration-300 ${
        isOpened
          ? "visible scale-100 opacity-100"
          : "invisible scale-50 opacity-0"
      }`}
    >
      {text}
    </div>
  );
};

export default Alert;
