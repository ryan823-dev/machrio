// Frontend content importer - runs in browser console
// This script imports content directly through the website's API

(async function importContentDirectly() {
    console.log('🚀 Starting direct content import...');
    
    // Articles to import
    const articles = [
        {
            title: "What Is MRO in Manufacturing? Definition, Examples, and Product Categories",
            slug: "what-is-mro-in-manufacturing",
            excerpt: "Learn what MRO means in manufacturing, what products count as MRO, and how industrial buyers use MRO supplies to support maintenance, repair, and operations.",
            content: '{"root":{"children":[{"type":"paragraph","children":[{"text":"MRO stands for Maintenance, Repair, and Operations – the essential supplies and services that keep industrial facilities running smoothly. Unlike production materials that become part of the final product, MRO items are consumed in the process of manufacturing itself."}]},{"type":"heading","tag":"h2","children":[{"text":"What Does MRO Stand For?"}]},{"type":"paragraph","children":[{"text":"MRO is an acronym that breaks down as:"}]},{"type":"list","listType":"bullet","children":[{"children":[{"text":"Maintenance: Keeping equipment and facilities in working condition"}]},{"children":[{"text":"Repair: Fixing broken or worn equipment components"}]},{"children":[{"text":"Operations: Supporting daily business operations and worker safety"}]}]},{"type":"heading","tag":"h2","children":[{"text":"What is MRO in Manufacturing?"}]},{"type":"paragraph","children":[{"text":"In manufacturing contexts, MRO encompasses all the indirect materials and services needed to support production without becoming part of the final product. Think of MRO as everything a factory needs to stay operational except the raw materials that go into making their actual products."}]},{"type":"paragraph","children":[{"text":"For example, a automotive parts manufacturer\\'s MRO supplies would include safety equipment for workers, lubricants for machinery, cleaning supplies for the facility, and replacement parts for conveyor systems – none of which end up in the brake pads or engine components they produce."}]},{"type":"heading","tag":"h2","children":[{"text":"Common Examples of MRO Products"}]},{"type":"paragraph","children":[{"text":"MRO products span numerous categories essential to industrial operations:"}]},{"type":"list","listType":"number","children":[{"children":[{"text":"Personal Protective Equipment (PPE): Safety glasses, gloves, hard hats, safety boots, and respirators"}]},{"children":[{"text":"Maintenance Supplies: Lubricants, cleaning chemicals, adhesives, sealants, and abrasives"}]},{"children":[{"text":"Tools and Hardware: Hand tools, power tools, fasteners, bearings, and mechanical components"}]},{"children":[{"text":"Facility Supplies: Janitorial products, packaging materials, storage solutions, and material handling equipment"}]},{"children":[{"text":"Electrical and Lighting: Wiring, switches, bulbs, batteries, and electrical components"}]},{"children":[{"text":"Safety and Security: Lockout/tagout equipment, fire extinguishers, first aid supplies, and security systems"}]}]},{"type":"heading","tag":"h2","children":[{"text":"MRO vs Production Materials"}]},{"type":"paragraph","children":[{"text":"The key distinction is that production materials become part of your final product, while MRO materials support the production process itself. Steel becomes car frames (production), but the cutting blades that shape that steel are MRO."}]},{"type":"paragraph","children":[{"text":"This difference affects purchasing decisions significantly – production materials often require specific certifications and traceability, while MRO purchases typically prioritize cost-effectiveness and availability."}]},{"type":"heading","tag":"h2","children":[{"text":"Why MRO Matters for Manufacturers"}]},{"type":"paragraph","children":[{"text":"Effective MRO management directly impacts operational efficiency and bottom-line results:"}]},{"type":"list","listType":"bullet","children":[{"children":[{"text":"Equipment uptime and productivity depend on quality maintenance supplies"}]},{"children":[{"text":"Worker safety requires reliable PPE and safety equipment"}]},{"children":[{"text":"Production delays often stem from MRO stockouts rather than raw material shortages"}]},{"children":[{"text":"Proper MRO purchasing can reduce total operational costs by 15-25%"}]}]},{"type":"heading","tag":"h2","children":[{"text":"Frequently Asked Questions"}]},{"type":"heading","tag":"h3","children":[{"text":"What does MRO stand for?"}]},{"type":"paragraph","children":[{"text":"MRO stands for Maintenance, Repair, and Operations – the indirect supplies and services that support industrial production without becoming part of the final product."}]},{"type":"heading","tag":"h3","children":[{"text":"What is MRO in manufacturing?"}]},{"type":"paragraph","children":[{"text":"In manufacturing, MRO refers to all the consumable supplies, spare parts, tools, and services needed to keep production facilities operating efficiently, including safety equipment, maintenance materials, and facility supplies."}]},{"type":"heading","tag":"h3","children":[{"text":"Are MRO products the same as raw materials?"}]},{"type":"paragraph","children":[{"text":"No, MRO products are indirect materials that support the production process but don\\'t become part of the final product, unlike raw materials which are incorporated into manufactured goods."}]},{"type":"heading","tag":"h3","children":[{"text":"What are examples of MRO items?"}]},{"type":"paragraph","children":[{"text":"Common MRO items include safety glasses, lubricants, cleaning supplies, hand tools, replacement bearings, electrical components, packaging materials, and facility maintenance supplies."}]}]}}',
            category: "industry-insight",
            tags: ["mro", "manufacturing", "maintenance", "industrial supplies"],
            author: "Machrio Team",
            status: "published",
            seo: {
                metaTitle: "What Is MRO in Manufacturing? Definition, Examples, and Categories",
                metaDescription: "Learn what MRO means in manufacturing, what products count as MRO, and how industrial buyers use MRO supplies to support maintenance, repair, and operations."
            }
        },
        {
            title: "What Are MRO Products? Categories, Examples, and Buying Tips",
            slug: "what-are-mro-products",
            excerpt: "Discover what MRO products are, which categories they include, and how businesses source industrial MRO supplies for maintenance, repair, and operations.",
            content: '{"root":{"children":[{"type":"paragraph","children":[{"text":"MRO products are the diverse range of supplies, equipment, and materials that keep industrial operations running smoothly. From safety gear protecting workers to specialized tools maintaining machinery, these products form the backbone of efficient manufacturing and facility management."}]},{"type":"heading","tag":"h2","children":[{"text":"What Counts as an MRO Product?"}]},{"type":"paragraph","children":[{"text":"An MRO product is any item used to support business operations that doesn\\'t become part of the final product being manufactured. These are consumable or replaceable items essential for maintaining productivity, ensuring safety, and keeping facilities operational."}]},{"type":"paragraph","children":[{"text":"The key characteristic is their indirect role – while crucial for operations, they\\'re not incorporated into what the company sells to customers."}]},{"type":"heading","tag":"h2","children":[{"text":"10 Common MRO Product Categories"}]},{"type":"heading","tag":"h3","children":[{"text":"1. Personal Protective Equipment (PPE)"}]},{"type":"paragraph","children":[{"text":"Essential for worker safety across all industries:"}]},{"type":"list","listType":"bullet","children":[{"children":[{"text":"Head protection: Hard hats, bump caps, face shields"}]},{"children":[{"text":"Eye and face protection: Safety glasses, goggles, welding helmets"}]},{"children":[{"text":"Hearing protection: Ear plugs, ear muffs, noise-canceling headphones"}]},{"children":[{"text":"Hand protection: Work gloves, chemical-resistant gloves, cut-resistant gloves"}]},{"children":[{"text":"Respiratory protection: Dust masks, respirators, air-purifying devices"}]},{"children":[{"text":"Body protection: Safety vests, coveralls, high-visibility clothing"}]},{"children":[{"text":"Foot protection: Steel-toe boots, slip-resistant shoes, chemical boots"}]}]}]}}',
            category: "buying-guide",
            tags: ["mro products", "industrial supplies", "maintenance", "procurement"],
            author: "Machrio Team",
            status: "published",
            seo: {
                metaTitle: "What Are MRO Products? Categories, Examples, and Buying Tips",
                metaDescription: "Discover what MRO products are, which categories they include, and how businesses source industrial MRO supplies for maintenance, repair, and operations."
            }
        },
        {
            title: "Types of Respirators Explained: N95, Half-Face, Full-Face, PAPR, and Supplied-Air",
            slug: "types-of-respirators-explained",
            excerpt: "Learn about different types of respirators including N95 masks, half-face respirators, full-face respirators, PAPRs, and supplied-air systems for workplace safety.",
            content: '{"root":{"children":[{"type":"paragraph","children":[{"text":"Understanding the different types of respirators is crucial for workplace safety. Each respirator type offers specific protection levels and is designed for particular hazards and environments. Choosing the right respirator can mean the difference between adequate protection and serious health risks."}]},{"type":"heading","tag":"h2","children":[{"text":"Quick Answer"}]},{"type":"paragraph","children":[{"text":"There are two main classes of respirators: air-purifying respirators (APRs) that filter contaminated air, and supplied-air respirators (SARs) that provide clean breathing air from an external source. Within these categories are various types including N95 masks, half-face respirators, full-face respirators, and powered air-purifying respirators (PAPRs)."}]},{"type":"heading","tag":"h2","children":[{"text":"Two Main Classes of Respirators"}]},{"type":"heading","tag":"h3","children":[{"text":"1. Air-Purifying Respirators (APRs)"}]},{"type":"paragraph","children":[{"text":"These respirators remove contaminants from the air you breathe by filtering, absorbing, or chemically neutralizing pollutants. They rely on the wearer\\'s breathing to draw air through the filtration system."}]},{"type":"heading","tag":"h3","children":[{"text":"2. Supplied-Air Respirators (SARs)"}]},{"type":"paragraph","children":[{"text":"These provide clean breathing air from an external source such as compressed air cylinders or airline connections. They don\\'t depend on filter cartridges and offer the highest level of respiratory protection."}]}]}}',
            category: "industry-insight",
            tags: ["respirators", "safety equipment", "ppe", "occupational health"],
            author: "Machrio Team",
            status: "published",
            seo: {
                metaTitle: "Types of Respirators Explained: N95, Half-Face, Full-Face, PAPR, and Supplied-Air",
                metaDescription: "Learn about different types of respirators including N95 masks, half-face respirators, full-face respirators, PAPRs, and supplied-air systems for workplace safety."
            }
        }
    ];
    
    const imported = [];
    const failed = [];
    
    // Try to import each article
    for (const article of articles) {
        try {
            console.log(`📄 Importing: ${article.title}`);
            
            // First check if article exists
            const checkResponse = await fetch(`/api/articles?where[slug][equals]=${article.slug}`);
            const checkData = await checkResponse.json();
            
            let result;
            
            if (checkData.docs && checkData.docs.length > 0) {
                // Update existing
                console.log('   ⚠️  Article exists, updating...');
                const updateResponse = await fetch(`/api/articles/${checkData.docs[0].id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(article)
                });
                result = await updateResponse.json();
            } else {
                // Create new
                console.log('   ➕ Creating new article...');
                const createResponse = await fetch('/api/articles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(article)
                });
                result = await createResponse.json();
            }
            
            if (result.id || result.doc) {
                console.log('   ✅ Success!');
                imported.push({
                    title: article.title,
                    slug: article.slug,
                    id: result.id || result.doc.id
                });
            } else {
                throw new Error(result.errors ? JSON.stringify(result.errors) : 'Unknown error');
            }
            
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failed.push({
                title: article.title,
                error: error.message
            });
        }
    }
    
    // Show results
    console.log('\n📊 Import Results:');
    console.log(`✅ Imported: ${imported.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (imported.length > 0) {
        console.log('\n_IMPORTED ARTICLES:_');
        imported.forEach(item => {
            console.log(`• ${item.title}`);
            console.log(`  URL: /knowledge-center/${item.slug}`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n_FAILED IMPORTS:_');
        failed.forEach(item => {
            console.log(`• ${item.title}: ${item.error}`);
        });
    }
    
    console.log('\n🔄 Refresh the page to see the new content!');
    console.log('Visit: http://localhost:3000/knowledge-center');
    
    return { imported, failed };
})();