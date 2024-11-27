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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="server">Server</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="utils">Utils</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] w-full rounded-md border p-4">
            <TabsContent value="server" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">server.js</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import express from 'express';
import cors from 'cors';
import * as tf from '@tensorflow/tfjs';
// ... rest of server.js code`}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="routes" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">routes/model.js</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`import express from 'express';
import { trainingRouter } from './model/training.js';
// ... rest of routes code`}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="components" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Components</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`// ChampionPredictions.tsx
import React, { useState, useEffect } from 'react';
// ... rest of components code`}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="utils" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Utilities</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{`// predictionUtils.ts
import * as tf from '@tensorflow/tfjs';
// ... rest of utils code`}</code>
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