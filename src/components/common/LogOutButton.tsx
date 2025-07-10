import { useAuth } from "@/hooks/auth";
import { LogOut } from "lucide-react";
import { Button } from "./Button";
import { forwardRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ButtonProps } from "./ui/button";

export const LogOutButton = forwardRef<HTMLButtonElement, ButtonProps>(function LogOutButton({ className, ...rest }, _) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = useCallback(() => {
        logout();
        navigate('/login');
    }, [logout]);

    return (
        <Button {...rest} className={className} onClick={() => handleLogout()}>
            <LogOut />
        </Button>
    )
});
