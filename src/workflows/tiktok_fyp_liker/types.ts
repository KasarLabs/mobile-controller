import { Annotation } from '@langchain/langgraph';

/**
 * Screen dimensions for mobile device
 */
export interface ScreenSize {
  width: number;
  height: number;
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  deviceId: string;
  likesCount: number;
}

/**
 * Workflow state annotation for TikTok FYP Liker
 */
export const TikTokWorkflowAnnotation = Annotation.Root({
  deviceId: Annotation<string>,
  likesCount: Annotation<number>,
  screenSize: Annotation<ScreenSize | null>,
  elementsList: Annotation<string | null>,
  agentPrompt: Annotation<string | null>,
  agentOutput: Annotation<string | null>,
  error: Annotation<Error | null>,
  success: Annotation<boolean>,
});

export type TikTokWorkflowState = typeof TikTokWorkflowAnnotation.State;
