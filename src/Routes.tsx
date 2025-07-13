import { RouterProvider, createBrowserRouter } from "react-router-dom"

import Login from "./pages/Auth/Login";
import { AuthRequired } from "./hooks/auth";
import SignUp from "./pages/Auth/SignUp";
import NextSession from "./pages/SessionExecution";
import SessionProgress from "./pages/SessionProgress";

export enum RouteNames {
    BASENAME = '/lsuadhd-frontend',
    HOME = '/',
    LOGIN = '/login',
    SIGNUP = '/signup',
    SESSION_PROGRESS = '/session-progress',
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
    ], {
        basename: RouteNames.BASENAME
    });

    return (
        <RouterProvider router={router} />
    )
}