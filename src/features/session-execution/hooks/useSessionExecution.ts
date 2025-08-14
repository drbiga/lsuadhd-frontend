import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import sessionExecutionService, { Session, SessionProgressData, Stage } from "@/features/session-execution/services/sessionExecutionService";
import { toast } from "react-toastify";
import { getLocalStorage, setLocalStorage, removeLocalStorage, Item } from "@/lib/localstorage";

interface CachedSessionData {
    nextSession: Session | null;
    remainingSessions: Session[];
    sessionHasStarted: boolean;
    stage: Stage | null;
    hasNextSession: number;
}

function isTabMoved(): boolean {
    const isAutoCloseTab = new URLSearchParams(window.location.search).get('autoclose') === 'true';
    const tabId = sessionStorage.getItem('tabId');
    return !isAutoCloseTab && !!tabId && localStorage.getItem(`tab-moved-${tabId}`) === 'true';
}

export function useSessionExecution() {
    const [nextSession, setNextSession] = useState<Session | null>(null);
    const [remainingSessions, setRemainingSessions] = useState<Session[]>([]);
    const [sessionHasStarted, setSessionHasStarted] = useState<boolean>(false);
    const [sessionProgressData, setSessionProgressData] = useState<SessionProgressData | null>(null);
    const [hasNextSession, setHasNextSession] = useState<number>(-1); // -1: loading, 0: no, 1: yes
    const [sessionHasEquipment, setSessionHasEquipment] = useState<boolean>(false);

    const { authState } = useAuth();

    useEffect(() => {
        const cachedData = getLocalStorage(Item.SESSION_EXECUTION_CACHE);
        if (cachedData) {
            try {
                const parsed: CachedSessionData = JSON.parse(cachedData);
                setNextSession(parsed.nextSession);
                setRemainingSessions(parsed.remainingSessions);
                setSessionHasStarted(parsed.sessionHasStarted);
                setHasNextSession(parsed.hasNextSession);
            } catch (error) {
                console.error("Error parsing cached session data:", error);
                removeLocalStorage(Item.SESSION_EXECUTION_CACHE);
            }
        }
    }, []);

    const saveToLocalStorage = useCallback((
        nextSession: Session | null,
        remainingSessions: Session[],
        sessionHasStarted: boolean,
        stage: Stage | null,
        hasNextSession: number
    ) => {
        const stateToCache: CachedSessionData = {
            nextSession,
            remainingSessions,
            sessionHasStarted,
            stage,
            hasNextSession
        };
        setLocalStorage(Item.SESSION_EXECUTION_CACHE, JSON.stringify(stateToCache));
    }, []);

    const fetchNextSession = useCallback(async () => {
        if (!authState.session?.user.username || isTabMoved()) return;

        try {
            const sessions = await sessionExecutionService.getRemainingSessionsForStudent(
                authState.session.user.username
            );
            setRemainingSessions(sessions);

            if (sessions.length > 0) {
                setNextSession(sessions[0]);
                setSessionHasEquipment(!sessions[0].no_equipment);
                setHasNextSession(1);
                saveToLocalStorage(sessions[0], sessions, false, null, 1);
            } else {
                setHasNextSession(0);
                saveToLocalStorage(null, sessions, false, null, 0);
            }
        } catch (error) {
            console.error("Error fetching next session:", error);
            setHasNextSession(0);
            saveToLocalStorage(null, [], false, null, 0);
        }
    }, [authState.session?.user.username, saveToLocalStorage]);

    const startSession = useCallback(async () => {
        if (!authState.session?.user.username || !nextSession || isTabMoved()) return;

        setSessionHasEquipment(nextSession && !nextSession.no_equipment);

        try {
            await sessionExecutionService.startSessionForStudent(
                authState.session.user.username,
                (progressData) => {
                    setSessionProgressData(progressData);
                    saveToLocalStorage(nextSession, [], true, progressData.stage, 1);
                }
            );
            setSessionHasStarted(true);
            saveToLocalStorage(nextSession, [], true, null, 1);
            toast.success("Session started successfully");
        } catch (error) {
            console.error("Error starting session:", error);
            toast.error("Failed to start session");
        }
    }, [authState.session?.user.username, nextSession, saveToLocalStorage]);

    const startHomework = useCallback(async () => {
        if (!authState.session?.user.username) return;

        try {
            await sessionExecutionService.startHomeworkForStudent(authState.session.user.username);
            toast.success("Homework started");
        } catch (error) {
            console.error("Error starting homework:", error);
            toast.error("Failed to start homework");
        }
    }, [authState.session?.user.username]);

    const finishSession = useCallback(async () => {
        if (!authState.session?.user.username) return;

        try {
            const updatedSession = await sessionExecutionService.finishSessionForStudent(authState.session.user.username);

            if (sessionProgressData) {
                const updatedProgressData = {
                    ...sessionProgressData,
                    stage: Stage.FINISHED
                };
                setSessionProgressData(updatedProgressData);
            }

            setNextSession(updatedSession);

            setTimeout(() => {
                removeLocalStorage(Item.SESSION_EXECUTION_CACHE);
            }, 2000);

            toast.success("Session finished");
        } catch (error) {
            console.error("Error finishing session:", error);
            toast.error("Failed to finish session");
        }
    }, [authState.session?.user.username, sessionProgressData]);

    useEffect(() => {
        fetchNextSession();

        return () => sessionExecutionService.cleanup();
    }, [fetchNextSession]);

    useEffect(() => {
        (async () => {
            if (authState.session?.user.username && !isTabMoved()) {
                try {
                    const student = await sessionExecutionService.getStudent(
                        authState.session.user.username
                    );
                    if (student.active_session !== null) {
                        setSessionHasStarted(true);
                        setNextSession(student.active_session);
                        setSessionHasEquipment(!student.active_session.no_equipment);

                        sessionExecutionService.setUpdateCallback(
                            student.name,
                            (progressData) => {
                                setSessionProgressData(progressData);
                                saveToLocalStorage(student.active_session, [], true, progressData.stage, 1);
                            }
                        );

                        const progress = await sessionExecutionService.getSessionProgress(
                            authState.session.user.username
                        );
                        setSessionProgressData(progress);

                        saveToLocalStorage(student.active_session, [], true, progress.stage, 1);
                    }
                } catch (error) {
                    console.error("Error getting session state:", error);
                }
            }
        })();
    }, [authState.session?.user.username]);

    return {
        nextSession,
        remainingSessions,
        sessionHasStarted,
        sessionProgressData,
        hasNextSession,
        sessionHasEquipment,
        startSession,
        startHomework,
        fetchNextSession,
        finishSession,
    };
}