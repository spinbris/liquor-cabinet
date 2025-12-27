import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "@/lib/config";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Strip markdown code blocks if present
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?```\s*$/i, "");
  return cleaned.trim();
}

export interface RecipeIngredient {
  item: string;
  amount: string;
  isSpirit: boolean;
  have: boolean | null;
}

export interface Recipe {
  name: string;
  difficulty: "easy" | "medium" | "hard";
  ingredients: RecipeIngredient[];
  instructions: string;
  glassType: string;
  garnish: string;
  missingSpirits: number;
  category: "can_make" | "almost" | "need_shopping";
  imageUrl: string | null;
}

// Fetch cocktail image from TheCocktailDB
async function getCocktailImage(cocktailName: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(cocktailName)}`
    );
    const data = await response.json();
    return data.drinks?.[0]?.strDrinkThumb || null;
  } catch (error) {
    console.error(`Failed to fetch image for ${cocktailName}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Search query is required" },
        { status: 400 }
      );
    }

    // Get user's bottles for matching
    const { data: bottles } = await supabase
      .from("bottles")
      .select("brand, product_name, category, sub_category")
      .gt("quantity", 0);

    // Get recipe from Claude
    const message = await anthropic.messages.create({
      model: config.ai.recipeModel,
      max_tokens: config.ai.maxTokens.recipes,
      messages: [
        {
          role: "user",
          content: `Give me the recipe for: "${query}"

If this is a known cocktail, return a JSON object with:
{
  "name": "Official cocktail name",
  "difficulty": "easy|medium|hard",
  "ingredients": [
    {"item": "Ingredient name", "amount": "amount with unit", "isSpirit": true/false}
  ],
  "instructions": "Step by step instructions in 2-4 sentences",
  "glassType": "Type of glass",
  "garnish": "Garnish suggestion"
}

Rules:
- isSpirit should be true ONLY for liquors/spirits/liqueurs (not mixers like juice, soda, syrup, bitters)
- Use standard measurements (oz is fine)
- Keep instructions concise but complete
- If the cocktail doesn't exist or you don't recognize it, return: {"error": "Cocktail not found"}

Return ONLY valid JSON, no markdown, no code blocks, no explanation.`,
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

    // Parse JSON response (strip markdown if present)
    let rawRecipe;
    try {
      const cleanedText = cleanJsonResponse(textContent.text);
      rawRecipe = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse recipe:", textContent.text);
      return NextResponse.json(
        { success: false, error: "Failed to parse recipe" },
        { status: 500 }
      );
    }

    // Check for error response
    if (rawRecipe.error) {
      return NextResponse.json(
        { success: false, error: rawRecipe.error },
        { status: 404 }
      );
    }

    // Get cocktail image
    const imageUrl = await getCocktailImage(rawRecipe.name);

    // Process recipe to mark which ingredients user has
    const userBottleNames = (bottles || []).map((b: any) =>
      `${b.brand} ${b.product_name}`.toLowerCase()
    );
    const userCategories = (bottles || []).map((b: any) =>
      (b.sub_category || b.category || "").toLowerCase()
    );

    const ingredients: RecipeIngredient[] = rawRecipe.ingredients.map((ing: any) => {
      const itemLower = ing.item.toLowerCase();

      // Check if it's a common mixer
      const isCommonMixer = config.recipes.commonMixers.some(
        (mixer) => itemLower.includes(mixer.toLowerCase())
      );

      if (isCommonMixer || !ing.isSpirit) {
        return { ...ing, have: null }; // null = common/not tracked
      }

      // Check if user has this spirit
      const hasSpirit =
        userBottleNames.some(
          (name) => name.includes(itemLower) || itemLower.includes(name.split(" ")[0])
        ) ||
        userCategories.some(
          (cat) => itemLower.includes(cat) || cat.includes(itemLower)
        );

      return { ...ing, have: hasSpirit };
    });

    // Count missing spirits
    const missingSpirits = ingredients.filter(
      (i: RecipeIngredient) => i.isSpirit && i.have === false
    ).length;

    // Categorize
    let category: Recipe["category"];
    if (missingSpirits === 0) {
      category = "can_make";
    } else if (missingSpirits === 1) {
      category = "almost";
    } else {
      category = "need_shopping";
    }

    const processedRecipe: Recipe = {
      ...rawRecipe,
      ingredients,
      missingSpirits,
      category,
      imageUrl,
    };

    return NextResponse.json({
      success: true,
      recipe: processedRecipe,
    });
  } catch (error) {
    console.error("Recipe search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search recipe" },
      { status: 500 }
    );
  }
}
