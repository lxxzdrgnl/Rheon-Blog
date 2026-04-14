import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outlined" | "ghost";
}

export function Button({ variant = "filled", className = "", children, ...props }: ButtonProps) {
  const base = "px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50";
  const variants = {
    filled: "bg-accent text-bg-primary hover:opacity-90",
    outlined: "border border-border text-text-primary hover:bg-bg-elevated",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
