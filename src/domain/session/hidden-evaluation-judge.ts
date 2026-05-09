export type HiddenEvaluationJudgeMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type HiddenEvaluationJudgeRequest = {
  messages: HiddenEvaluationJudgeMessage[];
  responseSchemaName: string;
  responseJsonSchema: Record<string, unknown>;
};

export type HiddenEvaluationJudgeCompletion = {
  content: string;
};

export type HiddenEvaluationJudge = {
  createStructuredJsonCompletion(
    request: HiddenEvaluationJudgeRequest
  ): Promise<HiddenEvaluationJudgeCompletion>;
};
