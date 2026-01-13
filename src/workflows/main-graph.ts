/**
 * MainGraph - Orchestration Class for App Workflows
 *
 * This class dynamically creates and connects subgraphs for multiple apps
 * based on the selectedApps configuration. It orchestrates the execution
 * of all app workflows in sequence.
 *
 * Architecture:
 * 1. Takes selectedApps array and bible configuration as constructor parameters
 * 2. Dynamically imports and instantiates subgraph factories for each app
 * 3. Adds each subgraph as a node in the main graph
 * 4. Connects subgraphs in sequence
 * 5. Compiles and returns the final orchestrated graph
 *
 * Example:
 * ```typescript
 * const mainGraph = new MainGraph(['tiktok', 'twitter'], bible);
 * const compiled = await mainGraph.compile();
 * const result = await compiled.invoke({ apps: ['tiktok', 'twitter'] });
 * ```
 */

import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { SubgraphFactory } from './subgraph-factory.js';
import { appConfigs, AppConfig } from './config.js';

/**
 * Main workflow state annotation
 * Tracks the overall workflow execution across all app subgraphs
 */
const MainGraphAnnotation = Annotation.Root({
  /** List of apps to process */
  apps: Annotation<string[]>,
  /** Current app being processed */
  currentApp: Annotation<string | null>,
  /** Results from each app subgraph */
  results: Annotation<Record<string, any>>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
  /** Global messages/logs */
  messages: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  /** Bible configuration */
  bible: Annotation<any>,
});

/**
 * Main workflow state type
 */
type MainGraphState = typeof MainGraphAnnotation.State;

/**
 * MainGraph - Orchestrates execution of multiple app subgraphs
 *
 * Dynamically creates a workflow that:
 * 1. Iterates through selectedApps
 * 2. Creates and adds a subgraph node for each app
 * 3. Connects subgraphs in sequence
 * 4. Executes all app workflows in order
 */
export class MainGraph {
  /** List of apps to include in the workflow */
  private selectedApps: string[];

  /** Bible configuration */
  private bible: any;

  /** Map of app name to subgraph factory instance */
  private subgraphFactories: Map<string, SubgraphFactory>;

  /**
   * Constructor
   * @param selectedApps - Array of app names to include (e.g., ['tiktok', 'twitter'])
   * @param bible - Bible configuration object
   */
  constructor(selectedApps: string[], bible: any) {
    this.selectedApps = selectedApps;
    this.bible = bible;
    this.subgraphFactories = new Map();
  }

  /**
   * Dynamically import and instantiate a subgraph factory for an app
   * Uses dynamic import to load the appropriate subgraph class
   *
   * @param appName - Name of the app (e.g., 'tiktok', 'twitter')
   * @returns SubgraphFactory instance for the app
   * @throws Error if the subgraph module cannot be loaded
   */
  private async loadSubgraphFactory(appName: string): Promise<SubgraphFactory> {
    try {
      // Get app config from configuration
      const config: AppConfig = appConfigs[appName];
      if (!config) {
        throw new Error(`No configuration found for app: ${appName}`);
      }

      // Dynamically import the subgraph module
      // Module path: ./apps/{appName}-subgraph.js (compiled from .ts)
      const modulePath = `./apps/${appName}-subgraph.js`;
      const module = await import(modulePath);

      // Instantiate the subgraph factory (default export)
      const SubgraphClass = module.default;
      const factory = new SubgraphClass(config);

      console.log(`✓ Loaded subgraph factory for: ${appName}`);
      return factory;
    } catch (error) {
      console.error(`✗ Failed to load subgraph for ${appName}:`, error);
      throw new Error(
        `Failed to load subgraph for ${appName}. Make sure ./apps/${appName}-subgraph.ts exists and exports a default class.`
      );
    }
  }

  /**
   * Build the main orchestration graph
   * Dynamically creates subgraph nodes and connects them in sequence
   *
   * @returns StateGraph instance (not yet compiled)
   */
  private async buildGraph() {
    const graph = new StateGraph(MainGraphAnnotation);

    // Load all subgraph factories
    console.log('\nLoading subgraph factories...');
    for (const appName of this.selectedApps) {
      const factory = await this.loadSubgraphFactory(appName);
      this.subgraphFactories.set(appName, factory);
    }

    // Add a start node to initialize state
    graph.addNode('initialize', async (state: MainGraphState) => {
      console.log('\n=== MainGraph: Initializing Workflow ===');
      console.log(`Apps to process: ${this.selectedApps.join(', ')}`);
      console.log(`Bible: ${this.bible.name}`);
      return {
        ...state,
        apps: this.selectedApps,
        bible: this.bible,
        messages: ['Workflow initialized'],
      };
    });

    // Dynamically add subgraph nodes for each app
    // Each subgraph is added directly as a node (not wrapped in a custom function)
    for (const appName of this.selectedApps) {
      const factory = this.subgraphFactories.get(appName);
      if (!factory) continue;

      // Create the compiled subgraph and add it directly as a node
      // The subgraph itself handles all its internal nodes and edges
      const compiledSubgraph = factory.createSubgraph();

      console.log(`✓ Adding ${appName} subgraph as node`);

      // Add the compiled subgraph directly as a node in the main graph
      // LangGraph will execute the entire subgraph when this node is reached
      graph.addNode(appName, compiledSubgraph);
    }

    // Add a completion node
    graph.addNode('complete', async (state: MainGraphState) => {
      console.log('\n=== MainGraph: Workflow Complete ===');
      console.log(`Processed ${this.selectedApps.length} apps`);
      console.log('Results:', Object.keys(state.results));
      return {
        ...state,
        messages: ['All workflows completed'],
      };
    });

    // Connect nodes in sequence: START → initialize → app1 → app2 → ... → complete → END
    const sequence = ['__start__', 'initialize', ...this.selectedApps, 'complete', END];
    for (let i = 0; i < sequence.length - 1; i++) {
      graph.addEdge(sequence[i] as any, sequence[i + 1] as any);
    }

    return graph;
  }

  /**
   * Compile the main graph
   * Builds and compiles the orchestration graph with all subgraphs
   *
   * @returns Compiled StateGraph ready for execution
   */
  async compile() {
    console.log('Building MainGraph...');
    const graph = await this.buildGraph();
    console.log('✓ MainGraph compiled successfully\n');
    return graph.compile();
  }

  /**
   * Get the list of selected apps
   * @returns Array of app names
   */
  getSelectedApps(): string[] {
    return this.selectedApps;
  }

  /**
   * Get the bible configuration
   * @returns Bible configuration object
   */
  getBible(): any {
    return this.bible;
  }
}
