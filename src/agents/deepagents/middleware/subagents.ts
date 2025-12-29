import { z } from 'zod/v3';
import {
  createMiddleware,
  createAgent,
  AgentMiddleware,
  tool,
  ToolMessage,
  humanInTheLoopMiddleware,
  type InterruptOnConfig,
  type ReactAgent,
  StructuredTool,
} from 'langchain';
import { Command, getCurrentTaskInput } from '@langchain/langgraph';
import type { LanguageModelLike } from '@langchain/core/language_models/base';
import type { Runnable } from '@langchain/core/runnables';
import { HumanMessage } from '@langchain/core/messages';

export type { AgentMiddleware };

// Constants
const DEFAULT_SUBAGENT_PROMPT =
  'In order to complete the objective that the user asks of you, you have access to a number of standard tools.';

// State keys that should be excluded when passing state to subagents
const EXCLUDED_STATE_KEYS = ['messages', 'todos', 'jumpTo'] as const;

const DEFAULT_GENERAL_PURPOSE_DESCRIPTION =
  'General-purpose agent for researching complex questions, searching for files and content, and executing multi-step tasks. When you are searching for a keyword or file and are not confident that you will find the right match in the first few tries use this agent to perform the search for you. This agent has access to all tools as the main agent.';

// Comprehensive task tool description from Python
function getTaskToolDescription(subagentDescriptions: string[]): string {
  return `
Launch an ephemeral subagent to handle independent tasks, both simple and complex.

Available agent types and the tools they have access to:
${subagentDescriptions.join('\n')}

When using the Task tool, you must specify a subagent_type parameter to select which agent type to use.

## Usage notes:
1. Launch multiple agents concurrently whenever possible, to maximize performance; to do that, use a single message with multiple tool uses
2. When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result.
3. Each agent invocation is stateless. You will not be able to send additional messages to the agent, nor will the agent be able to communicate with you outside of its final report. Therefore, your prompt should contain a highly detailed task description for the agent to perform autonomously and you should specify exactly what information the agent should return back to you in its final and only message to you.
4. The agent's outputs should generally be trusted
5. Clearly tell the agent whether you expect it to create content, perform analysis, or just do research (search, file reads, web fetches, etc.), since it is not aware of the user's intent

### Example usage with custom agents:

<example_agent_descriptions>
"TwitterSubAgent": Handles Twitter related execution tasks on the mobile device
</example_agent_description>

<example>
user: "Like this tweet" (when viewing a specific tweet on screen)
<commentary>
Even though this is a simple single-action task, it should use TwitterSubAgent for any Twitter interaction
The TwitterSubAgent is specialized to handle ALL Twitter actions, simple or complex
</commentary>
assistant: I'll use the TwitterSubAgent to like the tweet.
assistant: Uses the Task tool with TwitterSubAgent: "Like the currently visible tweet on the screen"
</example>

<example>
user: "Reply to the visible tweet with a comment about AI"
<commentary>
The tweet is already visible on screen. The subagent just needs to execute the reply action.
Even though the content is visible, use TwitterSubAgent for the interaction.
</commentary>
assistant: I'll use the TwitterSubAgent to reply to this tweet.
assistant: Uses the Task tool with TwitterSubAgent: "The tweet is currently visible on screen. Reply to it with a thoughtful comment about AI in my persona voice"
</example>

<example>
user: "Subscribe to @channel_name on Twitter"
<commentary>
This requires the DeepAgent to first navigate to show the profile, then spawn TwitterSubAgent to execute the follow action
Complex task: navigation + action execution
</commentary>
assistant: Let me navigate to @channel_name's profile first, then use TwitterSubAgent to follow.
assistant: *Navigates to show @channel_name profile*
assistant: Uses the Task tool with TwitterSubAgent: "The profile @channel_name is now visible on screen. Follow/subscribe to this account"
</example>

<example>
user: "Find all my unread messages across Twitter, Instagram, and WhatsApp and summarize them for me."
<commentary>
Each app requires multiple navigation steps and screen captures to find unread messages.
These tasks are independent and can run in parallel to save time.
Each subagent focuses on one app, keeping context isolated and efficient.
</commentary>
assistant: *Calls the task tool in parallel to launch three subagents (one for each app) to check unread messages*
assistant: *Synthesizes the results from all three apps and provides a unified summary to the user*
</example>

<example>
user: "Navigate to the Twitter app and scroll down 3 times"
<commentary>
This is basic navigation only - no actions that change or input data
The main agent should handle simple navigation directly without delegating to a subagent
</commentary>
assistant: *Uses mobile navigation tools directly to open Twitter and perform scroll actions*
</example>
  `.trim();
}

