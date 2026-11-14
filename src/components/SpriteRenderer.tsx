import { FC, HTMLProps, useEffect, useRef, useState } from "react";

interface SpriteRendererProps {
  src: string;
  size: number;
  runOnHover?: boolean;
  delay?: number;
}

const SpriteRenderer: FC<HTMLProps<HTMLDivElement> & SpriteRendererProps> = ({
  src,
  size,
  runOnHover = false,
  delay = 100,
  ...others
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(false);
    const el = containerRef.current;
    if (!el) return;
    const image = new Image();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let interval: ReturnType<typeof setInterval> | undefined;
    let disposed = false;
    let frames = 1;
    let frame = 0;
    let hovered = el.matches(":hover");
    let focused = el === document.activeElement;
    const stop = () => {
      clearInterval(interval);
      interval = undefined;
      frame = 0;
      el.style.backgroundPosition = "0px 50%";
    };
    const start = () => {
      if (interval || reduced.matches || frames <= 1) return;
      interval = setInterval(() => {
        frame = (frame + 1) % frames;
        el.style.backgroundPosition = `${-frame * size}px 50%`;
      }, delay);
    };
    const updatePlayback = () => {
      if (!runOnHover || hovered || focused) start();
      else stop();
    };
    const mouseEntered = () => {
      hovered = true;
      updatePlayback();
    };
    const mouseLeft = () => {
      hovered = false;
      updatePlayback();
    };
    const focusEntered = () => {
      focused = true;
      updatePlayback();
    };
    const focusLeft = () => {
      focused = false;
      updatePlayback();
    };
    image.onload = () => {
      if (disposed) return;
      frames = Math.max(
        1,
        Math.round(image.naturalWidth / image.naturalHeight),
      );
      // Use the same frame width for scaling the sheet and advancing it.
      el.style.backgroundSize = `${frames * size}px ${size}px`;
      setLoaded(true);
      updatePlayback();
    };
    const motionChanged = () => {
      stop();
      updatePlayback();
    };
    image.src = src;
    el.addEventListener("mouseenter", mouseEntered);
    el.addEventListener("mouseleave", mouseLeft);
    el.addEventListener("focus", focusEntered);
    el.addEventListener("blur", focusLeft);
    reduced.addEventListener("change", motionChanged);
    return () => {
      disposed = true;
      image.onload = null;
      stop();
      el.removeEventListener("mouseenter", mouseEntered);
      el.removeEventListener("mouseleave", mouseLeft);
      el.removeEventListener("focus", focusEntered);
      el.removeEventListener("blur", focusLeft);
      reduced.removeEventListener("change", motionChanged);
    };
  }, [src, size, runOnHover, delay]);
  return (
    <div
      ref={containerRef}
      role={others.onClick ? "button" : undefined}
      tabIndex={others.onClick ? 0 : undefined}
      aria-label={others.onClick ? "Select sticker" : undefined}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && others.onClick) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        alignSelf: "center",
        opacity: loaded ? 1 : 0,
        backgroundImage: `url(${src})`,
        backgroundRepeat: "no-repeat",
      }}
      {...others}
    />
  );
};
export default SpriteRenderer;
