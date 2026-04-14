"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-xs space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-sm text-text-tertiary mt-2">Sign in to continue</p>
        </div>
        <form action={formAction} className="space-y-4">
          <input
            name="id"
            type="text"
            placeholder="ID"
            required
            className="w-full px-4 py-3 rounded-lg bg-bg-card border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full px-4 py-3 rounded-lg bg-bg-card border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent text-sm"
          />
          {state?.error && (
            <p className="text-red-500 text-sm">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-accent text-bg-primary text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {pending ? "..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
