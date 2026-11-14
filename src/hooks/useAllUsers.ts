import { useCollectionQuery } from "./useCollectionQuery";
import { usersCollection } from "../shared/collections";

// Subscribe to the complete directory, including older users without createdAt.
// Searching this snapshot is local and never issues a query per keystroke.
export const useAllUsers = () =>
  useCollectionQuery("all-users", usersCollection);
