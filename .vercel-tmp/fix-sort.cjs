const fs = require('fs');
const f = 'src/app/(frontend)/category/[slug]/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix 1: Add sort param to getFilteredProducts
c = c.replace(
  '  filters: FilterOptions\n) {',
  "  filters: FilterOptions,\n  sort: string = '-createdAt'\n) {"
);

// Fix 2: Use sort variable instead of hardcoded in getFilteredProducts
c = c.replace(
  "      sort: '-createdAt',\n      depth: 2,",
  '      sort,\n      depth: 2,'
);

// Fix 3: Add sortParam to buildPageUrl
c = c.replace(
  "if (maxPriceParam) params.set('maxPrice', maxPriceParam)\n    return",
  "if (maxPriceParam) params.set('maxPrice', maxPriceParam)\n    if (sortParam) params.set('sort', sortParam)\n    return"
);

fs.writeFileSync(f, c);
console.log('Done - all 3 fixes applied');
