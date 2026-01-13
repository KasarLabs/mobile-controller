/**
 * TikTok Subgraph
 *
 * Orchestrates multiple TikTok workflows as a sequential routine.
 * Each existing TikTok workflow (fyp-liker, storage-poster, inbox-liker, rivals-liker)
 * is added as a node in this subgraph to create a complete automation routine.
 *
 * Workflow Architecture:
 * - Each TikTok workflow is a compiled LangGraph that runs independently
 * - This subgraph chains them together in a sequence
 * - State is managed independently by each workflow
 */

import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { SubgraphFactory } from '../subgraph-factory.js';
import { AppConfig } from '../config.js';

// Import existing TikTok workflow graphs
import { graph as fypLikerGraph } from './tiktok-fyp-liker/graph.js';

/**
 * TikTok routine state annotation
 * Tracks the overall routine execution across all TikTok workflows
 */
const TikTokAnnotation = Annotation.Root({
  /** Current workflow being executed */
  currentWorkflow: Annotation<string | null>,
  /** Results from each workflow */
  workflowResults: Annotation<Record<string, any>>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
  /** Messages/logs from routine execution */
  messages: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  /** Routine completion status */
  completed: Annotation<boolean>({
    reducer: (current, update) => update || current,
    default: () => false,
  }),
});

/**
 * TikTok routine state type
 */
type TikTokState = typeof TikTokAnnotation.State;

/**
 * TikTok Subgraph Implementation
 * Orchestrates multiple TikTok workflows in sequence:
 * 1. FYP Liker - Like videos on For You Page
 * 2. Storage Poster - Post videos from storage
 * 3. Inbox Liker - Like videos in inbox
 * 4. Rivals Liker - Like videos from rivals
 */
export default class TikTokSubgraph extends SubgraphFactory<TikTokState> {
  /**
   * Constructor
   * @param config - TikTok app configuration
   */
  constructor(config: AppConfig) {
    super('tiktok', config);
  }

  /**
   * Create the TikTok routine subgraph
   * Initializes the StateGraph and adds all workflows as nodes
   *
   * @returns Compiled StateGraph orchestrating all TikTok workflows
   */
  createSubgraph() {
    const graph = new StateGraph(TikTokAnnotation);
    this.addWorkflows(graph);
    return graph.compile();
  }

  /**
   * Add TikTok workflows to the graph
   * Each workflow is added as a node that executes the entire workflow graph
   *
   * @param graph - The StateGraph instance
   */
  addWorkflows(graph: StateGraph<TikTokState>) {
    // Initialize node
    this.addNode(graph, 'initialize', async (state: TikTokState) => {
      console.log(`\n[TikTok Routine] Starting TikTok automation routine`);
      console.log(`[TikTok Routine] Package: ${this.config.packageName}`);
      return {
        ...state,
        currentWorkflow: 'initialize',
        messages: ['TikTok routine initialized'],
      };
    });

    // Add existing TikTok workflows as nodes
    // Each compiled graph is added directly as a node
    console.log(`[TikTok Routine] Adding workflow: FYP Liker`);
    graph.addNode('fyp_liker', fypLikerGraph);

    // console.log(`[TikTok Routine] Adding workflow: Storage Poster`);
    // graph.addNode('storage_poster', storagePosterGraph);

    // Completion node
    this.addNode(graph, 'complete', async (state: TikTokState) => {
      console.log(`\n[TikTok Routine] All TikTok workflows completed`);
      return {
        ...state,
        currentWorkflow: 'complete',
        messages: ['TikTok routine completed successfully'],
        completed: true,
      };
    });

    // Create workflow sequence: initialize → fyp → storage → inbox → rivals → complete → END
    this.addSequence(graph, [
      '__start__',
      'initialize',
      'fyp_liker',
      'complete',
      END,
    ]);
  }
}
