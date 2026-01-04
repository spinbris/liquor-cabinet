#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const sql = neon(process.env.DATABASE_URL);

// Simple CSV parser (handles quoted fields with commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result.map(field => field.trim() === '' ? null : field);
}

async function importBottles() {
  console.log('🍾 Importing bottles from Supabase export...');

  const csvPath = path.join(__dirname, '../docs/migration/exports/bottles_rows.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  // Skip header
  const header = lines[0];
  const dataLines = lines.slice(1);

  console.log(`📊 Found ${dataLines.length} bottles to import`);

  let imported = 0;
  let skipped = 0;

  for (const line of dataLines) {
    try {
      const fields = parseCSVLine(line);

      // Map CSV columns to database columns
      const [
        id, brand, product_name, category, sub_category,
        country_of_origin, region, abv, size_ml, description,
        tasting_notes, image_url, quantity, notes, dan_murphys_url,
        created_at, updated_at, user_id
      ] = fields;

      // Insert bottle
      await sql`
        INSERT INTO bottles (
          id, user_id, brand, product_name, category, sub_category,
          country_of_origin, region, abv, size_ml, description,
          tasting_notes, image_url, quantity, notes, dan_murphys_url,
          created_at, updated_at
        )
        VALUES (
          ${id}, ${user_id}, ${brand}, ${product_name}, ${category}, ${sub_category},
          ${country_of_origin}, ${region}, ${abv ? parseFloat(abv) : null},
          ${size_ml ? parseFloat(size_ml) : null}, ${description},
          ${tasting_notes}, ${image_url}, ${quantity ? parseInt(quantity) : 1},
          ${notes}, ${dan_murphys_url},
          ${created_at}, ${updated_at}
        )
        ON CONFLICT (id) DO NOTHING
      `;

      imported++;
      if (imported % 10 === 0) {
        console.log(`   ✓ Imported ${imported}/${dataLines.length} bottles...`);
      }
    } catch (error) {
      console.error(`   ✗ Failed to import bottle: ${error.message}`);
      skipped++;
    }
  }

  console.log(`✅ Bottles import complete: ${imported} imported, ${skipped} skipped\n`);
}

async function importInventoryEvents() {
  console.log('📝 Importing inventory events from Supabase export...');

  const csvPath = path.join(__dirname, '../docs/migration/exports/inventory_events_rows.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  // Skip header
  const header = lines[0];
  const dataLines = lines.slice(1);

  console.log(`📊 Found ${dataLines.length} events to import`);

  let imported = 0;
  let skipped = 0;

  for (const line of dataLines) {
    try {
      const fields = parseCSVLine(line);

      // Map CSV columns to database columns
      const [
        id, bottle_id, event_type, quantity_change, purchase_price,
        purchase_source, notes, event_date, user_id
      ] = fields;

      // Insert event
      await sql`
        INSERT INTO inventory_events (
          id, user_id, bottle_id, event_type, quantity_change,
          purchase_price, purchase_source, notes, event_date
        )
        VALUES (
          ${id}, ${user_id}, ${bottle_id}, ${event_type}, ${parseInt(quantity_change)},
          ${purchase_price ? parseFloat(purchase_price) : null}, ${purchase_source},
          ${notes}, ${event_date}
        )
        ON CONFLICT (id) DO NOTHING
      `;

      imported++;
      if (imported % 10 === 0) {
        console.log(`   ✓ Imported ${imported}/${dataLines.length} events...`);
      }
    } catch (error) {
      console.error(`   ✗ Failed to import event: ${error.message}`);
      skipped++;
    }
  }

  console.log(`✅ Events import complete: ${imported} imported, ${skipped} skipped\n`);
}

async function verifyImport() {
  console.log('🔍 Verifying import...');

  const bottleCount = await sql`SELECT COUNT(*) as count FROM bottles`;
  const eventCount = await sql`SELECT COUNT(*) as count FROM inventory_events`;
  const userCount = await sql`SELECT COUNT(DISTINCT user_id) as count FROM bottles`;

  console.log(`   📊 Total bottles: ${bottleCount[0].count}`);
  console.log(`   📊 Total events: ${eventCount[0].count}`);
  console.log(`   👤 Unique users: ${userCount[0].count}`);

  // Show sample data
  const sampleBottles = await sql`
    SELECT brand, product_name, category, quantity
    FROM bottles
    LIMIT 3
  `;

  console.log('\n   Sample bottles:');
  sampleBottles.forEach(b => {
    console.log(`     - ${b.brand} ${b.product_name} (${b.category}, qty: ${b.quantity})`);
  });

  console.log('\n✅ Import verification complete!\n');
}

// Run import
async function main() {
  try {
    console.log('🚀 Starting Supabase → Neon data migration\n');

    await importBottles();
    await importInventoryEvents();
    await verifyImport();

    console.log('🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
