import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

import configs from "./configs";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeApp } from "firebase/app";

const firebaseApp = initializeApp(JSON.parse(configs.firebaseConfig));

export const auth = getAuth(firebaseApp);
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
export const storage = getStorage(firebaseApp);
