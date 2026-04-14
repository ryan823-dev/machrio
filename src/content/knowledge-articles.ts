export interface KnowledgeFaq {
  question: string
  answer: string
}

export interface KnowledgeArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: unknown
  category: 'buying-guide' | 'industry-insight' | 'how-to' | 'product-comparison'
  tags: string[]
  author: string
  status: 'published'
  publishedAt: string
  metaTitle?: string | null
  metaDescription?: string | null
  createdAt: string
  updatedAt: string
  quickAnswer?: string | null
  faq?: KnowledgeFaq[]
  featuredImage?: string | null
  readingTime?: number
  source?: 'builtin' | 'database'
}

type TextSegment = string | { text: string; bold?: boolean }

function textNode(segment: TextSegment) {
  if (typeof segment === 'string') {
    return { type: 'text', text: segment }
  }

  return {
    type: 'text',
    text: segment.text,
    ...(segment.bold ? { bold: true, format: 1 } : {}),
  }
}

function paragraph(...segments: TextSegment[]) {
  return {
    type: 'paragraph',
    children: segments.map(textNode),
  }
}

function heading(tag: 'h2' | 'h3', text: string) {
  return {
    type: 'heading',
    tag,
    children: [textNode(text)],
  }
}

function bulletList(items: string[]) {
  return {
    type: 'list',
    listType: 'bullet',
    children: items.map((item) => ({
      type: 'listitem',
      children: [textNode(item)],
    })),
  }
}

function richText(
  ...nodes: Array<
    | ReturnType<typeof paragraph>
    | ReturnType<typeof heading>
    | ReturnType<typeof bulletList>
  >
) {
  return {
    root: {
      type: 'root',
      children: nodes,
      direction: 'ltr',
      format: 'left',
      indent: 0,
      version: 1,
    },
  }
}

