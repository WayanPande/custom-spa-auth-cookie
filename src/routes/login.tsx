import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "../lib/auth.store";
import { useEffect } from "react";
import { z } from "zod";
import { type FieldApi, useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";

type RedirectParams = {
  redirect?: string;
};

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): RedirectParams => {
    return {
      redirect: search.redirect as string,
    };
  },
});

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <em role="alert" className="text-red-500 text-sm">
          {field.state.meta.errors.join(",")}
        </em>
      ) : null}
      {field.state.meta.isValidating ? "Validating..." : null}
    </>
  );
}

function LoginPage() {
  const navigate = Route.useNavigate();
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const { redirect } = Route.useSearch();

  const form = useForm({
    validatorAdapter: zodValidator(),
    validators: {
      onChange: formSchema,
    },
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      console.log(value);

      await login(value.email, value.password);
      navigate({ to: redirect ?? "/dashboard" });
    },
  });

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="mt-8 space-y-6"
        >
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <form.Field
            name="email"
            children={(field) => (
              <>
                <input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Email"
                  type="email"
                />
                <FieldInfo field={field} />
              </>
            )}
          />
          <form.Field
            name="password"
            children={(field) => (
              <>
                <input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Password"
                  type="password"
                />
                <FieldInfo field={field} />
              </>
            )}
          />
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            )}
          />
        </form>
      </div>
    </div>
  );
}
