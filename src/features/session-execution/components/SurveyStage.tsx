import { Session } from "@/features/session-execution/services/sessionExecutionService";
import { Walkthrough, WalkthroughInstructionsDescription, WalkthroughInstructionsTitle } from "@/features/session-execution/components/Walkthrough";

interface SurveyStageProps {
  session: Session;
}

export function SurveyStage({ session }: SurveyStageProps) {
  return (
    <>
      <Walkthrough>
        <WalkthroughInstructionsTitle>
          Survey
        </WalkthroughInstructionsTitle>
        <WalkthroughInstructionsDescription>
          <p>Please answer the following questions</p>
        </WalkthroughInstructionsDescription>
      </Walkthrough>
      <iframe
        src={session.post_link || session.start_link}
        className="h-full w-full"
      />
    </>
  );
}
