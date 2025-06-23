import { PropsWithChildren, useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";

type WalkthroughProps = PropsWithChildren<{
  onClose?: () => void;
}>;

export function WalkthroughSection({ children }: PropsWithChildren) {
  return (
    <div className="border-2 border-white">
      {children}
    </div>
  );
}

export function Walkthrough({ children, onClose }: WalkthroughProps) {
  const [open, setOpen] = useState(true);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && onClose) {
      onClose();
    }
  };

  return (
    <div>
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>{children}</AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function WalkthroughInstructionsDescription({ children }: PropsWithChildren) {
  return (
    <AlertDialogDescription className="flex flex-col gap-2">
      {children}
    </AlertDialogDescription>
  );
}
export function WalkthroughInstructionsTitle({ children }: PropsWithChildren) {
  return (
    <AlertDialogTitle>
      {children}
    </AlertDialogTitle>
  );
}
