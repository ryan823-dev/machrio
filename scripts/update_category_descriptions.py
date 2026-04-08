#!/usr/bin/env python3
"""
Update category descriptions in database with rich, detailed content
Run: python scripts/update_category_descriptions.py
"""

import psycopg2
import json

# Database connection
conn = psycopg2.connect(
    "postgresql://postgres:sGmPTCagRVFtHszbygRzSvYTdUXgCFfH@crossover.proxy.rlwy.net:38475/railway"
)
cur = conn.cursor()

# Detailed category descriptions (4-5 lines each) based on slug patterns
category_descriptions = {
    # Adhesives & Sealants & Tapes
    'adhesives': """Industrial adhesives, glues, and bonding solutions for manufacturing, assembly, and repair applications. Our comprehensive selection includes epoxy, cyanoacrylate, polyurethane, and acrylic adhesives for bonding metals, plastics, ceramics, and composites. Trusted brands like Loctite, 3M, and Permabond deliver reliable performance in demanding environments. Whether you need threadlockers, retainers, or structural adhesives, we have solutions for automotive, aerospace, electronics, and general manufacturing. Technical support and bulk pricing available for high-volume users.""",
    
    'sealants': """High-performance sealants and caulking products for sealing joints, gaps, and seams in industrial and construction applications. Choose from silicone, polyurethane, polysulfide, and butyl sealants designed for waterproofing, weatherproofing, and chemical resistance. Our sealants excel in extreme temperatures, UV exposure, and dynamic joint movement. Ideal for HVAC, plumbing, automotive, marine, and building envelope applications. Professional-grade formulations ensure long-lasting seals that prevent leaks, reduce energy loss, and protect against environmental damage.""",
    
    'tape': """Industrial tapes for bonding, masking, packaging, electrical insulation, and specialty applications. Our extensive inventory includes double-sided tapes, foam tapes, VHB tapes, masking tapes, electrical tapes, duct tapes, and safety tapes. Leading manufacturers like 3M, Berry, and Intertape provide reliable adhesion to various substrates including metal, plastic, glass, and painted surfaces. Applications range from general purpose bonding and mounting to critical aerospace and electronics assembly. Custom die-cutting and slitting services available for specific requirements.""",
    
    # Safety & PPE
    'safety': """Comprehensive personal protective equipment (PPE) and safety supplies for industrial workplace protection. Our catalog includes safety glasses, hard hats, hearing protection, respiratory masks, safety gloves, high-visibility apparel, steel-toe boots, and fall arrest systems. We stock trusted brands like 3M, Honeywell, MSA Safety, and Ansell that meet OSHA, ANSI, and CSA standards. From head to toe protection for construction, manufacturing, chemical handling, and hazardous environments. Bulk discounts and safety program consulting available for enterprise customers.""",
    
    'gloves': """Protective gloves for industrial, medical, food service, and laboratory applications. Our selection includes nitrile exam gloves, latex gloves, vinyl gloves, cut-resistant gloves, chemical-resistant gloves, heat-resistant gloves, and disposable gloves. Brands like Ansell, Kimberly-Clark, and Showa deliver superior dexterity, grip, and protection against chemicals, abrasions, cuts, and punctures. Available in multiple sizes and thicknesses for precision work or heavy-duty tasks. Powder-free options for sensitive environments. Volume pricing for healthcare facilities, restaurants, and manufacturing plants.""",
    
    'respiratory': """Respiratory protection equipment including N95 respirators, half-face respirators, full-face respirators, PAPR systems, and supplied-air respirators. Our respirators protect against dust, fumes, mists, gases, vapors, and biological contaminants. Trusted brands like 3M, Honeywell, and MSA provide NIOSH-approved filtration for asbestos, silica, lead, pesticides, and hazardous chemicals. Replacement filters, cartridges, and accessories available. Fit testing services and respiratory protection program compliance support for industrial hygiene and workplace safety.""",
    
    'eyewear': """Safety glasses, goggles, and face shields for comprehensive eye and face protection. Our eyewear meets ANSI Z87.1+ high-impact standards and features anti-fog, anti-scratch, and UV protection coatings. Styles include wraparound safety glasses, over-glass specs, bifocal readers, chemical splash goggles, and welding helmets. Brands like 3M, Uvex, and Pyramex offer comfortable, lightweight designs for all-day wear. Prescription safety eyewear available. Essential for construction, manufacturing, laboratories, and any environment with flying debris, chemicals, or optical radiation.""",
    
    'hard hats': """Head protection including hard hats, bump caps, and helmet accessories for construction, manufacturing, and utility work. Our hard hats meet ANSI/ISEA Z89.1 standards with Type I (top impact) and Type II (top and side impact) ratings. Class E (electrical), Class G (general), and Class C (conductive) options available. Features include 4-point or 6-point ratchet suspensions, moisture-wicking sweatbands, accessory slots for face shields and earmuffs, and high-visibility colors. Brands like MSA, Bullard, and Pyramex deliver durability and comfort for demanding work environments.""",
    
    'fall protection': """Complete fall arrest systems, harnesses, lanyards, self-retracting lifelines, and anchor points for working at heights. Our fall protection equipment meets OSHA 1926.502 and ANSI Z359 standards for construction, telecommunications, wind energy, and industrial applications. Full-body harnesses with dorsal D-rings, positioning belts, rope grabs, shock-absorbing lanyards, and rescue equipment available. Leading brands include 3M DBI-SALA, Honeywell Miller, and FallTech. Training and certified inspection services ensure compliance and worker safety.""",
    
    # Material Handling
    'material handling': """Complete material handling equipment and supplies for moving, storing, and controlling materials in warehouse, distribution, and industrial facilities. Our product line includes hand trucks, platform carts, pallet jacks, conveyor systems, hoists, cranes, lifting tables, and ergonomic work positioners. Storage solutions feature pallet racking, shelving units, mezzanines, lockers, and modular drawers. Brands like Vestil, Jamco, and Ballymore provide heavy-duty construction for demanding applications. Custom material handling system design and installation services available.""",
    
    'cart': """Carts, trucks, and trolleys for transporting materials, equipment, and supplies throughout facilities. Our selection includes platform trucks, hand trucks, utility carts, shelf carts, bin carts, and specialty carts for specific applications. Load capacities from 200 to 4,000 lbs with pneumatic, polyurethane, or rubber casters. Features like foldable handles, removable sides, and modular shelving enhance versatility. Brands like Rubbermaid Commercial, Magliner, and Wesco deliver durability for warehouse, hospital, hotel, and manufacturing environments. Custom configurations available.""",
    
    'lifting': """Lifting equipment including chain hoists, wire rope hoists, electric hoists, lever hoists, jacks, slings, shackles, and rigging hardware. Our lifting products handle loads from 1/4 ton to 100+ tons for construction, manufacturing, marine, and entertainment applications. Manual and powered options with hook-mounted, trolley-mounted, or fixed configurations. Wire rope slings, chain slings, and synthetic slings in various lengths and capacities. Crosby, Harrington, and Jet Lifting provide certified quality with load testing documentation. Rigging training and inspection services available.""",
    
    'storage': """Industrial storage solutions including pallet racking, cantilever racking, shelving units, mezzanine systems, lockers, cabinets, and modular drawer systems. Our storage products maximize warehouse space utilization with boltless assembly, adjustable beam levels, and high-density configurations. Brands like Lista, Vidmar, and Equipto offer tool storage cabinets, workbenches, and drawer dividers. Wire shelving, chrome wire racks, and polymer shelving for clean rooms and food service. Custom storage system design, CAD layout, and professional installation services.""",
    
    # Tools
    'tool': """Professional hand tools, power tools, and tool accessories for industrial maintenance, construction, automotive, and manufacturing applications. Our comprehensive inventory includes wrenches, sockets, screwdrivers, pliers, cutting tools, measuring tools, drills, grinders, saws, and pneumatic tools. Trusted brands like Snap-on, Milwaukee, DeWalt, Matco, and Proto deliver professional quality with warranty support. Tool storage solutions include rolling cabinets, tool chests, and wall-mounted organizers. Calibrated torque tools with certification available. Fleet pricing for maintenance teams and contractors.""",
    
    'hand tool': """Manual hand tools for gripping, cutting, fastening, measuring, and general purpose work in industrial and trade applications. Our selection includes wrenches, sockets, screwdrivers, pliers, cutters, hammers, chisels, files, saws, measuring tapes, levels, and clamps. Chrome vanadium steel construction with precision machining for durability and accuracy. Brands like Craftsman, Stanley, Channellock, and Klein Tools meet professional standards. Ergonomic handles reduce fatigue during extended use. Individual tools and complete sets for mechanics, electricians, carpenters, and maintenance technicians.""",
    
    'power tool': """Electric and pneumatic power tools for drilling, cutting, grinding, sanding, fastening, and material removal. Our catalog features cordless drills, impact drivers, angle grinders, circular saws, reciprocating saws, rotary hammers, sanders, polishers, and air tools. Leading brands include Milwaukee M18, DeWalt 20V MAX, Makita, Bosch, and Ingersoll Rand. Brushless motor technology delivers longer runtime and extended tool life. Complete systems with batteries, chargers, and carrying cases. Industrial pneumatic tools for high-cycle production environments.""",
    
    'cutting': """Precision cutting tools including end mills, drill bits, inserts, blades, cutters, saws, and abrasives for metalworking, woodworking, and plastic fabrication. Our cutting tool inventory features carbide end mills, HSS drills, reamers, taps, dies, threading tools, and tool holders for CNC machining and manual mills. Brands like Kennametal, Sandvik, Mitsubishi, and Harvey Tool provide performance and reliability. Coolant-fed tools, variable helix designs, and specialized geometries for challenging materials. Tool grinding and recoating services extend tool life.""",
    
    # Fasteners
    'fastener': """Complete fastener solutions including bolts, screws, nuts, washers, anchors, rivets, and specialty fasteners for industrial assembly, construction, and MRO applications. Our inventory spans inch and metric sizes in grade 2, 5, 8, and stainless steel 304/316. Products meet ASTM, SAE, ISO, and DIN standards. Applications include structural steel, machinery, automotive, marine, and aerospace. Bulk packaging and vendor-managed inventory programs available. Custom fastener kits and private labeling for distributors and OEMs.""",
    
    'bolt': """High-strength bolts and screws for structural, mechanical, and general industrial fastening applications. Our bolt inventory includes hex bolts, carriage bolts, eye bolts, U-bolts, J-bolts, anchor bolts, and socket head cap screws. Grades 2, 5, 8, and A325/A490 structural bolts in zinc-plated, hot-dip galvanized, and stainless steel finishes. Metric and imperial sizes from 1/4" to 2" diameter and M6 to M48. ASTM, SAE, and ISO certified. Threaded rod, nuts, and washers sold separately or as complete assemblies.""",
    
    'bearing': """Precision bearings for rotating machinery, conveyors, pumps, motors, and mechanical equipment. Our bearing selection includes deep groove ball bearings, angular contact bearings, spherical roller bearings, tapered roller bearings, needle bearings, and thrust bearings. Brands like SKF, FAG, Timken, and NSK deliver ABEC precision grades for high-speed, high-load, and extreme temperature applications. Sealed and shielded bearings with pre-lubrication for maintenance-free operation. Bearing pullers, heaters, and lubrication tools for installation.""",
    
    # Plumbing & Pumps
    'plumbing': """Complete plumbing supplies including pipes, fittings, valves, fixtures, water heaters, pumps, and installation accessories for residential, commercial, and industrial applications. Our inventory covers PVC, CPVC, copper, black iron, stainless steel, and PEX piping systems. Fittings include elbows, tees, couplings, unions, reducers, and adapters in socket, threaded, and flanged connections. Valves include ball valves, gate valves, check valves, butterfly valves, and pressure reducing valves. Brands like Uponor, Charlotte Pipe, Apollo, and NIBCO.""",
    
    'pump': """Industrial and commercial pumps for water supply, wastewater, chemical transfer, hydraulics, and process applications. Our pump catalog includes centrifugal pumps, submersible pumps, sump pumps, sewage pumps, diaphragm pumps, gear pumps, peristaltic pumps, and multistage pumps. Leading brands like Grundfos, Goulds, Little Giant, and Dayton deliver flows from GPM to 10,000+ GPM and heads up to 1,000 feet. Materials include cast iron, stainless steel, bronze, and thermoplastics for chemical compatibility. Variable frequency drives and pump control panels available.""",
    
    'valve': """Industrial valves for controlling flow, pressure, and direction of liquids, gases, and steam in plumbing, HVAC, process, and power generation applications. Our valve selection includes ball valves, gate valves, globe valves, check valves, butterfly valves, plug valves, and pressure relief valves. Sizes from 1/4" to 48" with threaded, socket weld, and flanged ends. Materials include bronze, cast iron, carbon steel, stainless steel, and exotic alloys. Actuated valves with electric, pneumatic, and hydraulic operators for automated control.""",
    
    'pipe': """Pipes, tubing, and pipe fittings for plumbing, mechanical, and industrial piping systems. Our inventory includes PVC schedule 40/80, CPVC, copper Type K/L/M, black steel, galvanized steel, stainless steel 304/316, and PEX tubing. Sizes from 1/8" to 24" diameter with various wall thicknesses and pressure ratings. Fittings include elbows (45/90), tees, crosses, reducers, couplings, unions, caps, and plugs. Grooved, threaded, socket, and butt-weld connections. Pipe hangers, supports, insulation, and trace heating available.""",
    
    'hose': """Flexible hoses, hose fittings, and hose reels for air, water, chemicals, hydraulics, steam, and material handling applications. Our hose catalog includes rubber air hoses, water hoses, hydraulic hoses, chemical transfer hoses, food-grade hoses, and PTFE hoses. Sizes from 1/4" to 6" ID with working pressures up to 10,000 PSI. Reinforced with wire braid, spiral wire, or textile for strength. End fittings include NPT, JIC, ORS, flanged, and camlock quick disconnects. Hose reels in steel and stainless steel with manual rewind, spring rewind, and motor-driven options.""",
    
    # Electrical
    'electrical': """Complete electrical supplies including wire and cable, conduit, fittings, boxes, panels, breakers, switches, receptacles, lighting, and electrical components for residential, commercial, and industrial installations. Our inventory covers THHN/THWN building wire, MC cable, AC cable, portable cords, control cable, and instrumentation cable. Conduit includes EMT, RMC, IMC, PVC, and flexible conduit in trade sizes 1/2" to 4". Brands like Southwire, Arlington, Eaton, Schneider Electric, and Hubbell deliver NEC compliance and UL listing.""",
    
    'wire': """Electrical wire and cable for power distribution, control systems, data communications, and specialty applications. Our selection includes THHN/THWN-2 building wire in stranded and solid copper from 14 AWG to 750 MCM, MC armored cable, AC cable, SOOW portable cord, tray cable, VFD cable, and instrument cable. Aluminum conductors available for feeders and service entrance. Colors include black, white, red, blue, green (ground), and multi-color sets. Spools from 100 ft to 5,000 ft. Custom cutting and wire marking services.""",
    
    'lighting': """Industrial and commercial lighting fixtures, lamps, ballasts, drivers, and lighting controls for warehouses, factories, offices, retail, and outdoor applications. Our lighting catalog includes LED high bays, low bays, vapor-tight fixtures, flood lights, street lights, parking lot lights, exit signs, emergency lights, and task lighting. Retrofit kits for metal halide and fluorescent replacement. Brands like Lithonia, Holophane, Cree, and Philips deliver energy efficiency with DLC and Energy Star certification. Lighting design services with photometric analysis and rebate assistance.""",
    
    'led': """LED lighting solutions for industrial, commercial, residential, and outdoor applications. Our LED products include high bay fixtures (100W to 400W equivalent), panel lights, troffers, downlights, flood lights, area lights, wall packs, canopy lights, and linear strip lights. Lumen output from 1,000 to 100,000 lumens with color temperatures 2700K to 5000K. Dimmable options with 0-10V, DALI, and wireless controls. IP65 and IP66 ratings for wet and dusty locations. 5-year warranties and DLC Premium qualification for maximum utility rebates.""",
    
    # Cleaning & Janitorial
    'cleaning': """Professional cleaning supplies and janitorial products for facility maintenance, sanitation, and infection control. Our catalog includes floor cleaners, degreasers, disinfectants, glass cleaners, restroom cleaners, and specialty cleaners for industrial equipment. Cleaning tools include microfiber mops, cloths, sponges, brushes, squeegees, and spray bottles. Waste receptacles, recycling bins, and liners. Brands like Rubbermaid Commercial, 3M, O-Cedar, and Boardwalk. Green Seal and EcoLogo certified products for sustainable cleaning programs. Bulk pricing for building service contractors.""",
    
    'janitorial': """Complete janitorial equipment and supplies for commercial and industrial cleaning professionals. Our product line includes automatic floor scrubbers, sweepers, vacuum cleaners (upright, backpack, wet/dry), carpet extractors, pressure washers, and steam cleaners. Janitorial carts, mop buckets with wringers, utility carts, and housekeeping carts. Dispensers for soap, paper towels, and toilet paper. Rubbermaid Commercial, Sanitaire, NSS, and Minuteman provide commercial-grade durability. Replacement parts, batteries, and cleaning solutions available.""",
    
    'disinfectant': """EPA-registered disinfectants and sanitizers for cleaning and infection control in healthcare, food service, education, and commercial facilities. Our disinfectant selection includes quaternary ammonium compounds, bleach-based disinfectants, hydrogen peroxide cleaners, and alcohol-based sanitizers. Kills 99.9% of bacteria, viruses (including SARS-CoV-2), and fungi. Ready-to-use sprays, wipes, and concentrates for dilution. Contact times from 1 to 10 minutes. Fragrance-free and green certified options. Bulk cases and institutional sizes for facilities management.""",
    
    # Packaging
    'packaging': """Complete packaging materials and supplies for product protection, storage, and shipping. Our packaging catalog includes corrugated boxes (regular slotted, full overlap, die-cut), box inserts, foam packaging, bubble wrap, foam peanuts, air pillows, and paper void fill. Stretch wrap, shrink wrap, strapping, and sealing tapes for unitizing and securing loads. Packaging machinery includes stretch wrappers, strapping machines, tape dispensers, and box sealers. Custom box manufacturing and printed packaging available.""",
    
    'shipping': """Shipping supplies including corrugated boxes, mailers, envelopes, labels, packing slips, and documentation pouches for e-commerce, distribution, and fulfillment operations. Our shipping box inventory includes standard sizes (small, medium, large) and custom dimensions with 200# to 275# test strength. Poly mailers, bubble mailers, and rigid mailers for apparel, books, and small items. Thermal shipping labels (4x6), packing list envelopes, and "Fragile" tape. Brands like Uline, Staples, and Amazon. Automated box sizing systems and label printers available.""",
    
    'bubble': """Bubble wrap and protective packaging materials for cushioning fragile items during shipping and storage. Our bubble wrap selection includes small bubble (3/16"), large bubble (1/2"), perforated rolls, sheets, and pre-made bags. Anti-static bubble wrap for electronics, food-grade bubble wrap, and self-adhesive bubble wrap. Widths from 12" to 60" with roll lengths up to 750 feet. Alternative protective packaging includes foam sheets, kraft paper, honeycomb wrap, and molded pulp inserts. Dispensers and perforators for efficient packaging operations.""",
    
    # Welding
    'welding': """Complete welding equipment, supplies, and safety gear for MIG, TIG, stick, plasma cutting, and oxy-fuel welding processes. Our welding catalog includes welding machines (Millermatic, Lincoln Power MIG, ESAB), welding wire (solid, flux-core, aluminum), welding rods (6010, 6011, 7018), TIG tungsten electrodes, and welding gas equipment. Welding safety includes auto-darkening helmets, welding gloves, welding blankets, welding curtains, and respirators. Welding positioners, turntables, and fixtures for precision fabrication.""",
    
    'weld': """Welding consumables including MIG wire, flux-core wire, TIG rods, stick electrodes, and submerged arc wire for welding carbon steel, stainless steel, aluminum, and exotic alloys. Our welding wire inventory includes ER70S-6, ER308L, ER4043, E6010, E7018 in various diameters and package sizes (2lb spools, 10lb spools, 25lb boxes, 250lb coils, 1000lb reels). Brands like Lincoln Electric, ESAB, Hobart, and Blue Demon. AWS and ASME certified for structural and code work. Shielding gases (C25, 100% CO2, argon) and flux available.""",
    
    # Lab & Scientific
    'lab': """Laboratory equipment and supplies for scientific research, quality control, testing, and educational institutions. Our lab catalog includes microscopes, balances, pH meters, spectrophotometers, centrifuges, hot plates, stirrers, ovens, incubators, and environmental chambers. Lab consumables include beakers, flasks, test tubes, pipettes, burettes, graduated cylinders, and petri dishes. Lab safety equipment includes fume hoods, eyewash stations, safety showers, and chemical storage cabinets. Brands like Corning, Pyrex, Eppendorf, and Thermo Fisher Scientific.""",
    
    'laboratory': """Complete laboratory equipment, glassware, instruments, and consumables for chemistry, biology, microbiology, and analytical laboratories. Our laboratory inventory includes volumetric glassware (Class A), borosilicate glassware, plasticware, filtration equipment, lab heaters, chillers, circulators, and vacuum pumps. Lab furniture includes lab tables, fume hoods, laminar flow hoods, biosafety cabinets, and lab benches with epoxy or phenolic resin tops. Calibration services, ISO-certified products, and GMP compliance documentation available.""",
    
    'testing': """Testing and measurement equipment for quality control, inspection, and materials characterization in manufacturing, construction, and research laboratories. Our testing equipment includes hardness testers, coating thickness gauges, surface roughness testers, force gauges, torque testers, vision systems, CMMs, and non-destructive testing (NDT) equipment. Measurement tools include calipers, micrometers, indicators, height gauges, and optical comparators. Brands like Mitutoyo, Starrett, Rockwell, and Instron. Calibration certificates traceable to NIST standards.""",
    
    # HVAC
    'hvac': """Heating, ventilation, and air conditioning (HVAC) equipment and supplies for residential, commercial, and industrial climate control. Our HVAC catalog includes air handlers, furnaces, boilers, air conditioners, heat pumps, rooftop units, split systems, and packaged units. HVAC components include compressors, condensers, evaporator coils, expansion valves, refrigerants (R-410A, R-32), and thermostats. Brands like Carrier, Trane, Lennox, and Rheem. HVAC tools include manifold gauges, vacuum pumps, leak detectors, and recovery machines.""",
    
    'ventilation': """Ventilation fans, blowers, ductwork, and air circulation equipment for industrial, commercial, and residential applications. Our ventilation products include centrifugal fans, axial fans, inline duct fans, roof exhausters, wall fans, hood fans, and explosion-proof fans. Ducting includes flexible duct, spiral pipe, rectangular duct, and fabric duct in galvanized steel, aluminum, and PVC. Dampers, diffusers, grilles, and registers for air distribution. Ventilation accessories include backdraft shutters, bird screens, and vibration isolators. AMCA-certified performance.""",
    
    'heater': """Industrial heaters and heating equipment for space heating, process heating, and freeze protection. Our heater selection includes unit heaters (gas-fired, electric, hot water), infrared heaters, radiant tube heaters, make-up air units, duct heaters, circulation heaters, and immersion heaters. Fuels include natural gas, propane, fuel oil, and electricity. Heating capacities from 1 kW to 2+ million BTU. Explosion-proof and corrosion-resistant models for hazardous locations. Modulating controls, thermostats, and building automation system integration available.""",
    
    # Industrial Supplies
    'industrial': """General industrial supplies and MRO (Maintenance, Repair, and Operations) products for manufacturing facilities, warehouses, plants, and commercial operations. Our comprehensive catalog spans adhesives, abrasives, fasteners, tools, safety equipment, material handling, electrical supplies, plumbing, HVAC, janitorial, and packaging. We stock trusted brands and offer competitive pricing with same-day shipping. Inventory management programs, vendor-managed inventory (VMI), and consignment stock available. Dedicated account management and technical support for enterprise customers.""",
    
    'mro': """Maintenance, repair, and operations (MRO) supplies for keeping industrial facilities running efficiently and minimizing downtime. Our MRO product categories include lubricants, bearings, power transmission, pneumatics, hydraulics, electrical, tools, safety, fasteners, abrasives, and facility maintenance. We serve automotive, food & beverage, pharmaceutical, aerospace, paper, steel, and general manufacturing industries. Supply chain solutions include 24/7 emergency service, kitting, vending machines, and integrated supply programs. Cost reduction through standardization and consolidation.""",
    
    'abrasive': """Abrasives for grinding, sanding, cutting, deburring, and surface preparation in metalworking, woodworking, and fabrication. Our abrasive products include grinding wheels, cut-off wheels, flap discs, fiber discs, sanding belts, sanding sheets, abrasive pads, wire brushes, and abrasive blasting media. Grits from coarse (24 grit) to ultra-fine (2000 grit) in aluminum oxide, silicon carbide, zirconia, and ceramic abrasives. Brands like 3M, Norton, PFERD, and Weiler. Bonded, coated, and non-woven abrasives for manual and CNC applications.""",
    
    'lubricant': """Industrial lubricants, oils, greases, and maintenance products for machinery, equipment, and vehicle maintenance. Our lubricant selection includes motor oils, gear oils, hydraulic oils, compressor oils, bearing greases, penetrating oils, cutting fluids, and way oils. Viscosity grades include ISO VG 32, 46, 68, 100, 150, 220, 320, 460, 680. Brands like Mobil, Shell, Chevron, Lucas, and WD-40. Synthetic and bio-based lubricants for extreme temperatures and environmentally sensitive applications. Lubrication equipment includes grease guns, oilers, and dispensing systems.""",
    
    # Office & Facility
    'office': """Office supplies and equipment for workplace organization, productivity, and professional operations. Our office catalog includes writing instruments (pens, pencils, markers), paper products (copy paper, notepads, sticky notes), filing supplies (folders, binders, labels), desk accessories (staplers, tape dispensers, scissors), and office machines (printers, copiers, shredders). Technology includes computer monitors, keyboards, mice, headsets, and webcams. Office furniture includes desks, chairs, filing cabinets, bookcases, and conference tables. Brands like Staples, Avery, Post-it, and Swingline.""",
    
    'facility': """Facility maintenance and building maintenance supplies for property managers, maintenance departments, and building engineers. Our facility products include light bulbs (LED, fluorescent, incandescent), HVAC filters, plumbing repair parts, electrical supplies, door hardware, lock sets, janitorial supplies, grounds maintenance equipment, and tools. Preventive maintenance supplies include lubricants, sealants, adhesives, tapes, and fasteners. Building automation and energy management products available. Bulk pricing for property management companies and facility service contractors.""",
    
    'furniture': """Industrial and commercial furniture for workplace, warehouse, and institutional environments. Our furniture catalog includes office desks, ergonomic chairs, conference tables, filing cabinets, lockers, shelving units, workbenches, industrial tables, storage cabinets, and material handling carts. Healthcare furniture includes nurse stations, medical carts, patient room furniture, and waiting room seating. Educational furniture includes classroom desks, chairs, cafeteria tables, and library furniture. Brands like HON, Steelcase, Herman Miller, and Global. Space planning and installation services available.""",
    
    # Automotive
    'auto': """Automotive tools, parts, fluids, and supplies for vehicle maintenance, repair, and service in professional shops and DIY garages. Our automotive catalog includes hand tools (wrenches, sockets, screwdrivers), power tools (impact wrenches, ratchets, drills), diagnostic tools (scan tools, code readers, multimeters), shop equipment (jack stands, floor jacks, oil drain pans), and automotive chemicals (motor oil, brake fluid, coolant, cleaners). Brands like Snap-on, Matco, Mac Tools, OTC, and Chemtool. Tool storage includes tool chests, rolling cabinets, and tool bags.""",
    
    'automotive': """Complete automotive equipment and supplies for professional repair shops, quick lube centers, dealerships, and serious DIY enthusiasts. Our automotive inventory includes shop equipment (vehicle lifts, tire changers, wheel balancers, alignment systems), fluid exchange equipment (oil changers, transmission flush machines, coolant exchangers), shop air compressors, lubrication equipment, and automotive lifts. Safety equipment includes safety glasses, gloves, and respirators. Shop supplies include shop towels, rags, absorbents, and waste disposal containers.""",
    
    # 3D Printing
    '3d print': """3D printing equipment, materials, and accessories for additive manufacturing, prototyping, and product development. Our 3D printing catalog includes FDM printers, SLA printers, SLS printers, and multi-material printers from leading manufacturers like Ultimaker, Prusa, Formlabs, and Markforged. 3D printing materials include PLA, ABS, PETG, TPU, nylon, carbon fiber-filled filaments, and resin. Filament diameters include 1.75mm and 2.85mm in various colors and properties. Post-processing equipment includes curing stations, wash stations, and support removal tools.""",
    
    'printer': """3D printers and printing supplies for rapid prototyping, custom manufacturing, and educational applications. Our printer selection includes desktop FDM printers, large-format printers, industrial production printers, and dental/medical printers. Features include dual extruders, heated beds, enclosed chambers, auto bed leveling, and filament runout sensors. Printer accessories include build plates (glass, PEI, BuildTak), nozzles (brass, hardened steel), extruders, hot ends, and upgrade kits. 3D scanning and CAD software available. Training and technical support included.""",
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
        matched_key = None
        for key, desc in category_descriptions.items():
            if key in slug_lower or slug_lower in key:
                matched_key = key
                description_text = desc
                break
        
        # If no match found, use a generic description
        if not description_text:
            description_text = f"""Quality {name} products for industrial, commercial, and professional applications. Our selection includes trusted brands and competitive pricing for maintenance, repair, and operations (MRO). Suitable for manufacturing, construction, facility maintenance, and general industrial use. Bulk pricing and volume discounts available for enterprise customers. Fast shipping and dedicated support for all your {name.lower()} needs."""
    
    # Create Lexical rich text format with multiple paragraphs
    # Split by sentences and create multiple paragraphs
    sentences = [s.strip() for s in description_text.replace('\n', ' ').split('.') if s.strip()]
    paragraphs = []
    
    # Group into 4-5 paragraphs
    current_para = []
    for i, sentence in enumerate(sentences):
        current_para.append(sentence)
        if len(current_para) >= 2 or (i == len(sentences) - 1 and current_para):
            para_text = '. '.join(current_para)
            if not para_text.endswith('.'):
                para_text += '.'
            paragraphs.append(para_text)
            current_para = []
    
    # Create Lexical content with multiple paragraphs
    lexical_children = []
    for para_text in paragraphs[:5]:  # Max 5 paragraphs
        lexical_children.append({
            "type": "paragraph",
            "format": "",
            "indent": 0,
            "version": 1,
            "children": [
                {
                    "mode": "normal",
                    "text": para_text,
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
        })
    
    lexical_content = {
        "root": {
            "type": "root",
            "format": "",
            "indent": 0,
            "version": 1,
            "children": lexical_children,
            "direction": "ltr"
        }
    }
    
    # Extract first paragraph for short description
    short_desc = paragraphs[0] if paragraphs else description_text[:250]
    
    # Update category
    cur.execute("""
        UPDATE categories 
        SET description = %s, 
            short_description = %s
        WHERE id = %s
    """, (json.dumps(lexical_content), short_desc, category_id))
    updated += 1

conn.commit()
print(f"Updated {updated} categories with detailed descriptions")

cur.close()
conn.close()
