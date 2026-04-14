"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>
        <form action={formAction} className="space-y-4">
          <Input name="id" type="text" placeholder="ID" required />
          <Input name="password" type="password" placeholder="Password" required />
          {state?.error && (
            <p className="text-red-500 text-sm">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
