import { FC, Fragment, useState } from "react";

import ClickAwayListener from "../ClickAwayListener";
import { STICKERS_URL } from "../../shared/constants";
import { Spinner as Spin } from "../Loading";
import SpriteRenderer from "../SpriteRenderer";
import { StickerCollections } from "../../shared/types";
import { useFetch } from "../../hooks/useFetch";

interface StickerPickerOpened {
  setIsOpened: (value: boolean) => void;
  onSelect: (value: string) => void;
}

const getRecentStickers = () => {
  const existing = localStorage.getItem("fireverse-recent-stickers") || "[]";
  try {
    const parsed = JSON.parse(existing);
    if (Array.isArray(parsed))
      return parsed
        .filter((item): item is string => typeof item === "string")
        .slice(0, 30);
    return [];
  } catch (error) {
    return [];
  }
};

const StickerPicker: FC<StickerPickerOpened> = ({ setIsOpened, onSelect }) => {
  const { data, loading, error, retry } = useFetch<StickerCollections>(
    "sticker",
    (signal) => fetch(STICKERS_URL, { signal }).then((res) => res.json()),
  );

  const [recentStickers, setRecentStickers] = useState(getRecentStickers());

  const addRecentSticker = (url: string) => {
    const added = [...new Set([url, ...recentStickers])].slice(0, 30);

    localStorage.setItem("fireverse-recent-stickers", JSON.stringify(added));

    setRecentStickers(added);
  };

  return (
    <ClickAwayListener onClickAway={() => setIsOpened(false)}>
      {(ref) => (
        <div
          ref={ref}
          className="picker-panel rounded-lg border-2 border-dark-lighten bg-[#222222] shadow-2xl"
        >
          {error ? (
            <p className="p-4 text-center">
              Unable to load stickers. <button onClick={retry}>Retry</button>
            </p>
          ) : loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Spin />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col">
              <div className="grow overflow-y-auto p-3 pt-1">
                {recentStickers.length > 0 && (
                  <>
                    <h1 className="mt-2" id="sticker-recent">
                      Recent stickers
                    </h1>
                    <div className="grid w-full grid-cols-5 justify-between">
                      {recentStickers.map((url) => (
                        <SpriteRenderer
                          key={url}
                          size={60}
                          onClick={() => {
                            onSelect(url);
                            addRecentSticker(url);
                            setIsOpened(false);
                          }}
                          className="cursor-pointer hover:bg-dark-lighten"
                          src={url}
                          runOnHover
                        />
                      ))}
                    </div>
                  </>
                )}

                {data?.map((collection) => (
                  <Fragment key={collection.id}>
                    <h1 className="mt-2" id={`sticker-${collection.id}`}>
                      {collection.name}
                    </h1>
                    <div className="grid w-full grid-cols-5 justify-between">
                      {collection.stickers.map((sticker) => (
                        <SpriteRenderer
                          key={sticker.spriteURL}
                          size={60}
                          onClick={() => {
                            onSelect(sticker.spriteURL);
                            addRecentSticker(sticker.spriteURL);
                            setIsOpened(false);
                          }}
                          className="cursor-pointer hover:bg-dark-lighten"
                          src={sticker.spriteURL}
                          runOnHover
                        />
                      ))}
                    </div>
                  </Fragment>
                ))}
              </div>

              <div className="flex h-18 w-full shrink-0 gap-2 overflow-x-auto border-t border-t-dark-lighten p-2">
                {recentStickers.length > 0 && (
                  <button
                    onClick={() =>
                      document
                        .querySelector(`#sticker-recent`)
                        ?.scrollIntoView()
                    }
                    className="flex h-9 w-9 items-center"
                  >
                    <i className="bx bx-time text-[26px] leading-[26px]"></i>
                  </button>
                )}
                {data?.map((collection) => (
                  <button
                    aria-label={collection.name}
                    key={collection.id}
                    onClick={() =>
                      document
                        .querySelector(`#sticker-${collection.id}`)
                        ?.scrollIntoView()
                    }
                    className="h-9 w-9 shrink-0"
                  >
                    <img
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                      src={collection.icon}
                      alt=""
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ClickAwayListener>
  );
};

export default StickerPicker;
