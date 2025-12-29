import {
  MessagesAnnotation,
  StateGraph,
  CompiledStateGraph,
  AnnotationRoot,
  MemorySaver,
} from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, ReactAgent } from 'langchain';
import mcpsIngester from '../ingesters/mcps/mcps.ingester.js';
import { DeviceInfo, MobileControler } from '../mobile/index.js';
import {
  bibleToPromptString,
  formatPromptWithDevice,
  getUserQuery,
  selectBible,
  selectDevices,
  selectApps,
  type AppConfig,
} from '../utils/index.js';
import { createDeepAgent } from './deepagents/agent.js';
import { SubAgent } from './deepagents/index.js';
import {
  TWITTER_TASK_SUBAGENT_PROMPT,
  DEEPAGENTS_SYSTEM_PROMPT,
  INSTAGRAM_TASK_SUBAGENT_PROMPT,
  TIKTOK_TASK_SUBAGENT_PROMPT,
  YOUTUBE_TASK_SUBAGENT_PROMPT,
} from '../prompts/agents/deepagents.prompt.js';
import { MobileContextAnnotation } from './deepagents/types/index.js';
import {
  deviceCheckMiddleware,
  devicePromptMiddleware,
} from './deepagents/middleware/devices.js';
import { AppMobileTrace } from './deepagents/middleware/AppMobileTrace.js';
import { createReverseSwipeMiddleware } from './deepagents/middleware/reverse_swipe.js';

export class MobileControllerGraph {
  // Graph implementation for MobileControllerGraph
  graph: CompiledStateGraph<
    AnnotationRoot<any>['State'],
    AnnotationRoot<any>['Update'],
    string,
    AnnotationRoot<any>['spec'],
    AnnotationRoot<any>['spec']
  > | null = null;

  agent: ReactAgent | null = null;

  model: ChatGoogleGenerativeAI;

  mobileController: MobileControler | null = null;

  selectedDevices: DeviceInfo | null = null;

  selectedBible: any = null;

  appMobileTrace: AppMobileTrace | null = null;

  authorizedApps: { name: string; identifier: string }[] = [];

