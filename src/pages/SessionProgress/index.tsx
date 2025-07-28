import { PageContainer, PageMainContent, PageTitle } from "@/components/layout/Page";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import Sidebar from "@/components/layout/Sidebar";
import { CompletedSessionsList } from "@/features/session-progress/components/CompletedSessionsList";
import { RemainingSessionsList } from "@/features/session-progress/components/RemainingSessionsList";
import { useSessionProgress } from "@/features/session-progress/hooks/useSessionProgress";

export default function SessionProgress() {
  const { sessionsDone, remainingSessions, sessionsDoneAnalytics, isLoading } = useSessionProgress();

  if (isLoading) {
    return (
      <PageContainer>
        <Sidebar />
        <PageMainContent>
          <PageTitle>Session Progress</PageTitle>
          <LoadingScreen message="Loading session progress data..." />
        </PageMainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Sidebar />
      <PageMainContent>
        <PageTitle>Session Progress</PageTitle>

        <div className="flex flex-col gap-8">
          <CompletedSessionsList 
            sessions={sessionsDone} 
            analytics={sessionsDoneAnalytics} 
          />
          
          <RemainingSessionsList 
            sessions={remainingSessions} 
            completedSessionsCount={sessionsDone.length} 
          />
        </div>
      </PageMainContent>
    </PageContainer>
  );
}
