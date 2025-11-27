import { forwardRef } from "react";
import { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ children, className, ...rest }, _) {
  return (
    <button
      {...rest}
      className={cn("bg-accent text-accent-foreground hover:bg-accent/80 font-medium rounded-lg px-5 py-2.5 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2", className)}
    >
      {children}
    </button>
  )
});