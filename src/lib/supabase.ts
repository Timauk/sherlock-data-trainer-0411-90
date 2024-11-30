import { createClient } from '@supabase/supabase-js';
import { toast } from "@/components/ui/use-toast";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are not set');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: async (url, options = {}) => {
      const MAX_RETRIES = 3;
      const INITIAL_BACKOFF = 1000; // 1 second

      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        try {
          const response = await fetch(url, options);
          
          if (response.status === 429) {
            const backoff = INITIAL_BACKOFF * Math.pow(2, attempt);
            console.warn(`Rate limited, retrying in ${backoff}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            attempt++;
            continue;
          }

          if (response.status === 404) {
            toast({
              title: "Erro de Conexão",
              description: "Não foi possível conectar ao servidor. Tentando novamente...",
              variant: "destructive"
            });
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return response;
        } catch (error) {
          if (attempt === MAX_RETRIES - 1) {
            toast({
              title: "Erro de Conexão",
              description: "Não foi possível estabelecer conexão com o servidor. Verifique sua conexão com a internet.",
              variant: "destructive"
            });
            throw error;
          }
          attempt++;
          await new Promise(resolve => setTimeout(resolve, INITIAL_BACKOFF * Math.pow(2, attempt)));
        }
      }
      throw new Error('Max retries exceeded');
    }
  }
});

export const handleOfflineError = (error: any) => {
  if (error?.message?.includes('offline')) {
    toast({
      title: "Modo Offline",
      description: "Você está offline. Algumas funcionalidades podem estar indisponíveis.",
      variant: "warning"
    });
    return true;
  }
  return false;
};