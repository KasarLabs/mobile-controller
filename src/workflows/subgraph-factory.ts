/**
 * SubgraphFactory - Abstract Base Class for App Subgraphs
 *
 * This factory pattern makes it easy to create new app subgraphs by:
 * 1. Extending this class
 * 2. Implementing the abstract methods (createSubgraph, addWorkflows)
 * 3. Using the provided helper methods for common graph operations
 *
 * Example:
 * ```typescript
 * class MyAppSubgraph extends SubgraphFactory {
 *   createSubgraph() {
 *     const graph = new StateGraph(MyAnnotation);
 *     this.addWorkflows(graph);
 *     return graph.compile();
 *   }
 *
 *   addWorkflows(graph: StateGraph) {
 *     this.addNode(graph, 'myNode', async (state) => {
 *       // node logic
 *       return state;
 *     });
 *     this.addSequence(graph, ['__start__', 'myNode', END]);
 *   }
 * }
 * ```
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { AppConfig } from './config.js';

/**
 * Abstract base class for creating app-specific subgraphs
 * Provides common functionality and enforces implementation of required methods
 */
export abstract class SubgraphFactory<TState = any> {
  /** Name of the app (e.g., 'tiktok', 'twitter') */
  protected appName: string;

  /** App-specific configuration */
  protected config: AppConfig;

  /**
   * Constructor
   * @param appName - Name of the app
   * @param config - App-specific configuration
   */
  constructor(appName: string, config: AppConfig) {
    this.appName = appName;
    this.config = config;
  }

  /**
   * Create and return the compiled subgraph
   * This is the main method that orchestrates the subgraph creation
   *
   * @returns Compiled StateGraph ready to be used as a subgraph node
   */
  abstract createSubgraph(): any;

  /**
   * Add all workflows/nodes to the graph
   * This is where you define the actual workflow logic
   *
   * @param graph - The StateGraph instance to add nodes and edges to
   */
  abstract addWorkflows(graph: StateGraph<TState>): void;

  /**
   * Helper: Add a node to the graph
   * Wraps StateGraph.addNode with logging
   *
   * @param graph - The StateGraph instance
   * @param name - Node name
   * @param handler - Node handler function
   */
  protected addNode(
    graph: any,
    name: string,
    handler: any
  ): void {
    graph.addNode(name, async (state: any) => {
      console.log(`[${this.appName}] → ${name}`);
      return await handler(state);
    });
  }

  /**
   * Helper: Add an edge between two nodes
   *
   * @param graph - The StateGraph instance
   * @param from - Source node name (use '__start__' for start)
   * @param to - Target node name (use END for end)
   */
  protected addEdge(
    graph: StateGraph<TState>,
    from: any,
    to: any
  ): void {
    graph.addEdge(from, to);
  }

  /**
   * Helper: Add a sequence of edges
   * Connects nodes in order: [A, B, C] creates edges A→B and B→C
   *
   * @param graph - The StateGraph instance
   * @param nodes - Array of node names in sequence
   */
  protected addSequence(
    graph: StateGraph<TState>,
    nodes: Array<string | typeof START | typeof END>
  ): void {
    for (let i = 0; i < nodes.length - 1; i++) {
      this.addEdge(graph, nodes[i] as any, nodes[i + 1] as any);
    }
  }

  /**
   * Helper: Add conditional edge
   * Routes to different nodes based on a condition function
   *
   * @param graph - The StateGraph instance
   * @param source - Source node name
   * @param condition - Function that returns the target node name
   * @param pathMap - Optional mapping of condition results to node names
   */
  protected addConditionalEdge(
    graph: any,
    source: any,
    condition: any,
    pathMap?: Record<string, string>
  ): void {
    graph.addConditionalEdges(source, condition, pathMap);
  }

  /**
   * Get the app name
   * @returns The app name
   */
  public getAppName(): string {
    return this.appName;
  }

  /**
   * Get the app config
   * @returns The app configuration
   */
  public getConfig(): AppConfig {
    return this.config;
  }
}
