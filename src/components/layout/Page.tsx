import { PropsWithChildren } from "react";
import { useAuth } from "@/hooks/auth";

export function PageContainer({ children }: PropsWithChildren) {
    const { authState } = useAuth();
    const user = authState?.session?.user;

    return (
        <div className="h-[100vh] w-[100vw] flex bg-background relative">
            {authState.isLoggedIn && user && (
                <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
                    <div className="bg-card text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-2xl p-3">
                        <p className="text-sm font-medium">Logged in as: <span className="text-yellow-500">{user.username}</span></p>
                    </div>
                </div>
            )}

            {children}
        </div>
    )
}


export function PageTitle({ children }: PropsWithChildren) {
    return (
        <h1 className="text-4xl text-slate-800 dark:text-slate-200">{children}</h1>
    )
}

export function PageMainContent({ children }: PropsWithChildren) {
    return (
        <div className="w-full pl-16 py-8 flex flex-col gap-8 overflow-y-auto">{children}</div>
    )
}


export function PageSectionTitle({ children }: PropsWithChildren) {
    return <h2 className="text-slate-400 dark:text-slate-600 opacity-70 text-2xl mb-8">{children}</h2>
}
