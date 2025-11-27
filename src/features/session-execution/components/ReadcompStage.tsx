import { Session, SessionProgressData } from "@/features/session-execution/services/sessionExecutionService";
import { Walkthrough, WalkthroughInstructionsDescription, WalkthroughInstructionsTitle } from "@/features/session-execution/components/Walkthrough";
import { Loader2 } from "lucide-react";

interface ReadcompStageProps {
  session: Session;
  sessionProgressData: SessionProgressData;
}

export function ReadcompStage({ session, sessionProgressData }: ReadcompStageProps) {

  return (
    <>
      {sessionProgressData.remainingTimeSeconds > 0 && (
        <Walkthrough>
          <WalkthroughInstructionsTitle>
            Reading and Comprehension
          </WalkthroughInstructionsTitle>
          <WalkthroughInstructionsDescription>
            <p>
              In the following 10 minutes, you will read some text
              passages and answer a few questions about them
            </p>
          </WalkthroughInstructionsDescription>
        </Walkthrough>
      )}

      {sessionProgressData.remainingTimeSeconds <= 0 && (
        <Walkthrough>
          <WalkthroughInstructionsTitle>
            Your Reading Comprehension Survey Time is Up!
          </WalkthroughInstructionsTitle>
          <WalkthroughInstructionsDescription>
            <div className="space-y-3">
              <p>
                Your 10-minute reading comprehension survey has ended.
                <span className="text-yellow-500 font-bold"> Please refrain from continuing to work on the passage.</span>
              </p>
              <p className="font-medium">
                At this point, make sure you:
              </p>
              <ol className="list-disc list-inside space-y-2 pl-2">
                <li>Scroll to the bottom of the survey</li>
                <li>Click the <strong className="text-yellow-500 font-bold">Submit</strong> button to save your answers</li>
              </ol>
              <p className="mt-4 text-sm text-yellow-500">
                The system will automatically detect when you've submitted and proceed to the next stage.
              </p>
            </div>
          </WalkthroughInstructionsDescription>
        </Walkthrough>
      )}

      <iframe
        src={session.readcomp_link || session.start_link}
        className="h-full w-full"
      />

      {sessionProgressData.remainingTimeSeconds <= 0 && (
        <div className="fixed bottom-4 right-4 bg-card border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Checking survey submission...</span>
        </div>
      )}
    </>
  );
}