const TASK_SYSTEM_PROMPT = `## \`task\` (subagent spawner)

You have access to a \`task\` tool to launch short-lived subagents that handle isolated tasks. These agents are ephemeral — they live only for the duration of the task and return a single result.

When to use the task tool:
- When a specialized subagent exists for a specific domain (e.g., TwitterSubAgent for ANY Twitter interaction, even simple ones like liking a tweet)
- When a task can be fully delegated in isolation (simple or complex)
- When a task is independent of other tasks and can run in parallel
- When a task requires focused reasoning or heavy token/context usage that would bloat the orchestrator thread
- When sandboxing improves reliability (e.g. code execution, structured searches, data formatting)

Subagent lifecycle:
1. **Spawn** → Provide clear role, instructions, and expected output
2. **Run** → The subagent completes the task autonomously
3. **Return** → The subagent provides a single structured result
4. **Reconcile** → Incorporate or synthesize the result into the main thread

When NOT to use the task tool:
- If you need to see the intermediate reasoning or steps after the subagent has completed (the task tool hides them)
- If delegating does not reduce token usage, complexity, or context switching AND no specialized subagent exists
- If splitting would add latency without benefit AND no specialized subagent exists
- For pure navigation tasks (scrolling, switching tabs)

## Important Task Tool Usage Notes to Remember
- Whenever possible, parallelize the work that you do. This is true for both tool_calls, and for tasks. Whenever you have independent steps to complete - make tool_calls, or kick off tasks (subagents) in parallel to accomplish them faster. This saves time for the user, which is incredibly important.
- Remember to use the \`task\` tool to silo independent tasks within a multi-part objective.
- If a specialized subagent exists for a domain (like TwitterSubAgent), use it for ALL actions in that domain, even simple ones.`;

/**
 * Type definitions for pre-compiled agents.
 */
export interface CompiledSubAgent {
  /** The name of the agent */
  name: string;
  /** The description of the agent */
  description: string;
  /** The agent instance */
  runnable: ReactAgent<any, any, any, any> | Runnable;
}

/**
 * Type definitions for subagents
 */
export interface SubAgent {
  /** The name of the agent */
  name: string;
  /** The description of the agent */
  description: string;
  /** The system prompt to use for the agent */
  systemPrompt: string;
  /** The tools to use for the agent (tool instances, not names). Defaults to defaultTools */
  tools?: StructuredTool[];
  /** The model for the agent. Defaults to default_model */
  model?: LanguageModelLike | string;
  /** Additional middleware to append after default_middleware */
  middleware?: AgentMiddleware[];
  /** The tool configs to use for the agent */
  interruptOn?: Record<string, boolean | InterruptOnConfig>;
}

/**
 * Filter state to exclude certain keys when passing to subagents
 */
