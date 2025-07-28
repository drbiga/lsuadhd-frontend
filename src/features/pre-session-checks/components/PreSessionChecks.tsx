import { useCallback, useEffect, useReducer, useRef, useState } from "react";
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

export type PreSessionChecksSteps =
  | { type: "WELCOME" }
  | { type: "LOCAL_SERVER" }
  | { type: "HEADPHONE_CHECK" }
  | { type: "VR_MODE_PASSTHROUGH" }
  | { type: "AUDIO_CUE"; answer: string; cue: string; error?: string }
  | { type: "CONFIRMATION" }
  | { type: "DONE" };

export type Action =
  | { type: "NEXT" }
  | { type: "SET_AUDIO_CUE"; answer: string }
  | { type: "VALIDATE_CUE" }
  | { type: "FINISH" }
  | { type: "CHANGE_CUE" };

export function checksReducer(
  state: PreSessionChecksSteps,
  action: Action
): PreSessionChecksSteps {
  const availableCues = ["dog", "ice cream", "laboratory"];

  function getNextCue(currentCue: string) {
    const currentIndex = availableCues.indexOf(currentCue);
    const nextIndex = (currentIndex + 1) % availableCues.length;
    return availableCues[nextIndex];
  }

  switch (state.type) {
    case "WELCOME":
      if (action.type === "NEXT") return { type: "LOCAL_SERVER" };
      break;
    case "LOCAL_SERVER":
      if (action.type === "NEXT") return { type: "HEADPHONE_CHECK" };
      break;
    case "HEADPHONE_CHECK":
      if (action.type === "NEXT") return { type: "VR_MODE_PASSTHROUGH" };
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
          ? { type: "CONFIRMATION" }
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
      <audio ref={audioRef} src={`/lsuadhd-frontend/${cue}.mp3`} preload="auto" />
    </div>
  );
};

export type PreSessionChecksProps = {
  completedCallback: () => void;
};

