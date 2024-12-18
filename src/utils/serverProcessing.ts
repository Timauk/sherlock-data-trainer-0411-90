import { toast } from '@/components/ui/use-toast';

export async function processOnServer(data: any) {
  try {
    const response = await fetch('http://localhost:3001/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Erro no processamento do servidor');
    }

    return await response.json();
  } catch (error) {
    toast({
      title: "Erro no Processamento",
      description: "Ocorreu um erro ao processar no servidor. Tentando localmente...",
      variant: "destructive"
    });
    return null;
  }
}