function filterStateForSubagent(
  state: Record<string, unknown>
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state)) {
    if (!EXCLUDED_STATE_KEYS.includes(key as never)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Create Command with filtered state update from subagent result
 */
function returnCommandWithStateUpdate(
  result: Record<string, unknown>,
  toolCallId: string
): Command {
  const stateUpdate = filterStateForSubagent(result);
  const messages = result.messages as Array<{ content: string }>;
  const lastMessage = messages?.[messages.length - 1];

  return new Command({
    update: {
      ...stateUpdate,
      messages: [
        new ToolMessage({
          content: lastMessage?.content || 'Task completed',
          tool_call_id: toolCallId,
          name: 'task',
        }),
      ],
    },
  });
}

/**
 * Create subagent instances from specifications
 */
function getSubagents(options: {
  defaultModel: LanguageModelLike | string;
  defaultTools: StructuredTool[];
  defaultMiddleware: AgentMiddleware[] | null;
  defaultInterruptOn: Record<string, boolean | InterruptOnConfig> | null;
  subagents: (SubAgent | CompiledSubAgent)[];
  generalPurposeAgent: boolean;
}): {
  agents: Record<string, ReactAgent<any, any, any, any> | Runnable>;
  descriptions: string[];
} {
  const {
    defaultModel,
    defaultTools,
    defaultMiddleware,
    defaultInterruptOn,
    subagents,
    generalPurposeAgent,
  } = options;

  const defaultSubagentMiddleware = defaultMiddleware || [];
  const agents: Record<string, ReactAgent<any, any, any, any> | Runnable> = {};
  const subagentDescriptions: string[] = [];

  // Create general-purpose agent if enabled
  if (generalPurposeAgent) {
    const generalPurposeMiddleware = [...defaultSubagentMiddleware];
    if (defaultInterruptOn) {
      generalPurposeMiddleware.push(
        humanInTheLoopMiddleware({ interruptOn: defaultInterruptOn })
      );
    }

    const generalPurposeSubagent = createAgent({
      model: defaultModel,
      systemPrompt: DEFAULT_SUBAGENT_PROMPT,
      tools: defaultTools as any,
      middleware: generalPurposeMiddleware,
    });

    agents['general-purpose'] = generalPurposeSubagent;
    subagentDescriptions.push(
      `- general-purpose: ${DEFAULT_GENERAL_PURPOSE_DESCRIPTION}`
    );
  }

  // Process custom subagents
  for (const agentParams of subagents) {
    subagentDescriptions.push(
      `- ${agentParams.name}: ${agentParams.description}`
    );

    if ('runnable' in agentParams) {
      agents[agentParams.name] = agentParams.runnable;
    } else {
      const middleware = agentParams.middleware
        ? [...defaultSubagentMiddleware, ...agentParams.middleware]
        : [...defaultSubagentMiddleware];

      const interruptOn = agentParams.interruptOn || defaultInterruptOn;
      if (interruptOn)
        middleware.push(humanInTheLoopMiddleware({ interruptOn }));

      agents[agentParams.name] = createAgent({
        model: agentParams.model ?? defaultModel,
        systemPrompt: agentParams.systemPrompt,
        tools: agentParams.tools ?? defaultTools,
        middleware,
      });
    }
  }

  return { agents, descriptions: subagentDescriptions };
}

/**
 * Create the task tool for invoking subagents
 */
function createTaskTool(options: {
  defaultModel: LanguageModelLike | string;
  defaultTools: StructuredTool[];
  defaultMiddleware: AgentMiddleware[] | null;
  defaultInterruptOn: Record<string, boolean | InterruptOnConfig> | null;
  subagents: (SubAgent | CompiledSubAgent)[];
  generalPurposeAgent: boolean;
  taskDescription: string | null;
}) {
  const {
    defaultModel,
    defaultTools,
    defaultMiddleware,
    defaultInterruptOn,
    subagents,
    generalPurposeAgent,
    taskDescription,
  } = options;

  const { agents: subagentGraphs, descriptions: subagentDescriptions } =
    getSubagents({
      defaultModel,
      defaultTools,
      defaultMiddleware,
      defaultInterruptOn,
      subagents,
      generalPurposeAgent,
    });

  const finalTaskDescription = taskDescription
    ? taskDescription
    : getTaskToolDescription(subagentDescriptions);

  return tool(
    async (
      input: { description: string; subagent_type: string },
      config
    ): Promise<Command | string> => {
      const { description, subagent_type } = input;

      // Validate subagent type
      if (!(subagent_type in subagentGraphs)) {
        const allowedTypes = Object.keys(subagentGraphs)
          .map(k => `\`${k}\``)
          .join(', ');
        throw new Error(
          `Error: invoked agent of type ${subagent_type}, the only allowed types are ${allowedTypes}`
        );
      }

      const subagent = subagentGraphs[subagent_type];

      // Get current state and filter it for subagent
      const currentState = getCurrentTaskInput<Record<string, unknown>>();
      const subagentState = filterStateForSubagent(currentState);
      subagentState.messages = [new HumanMessage({ content: description })];

      // Invoke the subagent
      const result = (await subagent.invoke(subagentState, config)) as Record<
        string,
        unknown
      >;

      // Return command with filtered state update
      if (!config.toolCall?.id) {
        throw new Error('Tool call ID is required for subagent invocation');
      }

      return returnCommandWithStateUpdate(result, config.toolCall.id);
    },
    {
      name: 'task',
      description: finalTaskDescription,
      schema: z.object({
        description: z
          .string()
          .describe('The task to execute with the selected agent'),
        subagent_type: z
          .string()
          .describe(
            `Name of the agent to use. Available: ${Object.keys(subagentGraphs).join(', ')}`
          ),
      }),
    }
  );
}

/**
 * Options for creating subagent middleware
 */
export interface SubAgentMiddlewareOptions {
  /** The model to use for subagents */
  defaultModel: LanguageModelLike | string;
  /** The tools to use for the default general-purpose subagent */
  defaultTools?: StructuredTool[];
  /** Default middleware to apply to all subagents */
  defaultMiddleware?: AgentMiddleware[] | null;
  /** The tool configs for the default general-purpose subagent */
  defaultInterruptOn?: Record<string, boolean | InterruptOnConfig> | null;
  /** A list of additional subagents to provide to the agent */
  subagents?: (SubAgent | CompiledSubAgent)[];
  /** Full system prompt override */
  systemPrompt?: string | null;
  /** Whether to include the general-purpose agent */
  generalPurposeAgent?: boolean;
  /** Custom description for the task tool */
  taskDescription?: string | null;
}

/**
 * Create subagent middleware with task tool
 */
export function createSubAgentMiddleware(
  options: SubAgentMiddlewareOptions
): AgentMiddleware {
  const {
    defaultModel,
    defaultTools = [],
    defaultMiddleware = null,
    defaultInterruptOn = null,
    subagents = [],
    systemPrompt = '',
    generalPurposeAgent = true,
    taskDescription = null,
  } = options;

  const taskTool = createTaskTool({
    defaultModel,
    defaultTools,
    defaultMiddleware,
    defaultInterruptOn,
    subagents,
    generalPurposeAgent,
    taskDescription,
  });

  return createMiddleware({
    name: 'subAgentMiddleware',
    tools: [taskTool],
    wrapModelCall: async (request, handler) => {
      if (systemPrompt !== null) {
        const currentPrompt = request.systemPrompt || '';
        const newPrompt = currentPrompt
          ? `${currentPrompt}\n\n${systemPrompt}`
          : systemPrompt;

        return handler({
          ...request,
          systemPrompt: newPrompt,
        });
      }
      return handler(request);
    },
  });
}
