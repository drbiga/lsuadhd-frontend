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
      <div className="flex flex-col gap-8 justify-center items-center translate-x-[-100px] p-16 border-[2px] border-slate-700 rounded-lg">
        <p className="text-2xl text-slate-700 dark:text-slate-300">
          Session #{session.seqnum}
        </p>
        
        {session.no_equipment && (
          <>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-bold text-yellow-500 text-xl">
                Attention!
              </span>{" "}
              You are{" "}
              <span className="font-bold text-yellow-500 text-xl">
                not supposed to use the headset
              </span>{" "}
              during this session.
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              If you are currently wearing the headset, then please take
              it off to continue your session properly.
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Your sessions with the headset begin at session #3
            </p>
          </>
        )}
        
        {!session.no_equipment && (
          <>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {session.is_passthrough
                ? "This session is going to be VR passthrough"
                : "This session is going to be VR"}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {session.has_feedback
                ? "You are going to receive some feedback this session"
                : "You will not recieve feedback for this session"}
            </p>
          </>
        )}

        <p className="text-sm text-slate-700 dark:text-slate-300">Are you ready to do this?</p>

        {session.seqnum > 2 ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>Start!</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>VR Headset</AlertDialogTitle>
                <div className="text-sm text-muted-foreground">
                  <span className="text-yellow-500 font-bold">You were supposed to be wearing the VR headset already.</span>
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
                  Start!
                </AlertDialogAction>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            className="bg-slate-300 dark:bg-slate-700 hover:bg-slate-700 hover:text-slate-100 dark:hover:bg-slate-400 dark:hover:text-slate-900 transition-all duration-100"
            onClick={onStartSession}
          >
            Start!
          </Button>
        )}
      </div>
    </div>
  );
}