export const builtinKnowledgeArticles: KnowledgeArticle[] = [
  {
    id: 'builtin-how-machrio-simplifies-global-mro-procurement',
    title: 'How Machrio Simplifies Global MRO Procurement',
    slug: 'how-machrio-simplifies-global-mro-procurement',
    excerpt:
      'Machrio combines transparent pricing, 24-hour quote support, DDP delivery, and multi-currency payment options to reduce friction in cross-border industrial buying.',
    category: 'industry-insight',
    tags: ['mro', 'global sourcing', 'ddp shipping', 'industrial procurement'],
    author: 'Machrio Team',
    status: 'published',
    publishedAt: '2026-04-14T02:00:00.000Z',
    createdAt: '2026-04-14T02:00:00.000Z',
    updatedAt: '2026-04-14T02:00:00.000Z',
    metaTitle: 'How Machrio Simplifies Global MRO Procurement | Machrio',
    metaDescription:
      'See how Machrio combines searchable products, RFQ support, local payment options, and DDP shipping for simpler global MRO procurement.',
    quickAnswer:
      'Machrio simplifies cross-border MRO procurement by combining searchable products, RFQ support, transparent pricing, multi-currency payment options, and DDP shipping that reduces customs surprises.',
    faq: [
      {
        question: 'What makes Machrio different from a generic industrial marketplace?',
        answer:
          'Machrio combines catalog purchasing, formal quotation workflows, DDP shipping options, and B2B payment support in one buying path so industrial teams do not have to coordinate several vendors just to complete one order.',
      },
      {
        question: 'When should buyers use RFQ instead of direct checkout?',
        answer:
          'RFQ is the better path when the order is high value, needs internal approval, involves volume pricing, requires a proforma invoice, or includes products that need sourcing support.',
      },
      {
        question: 'Which industries benefit most from this model?',
        answer:
          'Manufacturing, construction, automotive, healthcare, food and beverage, and warehouse or logistics teams benefit most because they often balance urgent maintenance needs with budget control and cross-border supply constraints.',
      },
    ],
    content: richText(
      paragraph(
        'Global MRO purchasing often looks simple on paper and chaotic in practice. A buyer may know exactly which gloves, sealants, labels, or handling products are needed, but still lose time comparing suppliers, confirming shipping terms, and checking whether duties will appear after the shipment lands.'
      ),
      paragraph(
        'Machrio is built around that gap. The platform combines product discovery, quote support, multi-currency payment options, and delivery models designed for international industrial buyers who care as much about landed cost and documentation as they do about list price.'
      ),
      heading('h2', 'Why Industrial Buyers Still Struggle'),
      paragraph(
        'For many teams, the hardest part of sourcing is not finding a product name. It is turning a requirement into a predictable order. Buyers need to know whether the item is appropriate for the application, whether pricing will hold after shipping is added, whether customs paperwork will delay delivery, and whether finance can pay through an approved channel.'
      ),
      paragraph(
        'That pressure is highest in recurring MRO categories such as safety supplies, adhesives and sealants, packaging materials, cleaning products, material handling equipment, and maintenance essentials. These are not one-time purchases. They are operating inputs that affect uptime, safety, and labor efficiency.'
      ),
      heading('h2', 'What Machrio Brings Together'),
      bulletList([
        'Searchable industrial categories so buyers can browse standardized MRO products quickly.',
        'RFQ support with a stated 24-hour response window for quote-driven or higher-value orders.',
        'Card, wallet, bank transfer, and approved business account payment paths for different procurement processes.',
        'DDP air and DDP sea routes that help buyers avoid surprise import charges on many international orders.',
        'U.S. warehouse fulfillment on select items when speed matters more than cross-border consolidation.',
      ]),
      paragraph(
        'In practical terms, this means the buyer can start with a fast online purchase for a simple need, or move into a more formal approval workflow without leaving the same commercial environment. That reduces handoffs between procurement, finance, and receiving teams.'
      ),
      heading('h2', 'Why DDP and Multi-Currency Matter'),
      paragraph(
        'Cross-border sourcing becomes harder when the lowest unit price creates the highest operational risk. If customs duties are unclear, invoices are difficult to reconcile, or payment requires an expensive international wire, the true cost of the order rises quickly.'
      ),
      paragraph(
        'Machrio addresses that by pairing DDP shipping options with local or regional payment support for many currencies. For finance teams, predictable landed cost and cleaner payment execution can matter just as much as the product itself.'
      ),
      heading('h2', 'Best-Fit Buying Situations'),
      paragraph(
        'This model is especially useful when a team is restocking common MRO items, supporting a plant or warehouse launch, consolidating repeat buys across departments, or sourcing from China while still needing a straightforward customer-facing buying experience.'
      ),
      paragraph(
        'It also fits buyers who need documentation, a proforma invoice, or help choosing the right route for urgent replenishment versus budget-sensitive stock orders.'
      ),
      heading('h2', 'Bottom Line'),
      paragraph(
        'Machrio is most valuable when procurement needs are repeatable, operationally important, and international in scope. By combining product access, quotation support, payment flexibility, and shipping models such as DDP, the platform turns several separate procurement tasks into one clearer workflow.'
      )
    ),
    source: 'builtin',
  },
  {
    id: 'builtin-how-to-choose-an-industrial-supplier-for-cross-border-orders',
    title: 'How to Choose an Industrial Supplier for Cross-Border Orders',
    slug: 'how-to-choose-an-industrial-supplier-for-cross-border-orders',
    excerpt:
      'Use this checklist to evaluate pricing clarity, delivery model, payment flexibility, compliance support, and post-order responsiveness before placing an international MRO order.',
    category: 'buying-guide',
    tags: ['buying guide', 'supplier selection', 'cross-border procurement', 'mro sourcing'],
    author: 'Machrio Team',
    status: 'published',
    publishedAt: '2026-04-13T02:00:00.000Z',
    createdAt: '2026-04-13T02:00:00.000Z',
    updatedAt: '2026-04-13T02:00:00.000Z',
    metaTitle: 'How to Choose an Industrial Supplier for Cross-Border Orders | Machrio',
    metaDescription:
      'Evaluate industrial suppliers with a simple cross-border checklist covering pricing, shipping terms, payment options, documentation, and support.',
    quickAnswer:
      'A reliable industrial supplier should make landed cost, payment options, documentation, and delivery expectations clear before you place the order, not after the shipment moves.',
    faq: [
      {
        question: 'What should buyers verify before placing an international MRO order?',
        answer:
          'At minimum, verify the exact product scope, pricing basis, shipping model, import duty responsibility, payment method, lead time, and the documents that will be issued with the shipment.',
      },
      {
        question: 'Why is landed cost more important than unit price?',
        answer:
          'A lower unit price can become a more expensive order if duties, brokerage fees, wire charges, delays, or missing paperwork create extra internal cost after checkout.',
      },
      {
        question: 'When is local bank transfer worth asking for?',
        answer:
          'It is especially useful for higher-value B2B orders, invoice-driven purchases, or companies that want to reduce international wire fees and speed up internal approval.',
      },
    ],
    content: richText(
      paragraph(
        'Choosing an industrial supplier for cross-border orders is not just a sourcing decision. It is a risk decision. The right supplier reduces surprises in payment, shipping, documentation, and after-sales support. The wrong one creates avoidable work for procurement, finance, and receiving.'
      ),
      paragraph(
        'If you are comparing suppliers for recurring MRO categories such as PPE, adhesives, packaging, cleaning supplies, or material handling products, this checklist helps you look beyond catalog price.'
      ),
      heading('h2', '1. Confirm the Supplier Covers Your Core Product Mix'),
      paragraph(
        'Start by checking whether the supplier focuses on the categories your team buys repeatedly. A supplier that already serves common operating needs such as safety, packaging, maintenance, and warehouse support products is more likely to support repeat purchasing efficiently than a seller built around one-off spot buys.'
      ),
      paragraph(
        'Category breadth matters because real procurement rarely happens one SKU at a time. Teams often need to restock several adjacent categories in the same buying cycle.'
      ),
      heading('h2', '2. Check Landed Cost, Not Just Product Price'),
      paragraph(
        'For international orders, total cost is shaped by duties, taxes, shipping mode, and handling fees. Ask whether the supplier can support DDP delivery, what shipping routes are available, and when extra import charges may still apply.'
      ),
      paragraph(
        'A supplier that explains these tradeoffs clearly helps buyers make better urgency versus budget decisions before placing the order.'
      ),
      heading('h2', '3. Make Sure Finance Can Actually Pay'),
      paragraph(
        'A good supplier offers payment flexibility that matches how industrial companies buy. That can include cards for urgent checkout, bank transfer for formal invoices, and business account support for approved customers. If your team needs a proforma invoice, PO matching, or local transfer details, confirm that process early.'
      ),
      heading('h2', '4. Review Documentation and Compliance Support'),
      paragraph(
        'Cross-border industrial orders often need commercial invoices, packing lists, HS codes, and product or material compliance documents. Even when a product is straightforward, receiving and customs teams still depend on complete paperwork.'
      ),
      paragraph(
        'Suppliers that understand this requirement usually communicate more clearly about what will be issued and when.'
      ),
      heading('h2', '5. Evaluate Response Speed After the Order'),
      paragraph(
        'Support quality should be judged by what happens after you show buying intent. Do you get a clear quote quickly? Are shipping options explained in plain language? Is there a realistic path for tracking, returns, and issue resolution? These service signals predict the day-to-day buying experience better than marketing copy does.'
      ),
      heading('h2', 'A Practical Supplier Checklist'),
      bulletList([
        'Covers the MRO categories your team buys frequently.',
        'Shows clear shipping terms and duty responsibility.',
        'Supports payment methods that fit both urgent and invoice-based orders.',
        'Provides shipment and customs documentation without back-and-forth.',
        'Responds quickly enough for maintenance and restocking timelines.',
      ]),
      paragraph(
        'If a supplier can satisfy those five checks consistently, you are not only buying a product source. You are building a smoother procurement process.'
      )
    ),
    source: 'builtin',
  },
  {
    id: 'builtin-how-to-order-industrial-supplies-from-machrio',
    title: 'How to Order Industrial Supplies from Machrio',
    slug: 'how-to-order-industrial-supplies-from-machrio',
    excerpt:
      'A step-by-step guide to browsing categories, choosing online checkout or RFQ, paying by card or bank transfer, and tracking delivery through Machrio.',
    category: 'how-to',
    tags: ['how to order', 'rfq', 'payment methods', 'shipping'],
    author: 'Machrio Team',
    status: 'published',
    publishedAt: '2026-04-12T02:00:00.000Z',
    createdAt: '2026-04-12T02:00:00.000Z',
    updatedAt: '2026-04-12T02:00:00.000Z',
    metaTitle: 'How to Order Industrial Supplies from Machrio | Machrio',
    metaDescription:
      'Follow the Machrio ordering workflow from product search and RFQ to payment confirmation, shipping selection, and tracking.',
    quickAnswer:
      'Order on Machrio by browsing products, deciding between direct checkout or RFQ, confirming payment, selecting the right shipping path, and tracking the shipment after dispatch.',
    faq: [
      {
        question: 'When should I choose RFQ instead of direct checkout on Machrio?',
        answer:
          'Choose RFQ when you need bulk pricing, a proforma invoice, formal internal approval, sourcing support, or a shipping recommendation for a larger order.',
      },
      {
        question: 'What payment methods are available?',
        answer:
          'Machrio supports secure card payments through Stripe, digital wallets on supported devices, bank transfers for business orders, and business account terms for approved customers.',
      },
      {
        question: 'How do I decide between U.S. warehouse, DDP air, and DDP sea?',
        answer:
          'Use U.S. warehouse stock for urgent U.S. delivery, DDP air when you need a balance of speed and landed-cost visibility, and DDP sea for budget-sensitive bulk orders with longer lead times.',
      },
    ],
    content: richText(
      paragraph(
        'Machrio supports two common industrial buying paths: a faster online checkout flow for straightforward orders, and an RFQ-led path for larger, more formal, or more complex procurement needs. The process is designed so buyers can move between those two paths without starting over.'
      ),
      heading('h2', 'Step 1: Find the Right Product Group'),
      paragraph(
        'Start by searching the catalog or browsing categories such as Safety and PPE, Adhesives and Sealants, Packaging and Shipping, Cleaning and Janitorial, or Material Handling. This helps you confirm that the order belongs in the correct product family before you compare purchasing options.'
      ),
      paragraph(
        'If the need is broad rather than SKU-specific, it is still useful to narrow down the category first. That makes later quote communication faster and more accurate.'
      ),
      heading('h2', 'Step 2: Decide Between Direct Checkout and RFQ'),
      paragraph(
        'Direct checkout works best for standard purchases that do not need extra approval. RFQ is the better choice when the order is larger, involves several items, needs volume pricing, or requires a formal proforma invoice for finance or procurement review.'
      ),
      paragraph(
        'A simple rule is this: if your team already knows the order and just wants to pay, use checkout. If your team needs pricing confirmation, shipping guidance, or internal sign-off, use RFQ.'
      ),
      heading('h2', 'Step 3: Confirm the Payment Path'),
      paragraph(
        'For urgent or straightforward buys, secure card checkout is the quickest route. For business orders, Machrio also supports bank transfer and approved account-based payment arrangements. If your company needs a PO-backed workflow, ask for the invoice path early so finance receives the right documents.'
      ),
      heading('h2', 'Step 4: Match Shipping to the Order Priority'),
      paragraph(
        'Review the fulfillment route before approving the order. Select U.S. warehouse delivery when speed inside the United States matters most. Choose DDP air when you want faster international delivery with duties typically prepaid. Choose DDP sea when the order is less urgent and cost control matters more than transit time.'
      ),
      paragraph(
        'For non-DDP courier shipments, confirm whether import duties and taxes may still be charged locally so the total cost is understood up front.'
      ),
      heading('h2', 'Step 5: Track Delivery and Coordinate Receiving'),
      paragraph(
        'After dispatch, use the shipment and order confirmation details to track progress. Receiving teams should keep the order number, invoice, and shipping method on hand so any delivery question can be resolved quickly with support.'
      ),
      heading('h2', 'When to Contact the Sales Team'),
      bulletList([
        'You need a formal quote within the same buying cycle.',
        'The order includes multiple categories or repeated replenishment.',
        'Your company requires a proforma invoice, PO support, or account setup.',
        'You want help choosing the best route for urgency, budget, and duty handling.',
      ]),
      paragraph(
        'In short, the fastest Machrio ordering workflow is to choose the correct buying path first. That one decision usually determines whether the rest of the order feels easy or unnecessarily manual.'
      )
    ),
    source: 'builtin',
  },
  {
    id: 'builtin-ddp-air-vs-ddp-sea-vs-us-warehouse-shipping',
    title: 'DDP Air vs DDP Sea vs U.S. Warehouse Shipping',
    slug: 'ddp-air-vs-ddp-sea-vs-us-warehouse-shipping',
    excerpt:
      'Compare speed, landed-cost visibility, and best-use scenarios for Machrio\'s main fulfillment routes so you can pick the right balance of urgency and budget.',
    category: 'product-comparison',
    tags: ['shipping comparison', 'ddp air', 'ddp sea', 'us warehouse'],
    author: 'Machrio Team',
    status: 'published',
    publishedAt: '2026-04-11T02:00:00.000Z',
    createdAt: '2026-04-11T02:00:00.000Z',
    updatedAt: '2026-04-11T02:00:00.000Z',
    metaTitle: 'DDP Air vs DDP Sea vs U.S. Warehouse Shipping | Machrio',
    metaDescription:
      'Compare U.S. warehouse delivery, DDP air, and DDP sea to choose the right Machrio shipping option for speed, cost, and customs control.',
    quickAnswer:
      'Use U.S. warehouse shipping for the fastest domestic delivery, DDP air for a balanced international option, and DDP sea for bulk orders where cost savings matter more than speed.',
    faq: [
      {
        question: 'Which option is best for urgent U.S. replenishment?',
        answer:
          'U.S. warehouse fulfillment is the best fit because it avoids cross-border transit and typically reaches the destination in a much shorter delivery window.',
      },
      {
        question: 'Why do many buyers choose DDP air?',
        answer:
          'DDP air is often the best middle ground because it is faster than sea freight while still giving buyers better landed-cost visibility than many non-DDP courier routes.',
      },
      {
        question: 'When does DDP sea make the most sense?',
        answer:
          'DDP sea is strongest for larger, lower-urgency orders where freight efficiency and predictable duty handling matter more than delivery speed.',
      },
    ],
    content: richText(
      paragraph(
        'Shipping decisions shape the true outcome of an industrial order. Two suppliers may quote the same product, but the better route for your team depends on whether you value urgency, predictable landed cost, or freight efficiency on a larger shipment.'
      ),
      paragraph(
        'Machrio highlights three main fulfillment paths on the site: U.S. warehouse delivery, DDP air, and DDP sea. Each one solves a different procurement problem.'
      ),
      heading('h2', 'U.S. Warehouse: Best for Speed Inside the U.S.'),
      paragraph(
        'When inventory is already positioned in the United States, this is usually the fastest and simplest option for domestic buyers. It works well for urgent replenishment, line-down situations, and short planning windows where every day matters.'
      ),
      paragraph(
        'The tradeoff is scope. U.S. warehouse stock is ideal when the item is available locally, but it may not offer the same breadth or consolidation opportunities as a broader cross-border order.'
      ),
      heading('h2', 'DDP Air: Best Balance of Speed and Cost Control'),
      paragraph(
        'DDP air is the middle-ground route. It is materially faster than sea freight and still supports a delivery model where duties and taxes are typically prepaid. That makes it attractive for international buyers who need better turnaround without handing cost control over to a last-minute customs bill.'
      ),
      paragraph(
        'For many routine but time-sensitive industrial purchases, DDP air is the safest compromise between urgency and predictability.'
      ),
      heading('h2', 'DDP Sea: Best for Bulk and Budget Planning'),
      paragraph(
        'DDP sea is usually the strongest option when the order is larger, heavier, or less urgent. It reduces freight cost pressure and still supports clearer duty handling than a standard non-DDP import path. Buyers commonly choose this route for planned replenishment, project stock, or lower-turn MRO items.'
      ),
      paragraph(
        'The main tradeoff is lead time. Sea freight requires stronger planning discipline, but it can deliver better total economics for the right order profile.'
      ),
      heading('h2', 'What About Express Courier?'),
      paragraph(
        'Express courier can still be useful for certain shipments, but Machrio notes that non-DDP courier routes may leave duties and taxes with the buyer. That is why many procurement teams prefer comparing U.S. warehouse, DDP air, and DDP sea first before defaulting to the fastest advertised transit time.'
      ),
      heading('h2', 'A Simple Decision Rule'),
      bulletList([
        'Choose U.S. warehouse when the order is urgent and domestic availability exists.',
        'Choose DDP air when timing matters but you still want smoother landed-cost control.',
        'Choose DDP sea when the order is larger, planned, and more sensitive to freight cost than transit speed.',
      ]),
      paragraph(
        'The best route is the one that matches the business need behind the purchase, not just the delivery promise shown on the first screen.'
      )
    ),
    source: 'builtin',
  },
]
