// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./index.css";
import { useIsStoreHydrated } from "./lib/auth.store";

// Create a router instance with properly typed context
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  basepath: import.meta.env.VITE_ASSET_PATH,
});

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Root component that provides auth context and router context
function App() {
  const isHydrated = useIsStoreHydrated();

  if (!isHydrated) {
    return <div>Loading...</div>; // Or your loading component
  }

  return <RouterProvider router={router} />;
}

const rootElement = document.getElementById("app")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
