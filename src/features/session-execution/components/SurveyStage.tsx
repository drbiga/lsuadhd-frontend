import { Session, SessionProgressData } from "@/features/session-execution/services/sessionExecutionService";
import { Walkthrough, WalkthroughInstructionsDescription, WalkthroughInstructionsTitle } from "@/features/session-execution/components/Walkthrough";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";

interface SurveyStageProps {
  session: Session;
  sessionProgressData: SessionProgressData;
  onFinishSession?: () => void;
}

export function SurveyStage({ session, sessionProgressData, onFinishSession }: SurveyStageProps) {
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [modalTimerRef, setModalTimerRef] = useState<NodeJS.Timeout | null>(null);
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  useEffect(() => {
    return () => {
      if (modalTimerRef) {
        clearTimeout(modalTimerRef);
      }
    };
  }, [modalTimerRef]);

  return (
    <>
      {sessionProgressData.remainingTimeSeconds > 0 && (
        <Walkthrough>
          <WalkthroughInstructionsTitle>
            Survey
          </WalkthroughInstructionsTitle>
          <WalkthroughInstructionsDescription>
            <p>Please answer the following questions</p>
          </WalkthroughInstructionsDescription>
        </Walkthrough>
      )}
      
      {sessionProgressData.remainingTimeSeconds <= 0 && (
        <Walkthrough
          onClose={() => {
            setTimeout(() => {
              setShowSurveyModal(true);
            }, 5000);
          }}
        >
          <WalkthroughInstructionsTitle>
            Your Survey Time is Up!
          </WalkthroughInstructionsTitle>
          <WalkthroughInstructionsDescription>
            <div className="space-y-3">
              <p>
                Your survey session has ended.
                <span className="text-yellow-500 font-bold"> Please refrain from continuing to work on the survey.</span>
              </p>
              <p className="font-medium">
                At this point, make sure you:
              </p>
              <ol className="list-disc list-inside space-y-2 pl-2">
                <li>Scroll to the bottom of the survey</li>
                <li>Click the <strong className="text-yellow-500 font-bold">Submit</strong> button to save your answers</li>
              </ol>
            </div>
          </WalkthroughInstructionsDescription>
        </Walkthrough>
      )}

      {showSurveyModal && (
        <AlertDialog open={showSurveyModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Have you submitted your survey?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSurveyModal(false);
                  setSurveySubmitted(false);

                  const timer = setTimeout(() => {
                    setShowSurveyModal(true);
                  }, 10000);
                  setModalTimerRef(timer);
                }}
              >
                No, let me submit it
              </Button>

              {!surveySubmitted ? (
                <Button
                  variant="outline"
                  onClick={() => setSurveySubmitted(true)}
                >
                  Yes, I submitted it
                </Button>
              ) : (
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    if (modalTimerRef) {
                      clearTimeout(modalTimerRef);
                      setModalTimerRef(null);
                    }

                    if (onFinishSession) {
                      onFinishSession();
                    }
                    setShowSurveyModal(false);
                  }}
                >
                  Proceed to Finished Stage
                </Button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <iframe
        src={session.post_link || session.start_link}
        className="h-full w-full"
      />

      {sessionProgressData.remainingTimeSeconds <= 0 && !showSurveyModal && (
        <div className="fixed bottom-4 right-7 z-50">
          <Button
            onClick={() => setShowSurveyModal(true)}
            variant="default"
            className="bg-slate-700 text-sm"
          >
            Return to submission confirmation
          </Button>
        </div>
      )}
    </>
  );
}
