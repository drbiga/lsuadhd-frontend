import { RouterProvider, createBrowserRouter } from "react-router-dom"

import Management from "./pages/Management";
import Login from "./pages/Login";
import { AuthRequired, Role, useAuth } from "./hooks/auth";
import SignUp from "./pages/SignUp";
import NextSession from "./pages/NextSession";
import SessionProgress from "./pages/SessionProgress";
import SessionGroups from "./pages/SessionGroups";
import { SessionGroupPage } from "./pages/SessionGroup";
import SessionProgressManagementPage from "./pages/SessionProgress/Management";
import Students from "./pages/Management/Students";

export enum RouteNames {
    // BASENAME = '/lsuadhd-frontend',
    BASENAME = '',
    HOME = '/',
    LOGIN = '/login',
    SIGNUP = '/signup',
    SESSION_PROGRESS = '/session-progress',
    MANAGEMENT = '/management',
    SESSION_GROUPS = '/session_groups',
    INDIVIDUAL_SESSION_GROUP = '/session-group',
    MANAGEMENT__STUDENTS = '/students'
}

export default function Routes() {
    const { authState } = useAuth();

    const router = createBrowserRouter([
        // ============================================================
        // Common pages
        {
            path: RouteNames.LOGIN,
            element: <Login />
        },
        {
            path: RouteNames.SIGNUP,
            element: <SignUp />
        },
        // ============================================================
        // Common conditional pages (depend on the role)
        {
            path: RouteNames.SESSION_PROGRESS,
            element: (
                <AuthRequired authRoute={RouteNames.LOGIN}>
                    {
                        (authState.session && authState.session.user.role === Role.MANAGER) ? (
                            <SessionProgressManagementPage />
                        ) : (
                            <SessionProgress />
                        )
                    }
                </AuthRequired>
            )
        },
        {
            path: RouteNames.HOME,
            element: (
                <AuthRequired authRoute={RouteNames.LOGIN}>
                    {(authState.session && authState.session.user.role === Role.STUDENT) ? (
                        <NextSession />
                    ) : (
                        <Management />
                    )}
                </AuthRequired>
            )
        },
        // ============================================================
        // Management Only Pages
        {
            path: RouteNames.MANAGEMENT,
            element: (
                <AuthRequired authRoute={RouteNames.LOGIN}>
                    <Management />
                </AuthRequired>
            ),
        },
        {
            path: RouteNames.SESSION_GROUPS,
            element: (
                <AuthRequired authRoute={RouteNames.LOGIN}>
                    <SessionGroups />
                </AuthRequired>
            ),
        },
        {
            path: RouteNames.INDIVIDUAL_SESSION_GROUP,
            element: (
                <AuthRequired authRoute={RouteNames.LOGIN}>
                    <SessionGroupPage />
                </AuthRequired>
            ),
        },
        {
            path: RouteNames.MANAGEMENT__STUDENTS,
            element: (
                <AuthRequired authRoute={RouteNames.LOGIN}>
                    <Students />
                </AuthRequired>
            )
        }
    ], {
        basename: RouteNames.BASENAME
    });

    return (
        <RouterProvider router={router} />
    )
}