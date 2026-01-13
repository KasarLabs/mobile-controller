import { StateGraph, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { MobileControler } from '../../mobile/index.js';
import {
  TikTokWorkflowAnnotation,
  TikTokWorkflowState,
  WorkflowConfig,
} from './types.js';
import {
  verifyDevice,
  killTikTok,
  getScreenSize,
  openTikTok,
  clickFypTab,
  listElementsOnScreen,
  prepareAgentPrompt,
  executeAgent,
  checkResult,
  pressHome,
  captureErrorScreenshot,
} from './nodes.js';

/**
 * TikTok FYP Liker Workflow
 * Converts n8n workflow to LangGraph implementation
 */
export class TikTokFypLikerWorkflow {
  private controller: MobileControler;
  private model: ChatGoogleGenerativeAI;
  private tools: any[];

  constructor(controller: MobileControler, tools: any[]) {
    this.controller = controller;
    this.tools = tools;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.model = new ChatGoogleGenerativeAI({
      temperature: 0.1,
      model: 'gemini-3-flash-preview',
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  /**
   * Build the workflow graph
   */
  buildGraph() {
    const workflow = new StateGraph(TikTokWorkflowAnnotation)
      .addNode('verify_device', async state => {
        console.log('→ Verifying device...');
        return await verifyDevice(state, this.controller);
      })
      .addNode('kill_tiktok', async state => {
        console.log('→ Killing TikTok app...');
        return await killTikTok(state, this.tools);
      })
      .addNode('get_screen_size', async state => {
        console.log('→ Getting screen size...');
        return await getScreenSize(state, this.controller);
      })
      .addNode('open_tiktok', async state => {
        console.log('→ Opening TikTok app...');
        return await openTikTok(state, this.tools);
      })
      .addNode('click_fyp_tab', async state => {
        console.log('→ Clicking FYP tab...');
        return await clickFypTab(state, this.tools);
      })
      .addNode('list_elements', async state => {
        console.log('→ Listing elements on screen...');
        return await listElementsOnScreen(state, this.tools);
      })
      .addNode('prepare_agent_prompt', async state => {
        console.log('→ Preparing agent prompt...');
        return await prepareAgentPrompt(state);
      })
      .addNode('execute_agent', async state => {
        console.log('→ Executing AI agent...');
        return await executeAgent(state, this.model, this.tools);
      })
      .addNode('check_result', async state => {
        console.log('→ Checking result...');
        return await checkResult(state);
      })
      .addNode('press_home', async state => {
        console.log('→ Pressing home button...');
        return await pressHome(state, this.tools);
      });

    // Main flow - simple linear execution
    workflow.addEdge('__start__', 'verify_device');
    workflow.addEdge('verify_device', 'kill_tiktok');
    workflow.addEdge('kill_tiktok', 'get_screen_size');
    workflow.addEdge('get_screen_size', 'open_tiktok');
    workflow.addEdge('open_tiktok', 'click_fyp_tab');
    workflow.addEdge('click_fyp_tab', 'list_elements');
    workflow.addEdge('list_elements', 'prepare_agent_prompt');
    workflow.addEdge('prepare_agent_prompt', 'execute_agent');
    workflow.addEdge('execute_agent', 'check_result');
    workflow.addEdge('check_result', 'press_home');
    workflow.addEdge('press_home', END);

    return workflow.compile();
  }

  /**
   * Run the workflow
   */
  async run(config: WorkflowConfig): Promise<TikTokWorkflowState> {
    const graph = this.buildGraph();

    const initialState: TikTokWorkflowState = {
      deviceId: config.deviceId,
      likesCount: config.likesCount,
      screenSize: null,
      elementsList: null,
      agentPrompt: null,
      agentOutput: null,
      error: null,
      success: false,
    };

    const result = await graph.invoke(initialState);
    return result;
  }
}
