import { Session, SessionAnalytics, Stage } from "@/features/session-execution/services/sessionExecutionService";
import { SessionChart } from "@/features/session-progress/components/SessionDisplay";
import { findAnalytics, presentPercentage } from "@/features/session-progress/lib/sessionProgressUtils";

interface CompletedSessionsListProps {
  sessions: Session[];
  analytics: SessionAnalytics[];
}

export function CompletedSessionsList({ sessions, analytics }: CompletedSessionsListProps) {
  // hide active session so user cannot see feedbacks in progress
  const completedSessions: Session[] = [];
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].stage === Stage.FINISHED) {
      completedSessions.push(sessions[i]);
    }
  }
  completedSessions.sort((a, b) => a.seqnum - b.seqnum);

  if (completedSessions.length === 0) {
    return (
      <h2 className="text-xl text-muted-foreground">
        You have not started your sessions yet. Please proceed and start
        the first one.
      </h2>
    );
  }

  return (
    <>
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-medium text-muted-foreground w-[70vw] m-5 text-left">Sessions Completed</h2>
      <ul className="flex flex-col gap-8 px-2">
        {completedSessions.map(function(session) {
          return (
            <li key={session.seqnum} className="bg-card border border-border p-6 h-[80vh] w-[70vw] rounded-xl flex shadow-sm">
              <div className="w-[35%] pr-6">
                <p className="text-2xl font-semibold text-foreground mb-4">
                  Session #{session.seqnum}
                </p>
                <div className="mb-4">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Overview
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Stage:</span>{" "}
                    <span className="text-foreground font-medium">
                      {session.stage.charAt(0).toUpperCase() + session.stage.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Feedbacks:</span>{" "}
                    <span className="text-foreground font-medium">{session.feedbacks.length}</span>
                  </div>
                  <div className="mt-2 pt-3 border-t border-border">
                    <div className="text-sm mb-2">
                      <span className="text-muted-foreground">Time focused:</span>{" "}
                      <span className="text-accent font-semibold">
                        {presentPercentage(
                          findAnalytics(analytics, session)?.percentage_time_focused || 0
                        )}
                      </span>
                    </div>
                    <div className="text-sm mb-2">
                      <span className="text-muted-foreground">Time normal:</span>{" "}
                      <span className="text-foreground font-medium">
                        {presentPercentage(
                          findAnalytics(analytics, session)?.percentage_time_normal || 0
                        )}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Time distracted:</span>{" "}
                      <span className="text-foreground font-medium">
                        {presentPercentage(
                          findAnalytics(analytics, session)?.percentage_time_distracted || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <SessionChart feedbacks={session.feedbacks} />
            </li>
          );
        })}
      </ul>
    </div>
    </>
  );
}
