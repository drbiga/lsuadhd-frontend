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
      <h2 className="text-2xl text-slate-800 dark:text-slate-200 opacity-50">
        You don't have any remaining sessions left to do. Congratulations,
        you've done them all!!
      </h2>
    );
  }

  return (
    <>
      <h2 className="text-2xl text-slate-800 dark:text-slate-200 opacity-50">Remaining sessions</h2>
      <ul className="flex flex-col gap-8 px-2">
        {sessions.map((session) => (
          <li key={session.seqnum} className="bg-card p-4 h-[80vh] w-[70vw] rounded-lg flex relative">
            <div className="w-[30%]">
              <p className="text-2xl text-slate-700 dark:text-slate-300">
                Session #{session.seqnum}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">Upcoming...</p>
              <p className="absolute top-4 right-4">
                {session.seqnum === completedSessionsCount + 1 && (
                  <Button
                    className="bg-slate-300 dark:bg-slate-700 hover:bg-slate-700 hover:text-slate-100 dark:hover:bg-slate-400 dark:hover:text-slate-900 transition-all duration-100"
                    onClick={() => navigate("/")}
                  >
                    Start next session
                  </Button>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
