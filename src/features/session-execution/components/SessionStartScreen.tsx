import { Button } from "@/components/common/Button";
import { Session } from "@/features/session-execution/services/sessionExecutionService";
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

interface SessionStartScreenProps {
  session: Session;
  onStartSession: () => void;
}

export function SessionStartScreen({ session, onStartSession }: SessionStartScreenProps) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="flex flex-col gap-6 justify-center items-center translate-x-[-100px] p-12 border border-border bg-card rounded-2xl shadow-lg max-w-2xl">
        <p className="text-3xl font-semibold text-foreground">
          Session #{session.seqnum}
        </p>
        
        {session.no_equipment && (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-base text-foreground">
              <span className="font-bold text-accent text-lg">
                Attention!
              </span>{" "}
              You are{" "}
              <span className="font-bold text-accent">
                not supposed to use the headset
              </span>{" "}
              during this session.
            </p>
            <p className="text-sm text-muted-foreground">
              If you are currently wearing the headset, then please take
              it off to continue your session properly.
            </p>
            <p className="text-sm text-muted-foreground">
              Your sessions with the headset begin at session #3
            </p>
          </div>
        )}
        
        {!session.no_equipment && (
          <div className="flex flex-col gap-3 text-center">
            <p className="text-sm text-foreground">
              {session.is_passthrough
                ? "This session is going to be VR passthrough"
                : "This session is going to be VR"}
            </p>
            <p className="text-sm text-foreground">
              {session.has_feedback
                ? "You are going to receive some feedback this session"
                : "You will not receive feedback for this session"}
            </p>
          </div>
        )}

        <p className="text-base text-foreground font-medium mt-2">Are you ready to begin?</p>

        {session.seqnum > 2 ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="mt-2">Start Session</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>VR Headset</AlertDialogTitle>
                <div className="text-sm text-muted-foreground">
                  <span className="text-accent font-bold">You were supposed to be wearing the VR headset already. </span>
                  Are you? If not, it's possible you missed something on the
                  instructions sheet.
                  Please double check.
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction
                  className="bg-green-600 hover:bg-green-700"
                  onClick={onStartSession}
                >
                  Start Session
                </AlertDialogAction>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button className="mt-2" onClick={onStartSession}>
            Start Session
          </Button>
        )}
      </div>
    </div>
  );
}
