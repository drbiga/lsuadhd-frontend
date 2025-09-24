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
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { redcapService, SURVEY_NAMES } from "@/services/redcap";

interface ReadcompStageProps {
  session: Session;
  sessionProgressData: SessionProgressData;
  onStartHomework: () => void;
  studentName?: string;
}

export function ReadcompStage({ session, sessionProgressData, onStartHomework, studentName }: ReadcompStageProps) {
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const getSurveyName = (): string => {
    const seqNum = session.seqnum;
    
    switch (seqNum) {
      case 1: return SURVEY_NAMES.READCOMP1;
      case 2: return SURVEY_NAMES.READCOMP2;
      case 3: return SURVEY_NAMES.READCOMP3;
      case 4: return SURVEY_NAMES.READCOMP4;
      case 5: return SURVEY_NAMES.READCOMP5;
      case 6: return SURVEY_NAMES.READCOMP6;
      case 7: return SURVEY_NAMES.READCOMP7;
      case 8: return SURVEY_NAMES.READCOMP8;
      case 9: return SURVEY_NAMES.READCOMP9;
      case 10: return SURVEY_NAMES.READCOMP10;
      case 11: return SURVEY_NAMES.READCOMP11;
      case 12: return SURVEY_NAMES.READCOMP12;
      default: return SURVEY_NAMES.READCOMP1;
    }
  };

  const checkSurveyCompletion = async () => {
    try {
      setIsCheckingCompletion(true);
      const surveyName = getSurveyName();
      
      const isCompleted = await redcapService.checkSurveyCompletion(studentName ?? "", surveyName);
      
      if (isCompleted) {
        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
        setShowSubmissionModal(false);
        onStartHomework();
      }
    } catch (error) {
      console.error('Could not check survey completion:', error);
    } finally {
      setIsCheckingCompletion(false);
    }
  };

  const startPolling = () => {
    checkSurveyCompletion();

    const interval = setInterval(checkSurveyCompletion, 5000);
    setPollInterval(interval);
  };

  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

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
        <Walkthrough
          onClose={() => {
            setTimeout(() => {
              setShowSubmissionModal(true);
              startPolling();
            }, 5000);
          }}
        >
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
            </div>
          </WalkthroughInstructionsDescription>
        </Walkthrough>
      )}

      {showSubmissionModal && (
        <AlertDialog open={showSubmissionModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Please Submit Your Survey</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              <p>Please complete and submit your survey on REDCap. The system will automatically detect when you've submitted and proceed to the next stage.</p>
              {isCheckingCompletion && (
                <p className="text-sm text-gray-600 mt-2">Still checking for submission...</p>
              )}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSubmissionModal(false);
                  if (pollInterval) {
                    clearInterval(pollInterval);
                    setPollInterval(null);
                  }
                }}
              >
                Close
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <iframe
        src={session.readcomp_link || session.start_link}
        className="h-full w-full"
      />

      {sessionProgressData.remainingTimeSeconds <= 0 && !showSubmissionModal && (
        <div className="fixed bottom-4 right-7 z-50">
          <Button
            onClick={() => {
              setShowSubmissionModal(true);
              startPolling();
            }}
            variant="default"
            className="bg-slate-700 text-sm"
          >
            Check submission status
          </Button>
        </div>
      )}
    </>
  );
}
