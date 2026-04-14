import { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-4 py-2.5 rounded-lg border border-border bg-bg-primary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent ${className}`}
      {...props}
    />
  );
}
