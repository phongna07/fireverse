import { useCallback, useEffect, useRef, useState } from "react";

const cache = new Map<string, unknown>();

interface State<T> {
  key: string;
  data: T | null;
  loading: boolean;
  error: boolean;
}

/** One-off request cached by `key`. A request made stale by a new key is aborted. */
export function useFetch<T>(
  key: string,
  query: (signal: AbortSignal) => Promise<T>,
) {
  const getInitialState = (): State<T> => ({
    key,
    data: cache.has(key) ? (cache.get(key) as T) : null,
    loading: !cache.has(key),
    error: false,
  });

  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    cache.delete(key);
    setState({ key, data: null, loading: true, error: false });
    setAttempt((value) => value + 1);
  }, [key]);
  const [state, setState] = useState(getInitialState);

  let current = state;
  if (state.key !== key) {
    current = getInitialState();
    setState(current);
  }

  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  });

  useEffect(() => {
    if (cache.has(key)) return;

    const controller = new AbortController();

    queryRef
      .current(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        cache.set(key, data);
        setState({ key, data, loading: false, error: false });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setState({ key, data: null, loading: false, error: true });
      });

    return () => controller.abort();
  }, [key, attempt]);

  return {
    data: current.data,
    loading: current.loading,
    error: current.error,
    retry,
  };
}
