import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { AlertDialogAction, AlertDialogDescription } from "@radix-ui/react-alert-dialog";
import { CirclePlay } from "lucide-react";
import axios, { AxiosError } from "axios";
import { useAuth } from "@/hooks/auth";
import { cn } from "@/lib/utils";

export type PreSessionChecksSteps =
  | { type: 'WELCOME' }
  | { type: 'LOCAL_SERVER' }
  | { type: 'VR_MODE_PASSTHROUGH' }
  | { type: 'AUDIO_CUE'; answer: string; chosenCue: string; error?: string }
  | { type: 'CONFIRMATION' }
  | { type: 'DONE' };

export type Action =
  | { type: 'NEXT' }
  | { type: 'SET_AUDIO_CUE'; answer: string; chosenCue: string }
  | { type: 'VALIDATE_CUE' }
  | { type: 'FINISH' };

export function checksReducer(state: PreSessionChecksSteps, action: Action): PreSessionChecksSteps {
  switch (state.type) {
    case 'WELCOME':
      if (action.type === 'NEXT') return { type: 'LOCAL_SERVER' };
      break;
    case 'LOCAL_SERVER':
      if (action.type === 'NEXT') return { type: 'VR_MODE_PASSTHROUGH' };
      break;
    case 'VR_MODE_PASSTHROUGH':
      if (action.type === 'NEXT') return { type: 'AUDIO_CUE', answer: '', chosenCue: '' };
      break;
    case 'AUDIO_CUE':
      if (action.type === 'SET_AUDIO_CUE') return { ...state, answer: action.answer, chosenCue: action.chosenCue };
      if (action.type === 'VALIDATE_CUE') {
        return state.answer === state.chosenCue
          ? { type: 'CONFIRMATION' }
          : { ...state, error: 'Invalid answer' };
      }
      break;
    case 'CONFIRMATION':
      if (action.type === 'FINISH') return { type: 'DONE' };
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
      <Button className="flex gap-2" variant={"link"} onClick={playSound}>
        <CirclePlay />
        Play Sound
      </Button>
      <audio ref={audioRef} src={`./${cue}.mp3`} preload="auto" />
    </div>
  );
};


export type PreSessionChecksProps = {
  completedCallback: () => void;
}

export function PreSessionChecks({ completedCallback }: PreSessionChecksProps) {
  const [state, dispatch] = useReducer(checksReducer, { type: 'WELCOME' });
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const audioCueAnswerRef = useRef(null);
  const availableCues = ['dog', 'ice cream', 'laboratory'];
  const [chosenCue, _] = useState(() => availableCues[Math.floor(Math.random() * availableCues.length)]);
  const [localServerIsWorking, setLocalServerIsWorking] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const { initializeLocalServer } = useAuth();

  const pingLocalServer = useCallback(async () => {
    setIsPinging(true)
    try {
      const response = await axios.get('http://localhost:8001/session');
      if (response.data) {
        setLocalServerIsWorking(true);
      }
    } catch (e: any) {
      if (e instanceof AxiosError) {
        if (e.response?.status === 412) {
          initializeLocalServer();
          setLocalServerIsWorking(true);
        } else if (e.code === 'ERR_NETWORK') {
          setLocalServerIsWorking(false);
        }
      }
      if (e.code === 'ECONNREFUSED') {
        setLocalServerIsWorking(false);
      }
      console.log(e)
    }
    setIsPinging(false);
  }, [setLocalServerIsWorking]);

  useEffect(() => {
    pingLocalServer()
  }, []);

  return (
    <>
      <Button className="bg-neutral-200 text-neutral-800" onClick={() => setDialogIsOpen(true)}>Begin</Button>
      <AlertDialog open={dialogIsOpen} onOpenChange={v => {
        setDialogIsOpen(v);
        if (!v) {
          dispatch({ type: 'FINISH' })
          completedCallback();
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {state.type === 'WELCOME' && (
              <>
                <AlertDialogTitle>Welcome</AlertDialogTitle>
                <AlertDialogDescription>You will perform a series of checks to make sure everything is ready and set up for a smooth session.</AlertDialogDescription>
              </>
            )}
            {state.type === 'LOCAL_SERVER' && (
              <>
                <AlertDialogTitle>Supporting apps</AlertDialogTitle>
                <AlertDialogDescription className="flex flex-col gap-8">
                  <div className="flex gap-4">
                    <p>
                      The moment you double clicked on the "Open this first" shortcut on the desktop,
                      you were supposed to see a command prompt, which looks like this.
                    </p>
                    <img width={"50%"} src="./cmd.jpg" alt="Command prompt image" />
                  </div>
                  <p>
                    It is an intermediary app that launches and runs on the background to take care of any and all communications between the laptop, the browser, and our servers
                  </p>
                  {localServerIsWorking && (<p className="flex items-center gap-1"><p className="w-1 h-1 rounded-full bg-green-600"></p><p>The local server appears to be online</p></p>)}
                  {!localServerIsWorking && (
                    <>
                      <p className="flex items-center gap-1">
                        <p className="w-1 h-1 rounded-full bg-red-600"></p>
                        <p>The local server appears to be offline</p>
                      </p>
                      <p>If you cannot resolve this, please contact Matheus by email mcost16@lsu.edu</p>
                    </>
                  )}
                </AlertDialogDescription>
              </>
            )}
            {state.type === 'VR_MODE_PASSTHROUGH' && (
              <>
                <AlertDialogTitle>Setting VR mode</AlertDialogTitle>
                <AlertDialogDescription>
                  On the Meta Workrooms app on the headset, make sure that the VR mode is set to passthrough
                  and that you can see your surroundings. If you see a virtual environment, please set to
                  passthrough before continuing.
                </AlertDialogDescription>
              </>
            )}
            {state.type === 'AUDIO_CUE' && (
              <>
                <AlertDialogTitle>Please enter the audio cue</AlertDialogTitle>
                <AlertDialogDescription>Try to increase the volume to a comfortable level</AlertDialogDescription>
              </>
            )}
            {state.type === 'CONFIRMATION' && (
              <>
                <AlertDialogTitle>Success!</AlertDialogTitle>
                <AlertDialogDescription>You have finished all pre-session checks</AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>

          {state.type === 'AUDIO_CUE' && (
            <>
              <Input
                ref={audioCueAnswerRef}
                value={state.answer}
                onChange={(e) => dispatch({ type: 'SET_AUDIO_CUE', answer: e.target.value, chosenCue })}
              />
              {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
              <AudioCuePlayButton cue={chosenCue} />
            </>
          )}

          <AlertDialogFooter>
            {['WELCOME', 'VR_MODE_PASSTHROUGH'].includes(state.type) && (
              <Button variant={'outline'} onClick={() => dispatch({ type: 'NEXT' })}>Continue</Button>
            )}
            {state.type === 'AUDIO_CUE' && (
              <Button variant={"outline"} onClick={() => dispatch({ type: 'VALIDATE_CUE' })}>
                Continue
              </Button>
            )}
            {
              state.type === 'CONFIRMATION' && (
                <AlertDialogAction>
                  <Button variant={"outline"} onClick={() => {
                    dispatch({ type: 'FINISH' })
                    completedCallback();
                  }}>Close</Button>
                </AlertDialogAction>
              )
            }
          </AlertDialogFooter >
        </AlertDialogContent >
      </AlertDialog >
    </>
  );
}