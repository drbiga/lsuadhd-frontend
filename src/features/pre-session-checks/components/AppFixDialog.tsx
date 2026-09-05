import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const FaqSection = ({
  question,
  children,
  defaultOpen = false,
}: {
  question: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  return (
    <details
      open={defaultOpen}
      className="rounded-md border border-border bg-muted/30 px-4 py-3"
    >
      <summary className="cursor-pointer font-semibold text-foreground">
        {question}
      </summary>
      <div className="flex flex-col gap-3 pt-3">{children}</div>
    </details>
  );
};

const StepImage = ({ src, alt }: { src: string; alt: string }) => (
  <img className="w-full rounded-md border border-border shadow" src={src} alt={alt} />
);

export type AppFixDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  shutdownSteps: React.ReactNode;
};

export function AppFixDialog({
  isOpen,
  onClose,
  appName,
  shutdownSteps,
}: AppFixDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fix {appName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <FaqSection question={`Can't open ${appName} at all?`}>
            <DialogDescription>
              Windows sometimes blocks our study apps from starting. This
              happens because our apps are built by the research team rather
              than by a large company, so Windows does not recognize the
              publisher. The apps are safe to run. There are two types of "blocks,"
              and they look different. Check which one you are getting.
            </DialogDescription>

            <p className="font-semibold text-foreground">
              Block 1: "Windows protected your PC" window
            </p>
            <DialogDescription>
              This one you can get past yourself. Click{" "}
              <strong className="text-yellow-500">More info</strong>, then click{" "}
              <strong className="text-yellow-500">Run anyway</strong>.
            </DialogDescription>
            <StepImage
              src="/smartscreen-1-more-info.png"
              alt="Windows protected your PC window, with More info highlighted"
            />
            <StepImage
              src="/smartscreen-2-run-anyway.png"
              alt="Windows protected your PC window expanded, with Run anyway highlighted"
            />

            <p className="font-semibold text-foreground">
              Block 2: a "Smart App Control" message with no "Run anyway" option
            </p>
            <DialogDescription>
              Smart App Control is a newer Windows security setting. Unlike the
              blue window above,{" "}
              <span className="font-semibold text-red-500">
                it gives you no way to continue
              </span>{" "} so it must be turned off. You may also see a notification
              saying "Part of this app has been blocked", which means the same
              thing.
            </DialogDescription>
            <StepImage
              src="/sac-blocked-app.png"
              alt="Smart App Control dialog saying it blocked an app that may be unsafe, offering only an Okay button"
            />
            <StepImage
              src="/sac-blocked-notification.png"
              alt="Windows Security notification saying part of this app has been blocked"
            />
            <DialogDescription>
              To turn it off: search{" "}
              <strong className="text-yellow-500">security</strong> in the
              Windows search bar and open{" "}
              <strong className="text-yellow-500">Windows Security</strong>.
            </DialogDescription>
            <StepImage
              src="/sac-1-open-security.png"
              alt="Windows search results for security, with Open highlighted"
            />
            <DialogDescription>
              Go to{" "}
              <strong className="text-yellow-500">App &amp; browser control</strong>
              , then click{" "}
              <strong className="text-yellow-500">
                Smart App Control settings
              </strong>
              .
            </DialogDescription>
            <StepImage
              src="/sac-2-app-browser-control.png"
              alt="Windows Security App and browser control page, with Smart App Control settings highlighted"
            />
            <DialogDescription>
              Set Smart App Control to{" "}
              <strong className="text-yellow-500">Off</strong>. You should now be able to open the app.
            </DialogDescription>
            <StepImage
              src="/sac-3-turn-off.png"
              alt="Smart App Control settings page, with the Off option highlighted"
            />
          </FaqSection>

          <FaqSection
            question={`${appName} is open, but this page says it isn't working?`}
          >
            <DialogDescription>
              Close the app completely, then start it again.
            </DialogDescription>
            {shutdownSteps}
            <DialogDescription>
              Wait a few seconds, re-open the app, and then click{" "}
              <strong className="text-yellow-500">Click to Verify Again</strong>{" "}
              on the checks screen.
            </DialogDescription>
          </FaqSection>

          <DialogDescription>
            Still not working? Contact Matheus at{" "}
            <strong className="text-yellow-500">mcost16@lsu.edu</strong>. It
            helps to mention which of the steps above you already tried.
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
}
