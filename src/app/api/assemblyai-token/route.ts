import { AssemblyAI } from "assemblyai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY || process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || "";
    
    console.log("API Key available:", !!apiKey);
    
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Create a direct instance of AssemblyAI
    const assemblyAI = new AssemblyAI({ apiKey });
    
    // Debug the client structure
    console.log("Client structure:", {
      hasRealtime: !!assemblyAI.realtime,
      realtimeMethods: assemblyAI.realtime ? Object.keys(assemblyAI.realtime) : 'N/A'
    });
    
    // Generate temporary token
    const token = await assemblyAI.realtime.createTemporaryToken({ expires_in: 480 });
    
    if (!token) {
      return NextResponse.json({ error: "Token generation failed" }, { status: 500 });
    }
    
    console.log("Token generated successfully:", !!token);
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      error: "Failed to generate token", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}