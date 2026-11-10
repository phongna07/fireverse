import Toaster from "./components/Toaster";
import { toast } from "./store/toast";
import { FC, useEffect } from "react";
import { auth, db } from "./shared/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { BarWave } from "./components/Loading";
import { RouterProvider } from "@tanstack/react-router";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "./router";
import { useStore } from "./store";

const App: FC = () => {
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) return;
      const reference = doc(db, "users", user.uid);
      void getDoc(reference)
        .then((snapshot) =>
          setDoc(
            reference,
            {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              phoneNumber:
                user.phoneNumber || user.providerData[0]?.phoneNumber || null,
              ...(!snapshot.data()?.createdAt
                ? { createdAt: serverTimestamp() }
                : {}),
            },
            { merge: true },
          ),
        )
        .catch(() =>
          toast.error(
            "Could not update your profile. Please try signing in again.",
          ),
        );
    });
  }, []);

  // Re-run the route guards whenever the signed-in user changes
  useEffect(() => {
    if (typeof currentUser !== "undefined") router.invalidate();
  }, [currentUser]);

  if (typeof currentUser === "undefined")
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <BarWave />
      </div>
    );

  return (
    <>
      <RouterProvider router={router} context={{ user: currentUser }} />
      <Toaster />
    </>
  );
};

export default App;
