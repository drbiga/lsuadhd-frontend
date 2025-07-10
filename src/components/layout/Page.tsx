import { PropsWithChildren } from "react";

export function PageContainer({ children }: PropsWithChildren) {
    return (
        <div className="h-[100vh] w-[100vw] flex bg-background">{children}</div>
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
