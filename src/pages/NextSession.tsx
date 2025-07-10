import { Button } from "@/components/common/Button";
import { PageContainer, PageTitle } from "@/components/layout/Page";
import { PreSessionChecks } from "@/components/PreSessionChecks";
import {
  SessionItemComment,
  SessionItemSeqnum,
  SessionItemStage,
  SessionStartButton,
} from "@/components/sessionExecution/Session";
import {
  Walkthrough,
  WalkthroughInstructionsDescription,
  WalkthroughInstructionsTitle,
} from "@/components/sessionExecution/WalkthroughSection";
import Sidebar, { SidebarHandle } from "@/components/layout/Sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/auth";
import sessionExecutionService, {
  Session,
  SessionProgressData,
  Stage,
} from "@/services/sessionExecution";
import { useCallback, useEffect, useRef, useState } from "react";
//import { set } from "react-hook-form";

enum HasNextSessionValue {
  LOADING = -1,
  NO = 0,
  YES = 1,
}

export default function NextSession() {
  const [nextSession, setNextSession] = useState<Session | null>(null);
  const [hasNextSession, setHasNextSession] = useState<HasNextSessionValue>(
    HasNextSessionValue.LOADING
  );
  const [sessionHasStarted, setSessionHasStarted] = useState<boolean>(false);
  const [sessionProgressData, setSessionProgressData] = useState<SessionProgressData | null>(null);
  const [completedPreSessionChecks, setCompletedPreSessionChecks] = useState(false);
  
  const [showReadcompModal, setShowReadcompModal] = useState(false);
  const [modalTimerRef, setModalTimerRef] = useState<NodeJS.Timeout | null>(null);
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  // State recovery and initialization code below (right above the return statement).

  const { authState } = useAuth();

  const sidebarRef = useRef<SidebarHandle>(null);

  const getNextSession = useCallback(async () => {
    if (authState.session) {
      const remainingSessions =
        await sessionExecutionService.getRemainingSessionsForStudent(
          authState.session.user.username
        );
      if (remainingSessions.length > 0) {
        setNextSession(remainingSessions[0]);
        setHasNextSession(HasNextSessionValue.YES);
      } else {
        setHasNextSession(HasNextSessionValue.NO);
      }
    }
  }, [authState, setNextSession, setHasNextSession]);

  useEffect(() => {
    getNextSession();
  }, [getNextSession]);

  const handleSessionProgressDataUpdate = useCallback(
    (sessionProgressUpdate: SessionProgressData) => {
      setSessionProgressData(sessionProgressUpdate);
    },
    [setSessionProgressData]
  );

  const handleStartSession = useCallback(async () => {
    if (authState.session) {
      const startedSession =
        await sessionExecutionService.startSessionForStudent(
          authState.session.user.username,
          handleSessionProgressDataUpdate
        );
      setNextSession(startedSession);
      setSessionHasStarted(true);
      sidebarRef.current?.autoCollapse();
    }
  }, [authState.session, handleSessionProgressDataUpdate]);

  // State recovery
  // In case the user has to go outside the next session page and returns, they need
  // to be able to come back to the point where they left.
  useEffect(() => {
    (async () => {
      if (authState.session) {
        const student = await sessionExecutionService.getStudent(
          authState.session.user.username
        );
        if (student.active_session !== null) {
          // If the student already has an active session, that means that they have started a session
          // and have not finished yet. So, we need to restore this session.
          setSessionHasStarted(true);
          setNextSession(student.active_session);
          sessionExecutionService.setUpdateCallback(
            student.name,
            handleSessionProgressDataUpdate
          );
        }
      }
    })();
  }, [authState, handleSessionProgressDataUpdate]);

  useEffect(() => {
    (async () => {
      if (authState.session) {
        const progress = await sessionExecutionService.getSessionProgress(
          authState.session?.user.username
        );
        console.log(progress);
        setSessionProgressData(progress);
      }
    })();
  }, [authState, setSessionProgressData]);

  useEffect(() => {
    return () => {
      if (modalTimerRef) {
        clearTimeout(modalTimerRef);
      }
    };
  }, [modalTimerRef]);

  return (
    <PageContainer>
      <Sidebar ref={sidebarRef} />
      <div className="w-full h-full">
        {!sessionHasStarted && !completedPreSessionChecks && (
          <div className="h-full flex flex-col justify-center items-center gap-4">
            <h2 className="text-xl">Welcome</h2>
            <p className="">
              You are about to go through some pre-session checks. Please press
              begin
            </p>
            <PreSessionChecks
              completedCallback={() => setCompletedPreSessionChecks(true)}
            />
          </div>
        )}

        {completedPreSessionChecks && !sessionHasStarted && hasNextSession && (
          <div className="h-full w-full flex items-center justify-center">
            <div className="flex flex-col gap-8 justify-center items-center translate-x-[-100px] p-16 border-[2px] border-slate-700 rounded-lg">
              <SessionItemSeqnum>{nextSession?.seqnum}</SessionItemSeqnum>
              {nextSession && nextSession.no_equipment && (
                <>
                  <SessionItemComment>
                    <span className="font-bold text-slate-200 text-xl">
                      Attention!
                    </span>{" "}
                    You are{" "}
                    <span className="font-bold text-slate-200 text-xl">
                      not supposed to use the headset
                    </span>{" "}
                    during this session.
                  </SessionItemComment>
                  <SessionItemComment>
                    If you are currently wearing the headset, then please take
                    it off to continue your session properly.
                  </SessionItemComment>
                  <SessionItemComment>
                    Your sessions with the headset begin at session #3
                  </SessionItemComment>
                </>
              )}
              {nextSession && !nextSession.no_equipment && (
                <>
                  <SessionItemComment>
                    {nextSession?.is_passthrough
                      ? "This session is going to be passthrough"
                      : "This session is going to be VR"}
                  </SessionItemComment>
                  <SessionItemComment>
                    {nextSession?.has_feedback
                      ? "You are going to receive some feedback this session"
                      : "There will be no feedback for this session"}
                  </SessionItemComment>
                </>
              )}

              <SessionItemComment>Are you ready to do this?</SessionItemComment>

              {nextSession && nextSession.seqnum > 2 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button>Start!</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>VR Headset</AlertDialogTitle>
                      <p>
                        You were supposed to be wearing the VR headset already.
                        Are you?
                      </p>
                      <p>
                        If not, it's possible you missed something on the
                        instructions sheet.
                      </p>
                      <p>Please double check.</p>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction>
                        <Button
                          variant="default"
                          onClick={() => handleStartSession()}
                        >
                        Start!
                        </Button>
                      </AlertDialogAction>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {nextSession && nextSession.seqnum <= 2 && (
                <SessionStartButton onClick={() => handleStartSession()}>
                  Start!
                </SessionStartButton>
              )}
            </div>
          </div>
        )}

        {sessionHasStarted &&
          sessionProgressData &&
          sessionProgressData.stage !== Stage.HOMEWORK && (
            <>
              <div className="relative">
                <div className="absolute top-5 left-5 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-xl p-4 flex flex-col gap-2 text-sm">
                  <SessionItemSeqnum>{nextSession?.seqnum}</SessionItemSeqnum>
                  <SessionItemStage>
                    {sessionProgressData?.stage}
                  </SessionItemStage>
                  {sessionProgressData && (
                    <SessionItemComment>
                      Remaining time:{" "}
                      {presentRemainingTime(
                        sessionProgressData.remainingTimeSeconds
                      )}
                    </SessionItemComment>
                  )}
                </div>
              </div>
            </>
          )}

        {sessionHasStarted && sessionProgressData?.stage === Stage.HOMEWORK && (
          <header className="w-full pl-10 pt-8 max-w-[84vw] flex justify-between px-5 fixed">
            <PageTitle>Next Session</PageTitle>

            <div className="ml-8 flex items-center justify-center gap-4">
              <SessionItemSeqnum>{nextSession?.seqnum}</SessionItemSeqnum>
              <SessionItemStage>{sessionProgressData?.stage}</SessionItemStage>
              {sessionProgressData && (
                <>
                  <SessionItemComment>
                    Remaining time:{" "}
                    {presentRemainingTime(
                      sessionProgressData.remainingTimeSeconds
                    )}
                  </SessionItemComment>
                </>
              )}
            </div>
          </header>
        )}

        {sessionHasStarted && sessionProgressData && (
          <>
            {sessionProgressData.stage === Stage.READCOMP && (
              <>
                {sessionProgressData.remainingTimeSeconds > 5 && (
                  // If readcomp is starting
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
                        <p>Your 10-minute reading comprehension session has ended.</p>
                        <p className="font-medium">
                          Before proceeding, please make sure you have:
                        </p>
                        <ol className="list-disc list-inside space-y-2 pl-2">
                          <li>Scrolled to the bottom of the survey</li>
                          <li>Clicked the <strong>Submit</strong> button to save your answers</li>
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
                          variant="default"
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
                            variant="default"
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
                              
                              if (authState.session) {
                                sessionExecutionService.startHomeworkForStudent(
                                  authState.session.user.username
                                );
                              }
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
                  src={nextSession?.readcomp_link || nextSession?.start_link}
                  className="h-full w-full"
                ></iframe>

                {sessionProgressData.remainingTimeSeconds <= 0 && !showReadcompModal && (
                  <div className="fixed bottom-4 right-7 z-50">
                    <Button
                      onClick={() => setShowReadcompModal(true)}
                      variant="default"
                      className="text-sm"
                    >
                      Click to return to survey submission confirmation
                    </Button>
                  </div>
                )}
              </>
            )}
            {sessionProgressData.stage === Stage.HOMEWORK && (
              <>
                {sessionProgressData.remainingTimeSeconds > 5 && (
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
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <SessionItemSeqnum>
                          {nextSession?.seqnum}
                        </SessionItemSeqnum>
                        <SessionItemStage>
                          {sessionProgressData?.stage}
                        </SessionItemStage>
                        {sessionProgressData && (
                          <SessionItemComment>
                            Remaining time:{" "}
                            {presentRemainingTime(
                              sessionProgressData.remainingTimeSeconds
                            )}
                          </SessionItemComment>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {sessionProgressData.remainingTimeSeconds <= 5 && (
                  <>
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
                  </>
                )}
              </>
            )}
            {sessionProgressData.stage === Stage.SURVEY && (
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
                  src={nextSession?.post_link || nextSession?.start_link}
                  className="h-full w-full"
                ></iframe>
              </>
            )}
            {sessionProgressData.stage === Stage.FINISHED && (
              <>
                {nextSession && !nextSession.no_equipment && (
                  <AlertDialog defaultOpen>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Important Reminder
                        </AlertDialogTitle>
                        <p>
                          <strong>Please remember to charge your headset</strong> after completing this session 
                          to make sure you don't run out of battery in your next session!
                        </p>
                      </AlertDialogHeader>
                      <AlertDialogCancel>
                        Continue
                      </AlertDialogCancel>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <div className="h-full w-full flex flex-col items-center justify-center">
                  <h2 className="text-lg">You have finished your session</h2>
                  <p>Please refer back to the instructions sheet.</p>
                  <p>
                    At this point, you should{" "}
                    <strong>
                      turn off the laptop
                      {!nextSession?.no_equipment && <span> and the headset</span>}
                    </strong>
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {!sessionHasStarted && !hasNextSession && (
          <div className="pl-16 pt-8">
            <h2 className="text-3xl mb-8">Congratulations!</h2>
            <p>
              It appears that you do not have any sessions left. Well done!
              You've done them all!!!
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function presentRemainingTime(
  remainingTimeSeconds: number | null | undefined
): string {
  if (remainingTimeSeconds != null) {
    return `${presentRemainingTimeMinutes(
      remainingTimeSeconds
    )}:${presentRemainingTimeSeconds(remainingTimeSeconds)}`;
  } else {
    return "";
  }
}

function presentRemainingTimeMinutes(timeSeconds: number): string {
  return String(Math.max(Math.floor(timeSeconds / 60), 0)).padStart(2, "0");
}

function presentRemainingTimeSeconds(timeSeconds: number): string {
  if (timeSeconds > -1) {
    return String(timeSeconds % 60).padStart(2, "0");
  } else {
    return "00";
  }
}
