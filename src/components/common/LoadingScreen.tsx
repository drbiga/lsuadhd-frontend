interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-xl">{message}</div>
    </div>
  );
}
