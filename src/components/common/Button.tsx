import { forwardRef } from "react";
import { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ children, className, ...rest }, _) {
  return (
    <button
      {...rest}
      className={cn("bg-accent text-slate-800 dark:text-slate-200 hover:bg-background border-[1px] border-transparent hover:border-accent rounded-md px-4 py-2 transition-all duration-100", className)}
    >
      {children}
    </button>
  )
});