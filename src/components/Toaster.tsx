import { FC } from "react";
import { useToastStore } from "../store/toast";

const Toaster: FC = () => {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-5 right-5 z-[9999] flex w-[calc(100vw-40px)] max-w-[300px] flex-col gap-2"
    >
      {toasts.map((item) => (
        <button
          key={item.id}
          type="button"
          role={item.isError ? "alert" : "status"}
          title="Dismiss"
          onClick={() => dismiss(item.id)}
          className={`animate-toast-in pointer-events-auto rounded-sm p-4 text-left text-white shadow-lg ${
            item.isError ? "bg-red-500" : "bg-[#323232]"
          }`}
        >
          {item.text}
        </button>
      ))}
    </div>
  );
};

export default Toaster;
