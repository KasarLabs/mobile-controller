import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TikTokFYPLikerStateType } from "./state.js";
import {
  readDeviceId,
  getScreenSize,
  calculateTapZone,
  killTikTok,
  openTikTok,
  doubleTapToLike,
  swipeUp,
  pressHome,
  sleep,
  listUIElements,
  getRandomTapCoords,
} from "./tools.js";

import dotenv from "dotenv";
dotenv.config();
// Initialize Gemini model
const model = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview",
  temperature: 0.1,
  apiKey: process.env.GOOGLE_API_KEY,
});

/**
 * Node: Initialize configuration and read device ID
 */
export async function initializeNode(
  state: TikTokFYPLikerStateType
): Promise<Partial<TikTokFYPLikerStateType>> {
  console.log("\n=== [Node] Initialize ===");
  console.log(`Agent: ${state.agentName}, Likes: ${state.likesCount}`);

  try {
    const deviceId = await readDeviceId(state.agentName);
    console.log(`Device ID: ${deviceId}`);
    return { deviceId };
  } catch (error) {
    return {
      error: `Failed to read device ID: ${error}`,
      status: "failed",
    };
  }
}

/**
 * Node: Get screen dimensions and calculate tap zones
 */
export async function getScreenInfoNode(
  state: TikTokFYPLikerStateType
): Promise<Partial<TikTokFYPLikerStateType>> {
  console.log("\n=== [Node] Get Screen Info ===");

  try {
    const { width, height } = await getScreenSize(state.deviceId);
    const tapZone = calculateTapZone(width, height);

    console.log(`Screen: ${width}x${height}`);
    console.log(`Tap zone: X(${tapZone.tapMinX}-${tapZone.tapMaxX}), Y(${tapZone.tapMinY}-${tapZone.tapMaxY})`);

    return {
      screenWidth: width,
      screenHeight: height,
      ...tapZone,
    };
  } catch (error) {
    return {
      error: `Failed to get screen info: ${error}`,
      status: "failed",
    };
  }
}

/**
 * Node: Kill and reopen TikTok
 */
export async function restartTikTokNode(
  state: TikTokFYPLikerStateType
): Promise<Partial<TikTokFYPLikerStateType>> {
  console.log("\n=== [Node] Restart TikTok ===");

  try {
    await killTikTok(state.deviceId);
    await sleep(2000);
    await openTikTok(state.deviceId);
    await sleep(5000);

    return { lastAction: "tiktok_restarted" };
  } catch (error) {
    return {
      error: `Failed to restart TikTok: ${error}`,
      status: "failed",
    };
  }
}

/**
 * Node: Verify we're on the FYP using Gemini
 */
export async function verifyFYPNode(
  state: TikTokFYPLikerStateType
): Promise<Partial<TikTokFYPLikerStateType>> {
  console.log("\n=== [Node] Verify FYP ===");

  try {
    const uiElements = await listUIElements(state.deviceId);

    const prompt = `You are analyzing the TikTok screen to verify we are on the For You Page (FYP).

UI ELEMENTS:
${uiElements}

Analyze these elements and respond with ONLY:
- "FYP_CONFIRMED" if you see typical FYP indicators (For You tab, video feed elements, heart/like buttons, comment icons, share buttons)
- "NOT_FYP" if we're clearly not on the FYP

Response format: Just write FYP_CONFIRMED or NOT_FYP, nothing else.`;

    const response = await model.invoke(prompt);
    const content = response.content.toString().trim().toUpperCase();

    const isFypConfirmed = content.includes("FYP_CONFIRMED");
    console.log(`FYP Status: ${isFypConfirmed ? "Confirmed" : "Not confirmed"}`);

    return {
      uiElements,
      isFypConfirmed,
      lastAction: "fyp_verified",
    };
  } catch (error) {
    return {
      error: `Failed to verify FYP: ${error}`,
      status: "failed",
    };
  }
}

/**
 * Node: Detect if current video is a live stream
 */
