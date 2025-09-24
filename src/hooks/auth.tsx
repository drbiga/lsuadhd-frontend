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
import { getLocalStorage, Item, removeLocalStorage, setLocalStorage } from "@/lib/localstorage";
import { toast } from "react-toastify";
import axios, { AxiosError } from "axios";

export interface LoginCredentials {
    username: string;
    password: string;
}

interface IAuthContext {
    authState: IAuthState;
    login(credentials: LoginCredentials): Promise<ISession | null>;
    logout(): void;
    // refreshUser(): void;
    initializeLocalServer(): void;
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

const AuthContext = createContext<IAuthContext>({} as IAuthContext);


export function AuthProvider({ children }: { children: ReactNode }) {
    const [ipAddress, setIpAddress] = useState<string>('');
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

    useEffect(() => {
        (async () => {
            const response = await axios.get('https://api.ipify.org/?format=json');
            setIpAddress(response.data.ip);

            if (authState.isLoggedIn && authState.session) {
                initializeLocalServer();    
            }

        })();
    }, []);

    const initializeLocalServer = useCallback(async () => {
        try {
            if (!authState.isLoggedIn) {
                return;
            }
            const response = await axios.get('http://localhost:8001/session');
            const localServerSession: ISession = response.data;
            if (authState.session && localServerSession.token !== authState.session?.token) {
                axios.post('http://localhost:8001/session', authState.session);
            }
            return authState;
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 412) {
                    // No session set in the local server yet, so we just set normally
                    if (authState.session) {
                        axios.post('http://localhost:8001/session', authState.session);
                        return authState;
                    }
                }
            }
        }
    }, [authState.isLoggedIn, authState.session]);

    const login = useCallback(async (credentials: LoginCredentials) => {
        try {
            removeLocalStorage(Item.SESSION_OBJ);
            let session: ISession | null = null;
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
                if (session.user.role === Role.MANAGER) {
                    toast.error('Manager accounts are not permitted to access this app');
                    return null;
                }

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
        <AuthContext.Provider value={{ authState, login, logout, initializeLocalServer }}>
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
