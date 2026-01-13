import { Annotation } from "@langchain/langgraph";

/**
 * State definition for the TikTok FYP Liker workflow
 */
export const TikTokFYPLikerState = Annotation.Root({
  // Configuration
  agentName: Annotation<string>({
    reducer: (_, b) => b,
    default: () => "ledailydoc",
  }),
  likesCount: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 10,
  }),

  // Device info
  deviceId: Annotation<string>({
    reducer: (_, b) => b,
    default: () => "",
  }),

  // Screen dimensions
  screenWidth: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 0,
  }),
  screenHeight: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 0,
  }),

  // Safe tap zone boundaries (40-60% of screen)
  tapMinX: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 0,
  }),
  tapMaxX: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 0,
  }),
  tapMinY: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 0,
  }),
  tapMaxY: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 0,
  }),

  // Loop state
  currentIteration: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 0,
  }),

  // Video detection
  videoType: Annotation<"REGULAR_VIDEO" | "LIVE_STREAM" | "INSUFFICIENT_DATA" | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  // UI elements from MCP
  uiElements: Annotation<string>({
    reducer: (_, b) => b,
    default: () => "",
  }),

  // FYP verification
  isFypConfirmed: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  // Last action performed
  lastAction: Annotation<string>({
    reducer: (_, b) => b,
    default: () => "",
  }),

  // Error handling
  error: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  // Workflow status
  status: Annotation<"running" | "completed" | "failed">({
    reducer: (_, b) => b,
    default: () => "running",
  }),
});

export type TikTokFYPLikerStateType = typeof TikTokFYPLikerState.State;

