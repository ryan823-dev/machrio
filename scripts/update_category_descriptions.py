#!/usr/bin/env python3
"""
Update category descriptions in database
Run: python scripts/update_category_descriptions.py
"""

import psycopg2
import json

# Database connection
conn = psycopg2.connect(
    "postgresql://postgres:sGmPTCagRVFtHszbygRzSvYTdUXgCFfH@crossover.proxy.rlwy.net:38475/railway"
)
cur = conn.cursor()

# Category descriptions based on slug patterns
category_descriptions = {
    # Adhesives & Sealants
    'adhesives': 'Industrial adhesives, glues, and bonding solutions for manufacturing, assembly, and repair applications.',
    'sealants': 'Sealants and caulking products for sealing joints, gaps, and seams in industrial and construction applications.',
    'tape': 'Industrial tapes for bonding, masking, packaging, and specialty applications.',
    
    # Safety & PPE
    'safety': 'Personal protective equipment (PPE) and safety supplies for industrial workplace protection.',
    'ppe': 'Personal protective equipment including gloves, eyewear, respiratory protection, and safety apparel.',
    'gloves': 'Protective gloves for industrial, medical, and food service applications.',
    'respiratory': 'Respiratory protection equipment including respirators, masks, and breathing apparatus.',
    'eyewear': 'Safety glasses, goggles, and face shields for eye protection.',
    'hard hats': 'Head protection including hard hats, bump caps, and helmet accessories.',
    'fall protection': 'Fall arrest systems, harnesses, lanyards, and anchor points for working at heights.',
    
    # Material Handling
    'material handling': 'Equipment and supplies for moving, storing, and controlling materials in warehouse and industrial facilities.',
    'cart': 'Carts, trucks, and trolleys for transporting materials and equipment.',
    'lifting': 'Lifting equipment including hoists, jacks, slings, and rigging hardware.',
    'storage': 'Storage solutions including shelving, racks, cabinets, and containers.',
    
    # Tools
    'tool': 'Hand tools, power tools, and tool accessories for industrial and professional use.',
    'hand tool': 'Manual hand tools for gripping, cutting, fastening, and general purpose work.',
    'power tool': 'Electric and pneumatic power tools for drilling, cutting, grinding, and fastening.',
    'cutting': 'Cutting tools including blades, cutters, and saws for metal, wood, and plastic.',
    
    # Fasteners
    'fastener': 'Fasteners including bolts, screws, nuts, washers, and anchors for industrial assembly.',
    'bolt': 'Bolts and screws for industrial fastening and assembly applications.',
    'nut': 'Nuts, washers, and fastener accessories.',
    'bearing': 'Bearings for rotating machinery, conveyors, and mechanical equipment.',
    
    # Plumbing & Pumps
    'plumbing': 'Plumbing supplies including pipes, fittings, valves, and fixtures.',
    'pump': 'Pumps for water, chemical, and industrial fluid transfer applications.',
    'valve': 'Valves for controlling flow of liquids and gases in plumbing and industrial systems.',
    'pipe': 'Pipes, tubing, and pipe fittings for plumbing and industrial applications.',
    'hose': 'Hoses, hose fittings, and hose reels for air, water, and fluid transfer.',
    
    # Electrical
    'electrical': 'Electrical supplies including wire, cable, connectors, and electrical components.',
    'wire': 'Electrical wire and cable for power distribution and control systems.',
    'lighting': 'Industrial and commercial lighting fixtures, lamps, and lighting accessories.',
    'led': 'LED lighting solutions for industrial, commercial, and outdoor applications.',
    
    # Cleaning & Janitorial
    'cleaning': 'Cleaning supplies and janitorial products for facility maintenance.',
    'janitorial': 'Janitorial equipment and supplies for commercial and industrial cleaning.',
    'disinfectant': 'Disinfectants and sanitizers for cleaning and infection control.',
    
    # Packaging
    'packaging': 'Packaging materials and supplies for product protection and shipping.',
    'shipping': 'Shipping supplies including boxes, mailers, and packaging materials.',
    'bubble': 'Bubble wrap and protective packaging materials.',
    
    # Welding
    'welding': 'Welding equipment, supplies, and safety gear for welding applications.',
    'weld': 'Welding rods, wire, and consumables for various welding processes.',
    
    # Lab & Scientific
    'lab': 'Laboratory equipment and supplies for scientific research and testing.',
    'laboratory': 'Lab equipment, glassware, and scientific instruments.',
    'testing': 'Testing and measurement equipment for quality control and inspection.',
    
    # HVAC
    'hvac': 'Heating, ventilation, and air conditioning equipment and supplies.',
    'ventilation': 'Ventilation fans, ducts, and air circulation equipment.',
    'heater': 'Industrial heaters and heating equipment.',
    
    # Industrial Supplies
    'industrial': 'General industrial supplies and MRO products for maintenance and operations.',
    'mro': 'Maintenance, repair, and operations (MRO) supplies for industrial facilities.',
    'abrasive': 'Abrasives for grinding, sanding, and surface preparation.',
    'lubricant': 'Lubricants, oils, and greases for machinery maintenance.',
    
    # Office & Facility
    'office': 'Office supplies and equipment for workplace organization.',
    'facility': 'Facility maintenance and building maintenance supplies.',
    'furniture': 'Industrial and commercial furniture for workplace and storage.',
    
    # Automotive
    'auto': 'Automotive tools, parts, and supplies for vehicle maintenance and repair.',
    'automotive': 'Automotive equipment and supplies for professional and DIY use.',
    
    # 3D Printing
    '3d print': '3D printing equipment, materials, and accessories.',
    'printer': '3D printers and printing supplies.',
}

# Fetch all categories
cur.execute("SELECT id, name, slug FROM categories")
categories = cur.fetchall()

updated = 0
not_found = 0

for category_id, name, slug in categories:
    # Try to find matching description
    description_text = None
    slug_lower = slug.lower()
    
    # Try exact match first
    if slug_lower in category_descriptions:
        description_text = category_descriptions[slug_lower]
    else:
        # Try partial match
        for key, desc in category_descriptions.items():
            if key in slug_lower or slug_lower in key:
                description_text = desc
                break
    
    if description_text:
        # Create Lexical rich text format
        lexical_content = {
            "root": {
                "type": "root",
                "format": "",
                "indent": 0,
                "version": 1,
                "children": [
                    {
                        "type": "paragraph",
                        "format": "",
                        "indent": 0,
                        "version": 1,
                        "children": [
                            {
                                "mode": "normal",
                                "text": description_text,
                                "type": "text",
                                "format": 0,
                                "style": "",
                                "detail": 0,
                                "version": 1
                            }
                        ],
                        "direction": "ltr",
                        "textFormat": 0,
                        "textStyle": ""
                    }
                ],
                "direction": "ltr"
            }
        }
        
        # Update category
        cur.execute("""
            UPDATE categories 
            SET description = %s, 
                short_description = %s
            WHERE id = %s
        """, (json.dumps(lexical_content), description_text[:250], category_id))
        updated += 1
    else:
        not_found += 1

conn.commit()
print(f"Updated {updated} categories with descriptions")
print(f"Warning: {not_found} categories without matching description template")

cur.close()
conn.close()
