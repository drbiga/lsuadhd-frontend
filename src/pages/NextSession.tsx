import { Button } from "@/components/Button";
import { PageContainer, PageTitle } from "@/components/Page";
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
import Sidebar from "@/components/Sidebar";
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
import { useCallback, useEffect, useState } from "react";

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
  const [sessionProgressData, setSessionProgressData] =
    useState<SessionProgressData | null>(null);

  const [completedPreSessionChecks, setCompletedPreSessionChecks] = useState(false);

  // State recovery and initialization code below (right above the return statement).


  const { authState } = useAuth();

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
    }
  }, [authState, nextSession]);

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

  useEffect(() => {}, [sessionHasStarted]);

  return (
    <PageContainer>
      <Sidebar />
      <div className="w-full h-full">
        {!sessionHasStarted && !completedPreSessionChecks && (
          <div className="h-full flex flex-col justify-center items-center gap-4">
            <h2 className="text-xl">Welcome</h2>
            <p className="">You are about to go through some pre-session checks. Please press begin</p>
            <PreSessionChecks completedCallback={() => setCompletedPreSessionChecks(true)} />
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
                    If you are currently wearing the headset, then
                    please take it off to continue your session
                    properly.
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
                      : "There will be no feedbacks for this session"}
                  </SessionItemComment>
                </>
              )}

              <SessionItemComment>
                Are you ready to do this?
              </SessionItemComment>

              {nextSession && nextSession.seqnum > 2 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button>Start!</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        VR Headset
                      </AlertDialogTitle>
                      <p>
                        You were supposed to be wearing the VR headset
                        already. Are you?
                      </p>
                      <p>
                        If not, it's possible you missed something on the
                        instructions sheet.
                      </p>
                      <p>Please double check.</p>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction className="bg-primary" onClick={() => handleStartSession()}>
                        Start!
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

        {sessionHasStarted && sessionProgressData?.stage !== Stage.HOMEWORK && (
          <header className="w-full flex gap-8 fixed bg-background opacity-30 transition-all duration-300 hover:opacity-100">
            {/* <PageTitle>Next Session</PageTitle> */}

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
                  {sessionProgressData.stage === Stage.READCOMP &&
                    sessionProgressData.remainingTimeSeconds <= 0 && (
                      <Button
                        onClick={() => {
                          if (authState.session)
                            sessionExecutionService.startHomeworkForStudent(
                              authState.session?.user.username
                            );
                        }}
                      >
                        Proceed to homework
                      </Button>
                    )}
                </>
              )}
            </div>
          </header>
        )}

        {sessionHasStarted && sessionProgressData?.stage === Stage.HOMEWORK && (
          <header className="w-full pl-16 pt-8 max-w-[84vw] flex justify-between px-4 fixed">
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
                  // If readcomp is over
                  <Walkthrough>
                    <WalkthroughInstructionsTitle>
                      Time's up!
                    </WalkthroughInstructionsTitle>
                    <WalkthroughInstructionsDescription>
                      <p>
                        Your time for this reading-comprehension section is
                        over.
                      </p>
                      <ol className="list-decimal">
                        <li>
                          <p>
                            <strong>Scroll</strong> all the way down on the
                            survey and <strong>click</strong> the submit
                            button&nbsp; to <strong>save</strong> your answers.
                          </p>
                        </li>
                        <li>
                          <p>
                            <strong>After</strong> you submit your answers,
                            please <strong>click</strong> the "Proceed to
                            homework" button on the{" "}
                            <strong>top-right corner</strong>.
                          </p>
                        </li>
                      </ol>
                    </WalkthroughInstructionsDescription>
                  </Walkthrough>
                )}
                <iframe
                  src={nextSession?.readcomp_link || nextSession?.start_link}
                  className="h-full w-full"
                ></iframe>
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
            {sessionProgressData.stage === Stage.HOMEWORK && (
              <>
                {sessionProgressData.remainingTimeSeconds > 5 && (
                  // Homework
                  <>
                    <Walkthrough>
                      <WalkthroughInstructionsTitle>
                        Homework
                      </WalkthroughInstructionsTitle>
                      <WalkthroughInstructionsDescription>
                        <p>
                          <strong>REMINDER:</strong>
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
            {sessionProgressData.stage === Stage.FINISHED && (
              <div className="h-full w-full flex flex-col items-center justify-center">
                <h2 className="text-lg">You have finished your session</h2>
                <p>Please refer back to the instructions sheet.</p>
                <p>
                  At this point, you should{" "}
                  <strong>turn off the laptop and the headset</strong>
                </p>
              </div>
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
