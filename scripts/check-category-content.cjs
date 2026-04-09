const { Client } = require('pg');

async function checkCategoryContent() {
  const client = new Client({
    connectionString: 'postgresql://postgres:sGmPTCagRVFtHszbygRzSvYTdUXgCFfH@crossover.proxy.rlwy.net:38475/railway'
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check L1 categories
    console.log('=== LEVEL 1 CATEGORIES (parent_id IS NULL) ===\n');
    const l1Result = await client.query(
      `SELECT slug, name, 
              description IS NOT NULL as has_desc,
              short_description IS NOT NULL as has_short_desc,
              intro_content IS NOT NULL as has_intro,
              buying_guide IS NOT NULL as has_guide,
              faq IS NOT NULL as has_faq,
              seo_content IS NOT NULL as has_seo
       FROM categories 
       WHERE parent_id IS NULL 
       ORDER BY slug 
       LIMIT 10`
    );

    for (const row of l1Result.rows) {
      console.log(`${row.name} (${row.slug})`);
      console.log(`  description: ${row.has_desc ? '✓' : '✗'}`);
      console.log(`  short_description: ${row.has_short_desc ? '✓' : '✗'}`);
      console.log(`  intro_content: ${row.has_intro ? '✓' : '✗'}`);
      console.log(`  buying_guide: ${row.has_guide ? '✓' : '✗'}`);
      console.log(`  faq: ${row.has_faq ? '✓' : '✗'}`);
      console.log(`  seo_content: ${row.has_seo ? '✓' : '✗'}`);
      console.log('');
    }

    // Check L2 categories
    console.log('\n=== LEVEL 2 CATEGORIES (have parent_id) ===\n');
    const l2Result = await client.query(
      `SELECT c.slug, c.name, p.slug as parent_slug,
              c.description IS NOT NULL as has_desc,
              c.short_description IS NOT NULL as has_short_desc,
              c.intro_content IS NOT NULL as has_intro,
              c.buying_guide IS NOT NULL as has_guide,
              c.faq IS NOT NULL as has_faq,
              c.seo_content IS NOT NULL as has_seo
       FROM categories c
       JOIN categories p ON c.parent_id = p.id
       WHERE p.parent_id IS NULL
       ORDER BY p.slug, c.slug
       LIMIT 10`
    );

    for (const row of l2Result.rows) {
      console.log(`${row.name} (${row.slug}) - Parent: ${row.parent_slug}`);
      console.log(`  description: ${row.has_desc ? '✓' : '✗'}`);
      console.log(`  short_description: ${row.has_short_desc ? '✓' : '✗'}`);
      console.log(`  intro_content: ${row.has_intro ? '✓' : '✗'}`);
      console.log(`  buying_guide: ${row.has_guide ? '✓' : '✗'}`);
      console.log(`  faq: ${row.has_faq ? '✓' : '✗'}`);
      console.log(`  seo_content: ${row.has_seo ? '✓' : '✗'}`);
      console.log('');
    }

    // Check article counts per category
    console.log('\n=== PRODUCT COUNTS BY CATEGORY ===\n');
    const countResult = await client.query(
      `SELECT c.slug, c.name, c.parent_id, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.primary_category_id
       GROUP BY c.id, c.slug, c.name
       ORDER BY c.parent_id, c.slug
       LIMIT 15`
    );

    for (const row of countResult.rows) {
      console.log(`${row.name} (${row.slug}): ${row.product_count} products`);
    }

    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkCategoryContent();
