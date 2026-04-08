#!/usr/bin/env python3
"""
Fix category descriptions that are too long (> 400 chars)
Run: python scripts/fix-long-descriptions.py
"""

import psycopg2

conn = psycopg2.connect(
    "postgresql://postgres:sGmPTCagRVFtHszbygRzSvYTdUXgCFfH@crossover.proxy.rlwy.net:38475/railway"
)
cur = conn.cursor()

# Find categories with short_description > 400 chars
cur.execute("""
    SELECT id, slug, short_description 
    FROM categories 
    WHERE LENGTH(short_description) > 400
""")

categories = cur.fetchall()
print(f"Found {len(categories)} categories with long descriptions")

fixed = 0
for category_id, slug, short_desc in categories:
    # Truncate to 400 chars, ensuring we end at a sentence
    if len(short_desc) > 400:
        # Try to cut at the last period before 400 chars
        truncated = short_desc[:400]
        last_period = truncated.rfind('.')
        if last_period > 350:  # Only cut at period if it's after 350 chars
            truncated = truncated[:last_period + 1]
        
        # Ensure it ends properly
        if not truncated.endswith('.'):
            # Find the last complete word
            last_space = truncated.rfind(' ')
            if last_space > 0:
                truncated = truncated[:last_space] + '.'
        
        cur.execute("""
            UPDATE categories 
            SET short_description = %s
            WHERE id = %s
        """, (truncated, category_id))
        fixed += 1
        print(f"Fixed {slug}: {len(short_desc)} -> {len(truncated)} chars")

conn.commit()
print(f"\nFixed {fixed} categories")

cur.close()
conn.close()
