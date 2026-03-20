// 回滚脚本 - 撤销所有产品分类更新
// 使用前请务必备份数据库！
// 生成时间：2026-03-19T03:40:19.159Z


// 回滚产品：Lab Brush with Plastic Handle, Bristle Material for Cleaning, Pkg Qty 24 (MACH-8247)
db.products.updateOne(
  { _id: "69a2f7388f9bd9b91fc93df1" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Lab Brush with Metal Handle, Nylon Bristles, for Cleaning and Maintenance, Pkg Qty 100 (MACH-8246)
db.products.updateOne(
  { _id: "69a2f73b8f9bd9b91fc93dfa" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Laboratory Test Tube Brush with Stainless Steel Handle, Hog Bristles, for Test Tube Cleaning, Pkg Qty 80 (MACH-8245)
db.products.updateOne(
  { _id: "69a2f73d8f9bd9b91fc93e03" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Laboratory Test Tube Brush with Stainless Steel Handle, Nylon Bristles, for Test Tube Cleaning, Pkg Qty 80 (MACH-8244)
db.products.updateOne(
  { _id: "69a2f73f8f9bd9b91fc93e0c" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Laboratory Test Tube Brush with Stainless Steel Handle, Nylon Bristles, for Test Tube Cleaning, Pkg Qty 80 (MACH-8243)
db.products.updateOne(
  { _id: "69a2f7428f9bd9b91fc93e15" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Laboratory Brush with Nylon, Flexible Design, for Precision Cleaning, Pkg Qty 12 (MACH-8242)
db.products.updateOne(
  { _id: "69a2f7458f9bd9b91fc93e1e" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Lab Cleaning Brush with Hog Bristles, 6.89 inch Length, Pkg Qty 36 (MACH-8241)
db.products.updateOne(
  { _id: "69a2f7478f9bd9b91fc93e27" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Lab Cleaning Brush with PBT Bristles, 345mm Length, Pkg Qty 10 (MACH-8240)
db.products.updateOne(
  { _id: "69a2f74a8f9bd9b91fc93e30" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Lab Brush with Plastic Handle, Pig Hair Bristles, for Cleaning and Maintenance, Pkg Qty 12 (MACH-8239)
db.products.updateOne(
  { _id: "69a2f74c8f9bd9b91fc93e39" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Industrial LED High Bay Light, High Intensity, Aluminum and Polycarbonate, for Factories and Warehouses, with 100W Output (MACH-cf56e491ab692516e267879da00a443b)
db.products.updateOne(
  { _id: "69a2f7718f9bd9b91fc93eb7" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Lamp Holder, Plastic Construction, 60W Power Rating, Pkg Qty 10 (MACH-8172)
db.products.updateOne(
  { _id: "69a2f7978f9bd9b91fc93f3e" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Surface Mount Light Socket, Ceramic and Flame-Resistant PC Construction, 100W Rating, Pkg Qty 30 (MACH-8171)
db.products.updateOne(
  { _id: "69a2f79a8f9bd9b91fc93f47" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：E27 Ceiling Mount Lamp Holder, Plastic Construction, Standard Socket Rating, Pkg Qty 10 (MACH-8170)
db.products.updateOne(
  { _id: "69a2f79d8f9bd9b91fc93f50" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Lamp Holder, PC and Metal Construction, E27 Socket Rating, Pkg Qty 50 (MACH-8169)
db.products.updateOne(
  { _id: "69a2f79f8f9bd9b91fc93f59" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Ceramic Lamp Holder, Surface-Mount Construction, E27 Socket Type, Pkg Qty 50 (MACH-8168)
db.products.updateOne(
  { _id: "69a2f7a28f9bd9b91fc93f62" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Lamp Holder, Plastic, 185-250V, Pkg Qty 50 (MACH-8167)
db.products.updateOne(
  { _id: "69a2f7a48f9bd9b91fc93f6b" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：E27 Light Socket, Plastic, 220V Rating, Pkg Qty 50 (MACH-8166)
db.products.updateOne(
  { _id: "69a2f7a78f9bd9b91fc93f74" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Lamp Holder, Plastic, 60W, Pkg Qty 50 (MACH-8165)
db.products.updateOne(
  { _id: "69a2f7a98f9bd9b91fc93f7d" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：LED Bulb, Plastic Construction, 5W Output, Pkg Qty 50 (MACH-8151)
db.products.updateOne(
  { _id: "69a2f7cd8f9bd9b91fc93ffb" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：High Visibility Safety Vest, Orange, Polyester, Reflective Stripes, Zipper Closure, Pkg Qty 12 (MACH-FGBX987)
db.products.updateOne(
  { _id: "69a2f7ea8f9bd9b91fc9405e" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：High Visibility Safety Vest, Orange, Polyester, Reflective Stripes, Zipper Closure, Multiple Pockets, Pkg Qty 12 (MACH-FGBX988)
db.products.updateOne(
  { _id: "69a2f7ec8f9bd9b91fc94067" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：High Visibility Safety Vest, Yellow, Polyester, Reflective Stripes, Zipper Closure, Pkg Qty 12 (MACH-FGBX989)
db.products.updateOne(
  { _id: "69a2f7ef8f9bd9b91fc94070" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Electrical Conduit Pipe with 1.97 in Diameter, 12.47 ft Length, featuring Impact Resistance and 120 psi Pressure Rating for Electrical Systems in Industrial Environments, Pkg Qty 8 (MACH-DJ6798349)
db.products.updateOne(
  { _id: "69a2f87c8f9bd9b91fc9425f" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Water Supply Equal Diameter Coupling, Compatible with 3.54 in Pipe, White (MACH-DJ6798348)
db.products.updateOne(
  { _id: "69a2f87e8f9bd9b91fc94268" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Water Supply Elbow, 90 Degree, Compatible with 3.54 in Pipe, White (MACH-DJ6798347)
db.products.updateOne(
  { _id: "69a2f8818f9bd9b91fc94271" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Pipe Coupling, 1 in Nominal Diameter, Milky White, Pkg Qty 200 (MACH-DJ6798342)
db.products.updateOne(
  { _id: "69a2f8838f9bd9b91fc9427a" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC U Drainage Coupling, dn75, 3 in Nominal Diameter, White, Compatible with 3 in Pipe (MACH-DJ6798341)
db.products.updateOne(
  { _id: "69a2f8868f9bd9b91fc94283" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Electrical Conduit Elbow, dn20, 0.79 in Nominal Diameter, White, Compatible with 0.79 in Pipe (MACH-DJ6798340)
db.products.updateOne(
  { _id: "69a2f8898f9bd9b91fc9428c" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Water Supply Elbow, 90 Degree, 0.79 in Nominal Diameter, Gray (MACH-DJ6798346)
db.products.updateOne(
  { _id: "69a2f88b8f9bd9b91fc94295" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC U Drainage Elbow, 90 Degree, With Inspection Port, dn110, 4.33 in Nominal Diameter, White, Compatible with 4.33 in Pipe (MACH-DJ6798345)
db.products.updateOne(
  { _id: "69a2f88e8f9bd9b91fc9429e" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Drainage Expansion Joint, 2 in Nominal Diameter, Milky White (MACH-DJ6798344)
db.products.updateOne(
  { _id: "69a2f8908f9bd9b91fc942a7" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC U Water Supply Coupling, dn40, 1.57 in Nominal Diameter, White, Compatible with 1.57 in Pipe (MACH-DJ6798343)
db.products.updateOne(
  { _id: "69a2f8938f9bd9b91fc942b0" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Water Supply Elbow, 90 Degree, 0.79 in Nominal Diameter, White, Pkg Qty 20 (MACH-DJ6798359)
db.products.updateOne(
  { _id: "69a2f8958f9bd9b91fc942b9" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Drainage Elbow, 45 Degree, dn50, 2 in Nominal Diameter, White, Pkg Qty 5 (MACH-DJ6798358)
db.products.updateOne(
  { _id: "69a2f8988f9bd9b91fc942c2" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Water Supply Reducing Coupling, 3 in to 1.97 in, White (MACH-DJ6798353)
db.products.updateOne(
  { _id: "69a2f89a8f9bd9b91fc942cb" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Electrical Conduit Straight Coupling, 0.79 in Nominal Diameter, White, Pkg Qty 100 (MACH-DJ6798362)
db.products.updateOne(
  { _id: "69a2f8ce8f9bd9b91fc9437f" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Electrical Conduit Elbow, 90 Degree, 0.63 in Outer Diameter, 0.63 in Inner Diameter, White, Pkg Qty 10 (MACH-DJ6798367)
db.products.updateOne(
  { _id: "69a2f8db8f9bd9b91fc943ac" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Electrical Conduit Coupling, National Standard, DN20A, 0.79 in Nominal Diameter, Compatible with 0.79 in Pipe, White (MACH-DJ6798336)
db.products.updateOne(
  { _id: "69a2f96a8f9bd9b91fc945a4" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Water Supply Tee, DN25, 1 in Nominal Diameter, Compatible with 1 in Pipe, White (MACH-DJ6798331)
db.products.updateOne(
  { _id: "69a2f96c8f9bd9b91fc945ad" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Drainage Elbow, 90 Degree, DE75, 3 in Nominal Diameter, White (MACH-DJ6798330)
db.products.updateOne(
  { _id: "69a2f96f8f9bd9b91fc945b6" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC U Electrical Conduit Straight Coupling, DN25, 1 in Nominal Diameter, Compatible with 1 in Pipe, White (MACH-DJ6798335)
db.products.updateOne(
  { _id: "69a2f9718f9bd9b91fc945bf" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC U Drainage Threaded Expansion Joint, Extended Type, DN110, 4.33 in Nominal Diameter, Compatible with 4.33 in Pipe, White (MACH-DJ6798334)
db.products.updateOne(
  { _id: "69a2f9748f9bd9b91fc945c8" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Electrical Conduit, Type B, DN25, 1 in Nominal Diameter, 0.06 in Thickness, 6.23 ft Length, White (MACH-DJ6798333)
db.products.updateOne(
  { _id: "69a2f9768f9bd9b91fc945d1" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Water Supply Female Thread Coupling, Large Inner Diameter 1.26 in, Small Inner Diameter 1 in, Pkg Qty 50 (MACH-DJ6798332)
db.products.updateOne(
  { _id: "69a2f9798f9bd9b91fc945da" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Hose Barb Fitting with Polypropylene Construction, 5/32" Size, featuring Corrosion Resistance for Fluid Transfer in Industrial Environments, Pkg Qty 100 (MACH-YU7658959)
db.products.updateOne(
  { _id: "69a2f99a8f9bd9b91fc9464f" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：American hose clamp, stainless steel 201, width 0.47 inch, diameter range from 9.45 inch to 10.24 inch, Pkg Qty 20 (MACH-YU7658989)
db.products.updateOne(
  { _id: "69a2f9fc8f9bd9b91fc947a5" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Thickened flat pipe clamp, stainless steel 304, diameter 4.49 inch (MACH-YU7658988)
db.products.updateOne(
  { _id: "69a2fa028f9bd9b91fc947b7" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Spiral wrap tube protective sleeve cable organizer, black, diameter 0.79 inch, length 6.56 foot (MACH-DF759024)
db.products.updateOne(
  { _id: "69a2faa18f9bd9b91fc949dc" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Spiral wrap tube, outer diameter 0.98 inch, black, length 8.20 foot per roll (MACH-DF759023)
db.products.updateOne(
  { _id: "69a2faa48f9bd9b91fc949e5" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Heat shrink tubing, diameter 1.57 inch, red, length 164.04 foot, shrink ratio two to one (MACH-DF759029)
db.products.updateOne(
  { _id: "69a2faa78f9bd9b91fc949ee" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Heat shrink tubing, diameter 0.47 inch, shrink to 0.24 inch, black, length 16.40 foot, shrink ratio two to one (MACH-DF759028)
db.products.updateOne(
  { _id: "69a2faa98f9bd9b91fc949f7" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Heat shrink tubing kit, multiple colors, shrink ratio two to one, shrink size 0.39 inch, Pkg Qty 580 (MACH-DF759027)
db.products.updateOne(
  { _id: "69a2faac8f9bd9b91fc94a00" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Spiral wrap tube, diameter 0.24 inch, white, length 59.06 foot (MACH-DF759022)
db.products.updateOne(
  { _id: "69a2faae8f9bd9b91fc94a09" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Aluminum alloy parallel groove clamp, Hangzhou type, JBL 50 240 3 II, metallic color (MACH-DF759021)
db.products.updateOne(
  { _id: "69a2fab18f9bd9b91fc94a12" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Flat wire fixed clip, NF 2.2, height 0.39 inch, white, Pkg Qty 100 (MACH-DF759020)
db.products.updateOne(
  { _id: "69a2fab48f9bd9b91fc94a1b" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Drawer type parts box, 9 compartments, length 14.17 inch, width 9.45 inch, height 7.09 inch, orange and black (MACH-DF759079)
db.products.updateOne(
  { _id: "69a2fab68f9bd9b91fc94a24" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Drawer type parts box, 60 compartments, length 18.90 inch, width 14.57 inch, height 7.09 inch, orange and black (MACH-DF759078)
db.products.updateOne(
  { _id: "69a2fab98f9bd9b91fc94a2d" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Drawer type parts box, 18 compartments, length 18.90 inch, width 14.57 inch, height 7.09 inch, blue and black (MACH-DF759072)
db.products.updateOne(
  { _id: "69a2fabe8f9bd9b91fc94a3f" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Drawer type parts box, 39 compartments, length 18.90 inch, width 14.57 inch, height 7.09 inch, orange and black (MACH-DF759071)
db.products.updateOne(
  { _id: "69a2fac18f9bd9b91fc94a48" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Drawer type parts box, 30 compartments, length 14.17 inch, width 9.45 inch, height 7.09 inch, green and black (MACH-DF759070)
db.products.updateOne(
  { _id: "69a2fac38f9bd9b91fc94a51" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Drawer type parts box, 12 compartments, length 9.84 inch, width 7.09 inch, height 6.69 inch, green and black (MACH-DF759077)
db.products.updateOne(
  { _id: "69a2fac68f9bd9b91fc94a5a" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Drawer type parts box, 18 compartments, length 18.90 inch, width 14.57 inch, height 7.09 inch, orange and black (MACH-DF759076)
db.products.updateOne(
  { _id: "69a2fac88f9bd9b91fc94a63" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Drawer type storage box, KY 1, length 5.51 inch, width 3.62 inch, height 1.73 inch, transparent (MACH-DF759075)
db.products.updateOne(
  { _id: "69a2facb8f9bd9b91fc94a6c" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Drawer type parts box, 18 compartments, length 18.90 inch, width 14.57 inch, height 7.09 inch, black (MACH-DF759074)
db.products.updateOne(
  { _id: "69a2facd8f9bd9b91fc94a75" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Stainless steel cable tie, 304 material, width 0.39 inch, length 31.50 inch, Pkg Qty 10 (MACH-DF759004)
db.products.updateOne(
  { _id: "69a2fad08f9bd9b91fc94a7e" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Stainless steel cable tie, 304 material, width 0.31 inch, length 19.69 inch, Pkg Qty 30 (MACH-DF759003)
db.products.updateOne(
  { _id: "69a2fad38f9bd9b91fc94a87" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Stainless Steel Cable Tie with Locking Tab, 15.75 in Length, 0.31 in Width, for Electrical and Industrial Applications, Pkg Qty 6 Packs of 100 (MACH-DF759002)
db.products.updateOne(
  { _id: "69a2fad58f9bd9b91fc94a90" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Stainless steel insert cable tie, white nylon, width 0.31 inch, length 9.45 inch, Pkg Qty 100 (MACH-DF759001)
db.products.updateOne(
  { _id: "69a2fad88f9bd9b91fc94a99" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Adjustable stainless steel hose clamp, 304 stainless steel, model HSKP BXGZD HK07, width 0.49 inch, length 31.50 inch, thickness 0.02 inch (MACH-DF759008)
db.products.updateOne(
  { _id: "69a2fadb8f9bd9b91fc94aa2" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Stainless steel cable tie, 304 material, width 0.18 inch, length 11.81 inch, natural color, Pkg Qty 50 (MACH-DF759007)
db.products.updateOne(
  { _id: "69a2fadd8f9bd9b91fc94aab" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Stainless steel cable tie roll, 304 material, model 5654, width 0.47 inch, length 164.04 foot, white (MACH-DF759006)
db.products.updateOne(
  { _id: "69a2fae08f9bd9b91fc94ab4" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Stainless steel cable tie, model HKW 137, width 0.39 inch, thickness 0.01 inch, net weight 1.10 pound, Pkg Qty 50 (MACH-DF759005)
db.products.updateOne(
  { _id: "69a2fae38f9bd9b91fc94abd" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Grid drawer type storage box, three drawers, blue, length 8.94 inch, width 6.50 inch, height 1.69 inch (MACH-DF759084)
db.products.updateOne(
  { _id: "69a2fae58f9bd9b91fc94ac6" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Office storage box, gray, large size, three layers (MACH-DF759083)
db.products.updateOne(
  { _id: "69a2fae88f9bd9b91fc94acf" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Drawer type parts box, WST151 series, blue, 16 compartments, length 20.67 inch, width 6.30 inch, height 14.76 inch (MACH-DF759082)
db.products.updateOne(
  { _id: "69a2faea8f9bd9b91fc94ad8" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Drawer type parts box, A804OG, four compartments, orange and black, length 9.84 inch, width 7.09 inch, height 6.69 inch (MACH-DF759081)
db.products.updateOne(
  { _id: "69a2faed8f9bd9b91fc94ae1" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Self locking nylon cable tie, black, width 0.19 inch, length 9.84 inch, Pkg Qty 100 (MACH-DF758998)
db.products.updateOne(
  { _id: "69a2fb148f9bd9b91fc94b68" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Releasable nylon cable tie, black, reusable, width 0.19 inch, length 11.81 inch, Pkg Qty 100 (MACH-DF758999)
db.products.updateOne(
  { _id: "69a2fb178f9bd9b91fc94b71" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PTFE heat shrink tubing, transparent, inner diameter 0.04 inch, shrink ratio one point seven to one, length 656.17 foot, voltage rating 600 volt (MACH-DF759036)
db.products.updateOne(
  { _id: "69a2fb378f9bd9b91fc94bdd" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Heat shrink tubing, rated voltage one kilovolt, diameter 0.31 inch, yellow green, length 328.08 foot, shrink ratio two to one (MACH-DF759035)
db.products.updateOne(
  { _id: "69a2fb398f9bd9b91fc94be6" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Heat shrink tubing kit, IT 60, multiple colors, diameter 0.24 inch, shrink ratio two to one, voltage rating 600 volt, Pkg Qty 60 (MACH-DF759034)
db.products.updateOne(
  { _id: "69a2fb3c8f9bd9b91fc94bef" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Vacuum cleaner filter element, compatible with NT 75 vacuum models (MACH-FG4354413)
db.products.updateOne(
  { _id: "69a2fbc98f9bd9b91fc94dde" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Air purifier filter set, compatible with KJ1000F P22B, KJ1000F P22W, KJ800F P22B, Pkg Qty 3 (MACH-FG4354412)
db.products.updateOne(
  { _id: "69a2fbcc8f9bd9b91fc94de7" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Cylindrical Plastic Filter with 0.47 Inch Inner Diameter, 0.61 Inch Outer Diameter, featuring 1.00 Inch Length, and 0.47 Inch Inner Diameter for Industrial Filtration in Harsh Environments, Pkg Qty 25 (MACH-FG4354411)
db.products.updateOne(
  { _id: "69a2fbd18f9bd9b91fc94df9" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：HEPA filter set, for VAIR150 450H heat recovery ventilation system, high efficiency filtration, Pkg Qty 2 (MACH-FG4354410)
db.products.updateOne(
  { _id: "69a2fbd68f9bd9b91fc94e0b" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Water filter cartridge, model C4 DRO, for industrial water purification (MACH-FG4354414)
db.products.updateOne(
  { _id: "69a2fbf28f9bd9b91fc94e6e" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Activated carbon water filter cartridge, model No 1, compatible with YDF211 water dispenser (MACH-FG4354424)
db.products.updateOne(
  { _id: "69a2fbff8f9bd9b91fc94e9b" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Post activated carbon water filter cartridge, compatible with AHR27 4030K2 water purifier (MACH-FG4354423)
db.products.updateOne(
  { _id: "69a2fc018f9bd9b91fc94ea4" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Activated carbon water filter cartridge, model T33B, one micron filtration, twist on design, length 11.40 inch (MACH-FG4354422)
db.products.updateOne(
  { _id: "69a2fc048f9bd9b91fc94ead" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Activated carbon water filter cartridge, model JZW LX1 CTO, for home and commercial water purification (MACH-FG4354421)
db.products.updateOne(
  { _id: "69a2fc098f9bd9b91fc94ebf" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Universal post activated carbon water filter cartridge, large T33 quick connect interface, three eighth inch connection, food grade PP shell (MACH-FG4354425)
db.products.updateOne(
  { _id: "69a2fc258f9bd9b91fc94f22" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Acrylic safety sign, red and white, bilingual warning sign, caution slippery, length 3.94 inch, width 3.94 inch, thickness 0.08 inch (MACH-FG4354455)
db.products.updateOne(
  { _id: "69a2fc748f9bd9b91fc95039" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：OSHA safety sign, soft PVC with adhesive back, bilingual warning sign, caution floor slippery when wet, length 12.40 inch, width 9.84 inch, thickness 0.03 inch (MACH-FG4354454)
db.products.updateOne(
  { _id: "69a2fc768f9bd9b91fc95042" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Safety sign, yellow, PVC board, bilingual warning sign, caution wet floor, for pools, length 15.75 inch, width 7.87 inch (MACH-FG4354453)
db.products.updateOne(
  { _id: "69a2fc798f9bd9b91fc9504b" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Plastic A frame warning sign, yellow, PP material, bilingual warning sign, caution wet floor, length 23.62 inch, width 8.07 inch, height 11.61 inch (MACH-FG4354452)
db.products.updateOne(
  { _id: "69a2fc7b8f9bd9b91fc95054" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：A frame caution sign, yellow, plastic, bilingual warning sign, caution wet floor, length 23.62 inch, width 11.81 inch, height 7.87 inch (MACH-FG4354451)
db.products.updateOne(
  { _id: "69a2fc7e8f9bd9b91fc9505d" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：High temperature burn warning label safety sign sticker, model HIT K007, equilateral triangle, size 2.00 inch, Pkg Qty 5 (MACH-QW3567790)
db.products.updateOne(
  { _id: "69a2fcc58f9bd9b91fc95159" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：High temperature warning label safety sticker, model HIT M012, English version, length 2.40 inch, width 1.60 inch, Pkg Qty 5 (MACH-QW3567792)
db.products.updateOne(
  { _id: "69a2fcc78f9bd9b91fc95162" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Electric shock warning label safety sign sticker, model ELE K010, equilateral triangle, size 4.00 inch, Pkg Qty 20 (MACH-QW3567791)
db.products.updateOne(
  { _id: "69a2fcca8f9bd9b91fc9516b" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Barcode Label Roll, Paper Construction, Thermal Print Technology, featuring Permanent Adhesive, and offering 2.36 x 2.36 in Label Size for Industrial Applications in Warehouse Environments, Pkg Qty 12 (MACH-QW3567794)
db.products.updateOne(
  { _id: "69a2fccc8f9bd9b91fc95174" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Barcode Labels, Paper Construction, Durable Adhesive, featuring 2.36 by 2.36 Inch Size for Industrial Labeling in Warehouse Environments, Pkg Qty 36 (MACH-QW3567793)
db.products.updateOne(
  { _id: "69a2fccf8f9bd9b91fc9517d" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Thermal Transfer Labels, Paper with Glossy Finish, 2 Inches by 1 Inch, Durable Print Quality, Pkg Qty 50 (MACH-QW3567796)
db.products.updateOne(
  { _id: "69a2fcd18f9bd9b91fc95186" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Industrial Labels, Paper, Permanent Adhesive, Pkg Qty 50 (MACH-QW3567795)
db.products.updateOne(
  { _id: "69a2fcd48f9bd9b91fc9518f" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Cable identification tag, model YMD 672, ABS hard plastic, length 2.80 inch, width 1.20 inch, includes 500 tags, includes 500 cable ties, includes 2 pens (MACH-QW3567798)
db.products.updateOne(
  { _id: "69a2fcda8f9bd9b91fc951a1" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Thermal Label Roll, White Paper, featuring Permanent Adhesive, and offering 1.57 inches by 2 inches Size for Barcode Labeling in Warehouse Environments, Pkg Qty 36 (MACH-QW3567797)
db.products.updateOne(
  { _id: "69a2fcde8f9bd9b91fc951b3" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Short shackle brass padlock, model 265 50, brass, keyed different, lock body width 1.97 inch, lock body height 1.69 inch (MACH-QW3567832)
db.products.updateOne(
  { _id: "69a2fce48f9bd9b91fc951c5" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Cable identification tag, HKW 300 series, ABS material, length 2.80 inch, width 1.26 inch, Pkg Qty 500 (MACH-QW3567799)
db.products.updateOne(
  { _id: "69a2fce68f9bd9b91fc951ce" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Automatic label dispenser, model X 130, label width from 0.20 inch to 5.12 inch (MACH-QW3567824)
db.products.updateOne(
  { _id: "69a2fce98f9bd9b91fc951d7" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Medical label printer, model B1, lake blue, supports multiple label sizes, includes one roll of white labels (MACH-QW3567823)
db.products.updateOne(
  { _id: "69a2fceb8f9bd9b91fc951e0" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Automatic label dispenser, model X 100, length 11.00 inch, width 5.35 inch, height 6.85 inch, label width from 0.20 inch to 3.94 inch (MACH-QW3567826)
db.products.updateOne(
  { _id: "69a2fcee8f9bd9b91fc951e9" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Automatic label dispenser, model X 130 imported version, label width from 0.20 inch to 5.12 inch (MACH-QW3567827)
db.products.updateOne(
  { _id: "69a2fcf58f9bd9b91fc95204" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Fully automatic label dispenser, model 1150D, label length from 0.12 inch to 5.91 inch, label width from 0.16 inch to 5.51 inch (MACH-QW3567820)
db.products.updateOne(
  { _id: "69a2fcfb8f9bd9b91fc95216" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Fully automatic induction label dispenser, model 1150D, label length from 0.12 inch to 5.91 inch, label width from 0.16 inch to 5.51 inch (MACH-QW3567822)
db.products.updateOne(
  { _id: "69a2fcfd8f9bd9b91fc9521f" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Biohazard toxic warning sign chemical safety label sticker, model CH K003, equilateral triangle, size 2.00 inch, Pkg Qty 50 (MACH-QW3567789)
db.products.updateOne(
  { _id: "69a2fd008f9bd9b91fc95228" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Automatic label dispenser, model X 100, label width from 0.20 inch to 3.94 inch (MACH-QW3567821)
db.products.updateOne(
  { _id: "69a2fd028f9bd9b91fc95231" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Biohazard warning sign chemical safety label sticker, model CH K002, equilateral triangle, size 2.00 inch, Pkg Qty 5 (MACH-QW3567788)
db.products.updateOne(
  { _id: "69a2fd058f9bd9b91fc9523a" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：ID badge holder, model QS 1620G, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, pink (MACH-QW3567813)
db.products.updateOne(
  { _id: "69a2fd078f9bd9b91fc95243" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Magnetic card holder, engineering plastic, length 3.15 inch, width 1.77 inch, yellow, Pkg Qty 10 (MACH-QW3567812)
db.products.updateOne(
  { _id: "69a2fd0a8f9bd9b91fc9524c" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Magnetic counting card holder, model 23742, engineering plastic with magnet, length 4.92 inch, width 3.39 inch, five digit counting, red, Pkg Qty 10 (MACH-QW3567817)
db.products.updateOne(
  { _id: "69a2fd128f9bd9b91fc95267" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Perforated magnetic card holder, model 2M00099, PP material with magnet, outer frame length 12.20 inch, width 8.74 inch, inner page length 10.90 inch, width 7.48 inch, blue (MACH-QW3567816)
db.products.updateOne(
  { _id: "69a2fd158f9bd9b91fc95270" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Automatic label dispenser, model LSH 120, label width from 0.20 inch to 4.72 inch (MACH-QW3567819)
db.products.updateOne(
  { _id: "69a2fd188f9bd9b91fc95279" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Automatic label dispenser, model X 100, length 11.00 inch, width 5.35 inch, height 6.85 inch, label width from 0.20 inch to 3.94 inch (MACH-QW3567818)
db.products.updateOne(
  { _id: "69a2fd1a8f9bd9b91fc95282" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Cable identification tag, model YMD 669, ABS material, length 2.80 inch, width 1.20 inch, Pkg Qty 100 (MACH-QW3567802)
db.products.updateOne(
  { _id: "69a2fd228f9bd9b91fc9529d" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Cable identification tag kit, model TYZ BP204, ABS material, length 2.80 inch, width 1.20 inch, thickness 0.04 inch, includes 100 tags, includes 100 cable ties, includes 1 pen (MACH-QW3567801)
db.products.updateOne(
  { _id: "69a2fd248f9bd9b91fc952a6" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：ID badge holder, model QS 1620H, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, white (MACH-QW3567804)
db.products.updateOne(
  { _id: "69a2fd278f9bd9b91fc952af" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：ID badge holder, model QS 1620A, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, gray (MACH-QW3567803)
db.products.updateOne(
  { _id: "69a2fd298f9bd9b91fc952b8" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：ID badge holder, model QS 1620D, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, dark blue (MACH-QW3567806)
db.products.updateOne(
  { _id: "69a2fd2c8f9bd9b91fc952c1" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：ID badge holder, model QS 1620J, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, light blue (MACH-QW3567805)
db.products.updateOne(
  { _id: "69a2fd2f8f9bd9b91fc952ca" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：ID badge holder, model QS 1620B, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, red (MACH-QW3567808)
db.products.updateOne(
  { _id: "69a2fd318f9bd9b91fc952d3" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：ID badge holder, model QS 1620F, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, orange (MACH-QW3567807)
db.products.updateOne(
  { _id: "69a2fd348f9bd9b91fc952dc" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Material card holder, model 240296, PVC material, A6 horizontal version, length 6.30 inch, width 4.33 inch, Pkg Qty 20 (MACH-QW3567809)
db.products.updateOne(
  { _id: "69a2fd368f9bd9b91fc952e5" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Fluororubber O ring, green, outer diameter 0.71 inch, cross section diameter 0.08 inch (MACH-fd34565564)
db.products.updateOne(
  { _id: "69a2fd838f9bd9b91fc953f3" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：O-ring with EPDM Material, 0.2 in Cross Section, featuring High Chemical Resistance, and Excellent Flexibility for Sealing Applications in Harsh Environments, Pkg Qty 20 (MACH-fd34565563)
db.products.updateOne(
  { _id: "69a2fd888f9bd9b91fc95405" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Disposable medical mask, model DNE170, blue, non sterile, Pkg Qty 10 (MACH-fd34565543)
db.products.updateOne(
  { _id: "69a2fd9f8f9bd9b91fc95456" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：LED emitter, cool white, copper substrate, power 20 watt, diameter 0.79 inch (MACH-JS459508)
db.products.updateOne(
  { _id: "69a2fea18f9bd9b91fc957e3" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Ultra thin flashlight switch, length 0.47 inch, width 0.47 inch, height 0.37 inch, self locking type, Pkg Qty 5 (MACH-JS459509)
db.products.updateOne(
  { _id: "69a2fea48f9bd9b91fc957ec" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Extended angled rod wide head soft bristle wooden handle broom, length 51.18 inch, head width 12.60 inch (MACH-JS459470)
db.products.updateOne(
  { _id: "69a2fea68f9bd9b91fc957f5" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Plastic broom, head width 12.60 inch, length 34.65 inch, black (MACH-JS459471)
db.products.updateOne(
  { _id: "69a2fea98f9bd9b91fc957fe" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Mop Bucket made from Plastic, offering Manual Wringer for Wet Floor Cleaning, with 14L Capacity, and Gray Color for Industrial Use (MACH-JS459474)
db.products.updateOne(
  { _id: "69a2feac8f9bd9b91fc95807" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Mop Bucket made from Plastic, offering Manual Wringer for Standard Mop, with 30L Capacity, and 12 in Overall Length for Industrial and Commercial Cleaning Applications (MACH-JS459475)
db.products.updateOne(
  { _id: "69a2feae8f9bd9b91fc95810" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Straight rod wooden handle broom, head width 12.60 inch, length 31.50 inch, four rows hard bristles, random color (MACH-JS459472)
db.products.updateOne(
  { _id: "69a2feb18f9bd9b91fc95819" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Extended sorghum broom, length 51.18 inch, width 14.17 inch (MACH-JS459473)
db.products.updateOne(
  { _id: "69a2feb38f9bd9b91fc95822" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：LED emitter, cool white, aluminum substrate, power 10 watt, diameter 0.63 inch (MACH-JS459511)
db.products.updateOne(
  { _id: "69a2feb68f9bd9b91fc9582b" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PP Mop Wringer with manual wringing capacity, integrated drainage system, and 33x12.8 inch size for industrial cleaning tasks (MACH-JS459478)
db.products.updateOne(
  { _id: "69a2feb88f9bd9b91fc95834" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Waterproof tail switch rubber button for rechargeable flashlight, diameter 0.47 inch, height 0.30 inch, inner column diameter 0.04 inch (MACH-JS459512)
db.products.updateOne(
  { _id: "69a2febb8f9bd9b91fc9583d" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Industrial mechanical seal model MG1 18 G60 AQ2EFF precision engineered for industrial sealing (MACH-JS459515)
db.products.updateOne(
  { _id: "69a2fec88f9bd9b91fc9586a" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Mechanical seal model 120 35 alloy material shaft sleeve outer diameter one point three eight inch (MACH-JS459516)
db.products.updateOne(
  { _id: "69a2feca8f9bd9b91fc95873" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Mechanical seal model 109 45 fluororubber alloy material shaft sleeve outer diameter one point seven seven inch (MACH-JS459513)
db.products.updateOne(
  { _id: "69a2fecd8f9bd9b91fc9587c" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Mechanical seal model 109 20 alloy fluororubber shaft diameter zero point seven nine inch outer diameter one point three eight inch (MACH-JS459514)
db.products.updateOne(
  { _id: "69a2fed08f9bd9b91fc95885" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Mechanical seal model 109 30 silicon carbide graphite nitrile rubber industrial sealing (MACH-JS459519)
db.products.updateOne(
  { _id: "69a2fed28f9bd9b91fc9588e" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Mechanical seal model 109 25 alloy nitrile rubber shaft diameter zero point nine eight inch outer diameter one point five seven inch (MACH-JS459517)
db.products.updateOne(
  { _id: "69a2fed58f9bd9b91fc95897" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Mechanical seal model WB2 25 silicon carbide material shaft sleeve outer diameter one inch (MACH-JS459518)
db.products.updateOne(
  { _id: "69a2fed78f9bd9b91fc958a0" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Mechanical seal model 103 50 alloy graphite shaft sleeve outer diameter one point nine seven inch (MACH-JS459522)
db.products.updateOne(
  { _id: "69a2feec8f9bd9b91fc958e8" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Industrial electrical cabinet safety warning sticker English version size sixty by forty millimeter pack of five (MACH-AF0073509)
db.products.updateOne(
  { _id: "69a2ff7a8f9bd9b91fc95ae0" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Anti static PE self sealing bag pink length thirty one point five inch width thirty one point five inch thickness zero point zero zero four inch short side opening one hundred pieces (MACH-AE1788869)
db.products.updateOne(
  { _id: "69a2ff988f9bd9b91fc95b4c" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Anti static PE bag with static tape red length thirty one point five inch width thirty nine point three seven inch thickness zero point zero zero four inch (MACH-AA4298954)
db.products.updateOne(
  { _id: "69a2ffa08f9bd9b91fc95b67" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：ISO standard industrial safety warning sticker hand pinch crush hazard bilingual pack of five (MACH-AF0073510)
db.products.updateOne(
  { _id: "69a2ffa38f9bd9b91fc95b70" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Industrial machinery safety warning sticker gear chain pinch hazard bilingual pack of twenty four (MACH-AF0073513)
db.products.updateOne(
  { _id: "69a2ffa58f9bd9b91fc95b79" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Danger safety warning sticker do not open door when machine is working English version (MACH-AF0073514)
db.products.updateOne(
  { _id: "69a2ffa88f9bd9b91fc95b82" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Electrical shock hazard warning sticker English professional operation required pack of twenty five (MACH-AF0073511)
db.products.updateOne(
  { _id: "69a2ffaa8f9bd9b91fc95b8b" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：ISO industrial danger prohibition safety sticker dangerous do not touch English pack of twenty five (MACH-AF0073512)
db.products.updateOne(
  { _id: "69a2ffad8f9bd9b91fc95b94" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Thermal cable label F type yellow width zero point nine eight inch length three point zero seven inch tail length one point five seven inch one hundred labels per roll (MACH-5445172.0)
db.products.updateOne(
  { _id: "69a2ffaf8f9bd9b91fc95b9d" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Insulated foam aluminum foil box length fourteen point one seven inch width seven point six eight inch height nine point eight four inch (MACH-789524.0)
db.products.updateOne(
  { _id: "69a2ffb28f9bd9b91fc95ba6" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Foam insulated shipping box blue gray length thirteen point three nine inch width eight point six six inch height seven point zero nine inch (MACH-789528.0)
db.products.updateOne(
  { _id: "69a2ffb58f9bd9b91fc95baf" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：VCI rust inhibitor PE bag yellow length nineteen point six nine inch width fifteen point seven five inch thickness zero point zero zero four inch one hundred pieces (MACH-AC9007547)
db.products.updateOne(
  { _id: "69a2ffb78f9bd9b91fc95bb8" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：VCI rust inhibitor self sealing bag yellow length twenty seven point five six inch width nineteen point six nine inch one hundred pieces (MACH-AC9735491)
db.products.updateOne(
  { _id: "69a2ffba8f9bd9b91fc95bc1" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Anti static packaging bag, short side opening, length ten point two four inch, width thirteen point seven eight inch, thickness zero point zero zero six inch, one hundred pieces per bag (MACH-AE2160037)
db.products.updateOne(
  { _id: "69a2ffd38f9bd9b91fc95c1b" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：VCI rust inhibitor self sealing bag, blue, length eight point six six inch, width seven point zero nine inch, height eight point six six inch (MACH-AC9513601)
db.products.updateOne(
  { _id: "69a2ffe08f9bd9b91fc95c48" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：VCI rust inhibitor self sealing bag, yellow, length fifteen point seven five inch, width eleven point eight one inch, thickness zero point zero zero three six inch (MACH-AF0427182)
db.products.updateOne(
  { _id: "69a2ffe88f9bd9b91fc95c63" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Thermal self adhesive label, yellow, width one point five seven inch, height one point one eight inch, two hundred thirty labels per box (MACH-5445171.0)
db.products.updateOne(
  { _id: "69a2fff78f9bd9b91fc95c99" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Thermal label, white, width zero point five nine inch, height one point nine seven inch, one hundred thirty labels per roll (MACH-5445167.0)
db.products.updateOne(
  { _id: "69a300028f9bd9b91fc95cbd" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Bottle cleaning brush, PBT bristle, total length eleven point four two inch, bristle width one point nine seven inch, bristle length one point nine seven inch (MACH-5445186.0)
db.products.updateOne(
  { _id: "69a300048f9bd9b91fc95cc6" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Anti static PE bag, blue, length nine point eight four inch, width thirteen point seven eight inch, thickness zero point zero zero three inch, one hundred pieces (MACH-AA8702863)
db.products.updateOne(
  { _id: "69a3000c8f9bd9b91fc95ce1" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：AGV magnetic strip track protection tape, yellow, thickness two millimeter, width three point nine four inch, length thirty two point eight one yard (MACH-AA8989410)
db.products.updateOne(
  { _id: "69a3000f8f9bd9b91fc95cea" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Silica gel desiccant, blue granules, zero point three five ounce, fifty bags, moisture absorption for storage (MACH-5445159.0)
db.products.updateOne(
  { _id: "69a300178f9bd9b91fc95d05" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：VCI rust inhibitor self sealing bag, yellow, length twenty seven point five six inch, width nineteen point six nine inch, height twenty seven point five six inch, one hundred pieces (MACH-AC9665115)
db.products.updateOne(
  { _id: "69a300198f9bd9b91fc95d0e" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Anti static shielding bag, short side opening, length seven point eight seven inch, width eleven point eight one inch, thickness zero point zero zero three inch, one hundred pieces (MACH-AC6155847)
db.products.updateOne(
  { _id: "69a3001c8f9bd9b91fc95d17" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Anti static PE bag, pink, length seven point eight seven inch, width fifteen point seven five inch, thickness zero point zero zero four inch, one hundred pieces (MACH-AA9513940)
db.products.updateOne(
  { _id: "69a300218f9bd9b91fc95d29" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Food grade silica gel desiccant, 0.35oz bags, Pkg Qty 50, reusable for food, medicine, electronics, and pet items (MACH-5445158.0)
db.products.updateOne(
  { _id: "69a300618f9bd9b91fc95e0a" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Panoramic safety goggles 101141, anti fog, scratch resistant protective eyewear, Pkg Qty 2 (MACH-GH2117804)
db.products.updateOne(
  { _id: "69a300888f9bd9b91fc95e91" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Multifunctional soft stretcher, composite PVC material, deployed 99.2in by 34.3in, folded 34.3in by 13.0in (MACH-GH2117851)
db.products.updateOne(
  { _id: "69a300a48f9bd9b91fc95ef4" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Four piece scoop stretcher RC C1, aluminum alloy, deployed 79.6in by 16.5in by 2.8in, folded 46.5in by 16.5in by 2.8in (MACH-GH2117850)
db.products.updateOne(
  { _id: "69a300a78f9bd9b91fc95efd" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Multifunctional roll up soft stretcher YJK F5, EVA material, deployed 99.2in by 34.3in by 0.2in, folded 36.2in by 14.2in by 14.2in, orange red color (MACH-GH2117859)
db.products.updateOne(
  { _id: "69a300a98f9bd9b91fc95f06" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Economical four fold folding stretcher YHJ DJ06, aluminum alloy and blue Oxford cloth, deployed 82.7in by 21.3in by 3.9in, folded 23.6in by 9.8in by 5.9in, with storage bag (MACH-GH2117858)
db.products.updateOne(
  { _id: "69a300ac8f9bd9b91fc95f0f" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Two fold galvanized iron thickened folding stretcher, high molecular Oxford cloth, deployed 78.7in by 20.9in by 7.1in, folded 40.2in by 11.8in by 3.9in, blue color (MACH-GH2117857)
db.products.updateOne(
  { _id: "69a300ae8f9bd9b91fc95f18" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Two fold aluminum alloy folding stretcher, high molecular Oxford cloth and thickened aluminum alloy, deployed 78.7in by 20.9in by 7.1in, folded 40.2in by 11.8in by 3.9in, blue color (MACH-GH2117856)
db.products.updateOne(
  { _id: "69a300b18f9bd9b91fc95f21" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Folding stretcher, aluminum alloy, deployed 82.7in by 20.9in by 7.1in, folded 41.5in by 4.3in by 9.8in, blue color (MACH-GH2117855)
db.products.updateOne(
  { _id: "69a300b38f9bd9b91fc95f2a" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Reinforced shoulder strap portable folding soft stretcher TJ2049, nylon cloth material, deployed 70.1in by 27.2in, folded 21.7in by 11.8in by 1.6in, blue color (MACH-GH2117854)
db.products.updateOne(
  { _id: "69a300b68f9bd9b91fc95f33" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Portable folding soft stretcher TJ2049, nylon cloth material, deployed 70.1in by 27.2in, folded 21.7in by 11.8in by 1.6in, blue color, with storage bag (MACH-GH2117853)
db.products.updateOne(
  { _id: "69a300b98f9bd9b91fc95f3c" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Multi purpose first aid kit K 001P, green aluminum case, single shoulder or handheld design, includes multiple emergency items, 12.6in by 7.9in by 7.9in (MACH-GH2117830)
db.products.updateOne(
  { _id: "69a300bb8f9bd9b91fc95f45" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Home First Aid Kit, White, Class I Medical Device, Contains Multiple Emergency Items, Size 9.4 by 6.9 by 6.0 in (MACH-GH2117837)
db.products.updateOne(
  { _id: "69a300d78f9bd9b91fc95fa8" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：First Aid Kit, Silver, Class I Medical Device, Contains 23 Types of Emergency Items, Size 13.8 by 9.1 by 9.1 in (MACH-GH2117836)
db.products.updateOne(
  { _id: "69a300da8f9bd9b91fc95fb1" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Enterprise Enhanced Medical Kit, Metal Silver, Contains 30 Emergency Items, Size 17.7 by 10.6 by 10.6 in (MACH-GH2117835)
db.products.updateOne(
  { _id: "69a300dd8f9bd9b91fc95fba" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Handheld Aluminum Medical Box, Silver, Empty Case, Size 9.8 by 5.5 by 6.3 in (MACH-GH2117834)
db.products.updateOne(
  { _id: "69a300df8f9bd9b91fc95fc3" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：First Aid Kit, Silver, Aluminum Frame, Aluminum Plastic Panel, Standard Configuration, Size 11.8 by 7.1 by 7.9 in (MACH-GH2117833)
db.products.updateOne(
  { _id: "69a300e28f9bd9b91fc95fcc" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Practical First Aid Kit, Silver, Contains 6 Categories, 27 Types, 89 Emergency Items, Size 11 by 7.1 by 6.7 in (MACH-GH2117832)
db.products.updateOne(
  { _id: "69a300e48f9bd9b91fc95fd5" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：ANSI Certified Chemical Safety Goggles, Anti Fog, Scratch Resistant, Dustproof, Impact Resistant, UV Protective, Splash Proof Eyewear (MACH-GH2117799)
db.products.updateOne(
  { _id: "69a300e78f9bd9b91fc95fde" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：ABS First Aid Kit, Orange, Handheld, Wall Mounted, Contains 30 Emergency Items, Size 12.4 by 8.5 by 4.9 in (MACH-GH2117831)
db.products.updateOne(
  { _id: "69a300e98f9bd9b91fc95fe7" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：ANSI Certified Safety Glasses, Anti Fog, Scratch Resistant, Dustproof, Impact Resistant, UV Protective Eyewear (MACH-GH2117798)
db.products.updateOne(
  { _id: "69a300ec8f9bd9b91fc95ff0" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Wheeled Fire Emergency Stretcher, Aluminum, Oxford Cloth, Deployed Size 72.8 by 19.7 by 8.5 in, Folded Size 36.0 by 20.0 by 11.8 in (MACH-GH2117840)
db.products.updateOne(
  { _id: "69a300f18f9bd9b91fc96002" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Multifunctional Stretcher, Fabric, Deployed Size 98.4 by 33.9 in, Orange Yellow (MACH-GH2117849)
db.products.updateOne(
  { _id: "69a300f48f9bd9b91fc9600b" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Portable Inflatable Rescue Stretcher, Foot Pump Inflatable, TPU Double Coated Cloth, Deployed Size 74.8 by 27.6 in (MACH-GH2117848)
db.products.updateOne(
  { _id: "69a300f68f9bd9b91fc96014" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Emergency Spinal Board Stretcher, High Density Polyethylene, Deployed Size 72.0 by 17.7 by 2.4 in, Load ≤350 lb, Orange Red (MACH-GH2117847)
db.products.updateOne(
  { _id: "69a300f98f9bd9b91fc9601d" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Ambulance 2 Fold Stretcher, Stainless Steel, Oxford Cloth, Deployed Size 78.7 by 20.9 in, Folded Size 38.6 by 7.9 in (MACH-GH2117846)
db.products.updateOne(
  { _id: "69a300fb8f9bd9b91fc96026" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Rescue Stretcher made from Plastic, offering Adjustable Straps for Safe Patient Transport, with Secure Straps, and 350 lbs Weight Capacity for Emergency Medical Applications (MACH-GH2117845)
db.products.updateOne(
  { _id: "69a300fe8f9bd9b91fc9602f" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Emergency Wheeled Folding Stretcher, Aluminum Alloy, Oxford Cloth, Deployed Size 72.8 by 20.5 by 8.3 in, Folded Size 36.2 by 20.5 by 3.5 in (MACH-GH2117844)
db.products.updateOne(
  { _id: "69a301008f9bd9b91fc96038" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Rescue Stretcher, Stainless Steel, Canvas, Blue, Deployed Size 78.7 by 20.9 by 11.8 in, Folded Size 39.4 by 9.8 by 3.1 in (MACH-GH2117843)
db.products.updateOne(
  { _id: "69a301038f9bd9b91fc96041" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Economical 2 Fold Folding Stretcher, Galvanized Iron Pipe, Blue Oxford Cloth, Deployed Size 78.7 by 21.3 by 7.1 in, Folded Size 39.4 by 11.8 by 3.9 in (MACH-GH2117842)
db.products.updateOne(
  { _id: "69a301068f9bd9b91fc9604a" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Handheld Welding Helmet, Thickened PP Material, Protective Welding Mask, Black (MACH-GH2117819)
db.products.updateOne(
  { _id: "69a301198f9bd9b91fc96089" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Handheld Welding Helmet, Shade 8, Polypropylene Material, Protective Welding Mask (MACH-GH2117818)
db.products.updateOne(
  { _id: "69a3011c8f9bd9b91fc96092" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Head Mounted Welding Helmet, Shade 8 to 11, With Lens, PP Material, Protective Welding Mask (MACH-GH2117817)
db.products.updateOne(
  { _id: "69a3011e8f9bd9b91fc9609b" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Economical Auto Darkening Welding Helmet, Shade 4 9 to 13, Head Mounted Protective Welding Mask (MACH-GH2117816)
db.products.updateOne(
  { _id: "69a301218f9bd9b91fc960a4" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Head Mounted Welding Helmet, Shade 8, Compatible with Welding Lens, Protective Welding Mask (MACH-GH2117815)
db.products.updateOne(
  { _id: "69a301238f9bd9b91fc960ad" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Metal First Aid Kit, Wall Mounted, Handheld, White, Contains Multiple Emergency Items, Size 9.4×4.3×15.2 in (MACH-GH2117829)
db.products.updateOne(
  { _id: "69a3014f8f9bd9b91fc96146" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：First Aid Kit Case, Empty, Silver, Aluminum Construction, Handheld, Shoulder Carry, Size 17.7×10.6×10.6 in (MACH-GH2117828)
db.products.updateOne(
  { _id: "69a301528f9bd9b91fc9614f" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：First Aid Kit, Metal Silver, Aluminum Frame and Panel, Contains 30 Types, 139 Emergency Items, Size 13.8×9.1×9.1 in (MACH-GH2117827)
db.products.updateOne(
  { _id: "69a301558f9bd9b91fc96158" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：First Aid Kit, Standard Configuration, 132 Items, Size 13.8×9.1×9.1 in (MACH-GH2117826)
db.products.updateOne(
  { _id: "69a301588f9bd9b91fc96161" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：First Aid Kit Case, Empty, Metal Silver, Aluminum Frame and Medium Fiber Panel, Handheld, Shoulder Carry, Size 11×7.1×6.7 in (MACH-GH2117825)
db.products.updateOne(
  { _id: "69a3015a8f9bd9b91fc9616a" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：First Aid Kit Case, Empty, Metal Silver, Aluminum Frame and Medium Fiber Panel, Handheld, Shoulder Carry, Size 12.2×7.9×7.5 in (MACH-GH2117824)
db.products.updateOne(
  { _id: "69a3015c8f9bd9b91fc96173" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：First Aid Kit, Basic, Metal Silver, Aluminum Frame and Panel, Contains 24 Types, 63 Emergency Items, Size 11×7.1×6.7 in (MACH-GH2117823)
db.products.updateOne(
  { _id: "69a3015f8f9bd9b91fc9617c" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Medical First Aid Kit, White and Transparent, Medical Grade PP Plastic, Contains 17 Types, 49 Emergency Items, Size 10.2×7.1×5.9 in (MACH-GH2117822)
db.products.updateOne(
  { _id: "69a301618f9bd9b91fc96185" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：First Aid Kit Case, Empty, Metal Silver, Aluminum Frame and Panel, Handheld, Shoulder Carry, Size 13.8×9.1×9.1 in (MACH-GH2117821)
db.products.updateOne(
  { _id: "69a301668f9bd9b91fc96197" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Portable First Aid Kit Case, Empty Case, Silver, Approximate Size 12.4×7.1×7.1 in (MACH-GH2117820)
db.products.updateOne(
  { _id: "69a3016b8f9bd9b91fc961a9" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Arctic Fox Lined Warm Freezer Gloves, Blue (MACH-AA7537012)
db.products.updateOne(
  { _id: "69a301ed8f9bd9b91fc9637d" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Impact-Resistant High-Calf Rain Boots, Black with Yellow Sole (MACH-AA7537037)
db.products.updateOne(
  { _id: "69a3023d8f9bd9b91fc96494" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：High-Calf PVC Rain Boots, Black (MACH-AA7537036)
db.products.updateOne(
  { _id: "69a302408f9bd9b91fc9649d" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC Mid-Calf Waterproof Rain Boots, Height 13.78 in (MACH-AA7537035)
db.products.updateOne(
  { _id: "69a302428f9bd9b91fc964a6" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PVC High-Calf Rain Boots, Black with Yellow Sole, Height 14.57 in (MACH-AA7537039)
db.products.updateOne(
  { _id: "69a3024d8f9bd9b91fc964ca" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Manual Forklift Handle, Compatible with DFE20 (MACH-AE6786057)
db.products.updateOne(
  { _id: "69a3028d8f9bd9b91fc965ab" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Light-Duty Swivel Caster, 1.65 in Wheel, Load 66 lb, Installation Height 2.52 in, Pkg Qty 2 (MACH-AA9472031)
db.products.updateOne(
  { _id: "69a3029d8f9bd9b91fc965e1" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Forklift Wheel Support, Compatible with AC20, AC25, AC30 (MACH-AE9069279)
db.products.updateOne(
  { _id: "69a302b28f9bd9b91fc96629" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Small Wheel Shaft, 0.79 in × 3.66 in (MACH-AE6785903)
db.products.updateOne(
  { _id: "69a302cd8f9bd9b91fc96683" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Heavy-Duty Swivel Caster, 4 in Nylon Wheel, Load 639 lb, Installation Height 5.67 in (MACH-AE1800019)
db.products.updateOne(
  { _id: "69a302e38f9bd9b91fc966d4" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Hand Truck Caster Set, 3 in, 2 Fixed and 2 Swivel Wheels, Load 220 lb, Installation Height 4.13 in (MACH-AA9450331)
db.products.updateOne(
  { _id: "69a302f08f9bd9b91fc96701" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Stainless Steel Platform Cart, Single-Layer, Size 35.43 × 19.69 × 33.86 in, Rated Load 661 lb (MACH-1.2789E7)
db.products.updateOne(
  { _id: "69a303708f9bd9b91fc968c3" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Turtle Platform Truck, Size 16.14 × 10.63 in, Container Compatible (MACH-AE2485229)
db.products.updateOne(
  { _id: "69a303aa8f9bd9b91fc96992" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PE Foam Double-Sided Tape, Thickness 0.04 in, Width 0.39 in, Length 9.84 ft (MACH-AE9325677)
db.products.updateOne(
  { _id: "69a303af8f9bd9b91fc969a4" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Platform Truck with Folding Handle, Size 18.50 × 27.95 in, Load Capacity 331 lb (MACH-AA2353495)
db.products.updateOne(
  { _id: "69a303b28f9bd9b91fc969ad" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Steel Platform Truck with Casters, Size 23.62 × 35.43 in, Fits 60 × 90 cm Containers (MACH-AE5687606)
db.products.updateOne(
  { _id: "69a303be8f9bd9b91fc969da" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Silent Steel Platform Truck, Size 41.34 × 24.80 in, Load Capacity 717 lb (MACH-AE1900011)
db.products.updateOne(
  { _id: "69a303c38f9bd9b91fc969ec" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Single Layer Plastic Platform Truck, YJD A1125006, 23.62 in Length, 35.43 in Width, 33.46 in Height, 661.39 lb Capacity (MACH-AE0428143)
db.products.updateOne(
  { _id: "69a303d28f9bd9b91fc96a22" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Silent Folding Stainless Steel Platform Truck, ZKH 700Q 1175 by 700, 46.26 in Length, 27.56 in Width, 1543.24 lb Capacity (MACH-AE4438684)
db.products.updateOne(
  { _id: "69a303f18f9bd9b91fc96a8e" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Platform Truck, CSR 18, 35.43 in Length, 23.62 in Width, 33.86 in Height, 661.39 lb Capacity (MACH-AE1151673)
db.products.updateOne(
  { _id: "69a303f98f9bd9b91fc96aa9" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：304 Stainless Steel Platform Truck, 304609005S, 23.62 in Width, 35.43 in Length, 330.69 lb Capacity, 5 in Silent Brake Wheels (MACH-AE6901983)
db.products.updateOne(
  { _id: "69a303fe8f9bd9b91fc96abb" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Anti Static Heavy Duty Cart, TB 21, 31.50 in Length, 23.62 in Width, 35.43 in Height, 661.39 lb Capacity (MACH-AQ6615)
db.products.updateOne(
  { _id: "69a304008f9bd9b91fc96ac4" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Tool Cart Accessory Partition, GC 10, 2.95 in Width, 22.2 in Length, Fits 22.2 in by 22.5 in Drawer (MACH-AE4215957)
db.products.updateOne(
  { _id: "69a304058f9bd9b91fc96ad6" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Heavy Duty Platform Hand Truck, QH07032, 39.37 in Length, 31.5 in Width, 35.43 in Height, 2204.62 lb Rated Load (MACH-AX5898)
db.products.updateOne(
  { _id: "69a304088f9bd9b91fc96adf" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Heavy Duty Square Tube Hand Truck, FGTC600 05, 23.62 in Length, 35.43 in Width, 661.39 lb Load Capacity (MACH-AE3843978)
db.products.updateOne(
  { _id: "69a3040d8f9bd9b91fc96af1" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Modular Platform Truck, 23652, 16.54 in Length, 11.42 in Width, 4.13 in Height, Fits 16.54 in by 11.42 in Containers (MACH-AE2340797)
db.products.updateOne(
  { _id: "69a304148f9bd9b91fc96b0c" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Ultra Silent Platform Truck, PLA300 DX, 35.43 in Length, 23.62 in Width, 661.39 lb Capacity, Folding Handle (MACH-AC2121)
db.products.updateOne(
  { _id: "69a304178f9bd9b91fc96b15" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Iron Platform Truck, QH07002, 35.43 in Length, 23.62 in Width, 35.43 in Height, 771.62 lb Capacity (MACH-AX5888)
db.products.updateOne(
  { _id: "69a304218f9bd9b91fc96b39" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Iron Platform Truck, QH07001, 35.43 in Length, 19.69 in Width, 33.46 in Height, 771.62 lb Capacity (MACH-AX5887)
db.products.updateOne(
  { _id: "69a304298f9bd9b91fc96b54" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Plastic Folding Platform Hand Truck, YL STC 11, 35.4 in Length, 23.6 in Width (MACH-AE1749818)
db.products.updateOne(
  { _id: "69a3042c8f9bd9b91fc96b5d" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Brake Equipped Turtle Platform Truck, WN36 01, 19.69 in Length, 14.17 in Width, Fits 19.69 in by 11.81 in Containers (MACH-AE2485310)
db.products.updateOne(
  { _id: "69a304338f9bd9b91fc96b78" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Thickened Wooden Platform Truck, 10214, 35.43 in Length, 23.62 in Width, 5.12 in Height, Natural Wood, 330.69 lb Load Capacity (MACH-AE0105457)
db.products.updateOne(
  { _id: "69a304368f9bd9b91fc96b81" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：PE Foam Double Sided Tape, 88623, White, 0.04 in Thickness, 0.39 in Width, 9.84 ft Length (MACH-AE9325682)
db.products.updateOne(
  { _id: "69a304388f9bd9b91fc96b8a" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Stainless Steel Single Layer Cart, QH07210, 35.43 in Length, 19.69 in Width, 33.86 in Height, 661.39 lb Rated Load (MACH-AX5950)
db.products.updateOne(
  { _id: "69a3043d8f9bd9b91fc96b9c" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Stone Ball Fork, XM LBQ 15.35, Blue, Suitable for 23.62 in Stone Ball (MACH-AE8203710)
db.products.updateOne(
  { _id: "69a304428f9bd9b91fc96bae" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Stainless Steel Single Layer Cart, QH07212, 39.37 in Length, 27.56 in Width, 35.43 in Height, 661.39 lb Rated Load (MACH-AX5952)
db.products.updateOne(
  { _id: "69a3044a8f9bd9b91fc96bc9" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Mesh Shelving Hand Truck Support Accessories with Wheels, 75.98 in Pillar, 0.98 in Diameter, 4 Poles, 2 Brake Wheels, 2 Swivel Wheels (MACH-AE1363705)
db.products.updateOne(
  { _id: "69a3044c8f9bd9b91fc96bd2" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Brake Equipped Turtle Platform Truck, WN37 01, 22.44 in Length, 14.57 in Width, Fits 19.69 in by 11.81 in Containers (MACH-AE2485313)
db.products.updateOne(
  { _id: "69a304518f9bd9b91fc96be4" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：VHB Foam Double Sided Tape, Black, 0.0433 in Thickness, 1.18 in Width, 10 ft Length (MACH-AE7698830)
db.products.updateOne(
  { _id: "69a304548f9bd9b91fc96bed" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Patterned Steel Platform Truck, HWG 006, 26.14 in Length, 47.17 in Width, 34.45 in Height, 1984.16 lb Load Capacity (MACH-AF0096894)
db.products.updateOne(
  { _id: "69a304578f9bd9b91fc96bf6" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Reflective Warning Tape, Black, 7.874 in Width, 150 ft Length, High Reflectivity, Multi Resistant, Durable Safety Tape (MACH-AE8097989)
db.products.updateOne(
  { _id: "69a304598f9bd9b91fc96bff" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Patterned Steel Platform Truck, HWG 005, 24.8 in Length, 37.8 in Width, 34.45 in Height, 1763.70 lb Load Capacity (MACH-AF0096896)
db.products.updateOne(
  { _id: "69a3045e8f9bd9b91fc96c11" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Patterned Steel Platform Truck, HWG 004, 24.8 in Length, 37.8 in Width, 34.45 in Height, 1763.70 lb Load Capacity (MACH-AF0096895)
db.products.updateOne(
  { _id: "69a304618f9bd9b91fc96c1a" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Full Silent Plastic Platform Truck, JHTT 02, 35.43 in Length, 23.62 in Width, 661.39 lb Capacity, Folding Handle (MACH-AE2388389)
db.products.updateOne(
  { _id: "69a304638f9bd9b91fc96c23" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Silent Folding Platform Truck, SL STC26, 28.35 in Length, 18.90 in Width, 31.50 in Height, 330.69 lb Capacity (MACH-AE1125707)
db.products.updateOne(
  { _id: "69a304668f9bd9b91fc96c2c" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Reflective Warning Tape, Black, 9.843 in Width, 150 ft Length, High Reflectivity, Multi Resistant, Durable Safety Tape (MACH-AE8097998)
db.products.updateOne(
  { _id: "69a304688f9bd9b91fc96c35" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Reflective Warning Tape, Yellow, 9.843 in Width, 150 ft Length (MACH-AE8097994)
db.products.updateOne(
  { _id: "69a3046b8f9bd9b91fc96c3e" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Primerless Acrylic Foam Tape, PX5011, Black, 0.045 in Thickness, 0.984 in Width, 108.27 ft Length (MACH-AC8419330)
db.products.updateOne(
  { _id: "69a3046d8f9bd9b91fc96c47" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：Polypropylene Elbow Hose Barb Fitting, 90 Degree Bend, Male Thread, for Fluid Transfer, Pkg Qty 20 (MACH-10091868363641)
db.products.updateOne(
  { _id: "69a305788f9bd9b91fc96ff8" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：NBR TC Skeleton Oil Seal, Dual Lip, Shaft Seal, For Industrial Rotating Equipment (MACH-10076967404260)
db.products.updateOne(
  { _id: "69a306328f9bd9b91fc9726e" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品：FKM Skeleton Oil Seal, Fluororubber, High Temperature Resistant, Chemical Resistant, Shaft Seal (MACH-10077100000697)
db.products.updateOne(
  { _id: "69a3063a8f9bd9b91fc97289" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)
