export type StepStatus = "idle" | "current" | "done";

export type WorkflowStep = {
  label: string;
  helper: string;
  status: StepStatus;
};
