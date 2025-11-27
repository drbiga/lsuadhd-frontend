import { useCallback, useReducer, useRef, useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialogAction,
  AlertDialogDescription,
} from "@radix-ui/react-alert-dialog";
import { CirclePlay } from "lucide-react";
import axios, { AxiosError } from "axios";
import { useAuth } from "@/hooks/auth";
import { cn } from "@/lib/utils";
import { Session } from "@/features/session-execution/services/sessionExecutionService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export type PreSessionChecksSteps =
  | { type: "WELCOME" }
  | { type: "SUPPORTING_APPS" }
  | { type: "HEADPHONE_CHECK" }
  | { type: "VR_MODE_PASSTHROUGH" }
  | { type: "AUDIO_CUE"; answer: string; cue: string; error?: string }
  | { type: "GOAL_SETTING"; goalPercentage: number }
  | { type: "CONFIRMATION" }
  | { type: "DONE" };

export type Action =
  | { type: "NEXT" }
  | { type: "SET_AUDIO_CUE"; answer: string }
  | { type: "VALIDATE_CUE" }
  | { type: "FINISH" }
  | { type: "CHANGE_CUE" }
  | { type: "SET_GOAL_PERCENTAGE"; goalPercentage: number }
  | { type: "RESET" };

export function checksReducer(
  state: PreSessionChecksSteps,
  action: Action,
  session: Session | null = null
): PreSessionChecksSteps {
  const availableCues = ["dog", "ice cream", "laboratory"];

  function getNextCue(currentCue: string) {
    const currentIndex = availableCues.indexOf(currentCue);
    const nextIndex = (currentIndex + 1) % availableCues.length;
    return availableCues[nextIndex];
  }

  switch (action.type) {
    case "RESET":
      return { type: "WELCOME" };
  }

  switch (state.type) {
    case "WELCOME":
      if (action.type === "NEXT") return { type: "SUPPORTING_APPS" };
      break;
    case "SUPPORTING_APPS":
      if (action.type === "NEXT") {
        if (session?.no_equipment || (session?.seqnum ?? 0) <= 2) {
          return { type: "CONFIRMATION" };
        }
        return { type: "HEADPHONE_CHECK" };
      }
      break;
    case "HEADPHONE_CHECK":
      if (action.type === "NEXT") {
        if (!session?.is_passthrough) {
          const firstCue =
            availableCues[Math.floor(Math.random() * availableCues.length)];
          return { type: "AUDIO_CUE", answer: "", cue: firstCue };
        }
        return { type: "VR_MODE_PASSTHROUGH" };
      }
      break;
    case "VR_MODE_PASSTHROUGH":
      if (action.type === "NEXT") {
        const firstCue =
          availableCues[Math.floor(Math.random() * availableCues.length)];
        return { type: "AUDIO_CUE", answer: "", cue: firstCue };
      }
      break;
    case "AUDIO_CUE":
      if (action.type === "SET_AUDIO_CUE")
        return { ...state, answer: action.answer };
      if (action.type === "VALIDATE_CUE") {
        return state.answer === state.cue
          ? { type: "GOAL_SETTING", goalPercentage: 50 }
          : { ...state, error: "Invalid answer" };
      }
      if (action.type === "CHANGE_CUE") {
        return {
          ...state,
          cue: getNextCue(state.cue),
          answer: "",
          error: undefined,
        };
      }
      break;
    case "GOAL_SETTING":
      if (action.type === "SET_GOAL_PERCENTAGE")
        return { ...state, goalPercentage: action.goalPercentage };
      if (action.type === "NEXT")
        return { type: "CONFIRMATION" };
      break;
    case "CONFIRMATION":
      if (action.type === "FINISH") return { type: "DONE" };
      break;
  }
  return state;
}

