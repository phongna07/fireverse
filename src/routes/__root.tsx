import { Link, Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import { RouterContext } from "../router";

const NotFound = () => (
  <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6">
    <img className="h-32 w-32 object-cover" src="/error.svg" alt="" />
    <p className="text-center text-lg">Page not found</p>
    <Link to="/" className="text-primary">
      Back to home
    </Link>
  </div>
);

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: NotFound,
});
