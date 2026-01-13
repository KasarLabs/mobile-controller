import { TikTokWorkflowState } from './types.js';
import { MobileControler } from '../../mobile/index.js';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { DynamicStructuredTool } from 'langchain';
import { ToolMessage } from '@langchain/core/messages';

/**
 * Verify device is connected
 */
export async function verifyDevice(
  state: TikTokWorkflowState,
  controller: MobileControler
): Promise<Partial<TikTokWorkflowState>> {
  try {
    const devices = await controller.getDevices();
    const deviceExists = devices.some(d => d.id === state.deviceId);

    if (!deviceExists) {
      throw new Error(`Device ${state.deviceId} not connected`);
    }

    return {};
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Kill TikTok app
 */
export async function killTikTok(
  state: TikTokWorkflowState,
  tools: DynamicStructuredTool[]
): Promise<Partial<TikTokWorkflowState>> {
  try {
    const terminateTool = tools.find(t => t.name === 'mobile_terminate_app');
    if (terminateTool) {
      console.log('  🔪 Terminating TikTok app...');
      await terminateTool.invoke({
        device: state.deviceId,
        packageName: 'com.zhiliaoapp.musically',
      });
      console.log('  ✓ TikTok terminated');
    } else {
      console.log('  ⚠️  mobile_terminate_app tool not found');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {};
  } catch (error) {
    console.error('  ❌ Failed to terminate TikTok:', (error as Error).message);
    return { error: error as Error };
  }
}

/**
 * Get screen size
 */
export async function getScreenSize(
  state: TikTokWorkflowState,
  controller: MobileControler
): Promise<Partial<TikTokWorkflowState>> {
  try {
    const screenSize = await controller.getDevicesScreenSize(state.deviceId);
    return { screenSize };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Open TikTok app
 */
export async function openTikTok(
  state: TikTokWorkflowState,
  tools: DynamicStructuredTool[]
): Promise<Partial<TikTokWorkflowState>> {
  try {
    const launchTool = tools.find(t => t.name === 'mobile_launch_app');
    if (!launchTool) {
      console.log('  ⚠️  mobile_launch_app tool not found');
      return { error: new Error('mobile_launch_app tool not found') };
    }

    console.log('  📱 Launching TikTok (com.zhiliaoapp.musically)...');
    await launchTool.invoke({
      device: state.deviceId,
      packageName: 'com.zhiliaoapp.musically',
    });
    console.log('  ✓ Launch command sent, waiting 5s for app to open...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('  ✓ TikTok should now be open');
    return {};
  } catch (error) {
    console.error('  ❌ Failed to open TikTok:', (error as Error).message);
    return { error: error as Error };
  }
}

/**
 * Click FYP tab
 */
export async function clickFypTab(
  state: TikTokWorkflowState,
  tools: DynamicStructuredTool[]
): Promise<Partial<TikTokWorkflowState>> {
  try {
    if (!state.screenSize) {
      throw new Error('Screen size not available');
    }

    const { width, height } = state.screenSize;
    const tapX = Math.round(width * 0.75);
    const tapY = Math.round(height * 0.07);

    const tapTool = tools.find(
      t => t.name === 'mobile_click_on_screen_at_coordinates'
    );
    if (!tapTool) {
      console.log('  ⚠️  mobile_click_on_screen_at_coordinates tool not found');
      return { error: new Error('mobile_click_on_screen_at_coordinates tool not found') };
    }

    console.log(`  👆 Clicking FYP tab at (${tapX}, ${tapY})...`);
    await tapTool.invoke({
      device: state.deviceId,
      x: tapX,
      y: tapY,
    });
    console.log('  ✓ FYP tab clicked');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {};
  } catch (error) {
    console.error('  ❌ Failed to click FYP tab:', (error as Error).message);
    return { error: error as Error };
  }
}

/**
 * List elements on screen
 */
export async function listElementsOnScreen(
  state: TikTokWorkflowState,
  tools: DynamicStructuredTool[]
): Promise<Partial<TikTokWorkflowState>> {
  try {
    const listElementsTool = tools.find(t => t.name === 'mobile_list_elements_on_screen');
    if (!listElementsTool) {
      console.log('  ⚠️  mobile_list_elements_on_screen tool not found');
      return { error: new Error('mobile_list_elements_on_screen tool not found') };
    }

    console.log('  📋 Listing elements on screen...');
    const elementsResult = await listElementsTool.invoke({
      device: state.deviceId,
    });

    const elementsList = typeof elementsResult === 'string'
      ? elementsResult
      : JSON.stringify(elementsResult, null, 2);

    console.log(`  ✓ Found ${elementsList.length} characters of element data`);
    return { elementsList };
  } catch (error) {
    console.error('  ❌ Failed to list elements:', (error as Error).message);
    return { error: error as Error };
  }
}

/**
 * Prepare agent prompt
 */
export async function prepareAgentPrompt(
  state: TikTokWorkflowState
): Promise<Partial<TikTokWorkflowState>> {
  if (!state.screenSize) {
    return { error: new Error('Screen size not available') };
  }

  if (!state.elementsList) {
    return { error: new Error('Elements list not available') };
  }

  const { width, height } = state.screenSize;
  const tapMinX = Math.round(width * 0.25);
  const tapMaxX = Math.round(width * 0.75);
  const tapMinY = Math.round(height * 0.3);
  const tapMaxY = Math.round(height * 0.55);

  const agentPrompt = `<task>
You are automating TikTok For You Page (FYP). Your goal is to like ${state.likesCount} videos then signal completion.
</task>

<device_info>
DEVICE_ID: ${state.deviceId}
SCREEN_SIZE: ${width}x${height}
</device_info>

<screen_elements>
${state.elementsList}
</screen_elements>

<flow>
For each video, follow these steps:

1. Analyze the current screen information
   - Use the <screen_elements> data provided above as reference
   - Look for indicators that help you understand what's on screen
   - Before performing any action, ask yourself the validation questions below

2. Execute action in accordance with <guidelines>
   - Follow the specific guidelines for liking videos or skipping content
   - Use the appropriate tools for each action
</flow>

<guidelines>
CRITICAL VALIDATION QUESTIONS - Ask yourself BEFORE every action:
1. Am I currently on TikTok?
2. Am I in a LIVE stream?

LIVE DETECTION INDICATORS:
- Red "LIVE" badge visible (usually top-left)
- Viewer count displayed (e.g., "1.2K watching")
- Chat/comment section visible on the side
- "LIVE" text or similar indicators in the screen elements

ACTION RULES:
IF LIVE STREAM DETECTED:
  - Log: "Video N is a LIVE - skipping"
  - DO NOT double-tap (would open/interact with the live)
  - Proceed directly to SWIPE action

IF NORMAL VIDEO (not a live):
  - Wait 3-5 seconds to simulate natural watching
  - LIKE the video by double-tapping:
    * Pick random x coordinate between ${tapMinX} and ${tapMaxX}
    * Pick random y coordinate between ${tapMinY} and ${tapMaxY}
    * Use mobile_double_tap_on_screen tool at those coordinates
    * Wait 1 second after tapping
  - Log: "Video N liked"

NAVIGATION:
  - After each video (liked or skipped), swipe up to next video
  - Use mobile_swipe_on_screen with direction="up"
  - Wait 2 seconds after swiping

TAP ZONES FOR LIKING:
- X range: ${tapMinX} to ${tapMaxX}
- Y range: ${tapMinY} to ${tapMaxY}
- Always use random coordinates within these ranges
</guidelines>

<completion>
After processing ${state.likesCount} videos (liked or skipped), reply exactly: TASK_COMPLETE
</completion>`;

  return { agentPrompt };
}

/**
 * Execute agent with agentic loop (multi-turn tool execution)
 */
export async function executeAgent(
  state: TikTokWorkflowState,
  model: ChatGoogleGenerativeAI,
  tools: any[]
): Promise<Partial<TikTokWorkflowState>> {
  try {
    if (!state.agentPrompt) {
      throw new Error('Agent prompt not available');
    }

    console.log('  🤖 Starting agentic loop...');

    // Filter out mobile_list_elements_on_screen since we provide elements in the prompt
    const filteredTools = tools.filter(t => t.name !== 'mobile_list_elements_on_screen');
    console.log(`  📦 Using ${filteredTools.length} tools (excluded mobile_list_elements_on_screen)`);

    const modelWithTools = model.bindTools(filteredTools);

    // Create a tools map for easy lookup (use filtered tools)
    const toolsMap = new Map(filteredTools.map(t => [t.name, t]));

    // Message history for multi-turn conversation
    const messages: any[] = [
      { role: 'user', content: state.agentPrompt }
    ];

    let iterations = 0;
    const maxIterations = 100; // Safety limit
    let finalOutput = '';

    while (iterations < maxIterations) {
      iterations++;
      console.log(`\n  🔄 Iteration ${iterations}`);

      // Get agent response
      const response = await modelWithTools.invoke(messages);

      // Add assistant message to history
      messages.push(response);

      // Extract text content
      let textContent = '';
      if (typeof response.content === 'string') {
        textContent = response.content;
      } else if (Array.isArray(response.content)) {
        textContent = response.content
          .filter((block: any) => typeof block === 'string' || block.type === 'text')
          .map((block: any) => (typeof block === 'string' ? block : block.text))
          .join('\n');
      }

      if (textContent) {
        console.log(`  💬 Agent: ${textContent.substring(0, 100)}${textContent.length > 100 ? '...' : ''}`);
        finalOutput += textContent + '\n';
      }

      // Check if task is complete
      if (textContent.includes('TASK_COMPLETE')) {
        console.log('\n  ✅ Agent signaled TASK_COMPLETE');
        break;
      }

      // Check for tool calls
      const toolCalls = response.tool_calls || [];
      if (toolCalls.length === 0) {
        console.log('  ℹ️  No tool calls, agent may be stuck or done');
        break;
      }

      console.log(`  🔧 Executing ${toolCalls.length} tool call(s)...`);

      // Execute all tool calls
      const toolResults: any[] = [];
      for (const toolCall of toolCalls) {
        const tool = toolsMap.get(toolCall.name);
        if (!tool) {
          console.log(`  ⚠️  Tool ${toolCall.name} not found`);
          toolResults.push({
            tool_call_id: toolCall.id,
            content: `Error: Tool ${toolCall.name} not found`
          });
          continue;
        }

        try {
          const argsStr = JSON.stringify(toolCall.args).substring(0, 60);
          console.log(`    ▶ ${toolCall.name}(${argsStr}...)`);

          const result = await tool.invoke(toolCall.args);
          const resultStr = typeof result === 'string'
            ? result.substring(0, 100)
            : JSON.stringify(result).substring(0, 100);
          console.log(`    ◀ ${resultStr}${resultStr.length >= 100 ? '...' : ''}`);

          toolResults.push({
            tool_call_id: toolCall.id,
            content: typeof result === 'string' ? result : JSON.stringify(result)
          });
        } catch (error) {
          console.log(`    ❌ Error: ${(error as Error).message}`);
          toolResults.push({
            tool_call_id: toolCall.id,
            content: `Error: ${(error as Error).message}`
          });
        }
      }

      // Add tool results to message history as ToolMessage instances
      for (const toolResult of toolResults) {
        messages.push(
          new ToolMessage({
            content: toolResult.content,
            tool_call_id: toolResult.tool_call_id
          })
        );
      }
    }

    if (iterations >= maxIterations) {
      console.log(`\n  ⚠️  Reached max iterations (${maxIterations})`);
    }

    console.log(`\n  ✓ Agentic loop completed in ${iterations} iterations`);

    return { agentOutput: finalOutput || `[Completed in ${iterations} iterations]` };
  } catch (error) {
    console.error('  ❌ Agent execution failed:', (error as Error).message);
    return { error: error as Error };
  }
}

/**
 * Check result
 */
export async function checkResult(
  state: TikTokWorkflowState
): Promise<Partial<TikTokWorkflowState>> {
  const success = state.agentOutput?.includes('TASK_COMPLETE') || false;
  return { success };
}

/**
 * Press home button
 */
export async function pressHome(
  state: TikTokWorkflowState,
  tools: DynamicStructuredTool[]
): Promise<Partial<TikTokWorkflowState>> {
  try {
    const pressButtonTool = tools.find(t => t.name === 'mobile_press_button');
    if (pressButtonTool) {
      console.log('  🏠 Pressing home button...');
      await pressButtonTool.invoke({
        device: state.deviceId,
        button: 'HOME',
      });
      console.log('  ✓ Home button pressed');
    } else {
      console.log('  ⚠️  mobile_press_button tool not found');
    }
    return {};
  } catch (error) {
    console.error('  ❌ Failed to press home:', (error as Error).message);
    return { error: error as Error };
  }
}

/**
 * Capture error screenshot
 */
export async function captureErrorScreenshot(
  state: TikTokWorkflowState,
  tools: DynamicStructuredTool[]
): Promise<Partial<TikTokWorkflowState>> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `/tmp/tiktok_fyp_liker_error_${timestamp}.png`;

    const screenshotTool = tools.find(t => t.name === 'mobile_save_screenshot');
    if (screenshotTool) {
      await screenshotTool.invoke({
        device: state.deviceId,
        path: filename,
      });
    }
    return {};
  } catch (error) {
    console.error('Failed to capture error screenshot:', error);
    return {};
  }
}
