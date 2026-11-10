import { FC, useEffect, useState } from "react";
import ClickAwayListener from "../ClickAwayListener";
import { Spinner } from "../Loading";
import configs from "../../shared/configs";
import { GiphyResponse } from "../../shared/types";
import { useFetch } from "../../hooks/useFetch";

interface GifPickerProps {
  setIsOpened: (value: boolean) => void;
  onSelect: (gif: string) => void;
}
const GifPicker: FC<GifPickerProps> = ({ setIsOpened, onSelect }) => {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 350);
    return () => clearTimeout(timer);
  }, [input]);
  const { data, loading, error, retry } = useFetch<GiphyResponse>(
    `giphy-${search}`,
    async (signal) => {
      const params = new URLSearchParams({
        api_key: configs.giphyAPIKey,
        limit: "30",
      });
      if (search) params.set("q", search);
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/${search ? "search" : "trending"}?${params}`,
        { signal },
      );
      if (!response.ok) throw new Error("Unable to load GIFs");
      return response.json();
    },
  );
  return (
    <ClickAwayListener onClickAway={() => setIsOpened(false)}>
      {(ref) => (
        <div
          ref={ref}
          className="picker-panel flex flex-col rounded-lg border-2 border-dark-lighten bg-[#222222] p-4 shadow-2xl"
        >
          <input
            aria-label="Search GIFs"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search GIFs..."
            className="w-full rounded-full bg-dark-lighten px-4 py-2"
          />
          {loading ? (
            <div className="m-auto">
              <Spinner />
            </div>
          ) : error ? (
            <div className="m-auto text-center">
              Unable to load GIFs.{" "}
              <button onClick={retry} className="text-primary">
                Retry
              </button>
            </div>
          ) : (
            <div className="mt-3 flex min-h-0 flex-wrap gap-2 overflow-y-auto">
              {data?.data.map((gif) => (
                <button
                  key={gif.id}
                  aria-label={gif.title || "Send GIF"}
                  onClick={() => {
                    onSelect(gif.images.original.url);
                    setIsOpened(false);
                  }}
                  className="h-[100px] min-w-20 flex-1"
                >
                  <img
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    src={
                      gif.images.fixed_height_small?.url ||
                      gif.images.fixed_height?.url ||
                      gif.images.original.url
                    }
                    alt={gif.title || "GIF"}
                  />
                </button>
              ))}
              {data?.data.length === 0 && (
                <p>No GIFs found. Try another search.</p>
              )}
            </div>
          )}
        </div>
      )}
    </ClickAwayListener>
  );
};
export default GifPicker;
