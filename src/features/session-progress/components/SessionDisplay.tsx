import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { Feedback, FeedbackType, Session, SessionAnalytics } from "@/features/session-execution/services/sessionExecutionService";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { presentPercentage } from "@/features/session-progress/lib/sessionProgressUtils";

interface SessionListProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SessionList({ title, children, className }: SessionListProps) {
  return (
    <div className="flex flex-col gap-8">
      <h2
        className={cn(
          "text-2xl text-slate-800 dark:text-slate-200 opacity-50",
          className
        )}
      >
        {title}
      </h2>
      <ul className="flex flex-col gap-8 px-2">{children}</ul>
    </div>
  );
}

interface SessionItemProps {
  session: Session;
  analytics?: SessionAnalytics;
  showChart?: boolean;
  onStartSession?: () => void;
  className?: string;
}

export function SessionItem({ session, analytics, showChart = false, onStartSession, className }: SessionItemProps) {
  return (
    <li
      className={cn("bg-card p-4 h-[80vh] w-[70vw] rounded-lg flex", className)}
    >
      <div className="w-[30%]">
        <p className="text-2xl text-slate-700 dark:text-slate-300">
          Session #{session.seqnum}
        </p>
        <p>
          <span className="text-slate-600 dark:text-slate-400 border-b-[1px]">
            Overview
          </span>
        </p>
        <div className="text-sm text-slate-700 dark:text-slate-300">
          Stage: {session.stage.charAt(0).toUpperCase() + session.stage.slice(1)}
        </div>
        <div className="text-sm text-slate-400 dark:text-slate-600">
          Number of feedbacks given: {session.feedbacks.length}
        </div>
        {analytics && (
          <>
            <div className="text-sm text-slate-800 dark:text-slate-200">
              Percentage of time focused: {presentPercentage(analytics.percentage_time_focused)}
            </div>
            <div className="text-sm text-slate-400 dark:text-slate-600">
              Percentage of time normal: {presentPercentage(analytics.percentage_time_normal)}
            </div>
            <div className="text-sm text-slate-400 dark:text-slate-600">
              Percentage of time distracted: {presentPercentage(analytics.percentage_time_distracted)}
            </div>
          </>
        )}
        {onStartSession && (
          <Button
            className="bg-slate-300 dark:bg-slate-700 hover:bg-slate-700 hover:text-slate-100 dark:hover:bg-slate-400 dark:hover:text-slate-900 transition-all duration-100"
            onClick={onStartSession}
          >
            Start Session
          </Button>
        )}
      </div>
      {showChart && <SessionChart feedbacks={session.feedbacks} />}
    </li>
  );
}

interface SessionChartProps {
  feedbacks: Feedback[];
}

export function SessionChart({ feedbacks }: SessionChartProps) {
  const data: ({ seqnum: number } & Feedback)[] = [];
  for (let i = 0; i < feedbacks.length; i++) {
    data.push({
      ...feedbacks[i],
      seqnum: (i + 1)* 0.5,
    });
  }

  return (
    <div className="w-[70%]">
      {feedbacks.length === 0 ? (
        <h2 className="text-xl relative top-[50%] text-slate-600 dark:text-slate-400">
          There were no feedbacks in this session. Is there something wrong?
        </h2>
      ) : (
        <ResponsiveContainer height="100%" width="100%">
          <LineChart height={500} width={600} data={data}>
            <XAxis dataKey="seqnum" />
            <YAxis
              type="category"
              domain={[
                FeedbackType.DISTRACTED,
                FeedbackType.NORMAL,
                FeedbackType.FOCUSED,
              ]}
              width={100}
            />
            <Line type="monotone" dataKey="output" />
            <Tooltip content={LineChartTooltip} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function LineChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    const v = payload[0].value?.toString();
    if (!v) {
      throw Error("Something is wrong with the library");
    }
    return (
      <div
        className="p-2 rounded-md bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 opacity-70"
      >
        <p>
          Minute {label}: {v?.charAt(0).toUpperCase() + v?.slice(1)}
        </p>
      </div>
    );
  }
}
