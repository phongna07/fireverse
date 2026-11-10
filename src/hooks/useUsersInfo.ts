import { useCallback, useEffect, useState } from "react";

import { SavedUser } from "../shared/types";
import { doc } from "firebase/firestore";
import { getDoc } from "firebase/firestore";
import { usersCollection } from "../shared/collections";

const cache = new Map<string, SavedUser>();
const pending = new Map<string, Promise<SavedUser>>();

// Concurrent requests for the same user share one read
const fetchUser = (uid: string) => {
  const cached = cache.get(uid);
  if (cached) return Promise.resolve(cached);

  const existing = pending.get(uid);
  if (existing) return existing;

  const request = getDoc(doc(usersCollection, uid))
    .then((snapshot) => {
      const user: SavedUser = {
        email: null,
        displayName: "Unknown user",
        photoURL: null,
        phoneNumber: null,
        ...snapshot.data(),
        uid,
      };
      cache.set(uid, user);
      return user;
    })
    .finally(() => pending.delete(uid));

  pending.set(uid, request);

  return request;
};

interface State {
  key: string;
  data: SavedUser[] | null;
  error: boolean;
}

export const useUsersInfo = (userIds: string[] = []) => {
  const key = userIds.join(",");

  const getInitialState = (): State => ({
    key,
    data: userIds.every((id) => cache.has(id))
      ? userIds.map((id) => cache.get(id) as SavedUser)
      : null,
    error: false,
  });

  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setState({ key, data: null, error: false });
    setAttempt((value) => value + 1);
  }, [key]);
  const [state, setState] = useState(getInitialState);

  let current = state;
  if (state.key !== key) {
    current = getInitialState();
    setState(current);
  }

  const isResolved = current.data !== null;

  useEffect(() => {
    if (isResolved) return;

    let cancelled = false;

    Promise.all(key ? key.split(",").map(fetchUser) : [])
      .then((data) => {
        if (!cancelled) setState({ key, data, error: false });
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setState({ key, data: null, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, [key, isResolved, attempt]);

  return {
    data: current.data,
    loading: !current.data && !current.error,
    error: current.error,
    retry,
  };
};
