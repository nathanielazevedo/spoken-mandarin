import { NextResponse } from "next/server";
import OpenAI from "openai";
import { pinyin } from "pinyin-pro";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Normalize text for comparison: lowercase, remove punctuation, trim
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[，。！？、：；""''（）【】]/g, "") // Chinese punctuation
    .replace(/[,.!?;:'"()\[\]]/g, "") // English punctuation
    .replace(/\s+/g, " ")
    .trim();
}

// Tokenize pinyin into words (split by spaces)
function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((token) => token.length > 0);
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity ratio (0-1)
function calculateSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  return 1 - distance / maxLength;
}

// Find mismatched tokens between transcript and target
function findMismatches(
  transcriptTokens: string[],
  targetTokens: string[]
): { index: number; expected: string; received: string }[] {
  const mismatches: { index: number; expected: string; received: string }[] = [];
  const maxLen = Math.max(transcriptTokens.length, targetTokens.length);

  for (let i = 0; i < maxLen; i++) {
    const expected = targetTokens[i] || "";
    const received = transcriptTokens[i] || "";

    if (expected !== received) {
      // Check if it's a close match (similarity > 0.7)
      const similarity = calculateSimilarity(expected, received);
      if (similarity < 0.7) {
        mismatches.push({ index: i, expected, received });
      }
    }
  }

  return mismatches;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const targetPinyin = formData.get("targetPinyin") as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (!targetPinyin) {
      return NextResponse.json({ error: "No target pinyin provided" }, { status: 400 });
    }

    // Get file extension from MIME type
    const mimeType = audioFile.type || "audio/webm";
    let extension = "webm";
    if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
      extension = "m4a";
    } else if (mimeType.includes("ogg")) {
      extension = "ogg";
    } else if (mimeType.includes("wav")) {
      extension = "wav";
    } else if (mimeType.includes("mp3") || mimeType.includes("mpeg")) {
      extension = "mp3";
    }

    // Convert to a File with proper name for Whisper
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const file = new File([buffer], `audio.${extension}`, { type: mimeType });

    // Send audio to OpenAI Whisper for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "zh", // Chinese
      response_format: "text",
    });

    const rawTranscript = (transcription as unknown as string).trim();
    
    // Convert Chinese characters to pinyin
    const transcriptPinyin = pinyin(rawTranscript, { 
      toneType: "symbol",  // Use tone marks like nǐ hǎo
      type: "string",
    });

    // Normalize both texts
    const normalizedTranscript = normalizeText(transcriptPinyin);
    const normalizedTarget = normalizeText(targetPinyin);

    // Tokenize for comparison
    const transcriptTokens = tokenize(normalizedTranscript);
    const targetTokens = tokenize(normalizedTarget);

    // Calculate overall similarity
    const overallSimilarity = calculateSimilarity(normalizedTranscript, normalizedTarget);

    // Find mismatched tokens
    const mismatches = findMismatches(transcriptTokens, targetTokens);

    // Pass threshold: 80% similarity or exact match
    const passed = overallSimilarity >= 0.80 || normalizedTranscript === normalizedTarget;

    return NextResponse.json({
      transcript: rawTranscript,
      transcriptPinyin,
      normalizedTranscript,
      targetPinyin,
      normalizedTarget,
      passed,
      similarity: Math.round(overallSimilarity * 100),
      mismatches,
    });
  } catch (error) {
    console.error("ASR error:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}
