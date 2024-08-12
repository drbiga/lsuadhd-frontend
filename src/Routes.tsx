import { RouterProvider, createBrowserRouter } from "react-router-dom"

import Management from "./pages/Management";
import Login from "./pages/Login";
import { AuthRequired } from "./hooks/auth";
import SignUp from "./pages/SignUp";
import NextSession from "./pages/NextSession";
import SessionProgress from "./pages/SessionProgress";
import SessionGroups from "./pages/SessionGroups";

export enum RouteNames {
    BASENAME = '/lsuadhd-frontend',
    HOME = '/',
    LOGIN = '/login',
    SIGNUP = '/signup',
    SESSION_PROGRESS = '/session-progress',
    MANAGEMENT = '/management',
    SESSION_GROUPS = 'session_groups'
}

export default function Routes() {

    const router = createBrowserRouter([
        {
            path: RouteNames.LOGIN,
            element: <Login />
        },
        {
            path: RouteNames.SIGNUP,
            element: <SignUp />
        },
        {
            path: RouteNames.SESSION_PROGRESS,
            element: (
                <AuthRequired authRoute={RouteNames.LOGIN}>
                    <SessionProgress />
                </AuthRequired>
            )
        },
        {
            path: RouteNames.HOME,
            element: (
                <AuthRequired authRoute={RouteNames.LOGIN}>
                    <NextSession />
                </AuthRequired>
            )
        },
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
    ], {
        basename: RouteNames.BASENAME
    });

    return (
        <RouterProvider router={router} />
    )
}