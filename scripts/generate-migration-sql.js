const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';

function escape(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'boolean') return str ? 'true' : 'false';
  if (typeof str === 'number') return str.toString();
  if (typeof str === 'object') return "'" + JSON.stringify(str).replace(/'/g, "''") + "'";
  return "'" + str.toString().replace(/'/g, "''") + "'";
}

function toDate(v) {
  if (!v) return 'now()';
  return "'" + new Date(v).toISOString() + "'";
}

async function main() {
  const mongo = new MongoClient(MONGODB_URI);
  await mongo.connect();
  const db = mongo.db('machrio');
  
  let sql = '-- Articles Migration\n\n';
  
  const arts = await db.collection('articles').find({}).toArray();
  console.error('Articles: ' + arts.length);
  
  for (const a of arts) {
    sql += `INSERT INTO articles (title, slug, description, content, category, tags, featured_image, author, status, published_at, meta_title, meta_description, created_at, updated_at)
VALUES (${escape(a.title)}, ${escape(a.slug)}, ${escape(a.description)}, ${escape(a.content)}, ${escape(a.category)}, ${escape(a.tags || [])}, ${escape(a.featuredImage)}, ${escape(a.author)}, ${escape(a.status || 'draft')}, ${toDate(a.publishedAt)}, ${escape(a.metaTitle)}, ${escape(a.metaDescription)}, ${toDate(a.createdAt)}, ${toDate(a.updatedAt)})
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, content=EXCLUDED.content, updated_at=EXCLUDED.updated_at;\n`;
  }
  
  sql += '\n-- Brands Migration\n\n';
  
  const brands = await db.collection('brands').find({}).toArray();
  console.error('Brands: ' + brands.length);
  
  for (const b of brands) {
    sql += `INSERT INTO brands (name, slug, description, logo, website, created_at, updated_at)
VALUES (${escape(b.name)}, ${escape(b.slug)}, ${escape(b.description)}, ${escape(b.logo)}, ${escape(b.website)}, ${toDate(b.createdAt)}, ${toDate(b.updatedAt)})
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, updated_at=EXCLUDED.updated_at;\n`;
  }
  
  console.log(sql);
  
  await mongo.close();
}

main().catch(console.error);
