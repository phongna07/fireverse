import { useStore } from "../store";
import { useCallback, useEffect, useRef, useState } from "react";

export type Subscribe<T> = (
  onNext: (value: T) => void,
  onError: (error: unknown) => void,
) => () => void;

interface State<T> {
  key: string;
  data: T | null;
  loading: boolean;
  error: boolean;
}

interface Options {
  /** While a new key loads, keep returning the data of the previous key */
  keepPrevious?: boolean;
}

const cache = new Map<string, unknown>();

/**
 * Subscribes to a realtime source identified by `key`. The last value of every
 * key is cached, so remounting shows it immediately while the subscription
 * reconnects.
 */
export function useSubscription<T>(
  queryKey: string,
  subscribe: Subscribe<T>,
  { keepPrevious = false }: Options = {},
) {
  const uid = useStore((state) => state.currentUser?.uid);
  const key = `${uid || "signed-out"}:${queryKey}`;
  const getInitialState = (previous?: State<T>): State<T> => {
    if (cache.has(key))
      return { key, data: cache.get(key) as T, loading: false, error: false };

    return {
      key,
      data: keepPrevious && previous ? previous.data : null,
      loading: true,
      error: false,
    };
  };

  const [state, setState] = useState<State<T>>(() => getInitialState());
  const [attempt, setAttempt] = useState(0);

  // Reset during render when the key changes, so data of the previous key is
  // never shown for the new one
  let current = state;
  if (state.key !== key) {
    current = getInitialState(state);
    setState(current);
  }

  const subscribeRef = useRef(subscribe);
  useEffect(() => {
    subscribeRef.current = subscribe;
  });

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeRef.current(
      (data) => {
        if (!active) return;
        if (cache.size >= 100) cache.delete(cache.keys().next().value!);
        cache.set(key, data);
        setState({ key, data, loading: false, error: false });
      },
      (error) => {
        if (!active) return;
        console.error(error);
        cache.delete(key);
        setState({ key, data: null, loading: false, error: true });
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [key, attempt]);

  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: false }));
    setAttempt((prev) => prev + 1);
  }, []);

  return {
    data: current.data,
    loading: current.loading,
    error: current.error,
    retry,
  };
}
