import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "../../lib/auth.store";

export const Route = createFileRoute("/_protected/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = Route.useNavigate();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="mb-4">Welcome, {user?.user_name}!</div>
      <button
        onClick={() => {
          logout();
          navigate({ to: "/login" });
        }}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}
