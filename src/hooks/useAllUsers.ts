import { orderBy, query, where } from "firebase/firestore";

import { useCollectionQuery } from "./useCollectionQuery";
import { usersCollection } from "../shared/collections";

export const useAllUsers = () =>
  useCollectionQuery(
    "all-users",
    query(
      usersCollection,
      where("createdAt", "!=", null),
      orderBy("createdAt", "desc"),
    ),
  );