export async function detectVideoTypeNode(
  state: TikTokFYPLikerStateType
): Promise<Partial<TikTokFYPLikerStateType>> {
  console.log("\n=== [Node] Detect Video Type ===");
  console.log(`Iteration: ${state.currentIteration + 1}/${state.likesCount}`);

  try {
    const uiElements = await listUIElements(state.deviceId);

    const prompt = `You are analyzing TikTok screen elements to detect if this is a LIVE stream.

UI ELEMENTS:
${uiElements}

Look for interaction icons on the RIGHT side of the screen:
- Heart/Like button
- Comment button
- Share button

If you see these interaction icons clearly present on the right side, this is a REGULAR video.
If these icons are MISSING or not in their usual position, this is a LIVE stream.

Respond with ONLY:
- "REGULAR_VIDEO" if interaction icons are present
- "LIVE_STREAM" if interaction icons are missing/different

Response format: Just write REGULAR_VIDEO or LIVE_STREAM, nothing else.`;

    const response = await model.invoke(prompt);
    const content = response.content.toString().trim().toUpperCase();

    let videoType: "REGULAR_VIDEO" | "LIVE_STREAM" | "INSUFFICIENT_DATA";

    const errorIndicators = ["AGENT STOPPED", "MAX ITERATIONS", "ERROR", "FAILED", "TIMEOUT"];
    if (errorIndicators.some((indicator) => content.includes(indicator))) {
      videoType = "INSUFFICIENT_DATA";
    } else if (content.includes("REGULAR")) {
      videoType = "REGULAR_VIDEO";
    } else {
      videoType = "LIVE_STREAM";
    }

    console.log(`Video type: ${videoType}`);

    return {
      uiElements,
      videoType,
      lastAction: "video_type_detected",
    };
  } catch (error) {
    return {
      videoType: "INSUFFICIENT_DATA",
      lastAction: "video_type_detection_failed",
    };
  }
}

/**
 * Node: Like the current video with double tap
 */
export async function likeVideoNode(
  state: TikTokFYPLikerStateType
): Promise<Partial<TikTokFYPLikerStateType>> {
  console.log("\n=== [Node] Like Video ===");

  try {
    const { x, y } = getRandomTapCoords(
      state.tapMinX,
      state.tapMaxX,
      state.tapMinY,
      state.tapMaxY
    );

    await doubleTapToLike(state.deviceId, x, y);
    await sleep(500);

    return { lastAction: "liked" };
  } catch (error) {
    return { lastAction: `like_failed: ${error}` };
  }
}

/**
 * Node: Swipe to next video
 */
export async function swipeNextNode(
  state: TikTokFYPLikerStateType
): Promise<Partial<TikTokFYPLikerStateType>> {
  console.log("\n=== [Node] Swipe Next ===");

  try {
    await swipeUp(state.deviceId, state.screenWidth, state.screenHeight);
    await sleep(1000);

    return { lastAction: "swiped" };
  } catch (error) {
    return { lastAction: `swipe_failed: ${error}` };
  }
}

/**
 * Node: Increment iteration counter
 */
export async function incrementIterationNode(
  state: TikTokFYPLikerStateType
): Promise<Partial<TikTokFYPLikerStateType>> {
  const newIteration = state.currentIteration + 1;
  console.log(`\n=== [Node] Increment Iteration: ${newIteration}/${state.likesCount} ===`);

  return {
    currentIteration: newIteration,
  };
}

/**
 * Node: Complete workflow - press home
 */
export async function completeWorkflowNode(
  state: TikTokFYPLikerStateType
): Promise<Partial<TikTokFYPLikerStateType>> {
  console.log("\n=== [Node] Complete Workflow ===");
  console.log(`Total likes completed: ${state.currentIteration}`);

  try {
    await pressHome(state.deviceId);
    return {
      status: "completed",
      lastAction: "workflow_completed",
    };
  } catch (error) {
    return {
      status: "completed",
      lastAction: `completed_with_home_error: ${error}`,
    };
  }
}

/**
 * Node: Handle FYP verification failure
 */
export async function fypErrorNode(
  state: TikTokFYPLikerStateType
): Promise<Partial<TikTokFYPLikerStateType>> {
  console.log("\n=== [Node] FYP Error ===");
  console.log("Could not confirm FYP - workflow cannot continue");

  return {
    error: "Could not confirm For You Page",
    status: "failed",
  };
}

// === ROUTING FUNCTIONS ===

/**
 * Route after FYP verification
 */
export function routeAfterFYPCheck(
  state: TikTokFYPLikerStateType
): "detect_video" | "fyp_error" {
  if (state.isFypConfirmed) {
    return "detect_video";
  }
  return "fyp_error";
}

/**
 * Route after video type detection
 */
export function routeAfterVideoDetection(
  state: TikTokFYPLikerStateType
): "like_video" | "swipe_skip" {
  if (state.videoType === "REGULAR_VIDEO") {
    return "like_video";
  }
  return "swipe_skip";
}

/**
 * Route after like/swipe - check if we should continue looping
 */
export function routeAfterIteration(
  state: TikTokFYPLikerStateType
): "detect_video" | "complete" {
  if (state.currentIteration < state.likesCount) {
    return "detect_video";
  }
  return "complete";
}