export function PreSessionChecks({ completedCallback }: PreSessionChecksProps) {
  const [state, dispatch] = useReducer(checksReducer, { type: "WELCOME" });
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const audioCueAnswerRef = useRef(null);
  const [localServerIsWorking, setLocalServerIsWorking] = useState(false);
  const [personalAnalyticsIsWorking, setPersonalAnalyticsIsWorking] = useState(false);
  const [feedbackSystemIsWorking, setFeedbackSystemIsWorking] = useState(false);
  const [isPingingLocal, setIsPingingLocal] = useState(false);
  const [isPingingPersonal, setIsPingingPersonal] = useState(false);
  const [isPingingFeedback, setIsPingingFeedback] = useState(false);
  const [beepChecked, setBeepChecked] = useState(false);

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

  const isPinging = isPingingLocal || isPingingPersonal || isPingingFeedback;
    
  useEffect(() => {
    pingLocalServer();
    pingPersonalAnalytics();
    pingFeedbackSystem();
  }, [pingLocalServer, pingPersonalAnalytics, pingFeedbackSystem]);


  const handleCheckBeep = () => {
    try {
      axios.get('http://localhost:8080/play-beep')
    } catch (error) {
    } finally {
      setBeepChecked(true);
    }
  };

  return (
    <>
      <Button
        className="bg-neutral-200 text-neutral-800"
        onClick={() => setDialogIsOpen(true)}
      >
        Begin
      </Button>
      <AlertDialog
        open={dialogIsOpen}
        onOpenChange={(v) => {
          setDialogIsOpen(v);
          if (v) {
            setDialogIsOpen(v);
          }
        }}
      >
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            {state.type === "WELCOME" && (
              <>
                <AlertDialogTitle>Welcome</AlertDialogTitle>
                <AlertDialogDescription>
                    To ensure a smooth session, you will perform a series of setup checks. 
                    <span className="text-yellow-500 font-bold"> Please read all instructions carefully.</span>
                </AlertDialogDescription>
              </>
            )}
            {state.type === "LOCAL_SERVER" && (
              <>
                <AlertDialogTitle>Supporting apps</AlertDialogTitle>
                <div className="flex flex-col gap-8">
                    <div className="flex gap-4">
                        <AlertDialogDescription>
                        The moment you double clicked on the "Open this first"
                        shortcut on the desktop, you were supposed to see a
                        command prompt, which looks like this:
                        </AlertDialogDescription>
                        <img
                        width={"50%"}
                        src="/lsuadhd-frontend/cmd.jpg"
                        alt="Command prompt image"
                        />
                    </div>
                    <AlertDialogDescription>
                        It is an intermediary app that launches and runs in the
                        background to take care of all communications between 
                        the laptop, the browser, and our servers. Alongside
                        it, the Personal Analytics app should be running in
                        the background as well.
                    </AlertDialogDescription>
                    <AlertDialogDescription>
                        <span className="text-yellow-500 font-bold">Please ensure both the server and app are running. </span> 
                        Refer to the indicators below for guidance.
                    </AlertDialogDescription>
                    {localServerIsWorking && (
                    <AlertDialogDescription className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-green-600"></span>
                        The Local Server appears to be online
                    </AlertDialogDescription>
                    )}
                    {!localServerIsWorking && (
                    <AlertDialogDescription className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-600"></span>
                        The Local Server appears to be offline
                    </AlertDialogDescription>
                    )}
                    {personalAnalyticsIsWorking && (
                    <AlertDialogDescription className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-green-600"></span>
                        The Personal Analytics app appears to be online
                    </AlertDialogDescription>
                    )}
                    {!personalAnalyticsIsWorking && (
                    <AlertDialogDescription className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-600"></span>
                        The Personal Analytics app appears to be offline.
                    </AlertDialogDescription>
                    )}
                    {feedbackSystemIsWorking && (
                    <AlertDialogDescription className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-green-600"></span>
                        The Feedback System appears to be online
                    </AlertDialogDescription>
                    )}
                    {!feedbackSystemIsWorking && (
                    <AlertDialogDescription className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-600"></span>
                        The Feedback System appears to be offline
                    </AlertDialogDescription>
                    )}
                    {(!localServerIsWorking || !personalAnalyticsIsWorking || !feedbackSystemIsWorking) && (
                    <AlertDialogDescription className="text-red-500">
                        If the PersonalAnalytics app, the command prompt, or the Feedback System is currently running, 
                        please close them. Then, double-click the desktop shortcut to restart the application.
                        If the issue persists, contact Matheus at <strong>mcost16@lsu.edu</strong> for assistance.
                    </AlertDialogDescription>
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
                      src="/lsuadhd-frontend/headset-vol-buttons.jpg"
                      alt="volume buttons"
                    />
                  </div>
                  <AlertDialogDescription>
                    Please check the 'beep' noise to ensure it is set at a comfortable level. 
                    <span className="text-yellow-500 font-bold"> This sound serves as
                    feedback when distraction is detected during the session.</span>
                  </AlertDialogDescription>
                </div>
              </>
            )}
            {state.type === "VR_MODE_PASSTHROUGH" && (
              <>
                <AlertDialogTitle>Setting VR mode</AlertDialogTitle>
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

          <AlertDialogFooter>
            {["WELCOME", "VR_MODE_PASSTHROUGH"].includes(state.type) && (
              <Button
                variant={"outline"}
                onClick={() => dispatch({ type: "NEXT" })}
              >
                Continue
              </Button>
            )}

            {state.type === "LOCAL_SERVER" && (
              <>
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isPinging ? "hidden" : ""
                  )}
                >
                  {localServerIsWorking && personalAnalyticsIsWorking && feedbackSystemIsWorking ? (
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  )}
                  <Button 
                    disabled={isPinging}
                    onClick={() => {pingLocalServer(); pingPersonalAnalytics(); pingFeedbackSystem();}}
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
                  disabled={!localServerIsWorking || !personalAnalyticsIsWorking || !feedbackSystemIsWorking}
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
                  disabled={!beepChecked}
                >
                  Continue
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCheckBeep}
                >
                  Check Beep
                </Button>
              </>
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

            {state.type === "CONFIRMATION" && (
              <AlertDialogAction
                onClick={() => {
                  dispatch({ type: "FINISH" });
                  setDialogIsOpen(false);
                  completedCallback();
                }}
              >
                Close
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
