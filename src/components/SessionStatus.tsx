import { useEffect, useState } from "react";
import { useAuthStore } from "../lib/auth.store";

export function SessionStatus() {
  const sessionExpiry = useAuthStore((state) => state.sessionExpiry);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const updateTimeRemaining = () => {
      if (sessionExpiry) {
        const remaining = new Date(sessionExpiry).getTime() - Date.now();
        if (remaining > 0) {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeRemaining(`${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining("Expired");
          logout();
        }
      }
    };

    const timer = setInterval(updateTimeRemaining, 1000);
    updateTimeRemaining();

    return () => clearInterval(timer);
  }, [sessionExpiry]);

  if (!sessionExpiry) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <div className="text-sm text-gray-600">
        Session expires in: {timeRemaining}
      </div>
      <button
        onClick={refreshSession}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Refresh Session
      </button>
    </div>
  );
}
