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
    sessionHasEquipment,
    startSession
  } = useSessionExecution();

  const {
    completedPreSessionChecks,
    setCompletedPreSessionChecks,
    goalPercentage,
    setGoalPercentage,
  } = usePreSessionChecks();

  const handleStartSession = async () => {
    await startSession(goalPercentage);
    sidebarRef.current?.autoCollapse();
  };

  if (hasNextSession === -1) {
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
          <div className="h-full flex flex-col justify-center items-center">
            <h2 className="text-3xl font-bold mb-1">Welcome</h2>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Up Next:</span> <span className="text-yellow-500 font-semibold">Session {nextSession?.seqnum}</span>
            </p>
            <p className="text-center m-4">
              You are about to go through some pre-session checks. Please press begin.
            </p>
            <PreSessionChecks
              session={nextSession}
              completedCallback={(goal) => {
                setCompletedPreSessionChecks(true);
                setGoalPercentage(goal);
              }}
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
              />
            )}

            {sessionProgressData.stage === Stage.FINISHED && (
              <FinishedStage
                hasEquipment={sessionHasEquipment}
              />
            )}
          </>
        )}
        {!sessionHasStarted && hasNextSession === 0 && (
          <div className="pl-16 pt-8">
            <h2 className="text-3xl mb-8 font-bold">Congratulations! <span className="animate-bounce inline-block">🎉</span></h2>
            <p>
              It appears that you do not have any sessions left. Well done!
              You've completed them all!
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
