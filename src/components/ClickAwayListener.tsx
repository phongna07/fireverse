import { FC, ReactNode, RefObject, useEffect, useRef } from "react";

interface ClickAwayListenerProps {
  onClickAway: () => void;
  children: (ref: RefObject<HTMLDivElement | null>) => ReactNode;
}

/** Calls `onClickAway` on a click outside the element, or on Escape. */
const ClickAwayListener: FC<ClickAwayListenerProps> = ({
  children,
  onClickAway,
}) => {
  const childrenRef = useRef<HTMLDivElement>(null);
  const onClickAwayRef = useRef(onClickAway);

  useEffect(() => {
    onClickAwayRef.current = onClickAway;
  });

  useEffect(() => {
    const mountedAt = performance.now();

    const handleClick = (e: MouseEvent) => {
      // Ignore the click that mounted this listener
      if (e.timeStamp < mountedAt) return;

      if (
        childrenRef.current &&
        e.target instanceof Node &&
        // The target may have been removed from the page by its own handler
        e.target.isConnected &&
        !childrenRef.current.contains(e.target)
      ) {
        onClickAwayRef.current();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClickAwayRef.current();
    };

    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return <>{children(childrenRef)}</>;
};

export default ClickAwayListener;
