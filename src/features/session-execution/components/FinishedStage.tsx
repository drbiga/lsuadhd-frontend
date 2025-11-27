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
              <p className="text-foreground">
                <span className="text-accent font-bold">Please remember to charge your headset</span> after completing this session 
                to make sure you don't run out of battery in your next session!
              </p>
            </AlertDialogHeader>
            <AlertDialogCancel>
              Continue
            </AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
        <div className="rounded-xl p-8 max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Session Complete</h2>
          <p className="text-muted-foreground mb-3">You have successfully finished your session.</p>
          <p className="text-muted-foreground mb-3">Please refer back to the instructions sheet.</p>
              <p className="text-foreground">
            At this point, you should{" "}
            <span className="text-accent font-semibold">
              close this tab. Then, please shut down the laptop
              {hasEquipment && <span> and the headset</span>}
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
