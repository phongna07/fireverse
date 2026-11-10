import {
  DocumentReference,
  DocumentSnapshot,
  onSnapshot,
} from "firebase/firestore";

import { useSubscription } from "./useSubscription";

export const useDocumentQuery = <T>(
  key: string,
  document: DocumentReference<T>,
) =>
  useSubscription<DocumentSnapshot<T>>(key, (onNext, onError) =>
    onSnapshot(document, onNext, onError),
  );
