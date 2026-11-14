import { FC, useEffect, useRef } from "react";

import { Picker } from "emoji-mart";
import data from "@emoji-mart/data/sets/15/facebook.json";

interface EmojiPickerProps {
  onSelect: (emoji: { native: string }) => void;
}

// @emoji-mart/react does not support React 19, so the core picker (a custom
// element) is mounted by hand.
const EmojiPicker: FC<EmojiPickerProps> = ({ onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const picker = new Picker({
      data,
      dynamicWidth: true,
      set: "facebook",
      theme: "dark",
      previewPosition: "none",
      skinTonePosition: "none",
      onEmojiSelect: (emoji: { native: string }) => onSelectRef.current(emoji),
    }) as unknown as HTMLElement;

    container.appendChild(picker);

    return () => {
      picker.remove();
    };
  }, []);

  return <div className="h-full w-full min-w-0" ref={containerRef} />;
};

export default EmojiPicker;
