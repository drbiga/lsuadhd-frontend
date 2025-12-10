import { PropsWithChildren } from "react";
import { useAuth } from "@/hooks/auth";

export function PageContainer({ children }: PropsWithChildren) {
    const { authState } = useAuth();
    const user = authState?.session?.user;

    return (
        <div className="h-[100vh] w-[100vw] flex bg-background relative">
            {authState.isLoggedIn && user && (
                <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
                    <div className="bg-card text-foreground border border-border rounded-xl px-4 py-2.5 shadow-sm">
                        <p className="text-sm font-medium">Logged in as <span className="text-accent font-semibold">{user.username}</span></p>
                    </div>
                </div>
            )}

            {children}
        </div>
    )
}


export function PageTitle({ children }: PropsWithChildren) {
    return (
        <h1 className="text-4xl font-semibold text-foreground tracking-tight">{children}</h1>
    )
}

export function PageMainContent({ children }: PropsWithChildren) {
    return (
        <div className="w-full pl-16 py-8 flex flex-col gap-8 overflow-y-auto">{children}</div>
    )
}


export function PageSectionTitle({ children }: PropsWithChildren) {
    return <h2 className="text-muted-foreground text-2xl mb-8 font-medium">{children}</h2>
}
