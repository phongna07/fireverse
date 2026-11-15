import { FC, useEffect } from "react";
import { endActiveCall, handleIncomingCalls } from "../../calls/callManager";
import { onSnapshot, query, where } from "firebase/firestore";
import CallOverlay from "./CallOverlay";
import IncomingCallDialog from "./IncomingCallDialog";
import { callsCollection } from "../../shared/collections";
import { useStore } from "../../store";

// Mounted once for signed-in users, outside the chat route, so calls keep
// going while moving between conversations
const CallLayer: FC = () => {
  const uid = useStore((state) => state.currentUser?.uid);

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = onSnapshot(
      query(
        callsCollection,
        where("participants", "array-contains", uid),
        where("status", "==", "ringing"),
      ),
      (snapshot) =>
        handleIncomingCalls(
          snapshot.docs
            .map((item) => ({ ...item.data(), id: item.id }))
            .filter((call) => call.callerId !== uid),
        ),
      (error) => console.error("Incoming call listener failed", error),
    );

    return () => {
      unsubscribe();
      endActiveCall();
    };
  }, [uid]);

  return (
    <>
      <IncomingCallDialog />
      <CallOverlay />
    </>
  );
};

export default CallLayer;
