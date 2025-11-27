import { forwardRef, useCallback, useEffect, useState } from "react";
import { Button } from "./Button";
import { Moon, Sun } from "lucide-react";
import { ButtonProps } from "../ui/button";

export const DarkModeButton = forwardRef<HTMLButtonElement, ButtonProps>(function DarkModeButton({ className, ...rest }, _) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const html = document.documentElement;
        return html.classList.contains('dark');
    });

    useEffect(() => {
        const html = document.documentElement;
        if (isDarkMode) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode(prev => !prev);
    }, []);

    return (
        <Button {...rest} className={className} type="button" onClick={toggleDarkMode}>
            {isDarkMode ? (
                <Moon className="w-5 h-5" />
            ) : (
                <Sun className="w-5 h-5" />
            )}
        </Button>
    )
});