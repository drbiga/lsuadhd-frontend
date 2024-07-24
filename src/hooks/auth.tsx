import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";

import iamService from "@/services/iam";
import api from "@/services/api";
import { getLocalStorage, Item, removeLocalStorage, setLocalStorage } from "@/localstorage";
import { toast } from "react-toastify";
import axios from "axios";

export interface LoginCredentials {
    username: string;
    password: string;
}

interface IAuthContext {
    authState: IAuthState;
    login(credentials: LoginCredentials): Promise<ISession | null>;
    logout(): void;
    // refreshUser(): void;
}

interface IAuthState {
    session?: ISession | null;
    isLoggedIn: boolean;
}

export interface ISession {
    token: string;
    user: User;
};

export interface User {
    username: string;
    role: Role;
};

export enum Role {
    MANAGER = 'manager',
    STUDENT = 'student'
};

function computeInitialState(): IAuthState {
    const sessionString = getLocalStorage(Item.SESSION_OBJ);
    const session: ISession = sessionString ? JSON.parse(sessionString) : {};
    const authState: IAuthState = session ? { session, isLoggedIn: true } : { isLoggedIn: false };
    return authState;
}

const AuthContext = createContext<IAuthContext>({ authState: computeInitialState() } as IAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authState, setAuthState] = useState<IAuthState>(() => {
        const sessionString = getLocalStorage(Item.SESSION_OBJ)
        const session = sessionString ? JSON.parse(sessionString) : null;
        if (session !== null && session.token) {
            return {
                session,
                isLoggedIn: true
            }
        } else {
            return {
                isLoggedIn: false
            }
        }
    });

    const [ipAddress, setIpAddress] = useState<string>('');
    useEffect(() => {
        (async () => {
            const response = await axios.get('https://api.ipify.org/?format=json');
            setIpAddress(response.data.ip);
        })();
    }, []);

    // useEffect(() => {
    //     (async () => {
    //         const sessionString = getLocalStorage(Item.SESSION_OBJ);
    //         const session = sessionString ? JSON.parse(sessionString) : null;
    //         if (session !== null) {
    //             setAuthState({
    //                 session,
    //                 isLoggedIn: true
    //             })
    //         } else {
    //             setAuthState({ isLoggedIn: false });
    //         }
    //     })()
    // }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        try {
            removeLocalStorage(Item.SESSION_OBJ);
            let session = null;
            try {
                session = await iamService.createSession(
                    credentials.username,
                    credentials.password,
                    ipAddress
                );
            } catch {
                toast.error('There was an error while logging you in on our servers')
            }
            if (session) {
                api.defaults.headers.common = { Authorization: `Bearer ${session.token}` }
                setLocalStorage(Item.SESSION_OBJ, JSON.stringify(session));
                setAuthState({
                    session,
                    isLoggedIn: true,
                });
                return session;
            } else {
                toast.error('Error while creating a session')
                removeLocalStorage(Item.SESSION_OBJ);
                setAuthState({
                    isLoggedIn: false
                });
                return null;
            }
        } catch {
            toast.error('Something went wrong while logging in.')
        }
        return null;
    }, [setAuthState, ipAddress]);

    const logout = useCallback(() => {
        removeLocalStorage(Item.SESSION_OBJ);
        setAuthState({
            // session: {} as ISession,
            isLoggedIn: false,
        });
    }, [setAuthState]);


    return (
        <AuthContext.Provider value={{ authState, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function AuthRequired({ children, authRoute }: { children: ReactNode, authRoute: string }) {
    const { authState } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authState.isLoggedIn) {
            navigate(authRoute);
        }
    }, [authState]);

    return (<div>{children}</div>);
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}
