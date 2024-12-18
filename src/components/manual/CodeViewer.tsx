import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CodeViewer = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sistema Completo - Código Fonte</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="server" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="server">Server</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="utils">Utils</TabsTrigger>
            <TabsTrigger value="hooks">Hooks</TabsTrigger>
            <TabsTrigger value="types">Types</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] w-full rounded-md border p-4">
            <TabsContent value="server" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">server.js</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import express from 'express';
import cors from 'cors';
import * as tf from '@tensorflow/tfjs';
import { logger } from './src/utils/logging/logger.js';
import { cacheMiddleware } from './src/utils/performance/serverCache.js';
// ... rest of server.js code`}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="routes" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Routes</h3>
                <h4 className="font-medium">routes/model.js</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import express from 'express';
import { trainingRouter } from './model/training.js';
import { predictionRouter } from './model/prediction.js';
// ... rest of model.js code`}</code>
                </pre>

                <h4 className="font-medium">routes/model/training.js</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns } from './utils.js';
// ... rest of training.js code`}</code>
                </pre>

                <h4 className="font-medium">routes/model/prediction.js</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns } from './utils.js';
// ... rest of prediction.js code`}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="components" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Components</h3>
                
                <h4 className="font-medium">ChampionPredictions.tsx</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
// ... rest of ChampionPredictions.tsx code`}</code>
                </pre>

                <h4 className="font-medium">PlayerList.tsx</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
// ... rest of PlayerList.tsx code`}</code>
                </pre>

                <h4 className="font-medium">FrequencyAnalysis.tsx</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// ... rest of FrequencyAnalysis.tsx code`}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="utils" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Utils</h3>
                
                <h4 className="font-medium">predictionUtils.ts</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import * as tf from '@tensorflow/tfjs';
import { ModelVisualization } from '../types/gameTypes';
// ... rest of predictionUtils.ts code`}</code>
                </pre>

                <h4 className="font-medium">timeSeriesAnalysis.ts</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`interface ArimaConfig {
  p: number;
  d: number;
  q: number;
}
// ... rest of timeSeriesAnalysis.ts code`}</code>
                </pre>

                <h4 className="font-medium">tfSetup.ts</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import * as tf from '@tensorflow/tfjs';
import * as tfjsNode from '@tensorflow/tfjs-node-gpu';
// ... rest of tfSetup.ts code`}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="hooks" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Hooks</h3>
                
                <h4 className="font-medium">useGameLoop.ts</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player, ModelVisualization } from '@/types/gameTypes';
// ... rest of useGameLoop.ts code`}</code>
                </pre>

                <h4 className="font-medium">useGameLogic.ts</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/components/ui/use-toast";
// ... rest of useGameLogic.ts code`}</code>
                </pre>

                <h4 className="font-medium">useModelTraining.ts</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { WorkerPool } from '@/utils/performance/workerPool';
// ... rest of useModelTraining.ts code`}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="types" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Types</h3>
                
                <h4 className="font-medium">gameTypes.ts</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`export interface Player {
  id: number;
  score: number;
  predictions: number[];
  weights: number[];
  fitness: number;
  generation: number;
}

export interface ModelVisualization {
  input: number[];
  output: number[];
  weights: number[][];
}

// ... rest of gameTypes.ts code`}</code>
                </pre>

                <h4 className="font-medium">monitoring.ts</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`export interface LogEntry {
  type: string;
  message: string;
  timestamp: string;
  details?: any;
}

// ... rest of monitoring.ts code`}</code>
                </pre>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CodeViewer;