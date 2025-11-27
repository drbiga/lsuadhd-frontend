import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { Session } from "@/features/session-execution/services/sessionExecutionService";

interface RemainingSessionsListProps {
  sessions: Session[];
  completedSessionsCount: number;
}

export function RemainingSessionsList({ sessions, completedSessionsCount }: RemainingSessionsListProps) {
  const navigate = useNavigate();

  if (sessions.length === 0) {
    return (
      <h2 className="text-xl text-muted-foreground">
        You don't have any remaining sessions left to do. Congratulations,
        you've done them all!!
      </h2>
    );
  }

  return (
    <>
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-medium text-muted-foreground w-[70vw] mb-10 text-left">Remaining Sessions</h2>
      <ul className="flex flex-col gap-8 px-2">
        {sessions.map((session) => (
          <li key={session.seqnum} className="bg-card border border-border p-6 h-[80vh] w-[70vw] rounded-xl flex relative shadow-sm">
            <div className="w-[35%]">
              <p className="text-2xl font-semibold text-foreground mb-2">
                Session #{session.seqnum}
              </p>
              <p className="text-sm text-muted-foreground">Upcoming session</p>
              {session.seqnum === completedSessionsCount + 1 && (
                <div className="absolute top-6 right-6">
                  <Button onClick={() => navigate("/")}>
                    Start Session
                  </Button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
    </>
  );
}
