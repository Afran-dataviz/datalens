/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { 
      messages, 
      schemaMeta, 
      summaryStats, 
      sampleRows, 
      fileName, 
      totalRows 
    } = await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'gsk_placeholder') {
      return NextResponse.json(
        { error: "Groq API key is not configured on the server. Please check your .env.local file." },
        { status: 500 }
      );
    }

    const columnNames = schemaMeta ? schemaMeta.map((c: any) => c.name).join(', ') : '';
    const sampleData = JSON.stringify(sampleRows);

    // Build the system prompt with rich dataset context
    const systemPrompt = `
You are DataLens AI, an expert data analyst assistant.
You have been given access to a dataset and you must 
answer ALL questions directly and conversationally.

CRITICAL RULES:
1. NEVER show SQL queries to the user
2. NEVER explain how to calculate something
3. ALWAYS give the direct answer immediately
4. Use the actual data provided to calculate answers
5. Format numbers nicely: 1200 = $1,200 or 1.2K
6. Be conversational like ChatGPT
7. Keep answers short and to the point
8. If asked for total → calculate and give the number
9. If asked for average → calculate and give the number
10. If asked for comparison → give direct comparison

RESPONSE FORMAT:
- Start with the direct answer immediately
- Use bullet points only if listing multiple items
- Use emojis sparingly to make it friendly
- Maximum 3-4 lines for simple questions
- Only elaborate if user asks for explanation

EXAMPLES OF GOOD RESPONSES:
User: "what is total revenue in bangalore?"
AI: "Total revenue from Bangalore is $1,200 
    from 1 order (PRIYA SHARMA - Laptop Pro) 🎯"

User: "which product sells the most?"
AI: "Laptop Pro is your top selling product 
    with 7 units sold across 5 orders 🏆"

User: "what is average order value?"
AI: "Your average order value is $842.50 💰"

User: "how many orders are pending?"
AI: "There are 4 pending orders worth $3,450 total ⏳"

DATASET CONTEXT:
You have access to the full dataset with these details:
- Dataset name: ${fileName || 'dataset.json'}
- Columns: ${columnNames}
- Total rows: ${totalRows || 0}
- Sample data (first 10 rows): ${sampleData}
- Summary statistics: ${JSON.stringify(summaryStats)}

Use this data to calculate EXACT answers.
Do not say "based on sample data" - give definitive answers.
`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
        temperature: 0.2,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      return NextResponse.json(
        { error: `Groq API Error: ${errText}` },
        { status: groqResponse.status }
      );
    }

    // Proxy the stream back to the client
    return new Response(groqResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
