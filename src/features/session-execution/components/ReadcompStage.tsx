import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Session, SessionProgressData } from "@/features/session-execution/services/sessionExecutionService";
import { Walkthrough, WalkthroughInstructionsDescription, WalkthroughInstructionsTitle } from "@/features/session-execution/components/Walkthrough";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";

interface ReadcompStageProps {
  session: Session;
  sessionProgressData: SessionProgressData;
  onStartHomework: () => void;
}

export function ReadcompStage({ session, sessionProgressData, onStartHomework }: ReadcompStageProps) {
  const [showReadcompModal, setShowReadcompModal] = useState(false);
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
      {sessionProgressData.remainingTimeSeconds > 5 && (
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

      {sessionProgressData.remainingTimeSeconds <= 5 && (
        <Walkthrough
          onClose={() => {
            setTimeout(() => {
              setShowReadcompModal(true);
            }, 5000);
          }}
        >
          <WalkthroughInstructionsTitle>
            Your Reading Comprehension Survey Time is Up!
          </WalkthroughInstructionsTitle>
          <WalkthroughInstructionsDescription>
            <div className="space-y-3">
              <p>
                Your 10-minute reading comprehension session has ended.
                <span className="text-yellow-500 font-bold"> Please refrain from continuing to work on the passage.</span>
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

      {showReadcompModal && (
        <AlertDialog open={showReadcompModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Have you submitted your survey?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReadcompModal(false);
                  setSurveySubmitted(false);
                  
                  const timer = setTimeout(() => {
                    setShowReadcompModal(true);
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
                    
                    onStartHomework();
                    setShowReadcompModal(false);
                  }}
                >
                  Proceed to Homework
                </Button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <iframe
        src={session.readcomp_link || session.start_link}
        className="h-full w-full"
      />

      {sessionProgressData.remainingTimeSeconds <= 0 && !showReadcompModal && (
        <div className="fixed bottom-4 right-7 z-50">
          <Button
            onClick={() => setShowReadcompModal(true)}
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
