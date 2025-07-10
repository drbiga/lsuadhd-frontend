import {
  forwardRef,
  HtmlHTMLAttributes,
  LiHTMLAttributes,
  PropsWithChildren,
} from "react";
import { Button } from "../common/Button";
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
import { Feedback, FeedbackType } from "@/services/sessionExecution";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

export const SessionListTitle = forwardRef<
  HTMLHeadingElement,
  HtmlHTMLAttributes<HTMLHeadingElement>
>(function SessionListTitle({ children, className }) {
  return (
    <h2
      className={cn(
        "text-2xl text-slate-800 dark:text-slate-200 opacity-50",
        className
      )}
    >
      {children}
    </h2>
  );
});

export function SessionListView({ children }: PropsWithChildren) {
  return <ul className="flex flex-col gap-8 px-2">{children}</ul>;
}

export const SessionItemView = forwardRef<
  HTMLLIElement,
  LiHTMLAttributes<HTMLLIElement>
>(function SessionItemView({ children, className }) {
  return (
    <li
      className={cn("bg-card p-4 h-[80vh] w-[70vw] rounded-lg flex", className)}
    >
      {children}
    </li>
  );
});

export const SessionItemContent = forwardRef<
  HTMLDivElement,
  HtmlHTMLAttributes<HTMLDivElement>
>(({ children, className }) => {
  return <div className={cn("w-[30%]", className)}>{children}</div>;
});

export function SessionItemStage({ children }: PropsWithChildren) {
  return (
    <div className="text-sm text-slate-700 dark:text-slate-300">
      Stage: {children}
    </div>
  );
}

export function SessionItemSeqnum({ children }: PropsWithChildren) {
  return (
    <p className="text-2xl text-slate-700 dark:text-slate-300">
      {/* <SessionAttributeLabel>Session #</SessionAttributeLabel> */}
      Session #{children}
    </p>
  );
}

export function SessionItemComment({ children }: PropsWithChildren) {
  return (
    <p className="text-sm text-slate-700 dark:text-slate-300">{children}</p>
  );
}

export function SessionStartButton({
  children,
  onClick,
}: PropsWithChildren & { onClick(): void }) {
  return (
    <Button
      className={`
        bg-slate-300 dark:bg-slate-700
        hover:bg-slate-700 hover:text-slate-100 dark:hover:bg-slate-400 dark:hover:text-slate-900
        transition-all duration-100
      `}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export const SessionItemNumFeedbacks = forwardRef<
  HTMLDivElement,
  HtmlHTMLAttributes<HTMLDivElement>
>(({ className, children }) => {
  return (
    <div
      className={cn(className, "text-sm text-slate-400 dark:text-slate-600")}
    >
      Number of feedbacks given: {children}
    </div>
  );
});

export const SessionItemPctTimeFocused = forwardRef<
  HTMLDivElement,
  HtmlHTMLAttributes<HTMLDivElement>
>(({ className, children }) => {
  return (
    <div
      className={cn(className, "text-sm text-slate-800 dark:text-slate-200")}
    >
      Percentage of time focused: {children}
    </div>
  );
});

export const SessionItemPctTimeNormal = forwardRef<
  HTMLDivElement,
  HtmlHTMLAttributes<HTMLDivElement>
>(({ className, children }) => {
  return (
    <div
      className={cn(className, "text-sm text-slate-400 dark:text-slate-600")}
    >
      Percentage of time normal: {children}
    </div>
  );
});

export const SessionItemPctTimeDistracted = forwardRef<
  HTMLDivElement,
  HtmlHTMLAttributes<HTMLDivElement>
>(({ className, children }) => {
  return (
    <div
      className={cn(className, "text-sm text-slate-400 dark:text-slate-600")}
    >
      Percentage of time distracted: {children}
    </div>
  );
});

type SessionItemChartExtraProps = {
  feedbacks: Feedback[];
};

export const SessionItemChart = forwardRef<
  HTMLDivElement,
  HtmlHTMLAttributes<HTMLDivElement> & SessionItemChartExtraProps
>(({ feedbacks }) => {
  const data: ({ seqnum: number } & Feedback)[] = [];
  for (let i = 0; i < feedbacks.length; i++) {
    data.push({
      ...feedbacks[i],
      seqnum: i + 1,
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
});

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
        className={`
        p-2 rounded-md
        bg-slate-300 dark:bg-slate-700
        text-slate-700 dark:text-slate-300 opacity-70
      `}
      >
        <p>
          Minute {label}: {v?.charAt(0).toUpperCase() + v?.slice(1)}
        </p>
      </div>
    );
  }
}
