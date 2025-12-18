import dotenv from 'dotenv';
dotenv.config();

import { getMobileControllerGraph } from './agents/mobile-controller.js';

const mobileControllerGraph = getMobileControllerGraph();

mobileControllerGraph
  .init()
  .then(async () => {
    await mobileControllerGraph.runAgent();
  })
  .catch(error => {
    console.error('Error initializing or running the graph:', error);
  });
