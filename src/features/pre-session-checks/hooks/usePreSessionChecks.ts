import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import sessionExecutionService from "@/features/session-execution/services/sessionExecutionService";

export function usePreSessionChecks() {
    const [completedPreSessionChecks, setCompletedPreSessionChecks] = useState(false);
    // const [goalPercentage, setGoalPercentage] = useState<number | undefined>(undefined);
    const { authState } = useAuth();

    useEffect(() => {
        (async () => {
            if (authState.session?.user.username) {
                try {
                    const student = await sessionExecutionService.getStudent(
                        authState.session.user.username
                    );
                    if (student.active_session !== null) {
                        setCompletedPreSessionChecks(true);
                    }
                } catch (error) {
                    console.error("Error checking for active session:", error);
                }
            }
        })();
    }, [authState.session?.user.username]);

    return {
        completedPreSessionChecks,
        setCompletedPreSessionChecks,
        // goalPercentage,
        // setGoalPercentage,
    };
}
