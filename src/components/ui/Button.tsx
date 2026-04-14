import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outlined";
}

export function Button({ variant = "filled", className = "", children, ...props }: ButtonProps) {
  const base = "px-5 py-2.5 rounded-full text-sm font-medium transition-colors";
  const variants = {
    filled: "bg-accent text-white hover:opacity-90",
    outlined: "border border-border text-text-primary hover:bg-bg-card",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
