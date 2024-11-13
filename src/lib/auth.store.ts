import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { devtools } from "zustand/middleware";
import { CryptoUtils } from "./crypto.util";
import Cookies from "js-cookie";

interface LoginResponse {
  data: {
    user_name: string;
    user_role_id: number;
    token: string;
    email: string;
    phone_number: string;
  };
  message?: string;
  id?: string;
  jti?: string;
}

interface AuthState {
  user: LoginResponse["data"] | null;
  sessionExpiry: Date | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean; // Add this

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => void;
  clearError: () => void;
  setHydrated: (state: boolean) => void; // Add this
}

const SESSION_DURATION = 30 * 60 * 1000;
const COOKIE_NAME = import.meta.env.VITE_COOKIE_NAME;

const COOKIE_OPTIONS = {
  expires: 1, // 1 day
  secure: import.meta.env.MODE === "production", // Use secure in production
  sameSite: "strict" as const,
  path: "/",
  // cannot use httpOnly when using the js-cookie library, because the library access the cookie via a js bot http
  // httpOnly: import.meta.env.MODE === "production",
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        sessionExpiry: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isHydrated: false,

        setHydrated: (state: boolean) => set({ isHydrated: state }),

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/api/v1/users/login`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              }
            );

            const user = (await response.json()) as LoginResponse;

            if (response.ok && user) {
              const expiry = new Date(Date.now() + SESSION_DURATION);

              set({
                user: user.data,
                isAuthenticated: true,
                sessionExpiry: expiry,
                isLoading: false,
              });
              return;
            }

            throw Error(user.message);
          } catch (err) {
            const error = (err as Error).message;
            let errorMessage = "Login failed. Please try again.";

            switch (error) {
              case "Bad request":
                break;
              case "Resource not found":
                errorMessage = "User not found. Please try again.";
                break;
              default:
                errorMessage = error;
                break;
            }

            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        logout: () => {
          CryptoUtils.clearAuthData();
          set({
            user: null,
            isAuthenticated: false,
            sessionExpiry: null,
            error: null,
          });
        },

        refreshSession: () => {
          const { user } = get();
          if (user) {
            const expiry = new Date(Date.now() + SESSION_DURATION);
            set({ sessionExpiry: expiry });
          }
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: COOKIE_NAME,
        storage: createJSONStorage(() => ({
          getItem: async (key: string): Promise<string | null> => {
            try {
              const cookie = Cookies.get(key);
              if (!cookie) return null;

              const parsed = JSON.parse(cookie);

              // Check if session has expired
              const sessionExpiry = new Date(parsed.state.sessionExpiry);
              if (sessionExpiry < new Date()) {
                CryptoUtils.clearAuthData();
                return null;
              }

              if (parsed.state.user) {
                const decryptedUser = await CryptoUtils.decrypt(
                  parsed.state.user
                );
                parsed.state.user = decryptedUser;
              }

              return JSON.stringify(parsed);
            } catch (error) {
              console.error("Error reading from cookie:", error);
              CryptoUtils.clearAuthData();
              return null;
            }
          },
          setItem: async (key: string, valueStr: string) => {
            try {
              const value = JSON.parse(valueStr);

              if (value.state.user) {
                const encryptedUser = await CryptoUtils.encrypt(
                  value.state.user
                );
                value.state.user = encryptedUser;
              }

              const options = {
                ...COOKIE_OPTIONS,
                expires: new Date(Date.now() + SESSION_DURATION),
              };

              Cookies.set(key, JSON.stringify(value), options);
            } catch (error) {
              console.error("Error setting cookie:", error);
              CryptoUtils.clearAuthData();
            }
          },
          removeItem: (key: string) => {
            CryptoUtils.clearAuthData();
          },
        })),
        partialize: (state) => ({
          user: state.user,
          sessionExpiry: state.sessionExpiry,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHydrated(true);
        },
      }
    )
  )
);

// Add a function to check if store is ready
export const useIsStoreHydrated = () =>
  useAuthStore((state) => state.isHydrated);
