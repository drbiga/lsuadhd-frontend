import { PageContainer, PageMainContent, PageTitle } from "@/components/layout/Page";
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
          <div className="flex items-center justify-center p-8">
            <div className="text-xl">Loading session progress data...</div>
          </div>
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
