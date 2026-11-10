import { FC, useEffect } from "react";
import { auth, db } from "./shared/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { BarWave } from "./components/Loading";
import { RouterProvider } from "@tanstack/react-router";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "./router";
import { useStore } from "./store";

const App: FC = () => {
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber || user.providerData?.[0]?.phoneNumber,
          createdAt: serverTimestamp(),
        });
      } else setCurrentUser(null);
    });
  }, []);

  // Re-run the route guards whenever the signed-in user changes
  useEffect(() => {
    if (typeof currentUser !== "undefined") router.invalidate();
  }, [currentUser]);

  if (typeof currentUser === "undefined")
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BarWave />
      </div>
    );

  return <RouterProvider router={router} context={{ user: currentUser }} />;
};

export default App;
