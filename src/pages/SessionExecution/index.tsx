import { useRef } from "react";
// import { useEffect } from "react";
import { PageContainer, PageMainContent, PageTitle } from "@/components/layout/Page";
import { PreSessionChecks } from "@/features/pre-session-checks/components/PreSessionChecks";
import { SessionInfoDisplay } from "@/features/session-execution/components/SessionInfoDisplay";
import { SessionStartScreen } from "@/features/session-execution/components/SessionStartScreen";
import { ReadcompStage } from "@/features/session-execution/components/ReadcompStage";
import { HomeworkStage } from "@/features/session-execution/components/HomeworkStage";
import { SurveyStage } from "@/features/session-execution/components/SurveyStage";
import { FinishedStage } from "@/features/session-execution/components/FinishedStage";
import Sidebar, { SidebarHandle } from "@/components/layout/Sidebar";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { useSessionExecution } from "@/features/session-execution/hooks/useSessionExecution";
import { usePreSessionChecks } from "@/features/pre-session-checks/hooks/usePreSessionChecks";
import { Stage } from "@/features/session-execution/services/sessionExecutionService";

export default function NextSession() {
  const sidebarRef = useRef<SidebarHandle>(null);
  const {
    nextSession,
    sessionHasStarted,
    sessionProgressData,
    hasNextSession,
    startSession,
    startHomework,
    finishSession
  } = useSessionExecution();

  const {
    completedPreSessionChecks,
    setCompletedPreSessionChecks
  } = usePreSessionChecks();

  const handleStartSession = async () => {
    await startSession();
    sidebarRef.current?.autoCollapse();
  };

  // [MATHEUS] TODO: Delete. I just put this here to skip the pre-session checks when developing
  // setCompletedPreSessionChecks(true);
  // useEffect(() => setCompletedPreSessionChecks(true), [])

  if (hasNextSession === -1 && (sessionHasStarted || !sessionProgressData)) {
    return (
      <PageContainer>
        <Sidebar ref={sidebarRef} />
        <PageMainContent>
          <PageTitle>Next Session</PageTitle>
          <LoadingScreen />
        </PageMainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Sidebar ref={sidebarRef} />
      <div className="w-full h-full">
        {!completedPreSessionChecks && hasNextSession !== 0 && !sessionHasStarted && (
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

        {completedPreSessionChecks && !sessionHasStarted && hasNextSession === 1 && nextSession && (
          <SessionStartScreen
            session={nextSession}
            onStartSession={handleStartSession}
          />
        )}

        {sessionHasStarted && sessionProgressData && sessionProgressData.stage !== Stage.HOMEWORK && (
          <div className="relative">
            <div className="absolute top-5 left-5">
              <SessionInfoDisplay
                session={nextSession}
                sessionProgressData={sessionProgressData}
              />
            </div>
          </div>
        )}

        {sessionHasStarted && sessionProgressData?.stage === Stage.HOMEWORK && (
          <header className="w-full pl-10 pt-8 max-w-[84vw] flex justify-between px-5 fixed">
            <PageTitle>Next Session</PageTitle>
          </header>
        )}

        {sessionHasStarted && sessionProgressData && nextSession && (
          <>
            {sessionProgressData.stage === Stage.READCOMP && (
              <ReadcompStage
                session={nextSession}
                sessionProgressData={sessionProgressData}
                onStartHomework={startHomework}
              />
            )}

            {sessionProgressData.stage === Stage.HOMEWORK && (
              <HomeworkStage
                session={nextSession}
                sessionProgressData={sessionProgressData}
              />
            )}

            {sessionProgressData.stage === Stage.SURVEY && (
              <SurveyStage
                session={nextSession}
                sessionProgressData={sessionProgressData}
                onFinishSession={finishSession}
              />
            )}

            {sessionProgressData.stage === Stage.FINISHED && (
              <FinishedStage session={nextSession} />
            )}

            {!sessionHasStarted && hasNextSession === 0 && (
              <div className="pl-16 pt-8">
                <h2 className="text-3xl mb-8">Congratulations!</h2>
                <p>
                  It appears that you do not have any sessions left. Well done!
                  You've done them all!!!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
