export interface Database {
  public: {
    Tables: {
      bottles: {
        Row: {
          id: string;
          brand: string;
          product_name: string;
          category: string;
          sub_category: string | null;
          country_of_origin: string | null;
          region: string | null;
          abv: number | null;
          size_ml: number | null;
          description: string | null;
          tasting_notes: string | null;
          image_url: string | null;
          quantity: number;
          notes: string | null;
          dan_murphys_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand: string;
          product_name: string;
          category: string;
          sub_category?: string | null;
          country_of_origin?: string | null;
          region?: string | null;
          abv?: number | null;
          size_ml?: number | null;
          description?: string | null;
          tasting_notes?: string | null;
          image_url?: string | null;
          quantity?: number;
          notes?: string | null;
          dan_murphys_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand?: string;
          product_name?: string;
          category?: string;
          sub_category?: string | null;
          country_of_origin?: string | null;
          region?: string | null;
          abv?: number | null;
          size_ml?: number | null;
          description?: string | null;
          tasting_notes?: string | null;
          image_url?: string | null;
          quantity?: number;
          notes?: string | null;
          dan_murphys_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_events: {
        Row: {
          id: string;
          bottle_id: string;
          event_type: "added" | "finished" | "adjusted";
          quantity_change: number;
          purchase_price: number | null;
          purchase_source: string | null;
          notes: string | null;
          event_date: string;
        };
        Insert: {
          id?: string;
          bottle_id: string;
          event_type: "added" | "finished" | "adjusted";
          quantity_change: number;
          purchase_price?: number | null;
          purchase_source?: string | null;
          notes?: string | null;
          event_date?: string;
        };
        Update: {
          id?: string;
          bottle_id?: string;
          event_type?: "added" | "finished" | "adjusted";
          quantity_change?: number;
          purchase_price?: number | null;
          purchase_source?: string | null;
          notes?: string | null;
          event_date?: string;
        };
      };
    };
  };
}

export type Bottle = Database["public"]["Tables"]["bottles"]["Row"];
export type BottleInsert = Database["public"]["Tables"]["bottles"]["Insert"];
export type BottleUpdate = Database["public"]["Tables"]["bottles"]["Update"];
export type InventoryEvent = Database["public"]["Tables"]["inventory_events"]["Row"];
export type InventoryEventInsert = Database["public"]["Tables"]["inventory_events"]["Insert"];
