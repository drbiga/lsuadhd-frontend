import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  AlertDialogAction,
  AlertDialogDescription,
} from "@radix-ui/react-alert-dialog";
import { CirclePlay } from "lucide-react";
import axios, { AxiosError } from "axios";
import { useAuth } from "@/hooks/auth";
import { cn } from "@/lib/utils";
// import { set } from "react-hook-form";

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
      <audio ref={audioRef} src={`./${cue}.mp3`} preload="auto" />
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
  const [isPingingLocal, setIsPingingLocal] = useState(false);
  const [isPingingPersonal, setIsPingingPersonal] = useState(false);

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

  const isPinging = isPingingLocal || isPingingPersonal;
  
  useEffect(() => {
    pingLocalServer();
    pingPersonalAnalytics();
  }, [pingLocalServer, pingPersonalAnalytics]);

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
        <AlertDialogContent>
          <AlertDialogHeader>
            {state.type === "WELCOME" && (
              <>
                <AlertDialogTitle>Welcome</AlertDialogTitle>
                <AlertDialogDescription>
                  You will perform a series of checks to make sure everything is
                  ready and set up for a smooth session.
                </AlertDialogDescription>
              </>
            )}
            {state.type === "LOCAL_SERVER" && (
              <>
                <AlertDialogTitle>Supporting apps</AlertDialogTitle>
                <AlertDialogDescription className="flex flex-col gap-8">
                  <div className="flex gap-4">
                    <p>
                      The moment you double clicked on the "Open this first"
                      shortcut on the desktop, you were supposed to see a
                      command prompt, which looks like this.
                    </p>
                    <img
                      width={"50%"}
                      src="./cmd.jpg"
                      alt="Command prompt image"
                    />
                  </div>
                  <p>
                    It is an intermediary app that launches and runs on the
                    background to take care of any and all communications
                    between the laptop, the browser, and our servers. Alongside
                    it, the Personal Analytics app should also be running in
                    the background.
                  </p>
                  {localServerIsWorking && (
                    <p className="flex items-center gap-1">
                      <p className="w-1 h-1 rounded-full bg-green-600"></p>
                      <p>The local server appears to be online</p>
                    </p>
                  )}
                  {!localServerIsWorking && (
                    <>
                      <p className="flex items-center gap-1">
                        <p className="w-1 h-1 rounded-full bg-red-600"></p>
                        <p>The local server appears to be offline</p>
                      </p>
                    </>
                  )}
                  {personalAnalyticsIsWorking && (
                    <p className="flex items-center gap-1">
                      <p className="w-1 h-1 rounded-full bg-green-600"></p>
                      <p>
                        The Personal Analytics app appears to be online
                      </p>
                    </p>
                  )}
                  {!personalAnalyticsIsWorking && (
                    <p className="flex items-center gap-1">
                      <p className="w-1 h-1 rounded-full bg-red-600"></p>
                      <p>
                        The Personal Analytics app appears to be offline.
                      </p>
                    </p>
                  )}
                  {(!localServerIsWorking || !personalAnalyticsIsWorking) && (
                    <p className="text-red-500">
                      If the PersonalAnalytics app or the command prompt is currently running, 
                      please close them. Then, double-click the desktop shortcut to restart the application.
                      If the issue persists, contact Matheus at mcost16@lsu.edu for assistance.
                    </p>
                  )}
                </AlertDialogDescription>
              </>
            )}
            {state.type === "HEADPHONE_CHECK" && (
              <>
                <AlertDialogTitle>Headphone Setup & Volume</AlertDialogTitle>
                <AlertDialogDescription className="flex flex-col gap-4">
                  <p>
                    Plug the headphones into the headset using the headphone jack on the right strap of the headset.
                  </p>
                  <p>
                    Then, make sure you have the volume of the headset high enough. You can raise the volume using the volume buttons on the bottom right section of the headset.
                  </p>
                  <div className="flex justify-center">
                    <img
                      width={"60%"}
                      src="./headset-vol-buttons.jpg"
                      alt="volume buttons"
                    />
                  </div>
                </AlertDialogDescription>
              </>
            )}
            {state.type === "VR_MODE_PASSTHROUGH" && (
              <>
                <AlertDialogTitle>Setting VR mode</AlertDialogTitle>
                <AlertDialogDescription>
                  On the Meta Workrooms app on the headset, make sure that the
                  VR mode is set to passthrough and that you can see your
                  surroundings. If you see a virtual environment, please set to
                  passthrough before continuing.
                </AlertDialogDescription>
              </>
            )}
            {state.type === "AUDIO_CUE" && (
              <>
                <AlertDialogTitle>Please enter the audio cue</AlertDialogTitle>
                <AlertDialogDescription>
                  Try to increase the volume to a comfortable level
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
                <p className="text-red-500 text-sm">{state.error}</p>
              )}
            </>
          )}

          <AlertDialogFooter>
            {["WELCOME", "VR_MODE_PASSTHROUGH", "HEADPHONE_CHECK"].includes(state.type) && (
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
                  {localServerIsWorking && personalAnalyticsIsWorking ? (
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  )}
                  <Button 
                    disabled={isPinging}
                    onClick={() => {pingLocalServer(); pingPersonalAnalytics();}}
                  >
                    {isPinging ? "Checking..." : "Verify again"}
                  </Button>
                </div>
                <div
                  className={cn("flex items-center", isPinging ? "" : "hidden")}
                >
                  <div className="w-5 h-5 border-2 border-t-2 border-white border-t-blue-400 rounded-full animate-spin"></div>
                </div>
                <Button
                  variant={"outline"}
                  disabled={!localServerIsWorking || !personalAnalyticsIsWorking}
                  onClick={() => dispatch({ type: "NEXT" })}
                >
                  Continue
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
              <AlertDialogAction>
                <Button
                  variant={"outline"}
                  onClick={() => {
                    dispatch({ type: "FINISH" });
                    setDialogIsOpen(false);
                    completedCallback();
                  }}
                >
                  Close
                </Button>
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
