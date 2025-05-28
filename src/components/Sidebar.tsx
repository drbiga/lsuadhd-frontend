import { ChevronLeft, ChevronRight, Group, LayoutGrid, Milestone, Target, Users } from "lucide-react";
import { forwardRef, ReactNode, SetStateAction, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DarkModeButton } from "./DarkModeButton";
import { Role, useAuth } from "@/hooks/auth";
import iamService from "@/services/iam";
import { LogOutButton } from "./LogOutButton";
import { Button } from "./Button";
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

const Sidebar = forwardRef<SidebarHandle>((props, ref) => {
    const [allowedContexts, setAllowedContexts] = useState<string[]>([]);
    const { pathname, state } = useLocation();

    const { authState } = useAuth();

    useImperativeHandle(ref, () => ({ autoCollapse: () => setCollapsed(true) }))

    useEffect(() => {
        (async () => {
            if (authState && authState.session && authState.session.user) {
                const contexts = await iamService.searchContexts(authState.session.user.role);
                setAllowedContexts(contexts.map(c => c.name));
            }
        })()
    }, [authState]);

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
                    allowedContexts.includes('management') &&
                    <SidebarLink active={pathname === RouteNames.MANAGEMENT} to={RouteNames.MANAGEMENT} collapsed={collapsed} icon={<LayoutGrid />}>Management</SidebarLink>
                }
                {
                    allowedContexts.includes('management') &&
                    <SidebarLink active={pathname === RouteNames.SESSION_GROUPS} to={RouteNames.SESSION_GROUPS} collapsed={collapsed} icon={<Group />}>Session Groups</SidebarLink>
                }
                {
                    allowedContexts.includes('management') &&
                    <SidebarLink active={pathname === RouteNames.MANAGEMENT__STUDENTS} to={RouteNames.MANAGEMENT__STUDENTS} collapsed={collapsed} icon={<Users />}>Students</SidebarLink>
                }
                {
                    allowedContexts.includes('session_execution') && authState.session?.user.role === Role.STUDENT && (
                        <SidebarLink active={pathname === RouteNames.HOME} to={RouteNames.HOME} collapsed={collapsed} icon={<Target />}>
                            Next Session
                        </SidebarLink>
                    )
                }
                {
                    allowedContexts.includes('session_execution') &&
                    <SidebarLink active={pathname === RouteNames.SESSION_PROGRESS} to={RouteNames.SESSION_PROGRESS} collapsed={collapsed} icon={<Milestone />}>Session Progress</SidebarLink>
                }
                {/* {
                    allowedContexts.includes('goals') &&
                    <SidebarLink active={pathname === '/goals'} to='/goals' collapsed={collapsed} icon={<Goal />}>My Goals</SidebarLink>
                } */}
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
