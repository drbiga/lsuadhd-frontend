import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface FinishedStageProps {
  hasEquipment?: boolean;
}

export function FinishedStage({ hasEquipment }: FinishedStageProps) {
  return (
    <>
      {hasEquipment && (
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
            close this tab and then shut down the laptop
            {hasEquipment && <span> as well as the headset</span>}
          </span>
        </p>
      </div>
    </>
  );
}
