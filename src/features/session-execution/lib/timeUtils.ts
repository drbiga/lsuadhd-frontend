export function presentRemainingTime(
    remainingTimeSeconds: number | null | undefined
): string {
    if (remainingTimeSeconds != null) {
        return `${presentRemainingTimeMinutes(
            remainingTimeSeconds
        )}:${presentRemainingTimeSeconds(remainingTimeSeconds)}`;
    } else {
        return "";
    }
}

function presentRemainingTimeMinutes(timeSeconds: number): string {
    return String(Math.max(Math.floor(timeSeconds / 60), 0)).padStart(2, "0");
}

function presentRemainingTimeSeconds(timeSeconds: number): string {
    if (timeSeconds > -1) {
        return String(timeSeconds % 60).padStart(2, "0");
    } else {
        return "00";
    }
}
