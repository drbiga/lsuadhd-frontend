import { Session, SessionAnalytics } from "@/features/session-execution/services/sessionExecutionService";
import { SessionChart } from "@/features/session-progress/components/SessionDisplay";
import { findAnalytics, presentPercentage } from "@/features/session-progress/lib/sessionProgressUtils";

interface CompletedSessionsListProps {
  sessions: Session[];
  analytics: SessionAnalytics[];
}

export function CompletedSessionsList({ sessions, analytics }: CompletedSessionsListProps) {
  if (sessions.length === 0) {
    return (
      <h2 className="text-2xl text-slate-800 dark:text-slate-200 opacity-50 text-md text-slate-400 dark:text-slate-600">
        You have not started your sessions yet. Please proceed and start
        the first one.
      </h2>
    );
  }

  return (
    <>
      <h2 className="text-2xl text-slate-800 dark:text-slate-200 opacity-50">Sessions already done</h2>
      <ul className="flex flex-col gap-8 px-2">
        {sessions.length > 0 &&
          analytics.length > 0 &&
          sessions.map((session) => (
            <li key={session.seqnum} className="bg-card p-4 h-[80vh] w-[70vw] rounded-lg flex">
              <div className="w-[30%]">
                <p className="text-2xl text-slate-700 dark:text-slate-300">
                  Session #{session.seqnum}
                </p>
                <p>
                  <span className="text-slate-600 dark:text-slate-400 border-b-[1px]">
                    Overview
                  </span>
                </p>
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  Stage: {session.stage.charAt(0).toUpperCase() + session.stage.slice(1)}
                </div>
                <div className="text-sm text-slate-400 dark:text-slate-600">
                  Number of feedbacks given: {session.feedbacks.length}
                </div>
                <div className="text-sm text-slate-800 dark:text-slate-200">
                  Percentage of time focused: {presentPercentage(
                    findAnalytics(analytics, session)?.percentage_time_focused || 0
                  )}
                </div>
                <div className="text-sm text-slate-400 dark:text-slate-600">
                  Percentage of time normal: {presentPercentage(
                    findAnalytics(analytics, session)?.percentage_time_normal || 0
                  )}
                </div>
                <div className="text-sm text-slate-400 dark:text-slate-600">
                  Percentage of time distracted: {presentPercentage(
                    findAnalytics(analytics, session)?.percentage_time_distracted || 0
                  )}
                </div>
              </div>
              <SessionChart feedbacks={session.feedbacks} />
            </li>
          ))}
      </ul>
    </>
  );
}
