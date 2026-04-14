import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "bordered" | "filled";
}

export function Card({ variant = "bordered", className = "", children, ...props }: CardProps) {
  const variants = {
    bordered: "border border-border rounded-xl hover:shadow-sm transition-shadow",
    filled: "bg-bg-card rounded-xl",
  };
  return (
    <div className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
