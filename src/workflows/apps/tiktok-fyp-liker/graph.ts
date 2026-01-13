import { StateGraph, END } from "@langchain/langgraph";
import { TikTokFYPLikerState } from "./state.js";
import {
  initializeNode,
  getScreenInfoNode,
  restartTikTokNode,
  verifyFYPNode,
  detectVideoTypeNode,
  likeVideoNode,
  swipeNextNode,
  incrementIterationNode,
  completeWorkflowNode,
  fypErrorNode,
  routeAfterFYPCheck,
  routeAfterVideoDetection,
  routeAfterIteration,
} from "./nodes.js";

/**
 * TikTok FYP Liker Graph
 *
 * This workflow automates liking videos on TikTok's For You Page:
 * 1. Initialize - Read device configuration
 * 2. Get Screen Info - Get device screen dimensions
 * 3. Restart TikTok - Kill and reopen the app
 * 4. Verify FYP - Ensure we're on the For You Page
 * 5. Loop:
 *    a. Detect video type (regular vs live)
 *    b. If regular: double tap to like
 *    c. Swipe to next video
 *    d. Increment counter
 *    e. Repeat until likesCount reached
 * 6. Complete - Press home and exit
 */

// Create the graph builder
const builder = new StateGraph(TikTokFYPLikerState)
  // Add all nodes
  .addNode("initialize", initializeNode)
  .addNode("get_screen_info", getScreenInfoNode)
  .addNode("restart_tiktok", restartTikTokNode)
  .addNode("verify_fyp", verifyFYPNode)
  .addNode("detect_video", detectVideoTypeNode)
  .addNode("like_video", likeVideoNode)
  .addNode("swipe_after_like", swipeNextNode)
  .addNode("swipe_skip", swipeNextNode)
  .addNode("increment_like", incrementIterationNode)
  .addNode("increment_skip", incrementIterationNode)
  .addNode("complete", completeWorkflowNode)
  .addNode("fyp_error", fypErrorNode)

  // Define the entry point
  .addEdge("__start__", "initialize")

  // Linear flow: initialize -> screen info -> restart -> verify
  .addEdge("initialize", "get_screen_info")
  .addEdge("get_screen_info", "restart_tiktok")
  .addEdge("restart_tiktok", "verify_fyp")

  // Conditional: After FYP verification
  .addConditionalEdges("verify_fyp", routeAfterFYPCheck, {
    detect_video: "detect_video",
    fyp_error: "fyp_error",
  })

  // FYP error leads to end
  .addEdge("fyp_error", END)

  // Conditional: After video detection
  .addConditionalEdges("detect_video", routeAfterVideoDetection, {
    like_video: "like_video",
    swipe_skip: "swipe_skip",
  })

  // Like path: like -> swipe -> increment -> check continue
  .addEdge("like_video", "swipe_after_like")
  .addEdge("swipe_after_like", "increment_like")
  .addConditionalEdges("increment_like", routeAfterIteration, {
    detect_video: "detect_video",
    complete: "complete",
  })

  // Skip path: swipe -> increment -> check continue
  .addEdge("swipe_skip", "increment_skip")
  .addConditionalEdges("increment_skip", routeAfterIteration, {
    detect_video: "detect_video",
    complete: "complete",
  })

  // Complete leads to end
  .addEdge("complete", END);

// Compile the graph with a higher recursion limit
// Default is 25, but we need: setup(4) + iterations * nodesPerIteration(4) + buffer
// For 100 likes max: 4 + (100 * 4) + 10 = 414, so we use 500 to be safe
export const graph = builder.compile().withConfig({
  recursionLimit: 500,
});

// Export for LangGraph Studio
export default graph;

