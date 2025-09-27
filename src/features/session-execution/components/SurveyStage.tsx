import { Session, SessionProgressData } from "@/features/session-execution/services/sessionExecutionService";
import { Walkthrough, WalkthroughInstructionsDescription, WalkthroughInstructionsTitle } from "@/features/session-execution/components/Walkthrough";
import { useState, useEffect } from "react";
import { redcapService, SURVEY_NAMES } from "@/services/redcap";

interface SurveyStageProps {
  session: Session;
  sessionProgressData: SessionProgressData;
  onFinishSession?: () => void;
  studentName?: string;
}

export function SurveyStage({ session, sessionProgressData, onFinishSession, studentName }: SurveyStageProps) {
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const getSurveyName = (): string => {
    const seqNum = session.seqnum;
    
    switch (seqNum) {
      case 1: return SURVEY_NAMES.POST1;
      case 2: return SURVEY_NAMES.POST2;
      case 3: return SURVEY_NAMES.POST3;
      case 4: return SURVEY_NAMES.POST4;
      case 5: return SURVEY_NAMES.POST5;
      case 6: return SURVEY_NAMES.POST6;
      case 7: return SURVEY_NAMES.POST7;
      case 8: return SURVEY_NAMES.POST8;
      case 9: return SURVEY_NAMES.POST9;
      case 10: return SURVEY_NAMES.POST10;
      case 11: return SURVEY_NAMES.POST11;
      case 12: return SURVEY_NAMES.POST12;
      default: return SURVEY_NAMES.POST1;
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
        if (onFinishSession) {
          onFinishSession();
        }
      }
    } catch (error) {
      console.error('Could not check survey completion:', error);
    } finally {
      setIsCheckingCompletion(false);
    }
  };

  const startPolling = () => {
    checkSurveyCompletion();
    
    const interval = setInterval(checkSurveyCompletion, 10000);
    setPollInterval(interval);
  };

  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  useEffect(() => {
    if (sessionProgressData.remainingTimeSeconds <= 0 && !pollInterval) {
      startPolling();
    }
  }, [sessionProgressData.remainingTimeSeconds, pollInterval]);

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
        <Walkthrough>
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
              <p className="text-sm text-yellow-500 font-bold mt-3">
                The system will automatically detect your submission and proceed to the next stage.
              </p>
            </div>
          </WalkthroughInstructionsDescription>
        </Walkthrough>
      )}



      <iframe
        src={session.post_link || session.start_link}
        className="h-full w-full"
      />

      {sessionProgressData.remainingTimeSeconds <= 0 && (
        <div className="fixed bottom-4 right-7 z-50">
          <div className="bg-slate-700 text-white px-4 py-2 rounded-md shadow-lg flex items-center space-x-2">
            {isCheckingCompletion ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            )}
            <span className="text-sm">Checking submission status...</span>
          </div>
        </div>
      )}
    </>
  );
}
