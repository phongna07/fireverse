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
    image.onload = () => {
      if (disposed) return;
      frames = Math.max(1, Math.round(image.width / image.height));
      setLoaded(true);
      if (!runOnHover) start();
    };
    const motionChanged = () => {
      stop();
      if (!runOnHover) start();
    };
    image.src = src;
    el.addEventListener("mouseenter", start);
    el.addEventListener("mouseleave", stop);
    el.addEventListener("focus", start);
    el.addEventListener("blur", stop);
    reduced.addEventListener("change", motionChanged);
    return () => {
      disposed = true;
      image.onload = null;
      stop();
      el.removeEventListener("mouseenter", start);
      el.removeEventListener("mouseleave", stop);
      el.removeEventListener("focus", start);
      el.removeEventListener("blur", stop);
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
        opacity: loaded ? 1 : 0,
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
      }}
      {...others}
    />
  );
};
export default SpriteRenderer;
