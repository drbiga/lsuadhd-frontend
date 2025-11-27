interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <div className="w-10 h-10 border-4 border-muted border-t-accent rounded-full animate-spin"></div>
      <div className="text-base text-muted-foreground">{message}</div>
    </div>
  );
}
