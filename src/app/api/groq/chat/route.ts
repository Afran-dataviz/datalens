/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { messages, schemaMeta, summaryStats, sampleRows } = await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'gsk_placeholder') {
      return NextResponse.json(
        { error: "Groq API key is not configured on the server. Please check your .env.local file." },
        { status: 500 }
      );
    }

    // Build the system prompt with rich dataset context
    const systemPrompt = `You are a professional, elite data analyst assistant inside the DataLens SaaS platform. 
You are helping the user analyze their uploaded dataset.

Here is the context about their spreadsheet:
- Column Metadata (Schema): ${JSON.stringify(schemaMeta)}
- Summary Statistics: ${JSON.stringify(summaryStats)}
- Sample Data (First 10 rows): ${JSON.stringify(sampleRows)}

Answer the user's questions about this data accurately. Highlight anomalies, explain numeric statistics (like mean, stdDev, and null frequencies), and help write code, SQL, or insights. Keep your responses clear, professional, and formatted in clean markdown.`;

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
