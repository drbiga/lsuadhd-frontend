import { Session, SessionProgressData } from "@/features/session-execution/services/sessionExecutionService";
import { presentRemainingTime } from "@/features/session-execution/lib/timeUtils";

interface SessionInfoDisplayProps {
  session: Session | null;
  sessionProgressData: SessionProgressData | null;
}

export function SessionInfoDisplay({ session, sessionProgressData }: SessionInfoDisplayProps) {
  if (!session || !sessionProgressData) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 shadow-sm">
      <p className="text-2xl font-semibold text-foreground">
        Session #{session.seqnum}
      </p>
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Stage:</span> <span className="text-foreground">{sessionProgressData.stage}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Remaining:</span> <span className="text-accent font-semibold">{presentRemainingTime(sessionProgressData.remainingTimeSeconds)}</span>
        </div>
      </div>
    </div>
  );
}
