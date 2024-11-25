import express from 'express';
import { checkpointManager } from './utils/checkpointManager.js';
import compression from 'compression';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Adiciona compressão para reduzir tamanho dos dados
router.use(compression());

// Função para limpar memória do navegador
async function clearBrowserMemory(res) {
  try {
    // Envia comando para limpar IndexedDB
    res.send(`
      <script>
        indexedDB.databases().then((dbs) => {
          dbs.forEach((db) => indexedDB.deleteDatabase(db.name));
        });
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
      </script>
    `);
  } catch (error) {
    console.error('Erro ao limpar memória:', error);
  }
}

router.post('/', async (req, res) => {
  try {
    // Cria worker thread para processamento pesado
    const workerPath = path.join(__dirname, '..', 'workers', 'checkpointWorker.js');
    
    const worker = new Worker(workerPath);
    
    worker.postMessage({
      type: 'SAVE_CHECKPOINT',
      data: {
        timestamp: new Date().toISOString(),
        systemInfo: {
          totalMemory: process.memoryUsage().heapTotal,
          freeMemory: process.memoryUsage().heapUsed,
          uptime: process.uptime()
        },
        gameState: req.body
      }
    });

    worker.on('message', async (result) => {
      if (result.success) {
        await clearBrowserMemory(res);
        res.json({ 
          message: 'Checkpoint salvo e memória limpa',
          filename: result.filename 
        });
      } else {
        throw new Error(result.error);
      }
    });

    worker.on('error', (error) => {
      throw error;
    });

  } catch (error) {
    console.error('Erro ao salvar checkpoint:', error);
    res.status(500).json({ 
      message: 'Erro ao salvar checkpoint', 
      error: error.message 
    });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const checkpoint = await checkpointManager.loadLatestCheckpoint();
    
    if (!checkpoint) {
      return res.status(404).json({ message: 'Nenhum checkpoint encontrado' });
    }
    
    res.json(checkpoint);
  } catch (error) {
    console.error('Erro ao carregar checkpoint:', error);
    res.status(500).json({ 
      message: 'Erro ao carregar checkpoint', 
      error: error.message 
    });
  }
});

export { router as checkpointRouter };