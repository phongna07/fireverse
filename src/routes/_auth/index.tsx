import { createFileRoute } from "@tanstack/react-router";

const Home = () => (
  <div className="hidden grow flex-col items-center justify-center gap-3 md:flex!">
    <h1 className="text-center">
      Select or create a conversation to start chatting
    </h1>
  </div>
);

export const Route = createFileRoute("/_auth/")({
  component: Home,
});
