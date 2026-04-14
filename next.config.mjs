import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint 检查只在开发时运行，生产构建时忽略
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 生产构建时忽略 TypeScript 错误
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.mroport.com',
      },
      {
        protocol: 'https',
        hostname: 'machrio.oss-us-west-1.aliyuncs.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // ========== WWW to Non-WWW Redirects ==========
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'www.machrio.com',
          },
        ],
        destination: 'https://machrio.com/',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.machrio.com',
          },
        ],
        destination: 'https://machrio.com/:path*',
        permanent: true,
      },

      // ========== Category Redirects (88) ==========
      // These redirect old category slugs to new ones
      {
        source: '/category/welding-protection',
        destination: '/category/welding-protective-clothing',
        permanent: true,
      },
      {
        source: '/category/platform-trucks',
        destination: '/category/work-platforms',
        permanent: true,
      },
      {
        source: '/category/quick-coupler',
        destination: '/category/hose-hose-fittings-and-hose-reels',
        permanent: true,
      },
      {
        source: '/category/hand-truck-accessories-replacement-parts',
        destination: '/category/power-tool-replacement-parts',
        permanent: true,
      },
      {
        source: '/category/rolling-tool-cart',
        destination: '/category/tool-storage',
        permanent: true,
      },
      {
        source: '/category/metal-workbenches',
        destination: '/category/tool-storage',
        permanent: true,
      },
      {
        source: '/category/temperature-controlled-packaging',
        destination: '/category/protective-packaging',
        permanent: true,
      },
      {
        source: '/category/general-purpose-boots',
        destination: '/category/footwear-and-footwear-accessories',
        permanent: true,
      },
      {
        source: '/category/cable-tag-wire-marker',
        destination: '/category/signs-and-facility-identification-products',
        permanent: true,
      },
      {
        source: '/category/cryogenic-gloves',
        destination: '/category/safety-gloves',
        permanent: true,
      },
      {
        source: '/category/fire-extinguishers',
        destination: '/category/fire-protection',
        permanent: true,
      },
      {
        source: '/category/gears-gear-drives',
        destination: '/category/gearing',
        permanent: true,
      },
      {
        source: '/category/air-hose-connector',
        destination: '/category/hose-hose-fittings-and-hose-reels',
        permanent: true,
      },
      {
        source: '/category/snakebite-protective-gaiters',
        destination: '/category/protective-clothing',
        permanent: true,
      },
      {
        source: '/category/brooms',
        destination: '/category/cleaning-carts',
        permanent: true,
      },
      {
        source: '/category/label-dispenser',
        destination: '/category/signs-and-facility-identification-products',
        permanent: true,
      },
      {
        source: '/category/tire-sealants',
        destination: '/category/valve-sealants',
        permanent: true,
      },
      {
        source: '/category/lab-workbenches',
        destination: '/category/lab-tables',
        permanent: true,
      },
      {
        source: '/category/safety-padlock',
        destination: '/category/lockout-padlocks',
        permanent: true,
      },
      {
        source: '/category/adhesives-glues',
        destination: '/category/construction-adhesives',
        permanent: true,
      },
      {
        source: '/category/cut-resistant-gloves',
        destination: '/category/safety-gloves',
        permanent: true,
      },
      {
        source: '/category/wire-clip-mount',
        destination: '/category/cable-organizers',
        permanent: true,
      },
      {
        source: '/category/hvac-filter-panel',
        destination: '/category/bag-air-filters',
        permanent: true,
      },
      {
        source: '/category/hepa-filter-pad',
        destination: '/category/bag-air-filters',
        permanent: true,
      },
      {
        source: '/category/hoists-cranes',
        destination: '/category/lifting-magnets',
        permanent: true,
      },
      {
        source: '/category/hot-melt-applicator-guns',
        destination: '/category/hot-melt-adhesives',
        permanent: true,
      },
      {
        source: '/category/mechanical-seals',
        destination: '/category/security-seals',
        permanent: true,
      },
      {
        source: '/category/tool-storage-workbenches',
        destination: '/category/tool-storage',
        permanent: true,
      },
      {
        source: '/category/bulk-webbing',
        destination: '/category/lifting-slings',
        permanent: true,
      },
      {
        source: '/category/hand-arm-protection',
        destination: '/category/hand-and-arm-protection',
        permanent: true,
      },
      {
        source: '/category/air-purifier-cartridge',
        destination: '/category/compressed-air-filters',
        permanent: true,
      },
      {
        source: '/category/slings-rigging',
        destination: '/category/lifting-slings',
        permanent: true,
      },
      {
        source: '/category/hard-hats-and-helmets',
        destination: '/category/head-protection',
        permanent: true,
      },
      {
        source: '/category/corrosion-inhibiting-vci-packaging',
        destination: '/category/protective-packaging',
        permanent: true,
      },
      {
        source: '/category/packaging-shipping',
        destination: '/category/packing-and-shipping-bags',
        permanent: true,
      },
      {
        source: '/category/lockout-hasp',
        destination: '/category/lockout-hasps',
        permanent: true,
      },
      {
        source: '/category/flashlights',
        destination: '/category/floodlights',
        permanent: true,
      },
      {
        source: '/category/cold-condition-insulated-gloves',
        destination: '/category/safety-gloves',
        permanent: true,
      },
      {
        source: '/category/waders',
        destination: '/category/footwear-and-footwear-accessories',
        permanent: true,
      },
      {
        source: '/category/barcode-label-roll',
        destination: '/category/signs-and-facility-identification-products',
        permanent: true,
      },
      {
        source: '/category/transporting',
        destination: '/category/strapping',
        permanent: true,
      },
      {
        source: '/category/caster-wheels',
        destination: '/category/stem-casters',
        permanent: true,
      },
      {
        source: '/category/moisture-absorbent-packaging',
        destination: '/category/protective-packaging',
        permanent: true,
      },
      {
        source: '/category/inspection-gloves',
        destination: '/category/safety-gloves',
        permanent: true,
      },
      {
        source: '/category/foot-protection',
        destination: '/category/footwear-and-footwear-accessories',
        permanent: true,
      },
      {
        source: '/category/adhesives-glue',
        destination: '/category/construction-adhesives',
        permanent: true,
      },
      {
        source: '/category/labels-identification-supplies',
        destination: '/category/signs-and-facility-identification-products',
        permanent: true,
      },
      {
        source: '/category/standard-packing-tape',
        destination: '/category/packing-tape',
        permanent: true,
      },
      {
        source: '/category/trash-recycling-containers',
        destination: '/category/safety-storage',
        permanent: true,
      },
      {
        source: '/category/lifting-pulling-positioning',
        destination: '/category/lifting-slings',
        permanent: true,
      },
      {
        source: '/category/belts-pulleys',
        destination: '/category/gearing',
        permanent: true,
      },
      {
        source: '/category/general-purpose-glues',
        destination: '/category/construction-adhesives',
        permanent: true,
      },
      {
        source: '/category/modular-tool-case',
        destination: '/category/modular-tool-storage-systems',
        permanent: true,
      },
      {
        source: '/category/workbenches-shop-desks',
        destination: '/category/tool-storage',
        permanent: true,
      },
      {
        source: '/category/gaskets',
        destination: '/category/caulks-and-sealants',
        permanent: true,
      },
      {
        source: '/category/jacks-lifts',
        destination: '/category/personnel-lifts',
        permanent: true,
      },
      {
        source: '/category/direct-thermal-labels',
        destination: '/category/signs-and-facility-identification-products',
        permanent: true,
      },
      {
        source: '/category/plastic-films-rolls',
        destination: '/category/stretch-wrap-rolls',
        permanent: true,
      },
      {
        source: '/category/black-masking-tape',
        destination: '/category/packing-tape',
        permanent: true,
      },
      {
        source: '/category/cleaning-rags',
        destination: '/category/cleaning-buckets',
        permanent: true,
      },
      {
        source: '/category/blue-masking-tape',
        destination: '/category/packing-tape',
        permanent: true,
      },
      {
        source: '/category/label-holder-plastic-pouch',
        destination: '/category/signs-and-facility-identification-products',
        permanent: true,
      },
      {
        source: '/category/drainage-mats',
        destination: '/category/floor-mats',
        permanent: true,
      },
      {
        source: '/category/chain-slings',
        destination: '/category/lifting-slings',
        permanent: true,
      },
      {
        source: '/category/first-aid-medical',
        destination: '/category/first-aid-and-wound-care',
        permanent: true,
      },
      {
        source: '/category/traction-floor-mats',
        destination: '/category/floor-mats',
        permanent: true,
      },
      {
        source: '/category/lab-brushes',
        destination: '/category/lab-tables',
        permanent: true,
      },
      {
        source: '/category/polyurethane-caulks-sealants',
        destination: '/category/caulks-and-sealants',
        permanent: true,
      },
      {
        source: '/category/welding-aprons',
        destination: '/category/welding-protective-clothing',
        permanent: true,
      },
      {
        source: '/category/parts-bin-drawer-organizer',
        destination: '/category/tool-organizers',
        permanent: true,
      },
      {
        source: '/category/lockout-tagout-kits',
        destination: '/category/lockout-tagout',
        permanent: true,
      },
      {
        source: '/category/circuit-breaker-lockout',
        destination: '/category/electrical-lockout-devices',
        permanent: true,
      },
      {
        source: '/category/seals-gaskets',
        destination: '/category/caulks-and-sealants',
        permanent: true,
      },
      {
        source: '/category/carts-trucks',
        destination: '/category/stem-casters',
        permanent: true,
      },
      {
        source: '/category/nylon-cable-tie',
        destination: '/category/cable-organizers',
        permanent: true,
      },
      {
        source: '/category/plug-lockout',
        destination: '/category/valve-lockout-devices',
        permanent: true,
      },
      {
        source: '/category/pipe-thread-sealants',
        destination: '/category/pipe-sealants',
        permanent: true,
      },
      {
        source: '/category/sealing-foam-tape',
        destination: '/category/bag-sealing-tape',
        permanent: true,
      },
      {
        source: '/category/welding-gloves',
        destination: '/category/welding-protective-clothing',
        permanent: true,
      },
      {
        source: '/category/heat-shrink-tubing',
        destination: '/category/cable-organizers',
        permanent: true,
      },
      {
        source: '/category/floor-marking-tape',
        destination: '/category/antislip-tape',
        permanent: true,
      },
      {
        source: '/category/high-visibility-vests',
        destination: '/category/workwear',
        permanent: true,
      },
      {
        source: '/category/plumbing-pumps',
        destination: '/category/plumbing-valves',
        permanent: true,
      },
      {
        source: '/category/general-purpose-safety-goggles',
        destination: '/category/eyewash-equipment-and-safety-showers',
        permanent: true,
      },
      {
        source: '/category/first-aid-kits',
        destination: '/category/first-aid-and-wound-care',
        permanent: true,
      },
      {
        source: '/category/replacement-parts-for-jobsite-lights',
        destination: '/category/floodlights',
        permanent: true,
      },
      {
        source: '/category/task-jobsite-lighting',
        destination: '/category/floodlights',
        permanent: true,
      },
      {
        source: '/category/linen-carts',
        destination: '/category/cleaning-carts',
        permanent: true,
      },

      // ========== Deleted Product Redirects ==========
      // Redirect removed products to relevant categories to fix GSC "Crawled - not indexed" errors
      {
        source: '/product/label-protection-tape/t50-thermal-index-label-peach-pink-color-0-98in-by-1-10in-pkg-qty-100-5173.0',
        destination: '/category/signs-and-facility-identification-products',
        permanent: true,
      },
      {
        source: '/product/seals-gaskets/fkm-tc-skeleton-oil-seal-high-temperature-fluororubber-shaft-seal-for-industrial-594937',
        destination: '/category/caulks-and-sealants',
        permanent: true,
      },
      {
        source: '/product/parts-bin-drawer-organizer/drawer-type-parts-box-18-compartments-length-18-90-inch-width-14-57-inch-height--759076',
        destination: '/category/tool-organizers',
        permanent: true,
      },
      {
        source: '/product/leg-body-protection/rubber-half-body-waist-high-waders-black-gh2117779',
        destination: '/category/footwear-and-footwear-accessories',
        permanent: true,
      },
      {
        source: '/product/hex-nuts/stainless-steel-304-a2-70-hex-nut-0-94-in-flats-m16-pkg-qty-25-9549',
        destination: '/category/fasteners',
        permanent: true,
      },
      {
        source: '/product/hex-nuts/grade-8-carbon-steel-hex-nut-1-18-in-zinc-plated-m30-pkg-qty-100-9472',
        destination: '/category/fasteners',
        permanent: true,
      },
      {
        source: '/product/hand-and-arm-protection/aramid-high-temp-safety-gloves-18-inches-400-f-pkg-qty-12-1186',
        destination: '/category/safety-gloves',
        permanent: true,
      },
      {
        source: '/product/hand-and-arm-protection/aluminum-foil-heat-resistant-gloves-15-inches-pkg-qty-8-9869',
        destination: '/category/safety-gloves',
        permanent: true,
      },

      // ========== Remove Trailing Slashes for Product/Category URLs ==========
      // Fix GSC "Page with redirect" issue for 1,074 URLs
      // Redirect URLs with trailing slash to non-slash version (301 permanent)
      {
        source: '/product/:category/:slug/',
        destination: '/product/:category/:slug',
        permanent: true,
      },
      {
        source: '/category/:slug/',
        destination: '/category/:slug',
        permanent: true,
      },
      {
        source: '/brand/:slug/',
        destination: '/brand/:slug',
        permanent: true,
      },

      // ========== Fix "products" Default Category Issue ==========
      // Redirect /product/products/[slug] to search page to help users find the product
      // This handles products without a proper category in the database
      {
        source: '/product/products/:slug',
        destination: '/search?q=:slug',
        permanent: true,
      },
    ]
  },
}

const payloadNextConfig = withPayload(nextConfig)

if (payloadNextConfig.experimental?.turbo) {
  payloadNextConfig.turbopack = {
    ...payloadNextConfig.turbopack,
    ...payloadNextConfig.experimental.turbo,
    resolveAlias: {
      ...payloadNextConfig.turbopack?.resolveAlias,
      ...payloadNextConfig.experimental.turbo.resolveAlias,
    },
  }

  delete payloadNextConfig.experimental.turbo

  if (Object.keys(payloadNextConfig.experimental).length === 0) {
    delete payloadNextConfig.experimental
  }
}

export default payloadNextConfig
