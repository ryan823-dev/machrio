import { getPool } from '../src/lib/db'

async function checkCategories() {
  const pool = getPool()
  const slugs = ['instant-adhesives', 'construction-adhesives', 'wood-glues', 'safety']
  
  for (const slug of slugs) {
    try {
      const result = await pool.query(
        `SELECT id, slug, name, parent_id, 
                description IS NULL as desc_null,
                short_description IS NULL as short_desc_null,
                intro_content IS NULL as intro_null,
                buying_guide IS NULL as guide_null,
                faq IS NULL as faq_null,
                seo_content IS NULL as seo_null
         FROM categories WHERE slug = $1`,
        [slug]
      )
      
      if (result.rows[0]) {
        console.log('\n===', slug, '===')
        console.log('ID:', result.rows[0].id)
        console.log('Name:', result.rows[0].name)
        console.log('Parent ID:', result.rows[0].parent_id)
        console.log('description NULL:', result.rows[0].desc_null)
        console.log('short_description NULL:', result.rows[0].short_desc_null)
        console.log('intro_content NULL:', result.rows[0].intro_null)
        console.log('buying_guide NULL:', result.rows[0].guide_null)
        console.log('faq NULL:', result.rows[0].faq_null)
        console.log('seo_content NULL:', result.rows[0].seo_null)
      } else {
        console.log('Category not found:', slug)
      }
    } catch (error) {
      console.error('Error checking', slug, ':', error)
    }
  }
  
  process.exit(0)
}

checkCategories()
