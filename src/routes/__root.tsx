import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { DefaultCatchBoundary } from "../components/DefaultCatchBoundary";
import { NotFound } from "../components/NotFount";

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: (props) => <DefaultCatchBoundary {...props} />,
  notFoundComponent: () => <NotFound />,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      {import.meta.env.MODE === "development" && <TanStackRouterDevtools />}
    </>
  );
}
