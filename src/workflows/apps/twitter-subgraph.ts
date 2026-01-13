/**
 * Twitter Subgraph
 *
 * Example implementation of a SubgraphFactory for Twitter app automation.
 * This demonstrates how to extend the SubgraphFactory to create app-specific workflows.
 *
 * To add more complex workflows:
 * 1. Add more nodes in the addWorkflows method
 * 2. Define state annotations for Twitter-specific data
 * 3. Use the helper methods (addNode, addEdge, addSequence) to build the graph
 */

import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { SubgraphFactory } from '../subgraph-factory.js';
import { AppConfig } from '../config.js';

/**
 * Twitter workflow state annotation
 * Defines the state structure for Twitter workflows
 */
const TwitterAnnotation = Annotation.Root({
  /** Current step in the workflow */
  step: Annotation<string>,
  /** Messages/logs from workflow execution */
  messages: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  /** Workflow completion status */
  completed: Annotation<boolean>({
    reducer: (current, update) => update || current,
    default: () => false,
  }),
});

/**
 * Twitter workflow state type
 */
type TwitterState = typeof TwitterAnnotation.State;

/**
 * Twitter Subgraph Implementation
 * Extends SubgraphFactory to provide Twitter-specific automation workflows
 */
export default class TwitterSubgraph extends SubgraphFactory<TwitterState> {
  /**
   * Constructor
   * @param config - Twitter app configuration
   */
  constructor(config: AppConfig) {
    super('twitter', config);
  }

  /**
   * Create the Twitter subgraph
   * Initializes the StateGraph and adds all workflows
   *
   * @returns Compiled StateGraph for Twitter workflows
   */
  createSubgraph() {
    const graph = new StateGraph(TwitterAnnotation);
    this.addWorkflows(graph);
    return graph.compile();
  }

  /**
   * Add Twitter workflows to the graph
   * This is where you define the actual workflow steps
   *
   * Currently implements a simple "hello world" workflow.
   * Future enhancements could include:
   * - Opening Twitter app
   * - Scrolling through timeline
   * - Liking tweets
   * - Retweeting content
   * - Following users
   * - Posting tweets
   *
   * @param graph - The StateGraph instance
   */
  addWorkflows(graph: StateGraph<TwitterState>) {
    // Add a simple hello node
    this.addNode(graph, 'hello_twitter', async (state: TwitterState) => {
      console.log(`Hello from Twitter! Package: ${this.config.packageName}`);
      return {
        ...state,
        step: 'hello_twitter',
        messages: [`Twitter subgraph executed for ${this.config.name}`],
        completed: true,
      };
    });

    // Create a simple linear workflow: START → hello_twitter → END
    this.addSequence(graph, ['__start__', 'hello_twitter', END]);

    // Future: Add more complex workflows here
    // Example:
    // this.addNode(graph, 'open_app', async (state) => { ... });
    // this.addNode(graph, 'scroll_timeline', async (state) => { ... });
    // this.addNode(graph, 'like_tweet', async (state) => { ... });
    // this.addSequence(graph, ['__start__', 'open_app', 'scroll_timeline', 'like_tweet', END]);
  }
}
