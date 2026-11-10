import { User } from "firebase/auth";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export interface RouterContext {
  user: User | null;
}

export const router = createRouter({
  routeTree,
  context: { user: null },
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
