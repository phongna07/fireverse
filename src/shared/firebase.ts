import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

import configs from "./configs";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

export const firebaseApp = initializeApp(JSON.parse(configs.firebaseConfig));

export const auth = getAuth(firebaseApp);
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
