import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-black text-white hover:bg-gray-800 active:scale-[0.98]": variant === "primary",
            "bg-gray-100 text-gray-900 hover:bg-gray-200 active:scale-[0.98]": variant === "secondary",
            "text-gray-600 hover:text-gray-900 hover:bg-gray-100": variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]": variant === "danger",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2.5 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
