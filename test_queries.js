// Test script to verify RAG system handles any natural language query
const testQueries = [
  "What transportation challenges does Robert face?",
  "How many times did Nathan mention stress or anxiety?",
  "What are the specific timeframes in the grievance policy?",
  "Compare the employment situations of Robert and Nathan",
  "What programming requirements apply to substance abuse cases?",
  "Did the case managers follow proper check-in procedures?",
  "What coping strategies do the clients use?"
];

async function testQuery(query) {
  try {
    const response = await fetch('http://localhost:5000/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    const result = await response.json();
    console.log(`\n=== QUERY: ${query} ===`);
    console.log(`ANSWER: ${result.answer}`);
    console.log(`SOURCES: ${result.sources?.length || 0} documents`);
    console.log(`REASONING: ${result.reasoning}`);
    return result;
  } catch (error) {
    console.error(`Error testing query "${query}":`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('Testing RAG system with various natural language queries...\n');
  
  for (const query of testQueries) {
    await testQuery(query);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  }
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('RAG system tested with diverse query types');
}

// Run if called directly
if (typeof window === 'undefined') {
  runTests().catch(console.error);
}