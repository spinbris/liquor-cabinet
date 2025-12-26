export interface BottleIdentification {
  brand: string;
  productName: string;
  category: "whisky" | "gin" | "rum" | "vodka" | "tequila" | "brandy" | "liqueur" | "wine" | "beer" | "other";
  subCategory?: string;
  countryOfOrigin?: string;
  region?: string;
  abv?: number;
  sizeMl?: number;
  description?: string;
  tastingNotes?: string;
  confidence: "high" | "medium" | "low";
}

export interface IdentifyResponse {
  success: boolean;
  bottle?: BottleIdentification;
  error?: string;
}
