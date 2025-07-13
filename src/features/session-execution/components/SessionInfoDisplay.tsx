import { Session, SessionProgressData } from "@/features/session-execution/services/sessionExecutionService";
import { presentRemainingTime } from "@/features/session-execution/lib/timeUtils";

interface SessionInfoDisplayProps {
  session: Session | null;
  sessionProgressData: SessionProgressData | null;
}

export function SessionInfoDisplay({ session, sessionProgressData }: SessionInfoDisplayProps) {
  if (!session || !sessionProgressData) return null;

  return (
    <div className="bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-xl p-4 flex flex-col gap-2 text-sm">
      <p className="text-2xl text-slate-700 dark:text-slate-300">
        Session #{session.seqnum}
      </p>
      <div className="text-sm text-slate-700 dark:text-slate-300">
        Stage: {sessionProgressData.stage}
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300">
        Remaining time: {presentRemainingTime(sessionProgressData.remainingTimeSeconds)}
      </p>
    </div>
  );
}
