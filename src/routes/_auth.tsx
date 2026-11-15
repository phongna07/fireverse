import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import CallLayer from "../components/Call/CallLayer";
import SideBar from "../components/Home/SideBar";

const AuthLayout = () => (
  <div className="app-shell flex gap-3">
    <SideBar />
    <Outlet />
    <CallLayer />
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
