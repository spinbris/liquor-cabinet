import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BottleIdentification, IdentifyResponse } from "@/lib/types";
import { config } from "@/lib/config";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest): Promise<NextResponse<IdentifyResponse>> {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    // Extract base64 data and media type
    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { success: false, error: "Invalid image format" },
        { status: 400 }
      );
    }

    const mediaType = matches[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const base64Data = matches[2];

    const message = await anthropic.messages.create({
      model: config.ai.identifyModel,
      max_tokens: config.ai.maxTokens.identify,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `Identify this liquor bottle and return ONLY valid JSON (no markdown, no explanation) with these fields:
{
  "brand": "Brand name",
  "productName": "Full product name",
  "category": "whisky|gin|rum|vodka|tequila|brandy|liqueur|wine|beer|other",
  "subCategory": "e.g., bourbon, single malt, spiced rum (optional)",
  "countryOfOrigin": "Country (optional)",
  "region": "Specific region like Kentucky, Speyside (optional)",
  "abv": numeric ABV percentage if visible (optional),
  "sizeMl": bottle size in ml if visible (optional),
  "description": "Brief description of this product",
  "tastingNotes": "Typical tasting notes for this product",
  "confidence": "high|medium|low based on how clearly you can identify it"
}

If you cannot identify a liquor bottle in the image, return:
{"error": "Could not identify a liquor bottle in this image"}`,
            },
          ],
        },
      ],
    });

    // Extract text response
    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { success: false, error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse JSON response
    const responseText = textContent.text.trim();
    const parsed = JSON.parse(responseText);

    if (parsed.error) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      bottle: parsed as BottleIdentification,
    });
  } catch (error) {
    console.error("Identify error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to identify bottle" },
      { status: 500 }
    );
  }
}
