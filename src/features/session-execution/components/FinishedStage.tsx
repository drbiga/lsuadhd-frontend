import { Session } from "@/features/session-execution/services/sessionExecutionService";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface FinishedStageProps {
  session: Session;
}

export function FinishedStage({ session }: FinishedStageProps) {
  return (
    <>
      {session && !session.no_equipment && (
        <AlertDialog defaultOpen>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Important Reminder
              </AlertDialogTitle>
              <p>
                <span className="text-yellow-500 font-bold">Please remember to charge your headset</span> after completing this session 
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
          <span className="text-yellow-500 font-bold">
            shut down the laptop
            {!session?.no_equipment && <span> and the headset</span>}
          </span>
        </p>
      </div>
    </>
  );
}