const AudioCuePlayButton = ({ cue }: { cue: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  return (
    <div>
      <Button className="flex gap-2 p-0 m-0" variant={"link"} size={"sm"} onClick={playSound}>
        <CirclePlay />
        Play Sound
      </Button>
      <audio ref={audioRef} src={`/${cue}.mp3`} preload="auto" />
    </div>
  );
};

const FixDialog = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {children}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export type PreSessionChecksProps = {
  completedCallback: (goalPercentage?: number) => void;
  session: Session | null;
};

export function PreSessionChecks({ completedCallback, session }: PreSessionChecksProps) {
  const [state, dispatch] = useReducer(
    (state: PreSessionChecksSteps, action: Action) => checksReducer(state, action, session),
    { type: "WELCOME" }
  );
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const audioCueAnswerRef = useRef(null);
  const [localServerIsWorking, setLocalServerIsWorking] = useState(false);
  const [personalAnalyticsIsWorking, setPersonalAnalyticsIsWorking] = useState(false);
  const [feedbackSystemIsWorking, setFeedbackSystemIsWorking] = useState(false);
  const [isPingingLocal, setIsPingingLocal] = useState(false);
  const [isPingingPersonal, setIsPingingPersonal] = useState(false);
  const [isPingingFeedback, setIsPingingFeedback] = useState(false);
  const [beepChecked, setBeepChecked] = useState(false);
  const [showLocalServerFix, setShowLocalServerFix] = useState(false);
  const [showPersonalAnalyticsFix, setShowPersonalAnalyticsFix] = useState(false);
  const [showFeedbackSystemFix, setShowFeedbackSystemFix] = useState(false);
  const [savedGoalPercentage, setSavedGoalPercentage] = useState<number | undefined>(undefined);

  const { initializeLocalServer } = useAuth();

  const pingLocalServer = useCallback(async () => {
    setIsPingingLocal(true);
    try {
      const response = await axios.get("http://localhost:8001/session");
      if (response.data) {
        setLocalServerIsWorking(true);
      }
    } catch (e: any) {
      setLocalServerIsWorking(false);
      if (e instanceof AxiosError) {
        if (e.response?.status === 412) {
          initializeLocalServer();
          setLocalServerIsWorking(true);
        }
      }
    } finally {
      setIsPingingLocal(false);
    }
  }, [initializeLocalServer]);

  const pingPersonalAnalytics = useCallback(async () => {
    setIsPingingPersonal(true);
    try {
      const response = await axios.get("http://localhost:8001/checkPA");
      if (response.data) {
        setPersonalAnalyticsIsWorking(true);
      }
    } catch (e: any) {
      setPersonalAnalyticsIsWorking(false);
      if (e instanceof AxiosError && e.code === "ERR_NETWORK") {
        console.error("Network error:", e);
      }
      if (e.code === "ECONNREFUSED") {
        console.error("Connection refused:", e);
      }
    } finally {
      setIsPingingPersonal(false);
    }
  }, []);

  const pingFeedbackSystem = useCallback(async () => {
    setIsPingingFeedback(true);
    try {
      const response = await axios.get("http://localhost:8080/health-check");
      if (response.data) {
        setFeedbackSystemIsWorking(true);
      }
    } catch (e: any) {
      setFeedbackSystemIsWorking(false);
      if (e instanceof AxiosError && e.code === "ERR_NETWORK") {
        console.error("Network error:", e);
      }
      if (e.code === "ECONNREFUSED") {
        console.error("Connection refused:", e);
      }
    } finally {
      setIsPingingFeedback(false);
    }
  }, []);

  const isPinging = isPingingLocal || isPingingPersonal || (session?.has_feedback ? isPingingFeedback : false);
  
  useEffect(() => {
    pingLocalServer();
    pingPersonalAnalytics();
    if (session?.has_feedback) {
      pingFeedbackSystem();
    } else {
      setFeedbackSystemIsWorking(true);
    }
  }, [pingLocalServer, pingPersonalAnalytics, pingFeedbackSystem, session]);

  const handleCheckBeep = () => {
    try {
      if (session?.has_feedback) {
        axios.get('http://localhost:8080/play-beep');
      }
    } catch (error) {
    } finally {
      setBeepChecked(true);
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          // If a tab has the autoclose parameter to mark a session as moved, 
          // they get redirected to base path before beginning a new session to prevent issues
          if (new URLSearchParams(window.location.search).get('autoclose') === 'true') {
            window.location.href = window.location.origin + window.location.pathname;
            return;
          }
          dispatch({ type: "RESET" });
          setDialogIsOpen(true);
        }}
      >
        Begin Pre-Session Checks
      </Button>
      <AlertDialog
        open={dialogIsOpen}
        onOpenChange={setDialogIsOpen}
      >
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            {state.type === "WELCOME" && (
              <>
                <AlertDialogTitle>Welcome</AlertDialogTitle>
                <AlertDialogDescription>
                  To ensure a smooth session, you will perform setup checks.
                  <span className="text-yellow-500 font-bold"> Please read all instructions carefully.</span>
                </AlertDialogDescription>
              </>
            )}
            {state.type === "SUPPORTING_APPS" && (
              <>
                <AlertDialogTitle>Supporting apps</AlertDialogTitle>
                <div className="flex flex-col gap-6">
                  <AlertDialogDescription>
                    <span className="text-yellow-500 font-bold">Please ensure {session?.has_feedback ? 'all systems' : 'both the server and app'} are running. </span>
                    Refer to the indicators below for guidance.
                  </AlertDialogDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn("w-3 h-3 rounded-full", localServerIsWorking ? "bg-green-600" : "bg-red-600")}></span>
                      <AlertDialogDescription>
                        The Local Server appears to be {localServerIsWorking ? "online" : "offline"}
                      </AlertDialogDescription>
                    </div>
                    {!localServerIsWorking && (
                      <Button variant="outline" size="sm" onClick={() => setShowLocalServerFix(true)}>
                        Fix
                      </Button>
                    )}
                  </div>
                  {localServerIsWorking && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn("w-3 h-3 rounded-full", personalAnalyticsIsWorking ? "bg-green-600" : "bg-red-600")}></span>
                        <AlertDialogDescription>
                          The Personal Analytics app appears to be {personalAnalyticsIsWorking ? "online" : "offline"}
                        </AlertDialogDescription>
                      </div>
                      {!personalAnalyticsIsWorking && (
                        <Button variant="outline" size="sm" onClick={() => setShowPersonalAnalyticsFix(true)}>
                          Fix
                        </Button>
                      )}
                    </div>
                  )}
                  {session?.has_feedback && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn("w-3 h-3 rounded-full", feedbackSystemIsWorking ? "bg-green-600" : "bg-red-600")}></span>
                        <AlertDialogDescription>
                          The Stoplight Feedback System appears to be {feedbackSystemIsWorking ? "online" : "offline"}
                        </AlertDialogDescription>
                      </div>
                      {!feedbackSystemIsWorking && (
                        <Button variant="outline" size="sm" onClick={() => setShowFeedbackSystemFix(true)}>
                          Fix
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
            {state.type === "HEADPHONE_CHECK" && (
              <>
                <AlertDialogTitle>Headphone Setup & Volume</AlertDialogTitle>
                <div className="flex flex-col gap-4">
                  <AlertDialogDescription>
                    Plug the headphones into the headset using the headphone jack on the right strap of the headset.
                  </AlertDialogDescription>
                  <AlertDialogDescription>
                    Then, make sure you have the volume of the headset high enough.
                    You can raise the volume using the buttons on the bottom
                    right section of the headset as shown in the image.
                  </AlertDialogDescription>
                  <div className="flex justify-center">
                    <img
                      width={"60%"}
                      src="/headset-vol-buttons.jpg"
                      alt="volume buttons"
                    />
                  </div>
                  {session?.has_feedback && !session?.is_passthrough && (
                    <AlertDialogDescription>
                      Please check the 'beep' noise to ensure it is set at a comfortable level.
                      <span className="text-yellow-500 font-bold"> This sound serves as
                        feedback when distraction is detected during the session.</span>
                    </AlertDialogDescription>
                  )}
                </div>
              </>
            )}
            {state.type === "VR_MODE_PASSTHROUGH" && (
              <>
                <AlertDialogTitle>Setting VR mode to Passthrough</AlertDialogTitle>
                <AlertDialogDescription>
                  On the Meta Workrooms app on the headset, <span className="text-yellow-500 font-bold">make sure that the
                    VR mode is set to passthrough</span> and that you can see your
                  surroundings. If you see a virtual environment, please set to
                  passthrough before continuing.
                </AlertDialogDescription>
              </>
            )}
            {state.type === "AUDIO_CUE" && (
              <>
                <AlertDialogTitle>Final Audio Check: Please enter the audio cue</AlertDialogTitle>
                <AlertDialogDescription>
                  Please double check that your volume is set to a comfortable level.
                </AlertDialogDescription>
              </>
            )}
            {state.type === "GOAL_SETTING" && (
              <>
                <AlertDialogTitle>Set Focus Goal</AlertDialogTitle>
                <AlertDialogDescription>
                  What percentage of the session do you aim to be focused for?
                  <span className="text-yellow-500 font-bold">Please provide an honest answer.</span>
                </AlertDialogDescription>
              </>
            )}
            {state.type === "CONFIRMATION" && (
              <>
                <AlertDialogTitle>Success!</AlertDialogTitle>

                <AlertDialogDescription>
                  You have finished all pre-session checks
                </AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>

          {state.type === "AUDIO_CUE" && (
            <>
              <Input
                ref={audioCueAnswerRef}
                value={state.answer}
                onChange={(e) =>
                  dispatch({ type: "SET_AUDIO_CUE", answer: e.target.value })
                }
              />
              {state.error && (
                <AlertDialogDescription className="text-red-500 text-sm">
                  {state.error}
                </AlertDialogDescription>
              )}
            </>
          )}

          {state.type === "GOAL_SETTING" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="goal-percentage" className="text-sm font-medium text-white">
                Focus Goal Percentage:
              </label>
              <select
                id="goal-percentage"
                value={state.goalPercentage}
                onChange={(e) =>
                  dispatch({ type: "SET_GOAL_PERCENTAGE", goalPercentage: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-md"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map((value) => (
                  <option key={value} value={value}>
                    {value}%
                  </option>
                ))}
              </select>
            </div>
          )}

          <AlertDialogFooter>
            {state.type !== "DONE" && (
              <div className="w-full flex justify-start">
                <Button
                  variant="link"
                  onClick={() => {
                    setDialogIsOpen(false);
                  }}
                >
                  Close Checks
                </Button>
              </div>
            )}
            {state.type === "WELCOME" && (
              <Button
                variant={"outline"}
                onClick={() => dispatch({ type: "NEXT" })}
              >
                Continue
              </Button>
            )}

            {state.type === "SUPPORTING_APPS" && (
              <>
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isPinging ? "hidden" : ""
                  )}
                >
                  {(localServerIsWorking && personalAnalyticsIsWorking && (!session?.has_feedback || feedbackSystemIsWorking)) ? (
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  )}
                  <Button
                    disabled={isPinging}
                    onClick={() => {
                      pingLocalServer();
                      pingPersonalAnalytics();
                      if (session?.has_feedback) {
                        pingFeedbackSystem();
                      }
                    }}
                  >
                    {isPinging ? "Checking..." : "Click to Verify Again"}
                  </Button>
                </div>
                <div
                  className={cn("flex items-center", isPinging ? "" : "hidden")}
                >
                  <div className="w-5 h-5 border-2 border-t-2 border-white border-t-blue-400 rounded-full animate-spin"></div>
                </div>
                <Button
                  variant={"outline"}
                  disabled={
                    !localServerIsWorking ||
                    !personalAnalyticsIsWorking ||
                    (session?.has_feedback && !feedbackSystemIsWorking)
                  }
                  onClick={() => dispatch({ type: "NEXT" })}
                >
                  Continue
                </Button>
              </>
            )}

            {state.type === "HEADPHONE_CHECK" && (
              <>
                <Button
                  variant={"outline"}
                  onClick={() => dispatch({ type: "NEXT" })}
                  disabled={session?.has_feedback && !session?.is_passthrough && !beepChecked}
                >
                  Continue
                </Button>
                {session?.has_feedback && !session?.is_passthrough && (
                  <Button
                    variant="outline"
                    onClick={handleCheckBeep}
                  >
                    Check Beep
                  </Button>
                )}
              </>
            )}

            {state.type === "VR_MODE_PASSTHROUGH" && (
              <Button
                variant={"outline"}
                onClick={() => dispatch({ type: "NEXT" })}
              >
                Continue
              </Button>
            )}

            {state.type === "AUDIO_CUE" && (
              <div className="flex w-full justify-end items-center">
                <AudioCuePlayButton cue={state.cue} />
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => dispatch({ type: "CHANGE_CUE" })}
                >
                  Change Cue
                </Button>

                <Button
                  variant="outline"
                  onClick={() => dispatch({ type: "VALIDATE_CUE" })}
                >
                  Continue
                </Button>
              </div>
            )}

            {state.type === "GOAL_SETTING" && (
              <Button
                variant="outline"
                onClick={() => {
                  setSavedGoalPercentage(state.goalPercentage);
                  dispatch({ type: "NEXT" });
                }}
              >
                Continue
              </Button>
            )}

            {state.type === "CONFIRMATION" && (
              <AlertDialogAction
                onClick={() => {
                  dispatch({ type: "FINISH" });
                  setDialogIsOpen(false);
                  completedCallback(savedGoalPercentage);
                }}
              >
                Close
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FixDialog 
        isOpen={showLocalServerFix} 
        onClose={() => setShowLocalServerFix(false)}
        title="Fix Local Server"
      >
        <img
            className="rounded-md shadow"
            src="/cmd.png"
            alt="Local Server"
        />

        <DialogDescription>
          The local server (shown above) acts as an intermediary app that runs in the background, 
          managing communications between the laptop, the browser, and our servers.
          If the Local Server is currently running, please close the command prompt window. 
          Then, double-click the "Open this first" shortcut on the desktop to restart the local server.
          Wait a few seconds and click "Click to Verify Again" to check the status.
        </DialogDescription>
        <DialogDescription>
          If the issue persists, contact Matheus at <strong className="text-yellow-500">mcost16@lsu.edu</strong> for assistance.
        </DialogDescription>
      </FixDialog>

      <FixDialog 
        isOpen={showPersonalAnalyticsFix} 
        onClose={() => setShowPersonalAnalyticsFix(false)}
        title="Fix Personal Analytics App"
      >
        <div className="flex gap-4 overflow-x-auto py-2 w-full scrollbar-thick">
          <img
            className="flex-shrink-0 h-[300px] rounded-md shadow"
            src="/personalanalytics1.png"
            alt="Step 1"
          />
          <img
            className="flex-shrink-0 h-[300px] rounded-md shadow"
            src="/personalanalytics2.png"
            alt="Step 2"
          />
          <img
            className="flex-shrink-0 h-[300px] rounded-md shadow"
            src="/personalanalytics3.png"
            alt="Step 3"
          />
          <img
            className="flex-shrink-0 h-[300px] rounded-md shadow"
            src="/personalanalytics4.png"
            alt="Step 4"
          />
        </div>


        <DialogDescription>
          If the Personal Analytics app is currently running, please close it completely.
          <span className="text-yellow-500"> Please use the scrollbar above to view the instructions 
          for closing the PersonalAnalytics app. </span>
          Then, restart the app using the provided executable file (.exe).
          Wait a few seconds and click "Click to Verify Again" to check the status.
        </DialogDescription>
        <DialogDescription>
          If the issue persists, contact Matheus at <strong className="text-yellow-500">mcost16@lsu.edu</strong> for assistance.
        </DialogDescription>
      </FixDialog>

      <FixDialog 
        isOpen={showFeedbackSystemFix} 
        onClose={() => setShowFeedbackSystemFix(false)}
        title="Fix Stoplight Feedback System"
      >
        <div className="flex justify-center p-3">
          <img
            width={"60%"}
            src="/closestoplight.png"
            alt="closestoplight"
          />
        </div>
        <DialogDescription>
          The stoplight app should be centered at the top of each display used by the computer. 
          If it appears to be open, please close it completely (as indicated by the image). Then, 
          re-open the Stoplight executable (.exe) file once more.
          Wait a few seconds and click "Click to Verify Again" to check the status.
        </DialogDescription>
        <DialogDescription>
          If the issue persists, contact Matheus at <strong className="text-yellow-500">mcost16@lsu.edu</strong> for assistance.
        </DialogDescription>
      </FixDialog>
    </>
  );
}
