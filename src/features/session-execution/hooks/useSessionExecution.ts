import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import sessionExecutionService, { Session, SessionProgressData, Stage } from "@/features/session-execution/services/sessionExecutionService";
import { toast } from "react-toastify";

export function useSessionExecution() {
    const [nextSession, setNextSession] = useState<Session | null>(null);
    const [remainingSessions, setRemainingSessions] = useState<Session[]>([]);
    const [sessionHasStarted, setSessionHasStarted] = useState<boolean>(false);
    const [sessionProgressData, setSessionProgressData] = useState<SessionProgressData | null>(null);
    const [hasNextSession, setHasNextSession] = useState<number>(-1); // -1: loading, 0: no, 1: yes

    const { authState } = useAuth();

    const fetchNextSession = useCallback(async () => {
        if (!authState.session?.user.username) return;

        try {
            const sessions = await sessionExecutionService.getRemainingSessionsForStudent(
                authState.session.user.username
            );
            setRemainingSessions(sessions);

            if (sessions.length > 0) {
                setNextSession(sessions[0]);
                setHasNextSession(1);
            } else {
                setHasNextSession(0);
            }
        } catch (error) {
            console.error("Error fetching next session:", error);
            setHasNextSession(0);
        }
    }, [authState.session?.user.username]);

    const startSession = useCallback(async () => {
        if (!authState.session?.user.username || !nextSession) return;

        try {
            await sessionExecutionService.startSessionForStudent(
                authState.session.user.username,
                setSessionProgressData
            );
            setSessionHasStarted(true);
            toast.success("Session started successfully");
        } catch (error) {
            console.error("Error starting session:", error);
            toast.error("Failed to start session");
        }
    }, [authState.session?.user.username, nextSession]);

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
                setSessionProgressData({
                    ...sessionProgressData,
                    stage: Stage.FINISHED
                });
            }

            setNextSession(updatedSession);

            toast.success("Session finished");
        } catch (error) {
            console.error("Error finishing session:", error);
            toast.error("Failed to finish session");
        }
    }, [authState.session?.user.username, sessionProgressData]);

    useEffect(() => {
        fetchNextSession();
    }, [fetchNextSession]);

    useEffect(() => {
        (async () => {
            if (authState.session?.user.username) {
                try {
                    const student = await sessionExecutionService.getStudent(
                        authState.session.user.username
                    );
                    if (student.active_session !== null) {
                        setSessionHasStarted(true);
                        setNextSession(student.active_session);

                        sessionExecutionService.setUpdateCallback(
                            student.name,
                            setSessionProgressData
                        );

                        const progress = await sessionExecutionService.getSessionProgress(
                            authState.session.user.username
                        );
                        setSessionProgressData(progress);
                    }
                } catch (error) {
                    console.error("Error getting session state:", error);
                }
            }
        })();
    }, [authState.session?.user.username]);

    useEffect(() => {
        if (sessionHasStarted && authState.session?.user.username) {
            sessionExecutionService.setUpdateCallback(
                authState.session.user.username,
                setSessionProgressData
            );
        }
    }, [sessionHasStarted, authState.session?.user.username]);

    return {
        nextSession,
        remainingSessions,
        sessionHasStarted,
        sessionProgressData,
        hasNextSession,
        startSession,
        startHomework,
        fetchNextSession,
        finishSession,
    };
}
