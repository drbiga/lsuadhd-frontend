import { ChevronLeft, ChevronRight, Milestone, Target } from "lucide-react";
import { forwardRef, ReactNode, useEffect, useImperativeHandle, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DarkModeButton } from "../common/DarkModeButton";
import { Role, useAuth } from "@/hooks/auth";
import iamService from "@/services/iam";
import { LogOutButton } from "../common/LogOutButton";
import { Button } from "../common/Button";
import { RouteNames } from "@/Routes";

function SidebarLink({ active, collapsed, children, icon, to }: { active?: boolean; collapsed: boolean, icon: ReactNode, to: string, children: ReactNode }) {
    return (
        <li className={`
            text-white hover:bg-slate-500
            py-2 ${collapsed ? "px-2" : "px-8"}
            rounded-md cursor-pointer
            transition-all duration-100
            ${active ? "bg-slate-500" : ""}
            `
        }>
            <Link to={to} state={{ collapsed }}>
                {
                    collapsed
                        ? icon
                        : <div className="flex items-center gap-2">{icon} {children}</div>
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
            h-full bg-slate-700
            flex flex-col items-center justify-between py-8
            transition-all duration-100
            ${collapsed ? "w-[5vw]" : "w-[20vw]"}
        `}>
            <ul className="flex flex-col justify-around gap-4 mt-16">
                {
                    <SidebarLink active={pathname === RouteNames.HOME} to={RouteNames.HOME} collapsed={collapsed} icon={<Target />}>
                        Next Session
                    </SidebarLink>
                }
                {
                    <SidebarLink active={pathname === RouteNames.SESSION_PROGRESS} to={RouteNames.SESSION_PROGRESS} collapsed={collapsed} icon={<Milestone />}>Session Progress</SidebarLink>
                }
            </ul>

            <div className="text-white">
                <div className={`mb-16 flex gap-2 ${collapsed ? "flex-col items-center" : "items-center"}`}>
                    <DarkModeButton className="bg-slate-800 text-slate-200 hover:bg-slate-900 border-0" />
                    <LogOutButton className="bg-slate-800 text-slate-200 hover:bg-slate-900 border-0" />
                </div>

                <div className="flex justify-center">
                    <Button className="bg-slate-800 text-slate-200 hover:bg-slate-900 border-0" onClick={() => setCollapsed(!collapsed)}>
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
