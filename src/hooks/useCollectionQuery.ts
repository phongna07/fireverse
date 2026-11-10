import { Query, QuerySnapshot, onSnapshot } from "firebase/firestore";

import { useSubscription } from "./useSubscription";

export const useCollectionQuery = <T>(
  key: string,
  query: Query<T>,
  options?: { keepPrevious?: boolean },
) =>
  useSubscription<QuerySnapshot<T>>(
    key,
    (onNext, onError) => onSnapshot(query, onNext, onError),
    options,
  );