  selectedApps: AppConfig[] = [];

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    this.model = new ChatGoogleGenerativeAI({
      temperature: 0.7,
      model: 'gemini-3-flash-preview',
      thinkingConfig: {
        includeThoughts: true,
      },
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  public async compiledGraph(): Promise<
    CompiledStateGraph<
      AnnotationRoot<any>['State'],
      AnnotationRoot<any>['Update'],
      string,
      AnnotationRoot<any>['spec'],
      AnnotationRoot<any>['spec']
    >
  > {
    if (this.graph) {
      return this.graph;
    }
    const checkpointer = new MemorySaver();

    const builder = new StateGraph(MessagesAnnotation);
    const graph = builder.compile({ checkpointer });

    return graph as CompiledStateGraph<
      AnnotationRoot<any>['State'],
      AnnotationRoot<any>['Update'],
      string,
      AnnotationRoot<any>['spec'],
      AnnotationRoot<any>['spec']
    >;
  }

  /**
   * init
   */
  public async init(): Promise<void> {
    // Define the graph structure and compile it
    await mcpsIngester.init();
    const tools = mcpsIngester.getTools();
    const filterTools = tools.filter(
      tool =>
        tool.name != 'mobile_take_screenshot' &&
        tool.name != 'mobile_save_screenshot'
    );
    this.mobileController = new MobileControler(tools);
    const devices = await this.mobileController.getDevices();
    if (devices.length === 0) {
      throw new Error('No devices available');
    }

    this.selectedDevices =
      devices.length === 1 ? devices[0] : await selectDevices(devices);

    const selectedDevicesScreenSize =
      await this.mobileController.getDevicesScreenSize(this.selectedDevices.id);
    this.selectedDevices.screenWidth = selectedDevicesScreenSize.width;
    this.selectedDevices.screenHeight = selectedDevicesScreenSize.height;
    this.selectedBible = await selectBible();

    // Let user select which apps to use
    this.selectedApps = await selectApps();

    const deviceCheckMiddlewares = deviceCheckMiddleware(this.mobileController);
    const devicePromptMiddlewareInstance = devicePromptMiddleware();
    const todoListMiddleware = createReverseSwipeMiddleware();
    console.log(`Selected Bible: ${this.selectedBible.name}`);

    // Create subagents dynamically based on selected apps
    const subagents: SubAgent[] = [];
    const subagentDescriptions: string[] = [];

    for (const app of this.selectedApps) {
      let subAgent: SubAgent | null = null;

      switch (app.name) {
        case 'Twitter':
          const twitterSubAgentPrompt = await formatPromptWithDevice(
            TWITTER_TASK_SUBAGENT_PROMPT,
            this.selectedDevices,
            {
              bible: bibleToPromptString(this.selectedBible),
            }
          );
          subAgent = {
            name: 'TwitterSubAgent',
            description:
              'Handles Twitter related execution tasks on the mobile device',
            systemPrompt: twitterSubAgentPrompt,
            middleware: [
              deviceCheckMiddlewares,
              devicePromptMiddlewareInstance,
              todoListMiddleware,
            ],
            tools: filterTools,
            model: this.model,
          };
          break;

        case 'Instagram':
          const instagramSubAgentPrompt = await formatPromptWithDevice(
            INSTAGRAM_TASK_SUBAGENT_PROMPT,
            this.selectedDevices,
            {
              bible: bibleToPromptString(this.selectedBible),
            }
          );
          subAgent = {
            name: 'InstagramSubAgent',
            description:
              'Handles Instagram related execution tasks on the mobile device',
            systemPrompt: instagramSubAgentPrompt,
            middleware: [
              deviceCheckMiddlewares,
              devicePromptMiddlewareInstance,
              todoListMiddleware,
            ],
            tools: filterTools,
            model: this.model,
          };
          break;

        case 'TikTok':
          const tiktokSubAgentPrompt = await formatPromptWithDevice(
            TIKTOK_TASK_SUBAGENT_PROMPT,
            this.selectedDevices,
            {
              bible: bibleToPromptString(this.selectedBible),
            }
          );
          subAgent = {
            name: 'TikTokSubAgent',
            description:
              'Handles TikTok related execution tasks on the mobile device',
            systemPrompt: tiktokSubAgentPrompt,
            middleware: [
              deviceCheckMiddlewares,
              devicePromptMiddlewareInstance,
              todoListMiddleware,
            ],
            tools: filterTools,
            model: this.model,
          };
          break;

        case 'YouTube':
          const youtubeSubAgentPrompt = await formatPromptWithDevice(
            YOUTUBE_TASK_SUBAGENT_PROMPT,
            this.selectedDevices,
            {
              bible: bibleToPromptString(this.selectedBible),
            }
          );
          subAgent = {
            name: 'YouTubeSubAgent',
            description:
              'Handles YouTube related execution tasks on the mobile device',
            systemPrompt: youtubeSubAgentPrompt,
            middleware: [
              deviceCheckMiddlewares,
              devicePromptMiddlewareInstance,
              todoListMiddleware,
            ],
            tools: filterTools,
            model: this.model,
          };
          break;
      }

      if (subAgent) {
        subagents.push(subAgent);
        subagentDescriptions.push(`${subAgent.name}: ${subAgent.description}`);
      }
    }

    // Set authorized apps based on selected apps
    this.authorizedApps = this.selectedApps.map(app => ({
      name: app.name,
      identifier: app.identifier,
    }));

    // Initialize AppMobileTrace for tracking app usage
    this.appMobileTrace = new AppMobileTrace(
      this.mobileController,
      this.selectedDevices.id,
      this.authorizedApps
    );

    const deepAgentPrompt = await formatPromptWithDevice(
      DEEPAGENTS_SYSTEM_PROMPT,
      this.selectedDevices,
      {
        bible: bibleToPromptString(this.selectedBible),
        subagentsList: subagentDescriptions.join('\n') + '\n',
      }
    );
    this.agent = createDeepAgent({
      model: this.model,
      tools: filterTools,
      systemPrompt: deepAgentPrompt,
      middleware: [
        deviceCheckMiddlewares,
        devicePromptMiddlewareInstance,
        todoListMiddleware,
      ],
      subagents: subagents,
      contextSchema: MobileContextAnnotation,
    });
  }

  public async runAgent(): Promise<void> {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }
    while (-1) {
      const userQuery = await getUserQuery();
      if (userQuery === '-1') {
        console.log('Stopping agent as per user request.');
        break;
      }
      const response = await this.agent.invoke(
        {
          messages: [new HumanMessage(userQuery)],
        },
        {
          context: {
            deviceInfo: this.selectedDevices,
            bibleData: bibleToPromptString(this.selectedBible),
            appMobileTrace: this.appMobileTrace,
            authorizedApps: this.authorizedApps,
          },
          recursionLimit: 200,
        }
      );
      console.log('Agent response:', response);
    }
  }
}

// Singleton instance
let instance: MobileControllerGraph | null = null;

export function getMobileControllerGraph(): MobileControllerGraph {
  if (!instance) {
    instance = new MobileControllerGraph();
  }
  return instance;
}
