import { NextResponse } from "next/server";
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
  have: boolean | null; // null = common mixer
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

export async function GET() {
  const supabase = getSupabase();

  try {
    // Get user's bottles
    const { data: bottles, error } = await supabase
      .from("bottles")
      .select("brand, product_name, category, sub_category")
      .gt("quantity", 0);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to load inventory" },
        { status: 500 }
      );
    }

    if (!bottles || bottles.length === 0) {
      return NextResponse.json({
        success: true,
        recipes: [],
        message: "Add some bottles to get recipe suggestions",
      });
    }

    // Format bottles for prompt
    const bottleList = bottles
      .map((b: any) => `- ${b.brand} ${b.product_name} (${b.sub_category || b.category})`)
      .join("\n");

    // Get recipe suggestions from Claude
    const message = await anthropic.messages.create({
      model: config.ai.recipeModel,
      max_tokens: config.ai.maxTokens.recipes,
      messages: [
        {
          role: "user",
          content: `Given these bottles in my bar:
${bottleList}

Suggest ${config.recipes.suggestionCount} cocktails I can make or almost make. Prioritize cocktails where I have the main spirit(s).

IMPORTANT: Use well-known, classic cocktail names when possible (e.g., "Aperol Spritz", "Piña Colada", "Margarita", "Mojito") so images can be found in cocktail databases.

For each cocktail return a JSON object with:
{
  "name": "Cocktail name",
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
- Include classic cocktails that use my bottles
- Include some creative or lesser-known options
- Vary the difficulty levels
- Keep instructions concise but complete

Return ONLY a valid JSON array, no markdown, no code blocks, no explanation.`,
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
    let rawRecipes;
    try {
      const cleanedText = cleanJsonResponse(textContent.text);
      rawRecipes = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse recipes:", textContent.text);
      return NextResponse.json(
        { success: false, error: "Failed to parse recipe suggestions" },
        { status: 500 }
      );
    }

    // Process recipes to mark which ingredients user has
    const userBottleNames = bottles.map((b: any) => 
      `${b.brand} ${b.product_name}`.toLowerCase()
    );
    const userCategories = bottles.map((b: any) => 
      (b.sub_category || b.category || "").toLowerCase()
    );

    // Fetch images for all recipes in parallel
    const imagePromises = rawRecipes.map((recipe: any) => 
      getCocktailImage(recipe.name)
    );
    const images = await Promise.all(imagePromises);

    const processedRecipes: Recipe[] = rawRecipes.map((recipe: any, index: number) => {
      const ingredients: RecipeIngredient[] = recipe.ingredients.map((ing: any) => {
        const itemLower = ing.item.toLowerCase();
        
        // Check if it's a common mixer
        const isCommonMixer = config.recipes.commonMixers.some(
          mixer => itemLower.includes(mixer.toLowerCase())
        );
        
        if (isCommonMixer || !ing.isSpirit) {
          return { ...ing, have: null }; // null = common/not tracked
        }

        // Check if user has this spirit
        const hasSpirit = userBottleNames.some(name => 
          name.includes(itemLower) || itemLower.includes(name.split(" ")[0])
        ) || userCategories.some(cat => 
          itemLower.includes(cat) || cat.includes(itemLower)
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

      return {
        ...recipe,
        ingredients,
        missingSpirits,
        category,
        imageUrl: images[index],
      };
    });

    // Sort by category (can_make first, then almost, then need_shopping)
    const categoryOrder = { can_make: 0, almost: 1, need_shopping: 2 };
    processedRecipes.sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category]);

    return NextResponse.json({
      success: true,
      recipes: processedRecipes,
      bottleCount: bottles.length,
    });
  } catch (error) {
    console.error("Recipes error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate recipes" },
      { status: 500 }
    );
  }
}
