import { ChevronLeft, ChevronRight, Milestone, Target } from "lucide-react";
import { forwardRef, ReactNode, useImperativeHandle, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DarkModeButton } from "../common/DarkModeButton";
import { LogOutButton } from "../common/LogOutButton";
import { Button } from "../common/Button";
import { RouteNames } from "@/Routes";

function SidebarLink({ active, collapsed, children, icon, to }: { active?: boolean; collapsed: boolean, icon: ReactNode, to: string, children: ReactNode }) {
    return (
        <li className={`
            text-sidebar-foreground hover:bg-sidebar-hover
            py-3 ${collapsed ? "px-3" : "px-6"}
            rounded-lg cursor-pointer
            transition-all duration-200
            ${active ? "bg-sidebar-active shadow-sm" : ""}
            `
        }>
            <Link to={to} state={{ collapsed }} className="focus:outline-none focus:ring-2 focus:ring-accent rounded-lg">
                {
                    collapsed
                        ? icon
                        : <div className="flex items-center gap-3 font-medium">{icon} {children}</div>
                }
            </Link>
        </li >
    );
}

export type SidebarHandle = {
    autoCollapse(): void;
}

const Sidebar = forwardRef<SidebarHandle>((_, ref) => {
    const { pathname, state } = useLocation();

    useImperativeHandle(ref, () => ({ autoCollapse: () => setCollapsed(true) }))

    const [collapsed, setCollapsed] = useState(() => {
        if (state && state.collapsed) {
            return true;
        }
        return false;
    });


    return (
        <div className={`
            h-full bg-sidebar border-r border-border
            flex flex-col items-center justify-between py-8
            transition-all duration-300 ease-in-out
            ${collapsed ? "w-[5vw]" : "w-[20vw]"}
        `}>
            <ul className="flex flex-col justify-around gap-3 mt-16 w-full px-4">
                {
                    <SidebarLink active={pathname === RouteNames.HOME} to={RouteNames.HOME} collapsed={collapsed} icon={<Target />}>
                        Next Session
                    </SidebarLink>
                }
                {
                    <SidebarLink active={pathname === RouteNames.SESSION_PROGRESS} to={RouteNames.SESSION_PROGRESS} collapsed={collapsed} icon={<Milestone />}>Session Progress</SidebarLink>
                }
            </ul>

            <div className="text-sidebar-foreground w-full px-4">
                <div className={`mb-16 flex gap-2 ${collapsed ? "flex-col items-center" : "items-center justify-center"}`}>
                    <DarkModeButton className="bg-sidebar-hover text-sidebar-foreground hover:bg-sidebar-active border-0" />
                    <LogOutButton className="bg-sidebar-hover text-sidebar-foreground hover:bg-sidebar-active border-0" />
                </div>

                <div className="flex justify-center">
                    <Button className="bg-sidebar-hover text-sidebar-foreground hover:bg-sidebar-active border-0" onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? (
                            <ChevronRight />
                        ) : (
                            <ChevronLeft />
                        )}
                    </Button>
                </div>
            </div>
        </div >
    );
})

export default Sidebar;
