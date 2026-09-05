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
import { AlertTriangle, CheckIcon, CirclePlay } from "lucide-react";
import axios, { AxiosError } from "axios";
import { useAuth } from "@/hooks/auth";
import { cn } from "@/lib/utils";
import { Session } from "@/features/session-execution/services/sessionExecutionService";
import { toast } from "react-toastify";
import iamService from "@/services/iam";
import api from "@/services/api";

import { Tooltip } from 'react-tooltip';

import { AppFixDialog } from "./AppFixDialog";

import { DialogDescription } from "@/components/ui/dialog"

export type PreSessionChecksSteps =
  | { type: "WELCOME" }
  | { type: "INPUT_DEVICES" }
  | { type: "SUPPORTING_APPS" }
  | { type: "SYNCING" }
  | { type: "HEADPHONE_CHECK" }
  // | { type: "VR_MODE_PASSTHROUGH" }
  | { type: "AUDIO_CUE"; answer: string; cue: string; error?: string }
  // | { type: "GOAL_SETTING"; goalPercentage: number }
  | { type: 'ENVIRONMENT_CHECK', correctEnvironment: string, currentEnvironment: string }
  | { type: 'ENVIRONMENT_FIX' }
  | { type: "CONFIRMATION" }
  | { type: "DONE" };

// Rough per-feedback estimate (upload + OCR, ~2 at a time) shown to students so they know
// roughly how long feedback recovery will take
const ESTIMATED_SECONDS_PER_FEEDBACK = 2;

export type Action =
  | { type: "NEXT" }
  | { type: "SET_AUDIO_CUE"; answer: string }
  | { type: "VALIDATE_CUE" }
  | { type: "FINISH" }
  | { type: "CHANGE_CUE" }
  // | { type: "SET_GOAL_PERCENTAGE"; goalPercentage: number }
  | { type: 'SET_CURRENT_ENVIRONMENT', correctEnvironment: string, currentEnvironment }
  | { type: 'FIX_ENVIRONMENT' }
  | { type: "RESET" };

