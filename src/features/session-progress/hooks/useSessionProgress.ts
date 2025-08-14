import { useState, useEffect } from "react";
import { useAuth, Role } from "@/hooks/auth";
import sessionExecutionService, { Session, SessionAnalytics } from "@/features/session-execution/services/sessionExecutionService";
import { toast } from "react-toastify";

export function useSessionProgress() {
    const [sessionsDone, setSessionsDone] = useState<Session[]>([]);
    const [remainingSessions, setRemainingSessions] = useState<Session[]>([]);
    const [sessionsDoneAnalytics, setSessionsDoneAnalytics] = useState<SessionAnalytics[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { authState } = useAuth();

    useEffect(() => {
        (async () => {
            if (authState.session && authState.session.user.role === Role.STUDENT) {
                try {
                    setIsLoading(true);
                    const student = await sessionExecutionService.getStudent(
                        authState.session?.user.username
                    );
                    setSessionsDone(student.sessions);
                    const sessions =
                        await sessionExecutionService.getRemainingSessionsForStudent(
                            authState.session.user.username
                        );
                    setRemainingSessions(sessions);
                    setSessionsDoneAnalytics(student.sessions_analytics);
                } catch {
                    toast.error(
                        "Something went wrong while getting your sessions. Please contact the administrator"
                    );
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        })();
    }, [authState.session?.user.username]);

    return {
        sessionsDone,
        remainingSessions,
        sessionsDoneAnalytics,
        isLoading,
    };
}
