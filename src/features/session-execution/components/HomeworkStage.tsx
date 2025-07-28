import { Session, SessionProgressData } from "@/features/session-execution/services/sessionExecutionService";
import { presentRemainingTime } from "@/features/session-execution/lib/timeUtils";
import { Walkthrough, WalkthroughInstructionsDescription, WalkthroughInstructionsTitle } from "@/features/session-execution/components/Walkthrough";
import { useEffect } from "react";

interface HomeworkStageProps {
  session: Session;
  sessionProgressData: SessionProgressData;
}

export function HomeworkStage({ session, sessionProgressData }: HomeworkStageProps) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${presentRemainingTime(sessionProgressData.remainingTimeSeconds)} - Homework Time`;
    
    return () => {
      document.title = originalTitle;
    };
  }, [sessionProgressData.remainingTimeSeconds]);

  return (
    <>
      {sessionProgressData.remainingTimeSeconds > 5 ? (
        <>
          <Walkthrough>
            <WalkthroughInstructionsTitle>
              Homework
            </WalkthroughInstructionsTitle>
            <WalkthroughInstructionsDescription>
              <p>
                <strong>REMINDER: </strong>
                Homework sessions must involve active work that
                involves typing. This means that you are using active
                studying techniques while reading (taking notes,
                highlighting, scrolling, annotating). You may also
                complete writing pieces or math/science/engineering
                assignments. If you would like suggestions on active
                work techniques or have questions about this, please
                reach out to study coordinator, Sophia, at
                sf924@gsapp.rutgers.edu
              </p>
              <p>
                Depending you the group you were assigned to, you may
                receive feedback through a stop light to indicate how
                well you are performing
              </p>
            </WalkthroughInstructionsDescription>
          </Walkthrough>
          <div className="h-full w-full flex items-center justify-center p-6 rounded-lg shadow-md">
            <div className="flex flex-col items-center justify-center gap-6">
              <p className="text-3xl text-slate-900 dark:text-slate-100">
                Session #{session.seqnum}
              </p>
              <div className="text-lg text-slate-700 dark:text-slate-300">
                Stage: {sessionProgressData.stage}
              </div>
              <p className="text-4xl font-semibold text-yellow-500 dark:text-yellow-400">
                Remaining time:
              </p>
              <p className="text-4xl font-bold rounded-lg shadow-md">
                {presentRemainingTime(sessionProgressData.remainingTimeSeconds)}
              </p>
            </div>
          </div>
        </>
      ) : (
        <Walkthrough>
          <WalkthroughInstructionsTitle>
            Your homework time is over.
          </WalkthroughInstructionsTitle>
          <WalkthroughInstructionsDescription>
            <p>Now, you're going to do a post-session survey</p>
            <p>
              You must answer all of the questions in order to be
              able to submit it.
            </p>
            <p>
              When you have answered all the questions, please press
              the "Submit" button at the bottom of the page
            </p>
          </WalkthroughInstructionsDescription>
        </Walkthrough>
      )}
    </>
  );
}
