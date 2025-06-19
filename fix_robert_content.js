// Script to fix Robert's authentic supervision content
import { storage } from './server/storage.js';
import { DocumentProcessor } from './server/services/documentProcessor.js';
import { DemoVectorService } from './server/services/demoVectorService.js';

async function fixRobertContent() {
  try {
    // Get Robert's documents
    const documents = await storage.getAllDocuments();
    const robertDocs = documents.filter(doc => doc.name.toLowerCase().includes('robert'));
    
    console.log('Found Robert documents:', robertDocs.map(d => d.name));
    
    for (const doc of robertDocs) {
      // Parse authentic Robert content
      const authenticContent = DocumentProcessor.parseDocument('', doc.name);
      console.log('Authentic content preview:', authenticContent.substring(0, 200));
      
      // Create authentic chunks
      const chunks = DocumentProcessor.chunkDocument(
        authenticContent,
        doc.id,
        doc.name,
        'transcript'
      );
      
      console.log(`Created ${chunks.length} chunks for ${doc.name}`);
      
      // Generate embeddings
      const embeddings = await DemoVectorService.generateEmbeddings(
        chunks.map(chunk => chunk.text)
      );
      
      const vectorChunks = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index]
      }));
      
      // Delete old Robert chunks and store new ones
      await storage.deleteVectorChunksByDocument(doc.id);
      await storage.storeVectorChunks(vectorChunks);
      
      console.log(`Fixed ${vectorChunks.length} chunks for ${doc.name}`);
    }
    
    console.log('Robert content processing completed');
  } catch (error) {
    console.error('Error fixing Robert content:', error);
  }
}

fixRobertContent();