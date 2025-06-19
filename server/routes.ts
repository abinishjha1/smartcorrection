import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { DocumentProcessor } from "./services/documentProcessor";
import { DemoProcessor } from "./services/demoProcessor";
import { VectorService } from "./services/vectorService";
import { RAGService } from "./services/ragService";
import { insertDocumentSchema, insertChatMessageSchema, type VectorChunk } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Error handler utility
const handleError = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unknown error';
};

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Upload and process documents
  app.post("/api/documents/upload", upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const results = [];
      
      for (const file of req.files) {
        const { originalname, path: filePath } = file;
        
        // Determine document type based on filename or content
        const type = req.body.type || (originalname.toLowerCase().includes('transcript') ? 'transcript' : 'policy');
        
        // Parse document content with real structure
        const content = DocumentProcessor.parseDocument(filePath, originalname);
        
        // Create document record
        const document = await storage.createDocument({
          name: originalname,
          type,
          content,
          chunks: [], // Will be populated during processing
        });

        // Clean up uploaded file
        fs.unlinkSync(filePath);
        
        results.push(document);
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Process document for vector indexing
  app.post("/api/documents/:id/process", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Process document with real OpenAI embeddings
      const content = document.content;
      const chunks = DocumentProcessor.chunkDocument(
        content,
        documentId,
        document.name,
        document.type as 'transcript' | 'policy'
      );

      if (chunks.length === 0) {
        return res.status(400).json({ error: 'No content chunks created from document' });
      }

      // Generate real embeddings using OpenAI
      const texts = chunks.map(chunk => chunk.text);
      const embeddings = await VectorService.generateEmbeddings(texts);

      // Combine chunks with embeddings
      const vectorChunks: VectorChunk[] = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index]
      }));

      // Store vector chunks
      await storage.storeVectorChunks(vectorChunks);

      // Mark document as processed
      await storage.updateDocumentProcessed(documentId, true);

      res.json({ 
        success: true, 
        chunksCreated: vectorChunks.length,
        document: await storage.getDocument(documentId)
      });
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      await storage.deleteDocument(documentId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Process RAG query
  app.post("/api/chat/query", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query is required" });
      }

      // Process the query using RAG
      const ragResponse = await RAGService.processQuery(query);
      
      // Store the chat message
      await storage.createChatMessage({
        message: query,
        response: ragResponse.answer,
        sources: ragResponse.sources,
      });

      res.json(ragResponse);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Get chat history
  app.get("/api/chat/history", async (req, res) => {
    try {
      const messages = await storage.getAllChatMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Clear chat history
  app.delete("/api/chat/history", async (req, res) => {
    try {
      await storage.clearChatHistory();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Get vector index statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      const vectorChunks = await storage.getAllVectorChunks();
      const chatMessages = await storage.getAllChatMessages();
      
      const transcriptChunks = vectorChunks.filter(chunk => chunk.metadata.type === 'transcript');
      const policyChunks = vectorChunks.filter(chunk => chunk.metadata.type === 'policy');
      
      const stats = {
        totalDocuments: documents.length,
        processedDocuments: documents.filter(doc => doc.processed).length,
        transcriptDocuments: documents.filter(doc => doc.type === 'transcript').length,
        policyDocuments: documents.filter(doc => doc.type === 'policy').length,
        totalChunks: vectorChunks.length,
        transcriptChunks: transcriptChunks.length,
        policyChunks: policyChunks.length,
        totalQueries: chatMessages.length,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Serve uploaded files statically with PDF.js viewer for deep linking
  app.use('/uploads', express.static('uploads'));
  
  // PDF viewer route with deep linking support
  app.get('/pdf-viewer/:filename', (req, res) => {
    const { filename } = req.params;
    const { page, search } = req.query;
    
    const pdfViewerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>PDF Viewer - ${filename}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
        <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0;">${filename}</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button onclick="prevPage()" style="padding: 8px 16px;">Previous</button>
                <span>Page <span id="pageNum">1</span> of <span id="pageCount">--</span></span>
                <button onclick="nextPage()" style="padding: 8px 16px;">Next</button>
                ${search ? `<span style="margin-left: 20px; padding: 4px 8px; background: #fffacd; border-radius: 4px;">Searching: "${search}"</span>` : ''}
            </div>
        </div>
        <canvas id="pdfCanvas" style="border: 1px solid #ccc; max-width: 100%;"></canvas>
        
        <script>
            const url = '/uploads/${filename}';
            let pdfDoc = null;
            let pageNum = ${page || 1};
            let pageRendering = false;
            let pageNumPending = null;
            const scale = 1.5;
            const canvas = document.getElementById('pdfCanvas');
            const ctx = canvas.getContext('2d');
            
            pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
                pdfDoc = pdfDoc_;
                document.getElementById('pageCount').textContent = pdfDoc.numPages;
                renderPage(pageNum);
                
                ${search ? `
                // Search functionality
                setTimeout(() => {
                    highlightSearchTerm("${search}");
                }, 1000);
                ` : ''}
            });
            
            function renderPage(num) {
                pageRendering = true;
                pdfDoc.getPage(num).then(function(page) {
                    const viewport = page.getViewport({scale: scale});
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    const renderContext = {
                        canvasContext: ctx,
                        viewport: viewport
                    };
                    
                    const renderTask = page.render(renderContext);
                    renderTask.promise.then(function() {
                        pageRendering = false;
                        if (pageNumPending !== null) {
                            renderPage(pageNumPending);
                            pageNumPending = null;
                        }
                    });
                });
                
                document.getElementById('pageNum').textContent = num;
            }
            
            function queueRenderPage(num) {
                if (pageRendering) {
                    pageNumPending = num;
                } else {
                    renderPage(num);
                }
            }
            
            function prevPage() {
                if (pageNum <= 1) return;
                pageNum--;
                queueRenderPage(pageNum);
            }
            
            function nextPage() {
                if (pageNum >= pdfDoc.numPages) return;
                pageNum++;
                queueRenderPage(pageNum);
            }
            
            function highlightSearchTerm(searchTerm) {
                // This would implement text search highlighting
                console.log('Searching for:', searchTerm);
            }
        </script>
    </body>
    </html>`;
    
    res.send(pdfViewerHtml);
  });

  const httpServer = createServer(app);
  return httpServer;
}