export function checksReducer(
  state: PreSessionChecksSteps,
  action: Action,
  session: Session | null = null,
): PreSessionChecksSteps {
  const availableCues = ["dog", "ice cream", "laboratory"];

  function getNextCue(currentCue: string) {
    const currentIndex = availableCues.indexOf(currentCue);
    const nextIndex = (currentIndex + 1) % availableCues.length;
    return availableCues[nextIndex];
  }

  switch (action.type) {
    case "RESET":
      // TODO: revert back to WELCOME state
      return { type: "WELCOME" };
  }

  switch (state.type) {
    case "WELCOME":
      if (action.type === "NEXT") return { type: "SUPPORTING_APPS" };
      break;
    case "SUPPORTING_APPS":
      // Check for (and restore) any feedback that never made it to the 
      // cloud before moving on with the rest of the checks.
      if (action.type === "NEXT") return { type: "SYNCING" };
      break;
    case "SYNCING":
      if (action.type === "NEXT") {
        if (session?.no_equipment || (session?.seqnum ?? 0) <= 2) {
          return { type: "CONFIRMATION" };
        }
        return { type: "HEADPHONE_CHECK" };
      }
      break;
    case "HEADPHONE_CHECK":
      if (action.type === "NEXT") {
        const firstCue =
          availableCues[Math.floor(Math.random() * availableCues.length)];
        return { type: "AUDIO_CUE", answer: "", cue: firstCue };
      }
      break;
    // case "VR_MODE_PASSTHROUGH":
    //   if (action.type === "NEXT") {
    //     const firstCue =
    //       availableCues[Math.floor(Math.random() * availableCues.length)];
    //     return { type: "AUDIO_CUE", answer: "", cue: firstCue };
    //   }
    //   break;
    case "AUDIO_CUE":
      if (action.type === "SET_AUDIO_CUE")
        return { ...state, answer: action.answer };
      if (action.type === "VALIDATE_CUE") {
        return state.answer === state.cue
          // ? { type: "GOAL_SETTING", goalPercentage: 50 }
          ? { type: "ENVIRONMENT_CHECK", correctEnvironment: '', currentEnvironment: '' }
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
    // case "GOAL_SETTING":
    //   if (action.type === "SET_GOAL_PERCENTAGE")
    //     return { ...state, goalPercentage: action.goalPercentage };
    //   if (action.type === "NEXT")
    //     return { type: "CONFIRMATION" };
    //   break;
    case 'ENVIRONMENT_CHECK':
      if (action.type === 'SET_CURRENT_ENVIRONMENT') {
        return { ...state, correctEnvironment: action.correctEnvironment, currentEnvironment: action.currentEnvironment }
      }
      if (action.type === 'NEXT') {
        if (state.correctEnvironment === '' || state.currentEnvironment === '') {
          toast('The continue button was pressed before setting the correct and current environments. Please let mcost16@lsu.edu know about this issue before proceeding')
        }
        if (state.correctEnvironment === 'TestingGroup') {
          return { type: 'INPUT_DEVICES' }
        }
        if (state.correctEnvironment === 'Passthrough' && state.currentEnvironment === 'Passthrough') {
          return { type: 'INPUT_DEVICES' }
        }
        if (state.correctEnvironment.startsWith("VR") && state.currentEnvironment.startsWith("VR")) {
          return { type: 'INPUT_DEVICES' }
        }
        return { type: 'ENVIRONMENT_FIX' }
      }
      break;
    case 'ENVIRONMENT_FIX':
      if (action.type === 'FIX_ENVIRONMENT')
        return { type: 'ENVIRONMENT_CHECK', correctEnvironment: '', currentEnvironment: '' }
      break;
    case "INPUT_DEVICES":
      if (action.type === "NEXT") return { type: "CONFIRMATION" };
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

export type PreSessionChecksProps = {
  completedCallback: (goalPercentage?: number) => void;
  session: Session | null;
  studentGroupEnvironment: string;
};

export function PreSessionChecks({ completedCallback, session, studentGroupEnvironment }: PreSessionChecksProps) {
  const [state, dispatch] = useReducer(
    (state: PreSessionChecksSteps, action: Action) => checksReducer(state, action, session),
    { type: "WELCOME" }
  );
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const audioCueAnswerRef = useRef(null);
  const [localServerIsWorking, setLocalServerIsWorking] = useState(false);
  const [localServerIsUpdated, setLocalServerIsUpdated] = useState(false);
  const [personalAnalyticsIsWorking, setPersonalAnalyticsIsWorking] = useState(false);
  const [feedbackSystemIsWorking, setFeedbackSystemIsWorking] = useState(false);
  const [isPingingLocal, setIsPingingLocal] = useState(false);
  const [isPingingUpdate, setIsPingingUpdate] = useState(false);
  const [isPingingPersonal, setIsPingingPersonal] = useState(false);
  const [isPingingFeedback, setIsPingingFeedback] = useState(false);
  const [beepChecked, setBeepChecked] = useState(false);
  const [showLocalServerFix, setShowLocalServerFix] = useState(false);
  const [showPersonalAnalyticsFix, setShowPersonalAnalyticsFix] = useState(false);
  const [showFeedbackSystemFix, setShowFeedbackSystemFix] = useState(false);
  const [syncPhase, setSyncPhase] = useState<"checking" | "syncing" | "error">("checking");
  const [syncCount, setSyncCount] = useState(0);
  const [syncRetry, setSyncRetry] = useState(0);
  // const [savedGoalPercentage, setSavedGoalPercentage] = useState<number | undefined>(undefined);
  const [currentEnvironment, setCurrentEnvironment] = useState("");

  const { initializeLocalServer, authState } = useAuth();

  const pingLocalServer = useCallback(async () => {
    setIsPingingLocal(true);
    try {
      const response = await axios.get("http://localhost:8001/session");
      setLocalServerIsWorking(Boolean(response.data));
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

  const checkLocalServerUpdated = useCallback(async () => {
    setIsPingingUpdate(true);
    try {
      const response = await axios.post("http://localhost:8001/ensure_updated");
      setLocalServerIsUpdated(response.data.status === "current");
    } catch (e: any) {
      setLocalServerIsUpdated(false);
    } finally {
      setIsPingingUpdate(false);
    }
  }, []);

  const pingPersonalAnalytics = useCallback(async () => {
    setIsPingingPersonal(true);
    try {
      const response = await axios.get("http://localhost:8001/checkPA");
      setPersonalAnalyticsIsWorking(Boolean(response.data));
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
      setFeedbackSystemIsWorking(Boolean(response.data));
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

  const isPinging = isPingingLocal || isPingingUpdate || isPingingPersonal || (session?.has_feedback ? isPingingFeedback : false);

  useEffect(() => {
    pingLocalServer();
    checkLocalServerUpdated();
    pingPersonalAnalytics();
    if (session?.has_feedback) {
      pingFeedbackSystem();
    } else {
      setFeedbackSystemIsWorking(true);
    }
  }, [pingLocalServer, checkLocalServerUpdated, pingPersonalAnalytics, pingFeedbackSystem, session]);

  useEffect(() => {
    if (state.type !== "SYNCING") return;
    let active = true;
    (async () => {
      setSyncPhase("checking");
      try {
        const { data } = await axios.get("http://localhost:8001/reconcile/pending");
        const pending: number = data?.pending ?? 0;
        if (!active) return;
        if (pending === 0) {
          dispatch({ type: "NEXT" });
          return;
        }
        setSyncCount(pending);
        setSyncPhase("syncing");
        await axios.post("http://localhost:8001/reconcile", {}, { timeout: 10 * 60 * 1000 });
        if (!active) return;
        const after = await axios.get("http://localhost:8001/reconcile/pending");
        if (!active) return;
        if ((after.data?.pending ?? 0) === 0) {
          dispatch({ type: "NEXT" });
        } else {
          setSyncPhase("error");
        }
      } catch {
        if (active) setSyncPhase("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [state.type, syncRetry]);

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
        onClick={async () => {
          // If a tab has the autoclose parameter to mark a session as moved, 
          // they get redirected to base path before beginning a new session to prevent issues
          if (new URLSearchParams(window.location.search).get('autoclose') === 'true') {
            window.location.href = window.location.origin + window.location.pathname;
            return;
          }

          const username = authState.session?.user.username;
          if (username) {
            const isLocked = await iamService.isUserLocked(username);
            if (isLocked) {
              toast.error("Please contact mcost16@lsu.edu with any questions. The feedback count in your last session was unusually low. Your account has been locked until the issue can be resolved by study coordinators.");
              return;
            }
          }

          // Wake the OCR container (pre-ping) so its warm for the session
          api.get("/session_execution/warm-ocr").catch(() => {});
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
            {state.type === "INPUT_DEVICES" && (
              <>
                <AlertDialogTitle className="flex items-center justify-center gap-2 text-center text-2xl text-yellow-500">
                  <AlertTriangle className="h-7 w-7 shrink-0" />
                  Please Only use the Mouse and Keyboard for Interaction
                  <AlertTriangle className="h-7 w-7 shrink-0" />
                </AlertDialogTitle>
                <div className="flex flex-col gap-4">
                  <AlertDialogDescription className="font-semibold text-foreground">
                    VR controllers, joysticks, and similar devices are{" "}
                    <span className="text-red-500">not permitted</span> during your session.
                  </AlertDialogDescription>
                  <AlertDialogDescription className="font-semibold text-foreground">
                    Please avoid using any of the
                    following at any point during the session:
                  </AlertDialogDescription>
                  <ul className="list-disc space-y-1 pl-6 text-sm font-medium text-foreground">
                    <li>VR / Touch controllers</li>
                    <li>VR joysticks or thumbsticks</li>
                    <li>Gamepads and game controllers</li>
                    <li>Hand-tracking gestures (controlling with your hands)</li>
                    <li>The in-headset laser / ray pointer</li>
                    <li>Trackpads, trackballs, styluses, or touchscreens</li>
                  </ul>
                  <AlertDialogDescription className="text-center font-bold text-yellow-500">
                    These devices prevent your activity from being tracked correctly by the
                    Personal Analytics application.
                  </AlertDialogDescription>
                </div>
              </>
            )}
            {state.type === "SUPPORTING_APPS" && (
              <>
                <AlertDialogTitle>Check If Supporting Apps Are Running</AlertDialogTitle>
                <div className="flex flex-col gap-6">

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-center">
                      <img
                        className="rounded-md shadow max-w-full"
                        src="/cmd.png"
                        alt="Command Prompt Window"
                      />
                    </div>
                    <AlertDialogDescription className="text-sm text-center text-yellow-500 font-semibold">
                      This is what the window looks like when the local server is running.
                      <span className="text-red-500"> Please do not close this window during your session.</span>
                    </AlertDialogDescription>
                    <div className="flex items-center gap-4">
                      <AlertDialogDescription className="text-sm">
                        If you see the Windows notification displayed shown on the right, or an app 
                        is blocked by Windows, turn OFF Smart App Control: 
                        search for and open "Windows Security" → App &amp; browser control
                        → Smart App Control settings → Turn Off.
                      </AlertDialogDescription>
                      <img
                        className="w-6/12 shrink-0 rounded-md border border-border shadow"
                        src="/sac-blocked-notification.png"
                        alt="Windows Security notification saying part of this app has been blocked"
                      />
                    </div>
                  </div>

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
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className={cn("w-3 h-3 rounded-full", localServerIsUpdated ? "bg-green-600" : "bg-red-600")}></span>
                        <AlertDialogDescription>
                          The Local Server appears to be {localServerIsUpdated ? "up to date" : "out of date"}
                        </AlertDialogDescription>
                      </div>
                      {!localServerIsUpdated && (
                        <AlertDialogDescription className="pl-6 text-xs text-red-500">
                          The local server has automatically shut itself down because it is out of date.
                          Please relaunch it so it can update itself to the latest version.
                        </AlertDialogDescription>
                      )}
                    </div>
                  )}
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
            {/* {state.type === "VR_MODE_PASSTHROUGH" && (
              <>
                <AlertDialogTitle>Setting VR mode to Passthrough</AlertDialogTitle>
                <AlertDialogDescription>
                  On the Meta Workrooms app on the headset, <span className="text-yellow-500 font-bold">make sure that the
                    VR mode is set to passthrough</span> and that you can see your
                  surroundings. If you see a virtual environment, please set to
                  passthrough before continuing.
                </AlertDialogDescription>
              </>
            )} */}
            {state.type === "AUDIO_CUE" && (
              <>
                <AlertDialogTitle>Final Audio Check: Please enter the audio cue</AlertDialogTitle>
                <AlertDialogDescription>
                  Please double check that your volume is set to a comfortable level.
                </AlertDialogDescription>
              </>
            )}
            {/* {state.type === "GOAL_SETTING" && (
              <>
                <AlertDialogTitle>Set Focus Goal</AlertDialogTitle>
                <AlertDialogDescription>
                  What percentage of the session do you aim to be focused for?
                  <span className="text-yellow-500 font-bold">Please provide an honest answer.</span>
                </AlertDialogDescription>
              </>
            )} */}
            {state.type === 'ENVIRONMENT_CHECK' && (
              <>
                <AlertDialogTitle>Environment Check</AlertDialogTitle>
                <AlertDialogDescription className="flex flex-col gap-4">
                  <p className="text-yellow-400">Your group is {studentGroupEnvironment}</p>
                  {studentGroupEnvironment === 'Passthrough' && (
                    <p>This means that you <b className="text-yellow-400">MUST</b> see your surroundings, the "real world"</p>
                  )}
                  {['VR Feedback', 'VR Only'].includes(studentGroupEnvironment) && (
                    <p>This means that you <b className="text-yellow-400">MUST</b> see a virtual environment, a natural landscape, instead of the "real world" surroundings.</p>
                  )}
                  <p>Please select the environment from the pictures below that mostly looks like what you see</p>
                  {!['VR Feedback', 'VR Only', 'Passthrough'].includes(studentGroupEnvironment) && (
                    <p>
                      There seems to be an issue with your group.
                      Please contact mcost16@lsu.edu and send a screenshot of the current
                      page and be sure to include your group in the picture
                    </p>
                  )}
                  {/* <p>You can try to fix this issue by selecting the screenshot below that resembles what you are seeing the most:</p> */}
                  <div className="grid gap-4">
                    <p>VR Environment:</p>
                    <div className="relative"
                      onClick={() => {
                        setCurrentEnvironment('vr');
                        dispatch({ type: 'SET_CURRENT_ENVIRONMENT', correctEnvironment: studentGroupEnvironment, currentEnvironment: 'VR' })
                      }}>
                      <div className={cn(
                        'flex justify-center items-center',
                        'transition-all duration-250 absolute top-0 right-0 left-0 bottom-0',
                        currentEnvironment === 'vr' ? 'bg-yellow-400 opacity-50' : 'opacity-0'
                      )}>
                        <CheckIcon size={100} />
                      </div>
                      <img
                        height={300}
                        src="/vr.png"
                        alt=""
                      />
                    </div>
                    <p>Passthrough Environment:</p>
                    <div className="relative"
                      onClick={() => {
                        setCurrentEnvironment('p');
                        dispatch({ type: 'SET_CURRENT_ENVIRONMENT', correctEnvironment: studentGroupEnvironment, currentEnvironment: 'Passthrough' })
                      }}>
                      <div className={cn(
                        'flex justify-center items-center',
                        'transition-all duration-250 absolute top-0 right-0 left-0 bottom-0',
                        currentEnvironment === 'p' ? 'bg-yellow-400 opacity-50' : 'opacity-0'
                      )}>
                        <CheckIcon size={100} />
                      </div>
                      <img
                        height={300}
                        src="/p.png"
                        alt=""
                      />
                    </div>
                  </div>
                </AlertDialogDescription>
              </>
            )}
            {state.type === 'ENVIRONMENT_FIX' && (
              <>
                <AlertDialogTitle>Fix Your Environment</AlertDialogTitle>
                <AlertDialogDescription className="grid gap-4 justify-center items-center">
                  <p>It seems your environment is wrong.</p>
                  <p>Please watch this video to see how to fix it, and remember that your group is <b className="text-yellow-400">{studentGroupEnvironment}</b></p>
                  <iframe width="100%" height="315"
                    src="https://www.youtube.com/embed/I1Sa5IXO6pE?t=10">
                  </iframe>
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
            {state.type === "SYNCING" && (
              <>
                <AlertDialogTitle>
                  {syncPhase === "error" ? "Something went wrong" : "Recovering feedback from past sessions"}
                </AlertDialogTitle>
                <div className="flex flex-col items-center gap-4 py-4">
                  {syncPhase !== "error" && (
                    <div className="w-8 h-8 border-2 border-t-2 border-white border-t-blue-400 rounded-full animate-spin"></div>
                  )}
                  {syncPhase === "checking" && (
                    <AlertDialogDescription className="text-center">
                      Checking whether any feedback from your past sessions failed to upload to the cloud. This will only take a moment.
                    </AlertDialogDescription>
                  )}
                  {syncPhase === "syncing" && (
                    <AlertDialogDescription className="text-center">
                      Some feedback from your past sessions never reached the cloud. Restoring {syncCount} item{syncCount === 1 ? "" : "s"} now. Estimated time{" "}
                      <strong>
                        {syncCount * ESTIMATED_SECONDS_PER_FEEDBACK < 60
                          ? "less than a minute"
                          : `~${Math.ceil((syncCount * ESTIMATED_SECONDS_PER_FEEDBACK) / 60)} min`}*
                      </strong>.
                      <span className="text-yellow-500 font-bold"> Please do not close this window.</span>
                      <br />
                      Questions or concerns? Contact <strong className="text-yellow-500">Matheus Costa (mcost16@lsu.edu)</strong>.
                    </AlertDialogDescription>
                  )}
                  {syncPhase === "error" && (
                    <AlertDialogDescription className="text-center">
                      We couldn't finish restoring feedback that failed to upload during a past session. You can retry, or continue (risk) and let a study coordinator resolve it later.
                      <br />
                      Please contact <strong className="text-yellow-500">Matheus Costa (mcost16@lsu.edu)</strong>.
                    </AlertDialogDescription>
                  )}
                </div>
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

          {/* {state.type === "GOAL_SETTING" && (
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
          )} */}

          <AlertDialogFooter>
            {!['CONFIRMATION', 'DONE', 'SYNCING'].includes(state.type) && (
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

            {state.type === "INPUT_DEVICES" && (
              <Button
                variant={"outline"}
                onClick={() => dispatch({ type: "NEXT" })}
              >
                I Understand
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
                  {(localServerIsWorking && localServerIsUpdated && personalAnalyticsIsWorking && (!session?.has_feedback || feedbackSystemIsWorking)) ? (
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  )}
                  <Button
                    disabled={isPinging}
                    onClick={() => {
                      pingLocalServer();
                      checkLocalServerUpdated();
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
                    !localServerIsUpdated ||
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

            {/* {state.type === "VR_MODE_PASSTHROUGH" && (
              <Button
                variant={"outline"}
                onClick={() => dispatch({ type: "NEXT" })}
              >
                Continue
              </Button>
            )} */}

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

            {/* {state.type === "GOAL_SETTING" && (
              <Button
                variant="outline"
                onClick={() => {
                  setSavedGoalPercentage(state.goalPercentage);
                  dispatch({ type: "NEXT" });
                }}
              >
                Continue
              </Button>
            )} */}

            {state.type === 'ENVIRONMENT_CHECK' && (
              <>
                <span
                  data-tooltip-id="env-check-continue-tooltip"
                  data-tooltip-content="Please select an environment option before proceeding"
                >
                  <Button
                    onClick={() => { dispatch({ type: 'NEXT' }); }}
                    disabled={currentEnvironment === ''}
                  >
                    Continue
                  </Button>
                </span>
                {currentEnvironment === '' && (
                  <Tooltip id="env-check-continue-tooltip" />
                )}
              </>
            )}

            {state.type === 'ENVIRONMENT_FIX' && (
              <Button
                onClick={() => {
                  dispatch({ type: 'FIX_ENVIRONMENT' });
                  setCurrentEnvironment('');
                }}
              >
                I have fixed it!
              </Button>
            )}

            {state.type === "CONFIRMATION" && (
              <AlertDialogAction
                onClick={() => {
                  dispatch({ type: "FINISH" });
                  setDialogIsOpen(false);
                  completedCallback(/* savedGoalPercentage */ undefined);
                }}
              >
                Close
              </AlertDialogAction>
            )}

            {state.type === "SYNCING" && syncPhase === "error" && (
              <>
                <Button variant="link" onClick={() => dispatch({ type: "NEXT" })}>
                  Continue anyway
                </Button>
                <Button variant="outline" onClick={() => setSyncRetry((n) => n + 1)}>
                  Retry
                </Button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppFixDialog
        isOpen={showLocalServerFix}
        onClose={() => setShowLocalServerFix(false)}
        appName="the Local Server"
        shutdownSteps={
          <>
            <DialogDescription>
              The Local Server is the black command prompt window shown on the
              checks screen. Close it as usual.
            </DialogDescription>
            <img
              className="w-full rounded-md border border-border shadow"
              src="/cmd.png"
              alt="The Local Server command prompt window"
            />
          </>
        }
      />

      <AppFixDialog
        isOpen={showPersonalAnalyticsFix}
        onClose={() => setShowPersonalAnalyticsFix(false)}
        appName="the Personal Analytics app"
        shutdownSteps={
          <>
            <DialogDescription>
              Personal Analytics has no window to close, so it has to be closed
              from Task Manager. Open Task Manager by pressing{" "}
              <strong className="text-yellow-500">Ctrl + Shift + Esc</strong>,
              or by searching{" "}
              <strong className="text-yellow-500">task</strong> in the Windows
              search bar.
            </DialogDescription>
            <img
              className="w-full rounded-md border border-border shadow"
              src="/pa-1-open-task-manager.png"
              alt="Windows search results for task, with Open highlighted"
            />
            <DialogDescription>
              In the search box at the top of Task Manager, type{" "}
              <strong className="text-yellow-500">personal</strong> to find the
              app.
            </DialogDescription>
            <img
              className="w-full rounded-md border border-border shadow"
              src="/pa-2-find-process.png"
              alt="Task Manager filtered to the PersonalAnalytics process"
            />
            <DialogDescription>
              Right-click{" "}
              <strong className="text-yellow-500">PersonalAnalytics</strong> and
              choose <strong className="text-yellow-500">End task</strong>.
            </DialogDescription>
            <img
              className="w-full rounded-md border border-border shadow"
              src="/pa-3-end-task.png"
              alt="Task Manager right-click menu with End task highlighted"
            />
          </>
        }
      />

      <AppFixDialog
        isOpen={showFeedbackSystemFix}
        onClose={() => setShowFeedbackSystemFix(false)}
        appName="the Stoplight Feedback System"
        shutdownSteps={
          <>
            <DialogDescription>
              The Stoplight app is closed from the system tray, at the
              bottom-right of the screen next to the clock. You may need to
              click the{" "}
              <strong className="text-yellow-500">^</strong> arrow to see hidden
              icons. Right-click the stoplight icon, then choose{" "}
              <strong className="text-yellow-500">Exit</strong>.
            </DialogDescription>
            <img
              className="w-full rounded-md border border-border shadow"
              src="/stoplight-exit-tray.png"
              alt="System tray menu for the stoplight app with Exit highlighted"
            />
          </>
        }
      />
    </>
  );
}
