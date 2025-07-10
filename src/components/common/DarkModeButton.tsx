import { forwardRef, useCallback, useState } from "react";
import { Button } from "./Button";
import { Moon, Sun } from "lucide-react";
import { ButtonProps } from "../ui/button";

export const DarkModeButton = forwardRef<HTMLButtonElement, ButtonProps>(function DarkModeButton({ className, ...rest }, _) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const html = document.getElementById('html');
        if (html) {
            return html.classList.contains('dark')
        }
    });

    const toggleDarkMode = useCallback(() => {
        const html = document.getElementById('html');
        if (isDarkMode) {
            html?.classList.remove('dark')
            setIsDarkMode(false);
        } else {
            html?.classList.add('dark');
            setIsDarkMode(true);
        }
    }, [isDarkMode])

    return (
        <Button {...rest} className={className} type="button" onClick={() => toggleDarkMode()}>
            {isDarkMode ? (
                <Moon />
            ) : (
                <Sun />
            )}
        </Button>
    )
});