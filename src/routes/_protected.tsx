import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore, useIsStoreHydrated } from "../lib/auth.store";
import { SessionStatus } from "../components/SessionStatus";
import { useEffect } from "react";

export const Route = createFileRoute("/_protected")({
  beforeLoad: ({ location }) => {
    // Only check initial auth state, we'll handle hydration in the component
    const store = useAuthStore.getState();
    if (!store.isHydrated) {
      return; // Wait for hydration
    }
    if (!store.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  loader: ({ location }) => location.href,
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const navigate = Route.useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useIsStoreHydrated();

  const redirect = Route.useLoaderData();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      navigate({
        to: "/login",
        search: {
          redirect,
        },
      });
    }
  }, [isHydrated, isAuthenticated, navigate]);

  if (!isHydrated) {
    return <div>Loading...</div>; // Or your loading component
  }

  return (
    <>
      <Outlet />
      <SessionStatus />
    </>
  );
}
