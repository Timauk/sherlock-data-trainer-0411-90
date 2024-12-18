import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import Overview from '@/components/manual/Overview';
import PlayersAI from '@/components/manual/PlayersAI';
import Controls from '@/components/manual/Controls';
import Analysis from '@/components/manual/Analysis';
import Techniques from '@/components/manual/Techniques';
import Updates from '@/components/manual/Updates';
import CodeViewer from '@/components/manual/CodeViewer';

const ManualPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manual do Sistema</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-7">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="players">Jogadores & IA</TabsTrigger>
          <TabsTrigger value="controls">Controles</TabsTrigger>
          <TabsTrigger value="analysis">Análises</TabsTrigger>
          <TabsTrigger value="techniques">Técnicas</TabsTrigger>
          <TabsTrigger value="updates">Atualizações</TabsTrigger>
          <TabsTrigger value="code">Código</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
          <TabsContent value="overview">
            <Overview />
          </TabsContent>

          <TabsContent value="players">
            <PlayersAI />
          </TabsContent>

          <TabsContent value="controls">
            <Controls />
          </TabsContent>

          <TabsContent value="analysis">
            <Analysis />
          </TabsContent>

          <TabsContent value="techniques">
            <Techniques />
          </TabsContent>

          <TabsContent value="updates">
            <Updates />
          </TabsContent>

          <TabsContent value="code">
            <CodeViewer />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default ManualPage;