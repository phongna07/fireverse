import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import SideBar from "../components/Home/SideBar";

const AuthLayout = () => (
  <div className="app-shell flex gap-3">
    <SideBar />
    <Outlet />
  </div>
);

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context, location }) => {
    if (!context.user)
      throw redirect({
        to: "/sign-in",
        search: {
          redirect: location.href,
        },
      });
  },
  component: AuthLayout,
});
