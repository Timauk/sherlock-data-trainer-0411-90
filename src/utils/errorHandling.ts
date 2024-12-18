import { toast } from "@/components/ui/use-toast";

export const handleApiError = (error: any) => {
  if (error?.response?.status === 429) {
    toast({
      title: "Muitas Requisições",
      description: "Por favor, aguarde um momento antes de tentar novamente.",
      variant: "default"
    });
    return;
  }

  if (error?.message?.includes('offline') || error?.message?.includes('Failed to fetch')) {
    toast({
      title: "Erro de Conexão",
      description: "Verifique sua conexão com a internet.",
      variant: "destructive"
    });
    return;
  }

  toast({
    title: "Erro",
    description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
    variant: "destructive"
  });
};