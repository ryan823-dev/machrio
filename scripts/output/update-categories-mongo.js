// MongoDB 更新脚本 - 为无分类产品添加分类
// 使用前请务必备份数据库！

// Lab Brush with Plastic Handle, Bristle Material for Cleaning, Pkg Qty 24
db.products.updateOne(
  { _id: "69a2f7388f9bd9b91fc93df1" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// Lab Brush with Metal Handle, Nylon Bristles, for Cleaning and Maintenance, Pkg Qty 100
db.products.updateOne(
  { _id: "69a2f73b8f9bd9b91fc93dfa" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// Laboratory Test Tube Brush with Stainless Steel Handle, Hog Bristles, for Test Tube Cleaning, Pkg Qty 80
db.products.updateOne(
  { _id: "69a2f73d8f9bd9b91fc93e03" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// Laboratory Test Tube Brush with Stainless Steel Handle, Nylon Bristles, for Test Tube Cleaning, Pkg Qty 80
db.products.updateOne(
  { _id: "69a2f73f8f9bd9b91fc93e0c" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// Laboratory Test Tube Brush with Stainless Steel Handle, Nylon Bristles, for Test Tube Cleaning, Pkg Qty 80
db.products.updateOne(
  { _id: "69a2f7428f9bd9b91fc93e15" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// Laboratory Brush with Nylon, Flexible Design, for Precision Cleaning, Pkg Qty 12
db.products.updateOne(
  { _id: "69a2f7458f9bd9b91fc93e1e" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// Lab Cleaning Brush with Hog Bristles, 6.89 inch Length, Pkg Qty 36
db.products.updateOne(
  { _id: "69a2f7478f9bd9b91fc93e27" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// Lab Cleaning Brush with PBT Bristles, 345mm Length, Pkg Qty 10
db.products.updateOne(
  { _id: "69a2f74a8f9bd9b91fc93e30" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// Lab Brush with Plastic Handle, Pig Hair Bristles, for Cleaning and Maintenance, Pkg Qty 12
db.products.updateOne(
  { _id: "69a2f74c8f9bd9b91fc93e39" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// Industrial LED High Bay Light, High Intensity, Aluminum and Polycarbonate, for Factories and Warehouses, with 100W Output
db.products.updateOne(
  { _id: "69a2f7718f9bd9b91fc93eb7" },
  { 
    $set: { 
      primaryCategory: "69a50f01d1138dde5e717f80",
      updatedAt: new Date()
    } 
  }
)

// Lamp Holder, Plastic Construction, 60W Power Rating, Pkg Qty 10
db.products.updateOne(
  { _id: "69a2f7978f9bd9b91fc93f3e" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e7180a0",
      updatedAt: new Date()
    } 
  }
)

// Surface Mount Light Socket, Ceramic and Flame-Resistant PC Construction, 100W Rating, Pkg Qty 30
db.products.updateOne(
  { _id: "69a2f79a8f9bd9b91fc93f47" },
  { 
    $set: { 
      primaryCategory: "69a50eecd1138dde5e717f31",
      updatedAt: new Date()
    } 
  }
)

// E27 Ceiling Mount Lamp Holder, Plastic Construction, Standard Socket Rating, Pkg Qty 10
db.products.updateOne(
  { _id: "69a2f79d8f9bd9b91fc93f50" },
  { 
    $set: { 
      primaryCategory: "69a50f51d1138dde5e7180ac",
      updatedAt: new Date()
    } 
  }
)

// Lamp Holder, PC and Metal Construction, E27 Socket Rating, Pkg Qty 50
db.products.updateOne(
  { _id: "69a2f79f8f9bd9b91fc93f59" },
  { 
    $set: { 
      primaryCategory: "69a50f4ad1138dde5e71808f",
      updatedAt: new Date()
    } 
  }
)

// Ceramic Lamp Holder, Surface-Mount Construction, E27 Socket Type, Pkg Qty 50
db.products.updateOne(
  { _id: "69a2f7a28f9bd9b91fc93f62" },
  { 
    $set: { 
      primaryCategory: "69a50eecd1138dde5e717f31",
      updatedAt: new Date()
    } 
  }
)

// Lamp Holder, Plastic, 185-250V, Pkg Qty 50
db.products.updateOne(
  { _id: "69a2f7a48f9bd9b91fc93f6b" },
  { 
    $set: { 
      primaryCategory: "69a50f51d1138dde5e7180ac",
      updatedAt: new Date()
    } 
  }
)

// E27 Light Socket, Plastic, 220V Rating, Pkg Qty 50
db.products.updateOne(
  { _id: "69a2f7a78f9bd9b91fc93f74" },
  { 
    $set: { 
      primaryCategory: "69a50f51d1138dde5e7180ac",
      updatedAt: new Date()
    } 
  }
)

// Lamp Holder, Plastic, 60W, Pkg Qty 50
db.products.updateOne(
  { _id: "69a2f7a98f9bd9b91fc93f7d" },
  { 
    $set: { 
      primaryCategory: "69a50f51d1138dde5e7180ac",
      updatedAt: new Date()
    } 
  }
)

// LED Bulb, Plastic Construction, 5W Output, Pkg Qty 50
db.products.updateOne(
  { _id: "69a2f7cd8f9bd9b91fc93ffb" },
  { 
    $set: { 
      primaryCategory: "69a50f51d1138dde5e7180ac",
      updatedAt: new Date()
    } 
  }
)

// High Visibility Safety Vest, Orange, Polyester, Reflective Stripes, Zipper Closure, Pkg Qty 12
db.products.updateOne(
  { _id: "69a2f7ea8f9bd9b91fc9405e" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// High Visibility Safety Vest, Orange, Polyester, Reflective Stripes, Zipper Closure, Multiple Pockets, Pkg Qty 12
db.products.updateOne(
  { _id: "69a2f7ec8f9bd9b91fc94067" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// High Visibility Safety Vest, Yellow, Polyester, Reflective Stripes, Zipper Closure, Pkg Qty 12
db.products.updateOne(
  { _id: "69a2f7ef8f9bd9b91fc94070" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// PVC Electrical Conduit Pipe with 1.97 in Diameter, 12.47 ft Length, featuring Impact Resistance and 120 psi Pressure Rating for Electrical Systems in Industrial Environments, Pkg Qty 8
db.products.updateOne(
  { _id: "69a2f87c8f9bd9b91fc9425f" },
  { 
    $set: { 
      primaryCategory: "69a50f44d1138dde5e718079",
      updatedAt: new Date()
    } 
  }
)

// PVC Water Supply Equal Diameter Coupling, Compatible with 3.54 in Pipe, White
db.products.updateOne(
  { _id: "69a2f87e8f9bd9b91fc94268" },
  { 
    $set: { 
      primaryCategory: "69a50eb0d1138dde5e717e54",
      updatedAt: new Date()
    } 
  }
)

// PVC Water Supply Elbow, 90 Degree, Compatible with 3.54 in Pipe, White
db.products.updateOne(
  { _id: "69a2f8818f9bd9b91fc94271" },
  { 
    $set: { 
      primaryCategory: "69a50eb0d1138dde5e717e54",
      updatedAt: new Date()
    } 
  }
)

// PVC Pipe Coupling, 1 in Nominal Diameter, Milky White, Pkg Qty 200
db.products.updateOne(
  { _id: "69a2f8838f9bd9b91fc9427a" },
  { 
    $set: { 
      primaryCategory: "69a50f0bd1138dde5e717fa5",
      updatedAt: new Date()
    } 
  }
)

// PVC U Drainage Coupling, dn75, 3 in Nominal Diameter, White, Compatible with 3 in Pipe
db.products.updateOne(
  { _id: "69a2f8868f9bd9b91fc94283" },
  { 
    $set: { 
      primaryCategory: "69a50f0bd1138dde5e717fa5",
      updatedAt: new Date()
    } 
  }
)

// PVC Electrical Conduit Elbow, dn20, 0.79 in Nominal Diameter, White, Compatible with 0.79 in Pipe
db.products.updateOne(
  { _id: "69a2f8898f9bd9b91fc9428c" },
  { 
    $set: { 
      primaryCategory: "69a50f44d1138dde5e718079",
      updatedAt: new Date()
    } 
  }
)

// PVC Water Supply Elbow, 90 Degree, 0.79 in Nominal Diameter, Gray
db.products.updateOne(
  { _id: "69a2f88b8f9bd9b91fc94295" },
  { 
    $set: { 
      primaryCategory: "69a50f2fd1138dde5e71802b",
      updatedAt: new Date()
    } 
  }
)

// PVC U Drainage Elbow, 90 Degree, With Inspection Port, dn110, 4.33 in Nominal Diameter, White, Compatible with 4.33 in Pipe
db.products.updateOne(
  { _id: "69a2f88e8f9bd9b91fc9429e" },
  { 
    $set: { 
      primaryCategory: "69a50ee7d1138dde5e717f1f",
      updatedAt: new Date()
    } 
  }
)

// PVC Drainage Expansion Joint, 2 in Nominal Diameter, Milky White
db.products.updateOne(
  { _id: "69a2f8908f9bd9b91fc942a7" },
  { 
    $set: { 
      primaryCategory: "69a50eded1138dde5e717f00",
      updatedAt: new Date()
    } 
  }
)

// PVC U Water Supply Coupling, dn40, 1.57 in Nominal Diameter, White, Compatible with 1.57 in Pipe
db.products.updateOne(
  { _id: "69a2f8938f9bd9b91fc942b0" },
  { 
    $set: { 
      primaryCategory: "69a50f2fd1138dde5e71802b",
      updatedAt: new Date()
    } 
  }
)

// PVC Water Supply Elbow, 90 Degree, 0.79 in Nominal Diameter, White, Pkg Qty 20
db.products.updateOne(
  { _id: "69a2f8958f9bd9b91fc942b9" },
  { 
    $set: { 
      primaryCategory: "69a50f2fd1138dde5e71802b",
      updatedAt: new Date()
    } 
  }
)

// PVC Water Supply Reducing Coupling, 3 in to 1.97 in, White
db.products.updateOne(
  { _id: "69a2f89a8f9bd9b91fc942cb" },
  { 
    $set: { 
      primaryCategory: "69a50f2fd1138dde5e71802b",
      updatedAt: new Date()
    } 
  }
)

// PVC Electrical Conduit Straight Coupling, 0.79 in Nominal Diameter, White, Pkg Qty 100
db.products.updateOne(
  { _id: "69a2f8ce8f9bd9b91fc9437f" },
  { 
    $set: { 
      primaryCategory: "69a50f44d1138dde5e718079",
      updatedAt: new Date()
    } 
  }
)

// PVC Electrical Conduit Elbow, 90 Degree, 0.63 in Outer Diameter, 0.63 in Inner Diameter, White, Pkg Qty 10
db.products.updateOne(
  { _id: "69a2f8db8f9bd9b91fc943ac" },
  { 
    $set: { 
      primaryCategory: "69a50f44d1138dde5e718079",
      updatedAt: new Date()
    } 
  }
)

// PVC Electrical Conduit Coupling, National Standard, DN20A, 0.79 in Nominal Diameter, Compatible with 0.79 in Pipe, White
db.products.updateOne(
  { _id: "69a2f96a8f9bd9b91fc945a4" },
  { 
    $set: { 
      primaryCategory: "69a50f44d1138dde5e718079",
      updatedAt: new Date()
    } 
  }
)

// PVC Water Supply Tee, DN25, 1 in Nominal Diameter, Compatible with 1 in Pipe, White
db.products.updateOne(
  { _id: "69a2f96c8f9bd9b91fc945ad" },
  { 
    $set: { 
      primaryCategory: "69a50eb0d1138dde5e717e54",
      updatedAt: new Date()
    } 
  }
)

// PVC U Electrical Conduit Straight Coupling, DN25, 1 in Nominal Diameter, Compatible with 1 in Pipe, White
db.products.updateOne(
  { _id: "69a2f9718f9bd9b91fc945bf" },
  { 
    $set: { 
      primaryCategory: "69a50f44d1138dde5e718079",
      updatedAt: new Date()
    } 
  }
)

// PVC U Drainage Threaded Expansion Joint, Extended Type, DN110, 4.33 in Nominal Diameter, Compatible with 4.33 in Pipe, White
db.products.updateOne(
  { _id: "69a2f9748f9bd9b91fc945c8" },
  { 
    $set: { 
      primaryCategory: "69a50eb0d1138dde5e717e54",
      updatedAt: new Date()
    } 
  }
)

// PVC Electrical Conduit, Type B, DN25, 1 in Nominal Diameter, 0.06 in Thickness, 6.23 ft Length, White
db.products.updateOne(
  { _id: "69a2f9768f9bd9b91fc945d1" },
  { 
    $set: { 
      primaryCategory: "69a50f44d1138dde5e718079",
      updatedAt: new Date()
    } 
  }
)

// PVC Water Supply Female Thread Coupling, Large Inner Diameter 1.26 in, Small Inner Diameter 1 in, Pkg Qty 50
db.products.updateOne(
  { _id: "69a2f9798f9bd9b91fc945da" },
  { 
    $set: { 
      primaryCategory: "69a50f2fd1138dde5e71802b",
      updatedAt: new Date()
    } 
  }
)

// Hose Barb Fitting with Polypropylene Construction, 5/32" Size, featuring Corrosion Resistance for Fluid Transfer in Industrial Environments, Pkg Qty 100
db.products.updateOne(
  { _id: "69a2f99a8f9bd9b91fc9464f" },
  { 
    $set: { 
      primaryCategory: "69a50f01d1138dde5e717f80",
      updatedAt: new Date()
    } 
  }
)

// American hose clamp, stainless steel 201, width 0.47 inch, diameter range from 9.45 inch to 10.24 inch, Pkg Qty 20
db.products.updateOne(
  { _id: "69a2f9fc8f9bd9b91fc947a5" },
  { 
    $set: { 
      primaryCategory: "69a50f2ed1138dde5e718027",
      updatedAt: new Date()
    } 
  }
)

// Thickened flat pipe clamp, stainless steel 304, diameter 4.49 inch
db.products.updateOne(
  { _id: "69a2fa028f9bd9b91fc947b7" },
  { 
    $set: { 
      primaryCategory: "69a50f0bd1138dde5e717fa5",
      updatedAt: new Date()
    } 
  }
)

// Spiral wrap tube protective sleeve cable organizer, black, diameter 0.79 inch, length 6.56 foot
db.products.updateOne(
  { _id: "69a2faa18f9bd9b91fc949dc" },
  { 
    $set: { 
      primaryCategory: "69a50eb0d1138dde5e717e54",
      updatedAt: new Date()
    } 
  }
)

// Spiral wrap tube, outer diameter 0.98 inch, black, length 8.20 foot per roll
db.products.updateOne(
  { _id: "69a2faa48f9bd9b91fc949e5" },
  { 
    $set: { 
      primaryCategory: "69a50eb0d1138dde5e717e54",
      updatedAt: new Date()
    } 
  }
)

// Heat shrink tubing, diameter 1.57 inch, red, length 164.04 foot, shrink ratio two to one
db.products.updateOne(
  { _id: "69a2faa78f9bd9b91fc949ee" },
  { 
    $set: { 
      primaryCategory: "69a50f29d1138dde5e718016",
      updatedAt: new Date()
    } 
  }
)

// Heat shrink tubing, diameter 0.47 inch, shrink to 0.24 inch, black, length 16.40 foot, shrink ratio two to one
db.products.updateOne(
  { _id: "69a2faa98f9bd9b91fc949f7" },
  { 
    $set: { 
      primaryCategory: "69a50f29d1138dde5e718016",
      updatedAt: new Date()
    } 
  }
)

// Heat shrink tubing kit, multiple colors, shrink ratio two to one, shrink size 0.39 inch, Pkg Qty 580
db.products.updateOne(
  { _id: "69a2faac8f9bd9b91fc94a00" },
  { 
    $set: { 
      primaryCategory: "69a50f29d1138dde5e718016",
      updatedAt: new Date()
    } 
  }
)

// Spiral wrap tube, diameter 0.24 inch, white, length 59.06 foot
db.products.updateOne(
  { _id: "69a2faae8f9bd9b91fc94a09" },
  { 
    $set: { 
      primaryCategory: "69a50eb0d1138dde5e717e54",
      updatedAt: new Date()
    } 
  }
)

// Aluminum alloy parallel groove clamp, Hangzhou type, JBL 50 240 3 II, metallic color
db.products.updateOne(
  { _id: "69a2fab18f9bd9b91fc94a12" },
  { 
    $set: { 
      primaryCategory: "69a50f4ad1138dde5e71808f",
      updatedAt: new Date()
    } 
  }
)

// Flat wire fixed clip, NF 2.2, height 0.39 inch, white, Pkg Qty 100
db.products.updateOne(
  { _id: "69a2fab48f9bd9b91fc94a1b" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805b",
      updatedAt: new Date()
    } 
  }
)

// Drawer type parts box, 9 compartments, length 14.17 inch, width 9.45 inch, height 7.09 inch, orange and black
db.products.updateOne(
  { _id: "69a2fab68f9bd9b91fc94a24" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e71809f",
      updatedAt: new Date()
    } 
  }
)

// Drawer type parts box, 60 compartments, length 18.90 inch, width 14.57 inch, height 7.09 inch, orange and black
db.products.updateOne(
  { _id: "69a2fab98f9bd9b91fc94a2d" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e71809f",
      updatedAt: new Date()
    } 
  }
)

// Drawer type parts box, 18 compartments, length 18.90 inch, width 14.57 inch, height 7.09 inch, blue and black
db.products.updateOne(
  { _id: "69a2fabe8f9bd9b91fc94a3f" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e71809f",
      updatedAt: new Date()
    } 
  }
)

// Drawer type parts box, 39 compartments, length 18.90 inch, width 14.57 inch, height 7.09 inch, orange and black
db.products.updateOne(
  { _id: "69a2fac18f9bd9b91fc94a48" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e71809f",
      updatedAt: new Date()
    } 
  }
)

// Drawer type parts box, 30 compartments, length 14.17 inch, width 9.45 inch, height 7.09 inch, green and black
db.products.updateOne(
  { _id: "69a2fac38f9bd9b91fc94a51" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e71809f",
      updatedAt: new Date()
    } 
  }
)

// Drawer type parts box, 12 compartments, length 9.84 inch, width 7.09 inch, height 6.69 inch, green and black
db.products.updateOne(
  { _id: "69a2fac68f9bd9b91fc94a5a" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e71809f",
      updatedAt: new Date()
    } 
  }
)

// Drawer type parts box, 18 compartments, length 18.90 inch, width 14.57 inch, height 7.09 inch, orange and black
db.products.updateOne(
  { _id: "69a2fac88f9bd9b91fc94a63" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e71809f",
      updatedAt: new Date()
    } 
  }
)

// Drawer type storage box, KY 1, length 5.51 inch, width 3.62 inch, height 1.73 inch, transparent
db.products.updateOne(
  { _id: "69a2facb8f9bd9b91fc94a6c" },
  { 
    $set: { 
      primaryCategory: "69a50f4fd1138dde5e7180a5",
      updatedAt: new Date()
    } 
  }
)

// Drawer type parts box, 18 compartments, length 18.90 inch, width 14.57 inch, height 7.09 inch, black
db.products.updateOne(
  { _id: "69a2facd8f9bd9b91fc94a75" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e71809f",
      updatedAt: new Date()
    } 
  }
)

// Stainless steel cable tie, 304 material, width 0.39 inch, length 31.50 inch, Pkg Qty 10
db.products.updateOne(
  { _id: "69a2fad08f9bd9b91fc94a7e" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Stainless steel cable tie, 304 material, width 0.31 inch, length 19.69 inch, Pkg Qty 30
db.products.updateOne(
  { _id: "69a2fad38f9bd9b91fc94a87" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Stainless Steel Cable Tie with Locking Tab, 15.75 in Length, 0.31 in Width, for Electrical and Industrial Applications, Pkg Qty 6 Packs of 100
db.products.updateOne(
  { _id: "69a2fad58f9bd9b91fc94a90" },
  { 
    $set: { 
      primaryCategory: "69a50f44d1138dde5e718079",
      updatedAt: new Date()
    } 
  }
)

// Stainless steel insert cable tie, white nylon, width 0.31 inch, length 9.45 inch, Pkg Qty 100
db.products.updateOne(
  { _id: "69a2fad88f9bd9b91fc94a99" },
  { 
    $set: { 
      primaryCategory: "69a50f49d1138dde5e71808c",
      updatedAt: new Date()
    } 
  }
)

// Adjustable stainless steel hose clamp, 304 stainless steel, model HSKP BXGZD HK07, width 0.49 inch, length 31.50 inch, thickness 0.02 inch
db.products.updateOne(
  { _id: "69a2fadb8f9bd9b91fc94aa2" },
  { 
    $set: { 
      primaryCategory: "69a50f2ed1138dde5e718027",
      updatedAt: new Date()
    } 
  }
)

// Stainless steel cable tie, 304 material, width 0.18 inch, length 11.81 inch, natural color, Pkg Qty 50
db.products.updateOne(
  { _id: "69a2fadd8f9bd9b91fc94aab" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Stainless steel cable tie roll, 304 material, model 5654, width 0.47 inch, length 164.04 foot, white
db.products.updateOne(
  { _id: "69a2fae08f9bd9b91fc94ab4" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Stainless steel cable tie, model HKW 137, width 0.39 inch, thickness 0.01 inch, net weight 1.10 pound, Pkg Qty 50
db.products.updateOne(
  { _id: "69a2fae38f9bd9b91fc94abd" },
  { 
    $set: { 
      primaryCategory: "69a50f49d1138dde5e71808c",
      updatedAt: new Date()
    } 
  }
)

// Grid drawer type storage box, three drawers, blue, length 8.94 inch, width 6.50 inch, height 1.69 inch
db.products.updateOne(
  { _id: "69a2fae58f9bd9b91fc94ac6" },
  { 
    $set: { 
      primaryCategory: "69a50f4fd1138dde5e7180a5",
      updatedAt: new Date()
    } 
  }
)

// Office storage box, gray, large size, three layers
db.products.updateOne(
  { _id: "69a2fae88f9bd9b91fc94acf" },
  { 
    $set: { 
      primaryCategory: "69a50ecdd1138dde5e717ebf",
      updatedAt: new Date()
    } 
  }
)

// Drawer type parts box, WST151 series, blue, 16 compartments, length 20.67 inch, width 6.30 inch, height 14.76 inch
db.products.updateOne(
  { _id: "69a2faea8f9bd9b91fc94ad8" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e71809f",
      updatedAt: new Date()
    } 
  }
)

// Drawer type parts box, A804OG, four compartments, orange and black, length 9.84 inch, width 7.09 inch, height 6.69 inch
db.products.updateOne(
  { _id: "69a2faed8f9bd9b91fc94ae1" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e71809f",
      updatedAt: new Date()
    } 
  }
)

// Self locking nylon cable tie, black, width 0.19 inch, length 9.84 inch, Pkg Qty 100
db.products.updateOne(
  { _id: "69a2fb148f9bd9b91fc94b68" },
  { 
    $set: { 
      primaryCategory: "69a50f49d1138dde5e71808c",
      updatedAt: new Date()
    } 
  }
)

// Releasable nylon cable tie, black, reusable, width 0.19 inch, length 11.81 inch, Pkg Qty 100
db.products.updateOne(
  { _id: "69a2fb178f9bd9b91fc94b71" },
  { 
    $set: { 
      primaryCategory: "69a50f49d1138dde5e71808c",
      updatedAt: new Date()
    } 
  }
)

// PTFE heat shrink tubing, transparent, inner diameter 0.04 inch, shrink ratio one point seven to one, length 656.17 foot, voltage rating 600 volt
db.products.updateOne(
  { _id: "69a2fb378f9bd9b91fc94bdd" },
  { 
    $set: { 
      primaryCategory: "69a50f29d1138dde5e718016",
      updatedAt: new Date()
    } 
  }
)

// Heat shrink tubing, rated voltage one kilovolt, diameter 0.31 inch, yellow green, length 328.08 foot, shrink ratio two to one
db.products.updateOne(
  { _id: "69a2fb398f9bd9b91fc94be6" },
  { 
    $set: { 
      primaryCategory: "69a50f29d1138dde5e718016",
      updatedAt: new Date()
    } 
  }
)

// Heat shrink tubing kit, IT 60, multiple colors, diameter 0.24 inch, shrink ratio two to one, voltage rating 600 volt, Pkg Qty 60
db.products.updateOne(
  { _id: "69a2fb3c8f9bd9b91fc94bef" },
  { 
    $set: { 
      primaryCategory: "69a50f29d1138dde5e718016",
      updatedAt: new Date()
    } 
  }
)

// Vacuum cleaner filter element, compatible with NT 75 vacuum models
db.products.updateOne(
  { _id: "69a2fbc98f9bd9b91fc94dde" },
  { 
    $set: { 
      primaryCategory: "69a50f35d1138dde5e718040",
      updatedAt: new Date()
    } 
  }
)

// Air purifier filter set, compatible with KJ1000F P22B, KJ1000F P22W, KJ800F P22B, Pkg Qty 3
db.products.updateOne(
  { _id: "69a2fbcc8f9bd9b91fc94de7" },
  { 
    $set: { 
      primaryCategory: "69a50f2fd1138dde5e71802b",
      updatedAt: new Date()
    } 
  }
)

// Cylindrical Plastic Filter with 0.47 Inch Inner Diameter, 0.61 Inch Outer Diameter, featuring 1.00 Inch Length, and 0.47 Inch Inner Diameter for Industrial Filtration in Harsh Environments, Pkg Qty 25
db.products.updateOne(
  { _id: "69a2fbd18f9bd9b91fc94df9" },
  { 
    $set: { 
      primaryCategory: "69a50f01d1138dde5e717f80",
      updatedAt: new Date()
    } 
  }
)

// HEPA filter set, for VAIR150 450H heat recovery ventilation system, high efficiency filtration, Pkg Qty 2
db.products.updateOne(
  { _id: "69a2fbd68f9bd9b91fc94e0b" },
  { 
    $set: { 
      primaryCategory: "69a50f02d1138dde5e717f82",
      updatedAt: new Date()
    } 
  }
)

// Water filter cartridge, model C4 DRO, for industrial water purification
db.products.updateOne(
  { _id: "69a2fbf28f9bd9b91fc94e6e" },
  { 
    $set: { 
      primaryCategory: "69a50f01d1138dde5e717f80",
      updatedAt: new Date()
    } 
  }
)

// Activated carbon water filter cartridge, model No 1, compatible with YDF211 water dispenser
db.products.updateOne(
  { _id: "69a2fbff8f9bd9b91fc94e9b" },
  { 
    $set: { 
      primaryCategory: "69a50f2fd1138dde5e71802b",
      updatedAt: new Date()
    } 
  }
)

// Post activated carbon water filter cartridge, compatible with AHR27 4030K2 water purifier
db.products.updateOne(
  { _id: "69a2fc018f9bd9b91fc94ea4" },
  { 
    $set: { 
      primaryCategory: "69a50f2fd1138dde5e71802b",
      updatedAt: new Date()
    } 
  }
)

// Activated carbon water filter cartridge, model T33B, one micron filtration, twist on design, length 11.40 inch
db.products.updateOne(
  { _id: "69a2fc048f9bd9b91fc94ead" },
  { 
    $set: { 
      primaryCategory: "69a50f2fd1138dde5e71802b",
      updatedAt: new Date()
    } 
  }
)

// Activated carbon water filter cartridge, model JZW LX1 CTO, for home and commercial water purification
db.products.updateOne(
  { _id: "69a2fc098f9bd9b91fc94ebf" },
  { 
    $set: { 
      primaryCategory: "69a50f2fd1138dde5e71802b",
      updatedAt: new Date()
    } 
  }
)

// Universal post activated carbon water filter cartridge, large T33 quick connect interface, three eighth inch connection, food grade PP shell
db.products.updateOne(
  { _id: "69a2fc258f9bd9b91fc94f22" },
  { 
    $set: { 
      primaryCategory: "69a50ebbd1138dde5e717e7c",
      updatedAt: new Date()
    } 
  }
)

// Acrylic safety sign, red and white, bilingual warning sign, caution slippery, length 3.94 inch, width 3.94 inch, thickness 0.08 inch
db.products.updateOne(
  { _id: "69a2fc748f9bd9b91fc95039" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// OSHA safety sign, soft PVC with adhesive back, bilingual warning sign, caution floor slippery when wet, length 12.40 inch, width 9.84 inch, thickness 0.03 inch
db.products.updateOne(
  { _id: "69a2fc768f9bd9b91fc95042" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// Safety sign, yellow, PVC board, bilingual warning sign, caution wet floor, for pools, length 15.75 inch, width 7.87 inch
db.products.updateOne(
  { _id: "69a2fc798f9bd9b91fc9504b" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// Plastic A frame warning sign, yellow, PP material, bilingual warning sign, caution wet floor, length 23.62 inch, width 8.07 inch, height 11.61 inch
db.products.updateOne(
  { _id: "69a2fc7b8f9bd9b91fc95054" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// A frame caution sign, yellow, plastic, bilingual warning sign, caution wet floor, length 23.62 inch, width 11.81 inch, height 7.87 inch
db.products.updateOne(
  { _id: "69a2fc7e8f9bd9b91fc9505d" },
  { 
    $set: { 
      primaryCategory: "69a50f40d1138dde5e718069",
      updatedAt: new Date()
    } 
  }
)

// High temperature burn warning label safety sign sticker, model HIT K007, equilateral triangle, size 2.00 inch, Pkg Qty 5
db.products.updateOne(
  { _id: "69a2fcc58f9bd9b91fc95159" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// High temperature warning label safety sticker, model HIT M012, English version, length 2.40 inch, width 1.60 inch, Pkg Qty 5
db.products.updateOne(
  { _id: "69a2fcc78f9bd9b91fc95162" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// Electric shock warning label safety sign sticker, model ELE K010, equilateral triangle, size 4.00 inch, Pkg Qty 20
db.products.updateOne(
  { _id: "69a2fcca8f9bd9b91fc9516b" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// Barcode Label Roll, Paper Construction, Thermal Print Technology, featuring Permanent Adhesive, and offering 2.36 x 2.36 in Label Size for Industrial Applications in Warehouse Environments, Pkg Qty 12
db.products.updateOne(
  { _id: "69a2fccc8f9bd9b91fc95174" },
  { 
    $set: { 
      primaryCategory: "69a50ef1d1138dde5e717f42",
      updatedAt: new Date()
    } 
  }
)

// Barcode Labels, Paper Construction, Durable Adhesive, featuring 2.36 by 2.36 Inch Size for Industrial Labeling in Warehouse Environments, Pkg Qty 36
db.products.updateOne(
  { _id: "69a2fccf8f9bd9b91fc9517d" },
  { 
    $set: { 
      primaryCategory: "69a50ef1d1138dde5e717f42",
      updatedAt: new Date()
    } 
  }
)

// Thermal Transfer Labels, Paper with Glossy Finish, 2 Inches by 1 Inch, Durable Print Quality, Pkg Qty 50
db.products.updateOne(
  { _id: "69a2fcd18f9bd9b91fc95186" },
  { 
    $set: { 
      primaryCategory: "69a50f21d1138dde5e717ff9",
      updatedAt: new Date()
    } 
  }
)

// Industrial Labels, Paper, Permanent Adhesive, Pkg Qty 50
db.products.updateOne(
  { _id: "69a2fcd48f9bd9b91fc9518f" },
  { 
    $set: { 
      primaryCategory: "69a50ef1d1138dde5e717f42",
      updatedAt: new Date()
    } 
  }
)

// Cable identification tag, model YMD 672, ABS hard plastic, length 2.80 inch, width 1.20 inch, includes 500 tags, includes 500 cable ties, includes 2 pens
db.products.updateOne(
  { _id: "69a2fcda8f9bd9b91fc951a1" },
  { 
    $set: { 
      primaryCategory: "69a50f49d1138dde5e71808c",
      updatedAt: new Date()
    } 
  }
)

// Thermal Label Roll, White Paper, featuring Permanent Adhesive, and offering 1.57 inches by 2 inches Size for Barcode Labeling in Warehouse Environments, Pkg Qty 36
db.products.updateOne(
  { _id: "69a2fcde8f9bd9b91fc951b3" },
  { 
    $set: { 
      primaryCategory: "69a50ef1d1138dde5e717f42",
      updatedAt: new Date()
    } 
  }
)

// Short shackle brass padlock, model 265 50, brass, keyed different, lock body width 1.97 inch, lock body height 1.69 inch
db.products.updateOne(
  { _id: "69a2fce48f9bd9b91fc951c5" },
  { 
    $set: { 
      primaryCategory: "69a50efcd1138dde5e717f6b",
      updatedAt: new Date()
    } 
  }
)

// Cable identification tag, HKW 300 series, ABS material, length 2.80 inch, width 1.26 inch, Pkg Qty 500
db.products.updateOne(
  { _id: "69a2fce68f9bd9b91fc951ce" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Automatic label dispenser, model X 130, label width from 0.20 inch to 5.12 inch
db.products.updateOne(
  { _id: "69a2fce98f9bd9b91fc951d7" },
  { 
    $set: { 
      primaryCategory: "69a50efcd1138dde5e717f6b",
      updatedAt: new Date()
    } 
  }
)

// Medical label printer, model B1, lake blue, supports multiple label sizes, includes one roll of white labels
db.products.updateOne(
  { _id: "69a2fceb8f9bd9b91fc951e0" },
  { 
    $set: { 
      primaryCategory: "69a50f22d1138dde5e717ffa",
      updatedAt: new Date()
    } 
  }
)

// Automatic label dispenser, model X 100, length 11.00 inch, width 5.35 inch, height 6.85 inch, label width from 0.20 inch to 3.94 inch
db.products.updateOne(
  { _id: "69a2fcee8f9bd9b91fc951e9" },
  { 
    $set: { 
      primaryCategory: "69a50efcd1138dde5e717f6b",
      updatedAt: new Date()
    } 
  }
)

// Automatic label dispenser, model X 130 imported version, label width from 0.20 inch to 5.12 inch
db.products.updateOne(
  { _id: "69a2fcf58f9bd9b91fc95204" },
  { 
    $set: { 
      primaryCategory: "69a50efcd1138dde5e717f6b",
      updatedAt: new Date()
    } 
  }
)

// Fully automatic label dispenser, model 1150D, label length from 0.12 inch to 5.91 inch, label width from 0.16 inch to 5.51 inch
db.products.updateOne(
  { _id: "69a2fcfb8f9bd9b91fc95216" },
  { 
    $set: { 
      primaryCategory: "69a50efcd1138dde5e717f6b",
      updatedAt: new Date()
    } 
  }
)

// Fully automatic induction label dispenser, model 1150D, label length from 0.12 inch to 5.91 inch, label width from 0.16 inch to 5.51 inch
db.products.updateOne(
  { _id: "69a2fcfd8f9bd9b91fc9521f" },
  { 
    $set: { 
      primaryCategory: "69a50efcd1138dde5e717f6b",
      updatedAt: new Date()
    } 
  }
)

// Biohazard toxic warning sign chemical safety label sticker, model CH K003, equilateral triangle, size 2.00 inch, Pkg Qty 50
db.products.updateOne(
  { _id: "69a2fd008f9bd9b91fc95228" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// Automatic label dispenser, model X 100, label width from 0.20 inch to 3.94 inch
db.products.updateOne(
  { _id: "69a2fd028f9bd9b91fc95231" },
  { 
    $set: { 
      primaryCategory: "69a50efcd1138dde5e717f6b",
      updatedAt: new Date()
    } 
  }
)

// Biohazard warning sign chemical safety label sticker, model CH K002, equilateral triangle, size 2.00 inch, Pkg Qty 5
db.products.updateOne(
  { _id: "69a2fd058f9bd9b91fc9523a" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// ID badge holder, model QS 1620G, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, pink
db.products.updateOne(
  { _id: "69a2fd078f9bd9b91fc95243" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Magnetic card holder, engineering plastic, length 3.15 inch, width 1.77 inch, yellow, Pkg Qty 10
db.products.updateOne(
  { _id: "69a2fd0a8f9bd9b91fc9524c" },
  { 
    $set: { 
      primaryCategory: "69a50f53d1138dde5e7180b3",
      updatedAt: new Date()
    } 
  }
)

// Magnetic counting card holder, model 23742, engineering plastic with magnet, length 4.92 inch, width 3.39 inch, five digit counting, red, Pkg Qty 10
db.products.updateOne(
  { _id: "69a2fd128f9bd9b91fc95267" },
  { 
    $set: { 
      primaryCategory: "69a50f53d1138dde5e7180b3",
      updatedAt: new Date()
    } 
  }
)

// Perforated magnetic card holder, model 2M00099, PP material with magnet, outer frame length 12.20 inch, width 8.74 inch, inner page length 10.90 inch, width 7.48 inch, blue
db.products.updateOne(
  { _id: "69a2fd158f9bd9b91fc95270" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Automatic label dispenser, model LSH 120, label width from 0.20 inch to 4.72 inch
db.products.updateOne(
  { _id: "69a2fd188f9bd9b91fc95279" },
  { 
    $set: { 
      primaryCategory: "69a50efcd1138dde5e717f6b",
      updatedAt: new Date()
    } 
  }
)

// Automatic label dispenser, model X 100, length 11.00 inch, width 5.35 inch, height 6.85 inch, label width from 0.20 inch to 3.94 inch
db.products.updateOne(
  { _id: "69a2fd1a8f9bd9b91fc95282" },
  { 
    $set: { 
      primaryCategory: "69a50efcd1138dde5e717f6b",
      updatedAt: new Date()
    } 
  }
)

// Cable identification tag, model YMD 669, ABS material, length 2.80 inch, width 1.20 inch, Pkg Qty 100
db.products.updateOne(
  { _id: "69a2fd228f9bd9b91fc9529d" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Cable identification tag kit, model TYZ BP204, ABS material, length 2.80 inch, width 1.20 inch, thickness 0.04 inch, includes 100 tags, includes 100 cable ties, includes 1 pen
db.products.updateOne(
  { _id: "69a2fd248f9bd9b91fc952a6" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// ID badge holder, model QS 1620H, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, white
db.products.updateOne(
  { _id: "69a2fd278f9bd9b91fc952af" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// ID badge holder, model QS 1620A, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, gray
db.products.updateOne(
  { _id: "69a2fd298f9bd9b91fc952b8" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// ID badge holder, model QS 1620D, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, dark blue
db.products.updateOne(
  { _id: "69a2fd2c8f9bd9b91fc952c1" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// ID badge holder, model QS 1620J, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, light blue
db.products.updateOne(
  { _id: "69a2fd2f8f9bd9b91fc952ca" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// ID badge holder, model QS 1620B, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, red
db.products.updateOne(
  { _id: "69a2fd318f9bd9b91fc952d3" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// ID badge holder, model QS 1620F, plastic material, outer frame length 4.33 inch, width 2.76 inch, with lanyard, orange
db.products.updateOne(
  { _id: "69a2fd348f9bd9b91fc952dc" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Material card holder, model 240296, PVC material, A6 horizontal version, length 6.30 inch, width 4.33 inch, Pkg Qty 20
db.products.updateOne(
  { _id: "69a2fd368f9bd9b91fc952e5" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Fluororubber O ring, green, outer diameter 0.71 inch, cross section diameter 0.08 inch
db.products.updateOne(
  { _id: "69a2fd838f9bd9b91fc953f3" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805a",
      updatedAt: new Date()
    } 
  }
)

// O-ring with EPDM Material, 0.2 in Cross Section, featuring High Chemical Resistance, and Excellent Flexibility for Sealing Applications in Harsh Environments, Pkg Qty 20
db.products.updateOne(
  { _id: "69a2fd888f9bd9b91fc95405" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Disposable medical mask, model DNE170, blue, non sterile, Pkg Qty 10
db.products.updateOne(
  { _id: "69a2fd9f8f9bd9b91fc95456" },
  { 
    $set: { 
      primaryCategory: "69a50edfd1138dde5e717f02",
      updatedAt: new Date()
    } 
  }
)

// LED emitter, cool white, copper substrate, power 20 watt, diameter 0.79 inch
db.products.updateOne(
  { _id: "69a2fea18f9bd9b91fc957e3" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e7180a0",
      updatedAt: new Date()
    } 
  }
)

// Ultra thin flashlight switch, length 0.47 inch, width 0.47 inch, height 0.37 inch, self locking type, Pkg Qty 5
db.products.updateOne(
  { _id: "69a2fea48f9bd9b91fc957ec" },
  { 
    $set: { 
      primaryCategory: "69a50edbd1138dde5e717ef4",
      updatedAt: new Date()
    } 
  }
)

// Extended angled rod wide head soft bristle wooden handle broom, length 51.18 inch, head width 12.60 inch
db.products.updateOne(
  { _id: "69a2fea68f9bd9b91fc957f5" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// Plastic broom, head width 12.60 inch, length 34.65 inch, black
db.products.updateOne(
  { _id: "69a2fea98f9bd9b91fc957fe" },
  { 
    $set: { 
      primaryCategory: "69a50ef4d1138dde5e717f4f",
      updatedAt: new Date()
    } 
  }
)

// Mop Bucket made from Plastic, offering Manual Wringer for Wet Floor Cleaning, with 14L Capacity, and Gray Color for Industrial Use
db.products.updateOne(
  { _id: "69a2feac8f9bd9b91fc95807" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// Mop Bucket made from Plastic, offering Manual Wringer for Standard Mop, with 30L Capacity, and 12 in Overall Length for Industrial and Commercial Cleaning Applications
db.products.updateOne(
  { _id: "69a2feae8f9bd9b91fc95810" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// Straight rod wooden handle broom, head width 12.60 inch, length 31.50 inch, four rows hard bristles, random color
db.products.updateOne(
  { _id: "69a2feb18f9bd9b91fc95819" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// LED emitter, cool white, aluminum substrate, power 10 watt, diameter 0.63 inch
db.products.updateOne(
  { _id: "69a2feb68f9bd9b91fc9582b" },
  { 
    $set: { 
      primaryCategory: "69a50f4ed1138dde5e7180a0",
      updatedAt: new Date()
    } 
  }
)

// PP Mop Wringer with manual wringing capacity, integrated drainage system, and 33x12.8 inch size for industrial cleaning tasks
db.products.updateOne(
  { _id: "69a2feb88f9bd9b91fc95834" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// Waterproof tail switch rubber button for rechargeable flashlight, diameter 0.47 inch, height 0.30 inch, inner column diameter 0.04 inch
db.products.updateOne(
  { _id: "69a2febb8f9bd9b91fc9583d" },
  { 
    $set: { 
      primaryCategory: "69a50f2fd1138dde5e71802b",
      updatedAt: new Date()
    } 
  }
)

// Industrial mechanical seal model MG1 18 G60 AQ2EFF precision engineered for industrial sealing
db.products.updateOne(
  { _id: "69a2fec88f9bd9b91fc9586a" },
  { 
    $set: { 
      primaryCategory: "69a50f01d1138dde5e717f80",
      updatedAt: new Date()
    } 
  }
)

// Mechanical seal model 120 35 alloy material shaft sleeve outer diameter one point three eight inch
db.products.updateOne(
  { _id: "69a2feca8f9bd9b91fc95873" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Mechanical seal model 109 45 fluororubber alloy material shaft sleeve outer diameter one point seven seven inch
db.products.updateOne(
  { _id: "69a2fecd8f9bd9b91fc9587c" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Mechanical seal model 109 20 alloy fluororubber shaft diameter zero point seven nine inch outer diameter one point three eight inch
db.products.updateOne(
  { _id: "69a2fed08f9bd9b91fc95885" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805a",
      updatedAt: new Date()
    } 
  }
)

// Mechanical seal model 109 30 silicon carbide graphite nitrile rubber industrial sealing
db.products.updateOne(
  { _id: "69a2fed28f9bd9b91fc9588e" },
  { 
    $set: { 
      primaryCategory: "69a50f01d1138dde5e717f80",
      updatedAt: new Date()
    } 
  }
)

// Mechanical seal model 109 25 alloy nitrile rubber shaft diameter zero point nine eight inch outer diameter one point five seven inch
db.products.updateOne(
  { _id: "69a2fed58f9bd9b91fc95897" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805a",
      updatedAt: new Date()
    } 
  }
)

// Mechanical seal model WB2 25 silicon carbide material shaft sleeve outer diameter one inch
db.products.updateOne(
  { _id: "69a2fed78f9bd9b91fc958a0" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Mechanical seal model 103 50 alloy graphite shaft sleeve outer diameter one point nine seven inch
db.products.updateOne(
  { _id: "69a2feec8f9bd9b91fc958e8" },
  { 
    $set: { 
      primaryCategory: "69a50f1cd1138dde5e717fe3",
      updatedAt: new Date()
    } 
  }
)

// Industrial electrical cabinet safety warning sticker English version size sixty by forty millimeter pack of five
db.products.updateOne(
  { _id: "69a2ff7a8f9bd9b91fc95ae0" },
  { 
    $set: { 
      primaryCategory: "69a50f44d1138dde5e718079",
      updatedAt: new Date()
    } 
  }
)

// Anti static PE self sealing bag pink length thirty one point five inch width thirty one point five inch thickness zero point zero zero four inch short side opening one hundred pieces
db.products.updateOne(
  { _id: "69a2ff988f9bd9b91fc95b4c" },
  { 
    $set: { 
      primaryCategory: "69a50f2ad1138dde5e718019",
      updatedAt: new Date()
    } 
  }
)

// Anti static PE bag with static tape red length thirty one point five inch width thirty nine point three seven inch thickness zero point zero zero four inch
db.products.updateOne(
  { _id: "69a2ffa08f9bd9b91fc95b67" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805c",
      updatedAt: new Date()
    } 
  }
)

// ISO standard industrial safety warning sticker hand pinch crush hazard bilingual pack of five
db.products.updateOne(
  { _id: "69a2ffa38f9bd9b91fc95b70" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// Industrial machinery safety warning sticker gear chain pinch hazard bilingual pack of twenty four
db.products.updateOne(
  { _id: "69a2ffa58f9bd9b91fc95b79" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// Danger safety warning sticker do not open door when machine is working English version
db.products.updateOne(
  { _id: "69a2ffa88f9bd9b91fc95b82" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// Electrical shock hazard warning sticker English professional operation required pack of twenty five
db.products.updateOne(
  { _id: "69a2ffaa8f9bd9b91fc95b8b" },
  { 
    $set: { 
      primaryCategory: "69a50f44d1138dde5e718079",
      updatedAt: new Date()
    } 
  }
)

// ISO industrial danger prohibition safety sticker dangerous do not touch English pack of twenty five
db.products.updateOne(
  { _id: "69a2ffad8f9bd9b91fc95b94" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// Thermal cable label F type yellow width zero point nine eight inch length three point zero seven inch tail length one point five seven inch one hundred labels per roll
db.products.updateOne(
  { _id: "69a2ffaf8f9bd9b91fc95b9d" },
  { 
    $set: { 
      primaryCategory: "69a50f49d1138dde5e71808c",
      updatedAt: new Date()
    } 
  }
)

// Insulated foam aluminum foil box length fourteen point one seven inch width seven point six eight inch height nine point eight four inch
db.products.updateOne(
  { _id: "69a2ffb28f9bd9b91fc95ba6" },
  { 
    $set: { 
      primaryCategory: "69a50f3ad1138dde5e718054",
      updatedAt: new Date()
    } 
  }
)

// Foam insulated shipping box blue gray length thirteen point three nine inch width eight point six six inch height seven point zero nine inch
db.products.updateOne(
  { _id: "69a2ffb58f9bd9b91fc95baf" },
  { 
    $set: { 
      primaryCategory: "69a50ed2d1138dde5e717ed2",
      updatedAt: new Date()
    } 
  }
)

// VCI rust inhibitor self sealing bag yellow length twenty seven point five six inch width nineteen point six nine inch one hundred pieces
db.products.updateOne(
  { _id: "69a2ffba8f9bd9b91fc95bc1" },
  { 
    $set: { 
      primaryCategory: "69a50f2ad1138dde5e718019",
      updatedAt: new Date()
    } 
  }
)

// Anti static packaging bag, short side opening, length ten point two four inch, width thirteen point seven eight inch, thickness zero point zero zero six inch, one hundred pieces per bag
db.products.updateOne(
  { _id: "69a2ffd38f9bd9b91fc95c1b" },
  { 
    $set: { 
      primaryCategory: "69a50ed2d1138dde5e717ed0",
      updatedAt: new Date()
    } 
  }
)

// VCI rust inhibitor self sealing bag, blue, length eight point six six inch, width seven point zero nine inch, height eight point six six inch
db.products.updateOne(
  { _id: "69a2ffe08f9bd9b91fc95c48" },
  { 
    $set: { 
      primaryCategory: "69a50f2ad1138dde5e718019",
      updatedAt: new Date()
    } 
  }
)

// VCI rust inhibitor self sealing bag, yellow, length fifteen point seven five inch, width eleven point eight one inch, thickness zero point zero zero three six inch
db.products.updateOne(
  { _id: "69a2ffe88f9bd9b91fc95c63" },
  { 
    $set: { 
      primaryCategory: "69a50f2ad1138dde5e718019",
      updatedAt: new Date()
    } 
  }
)

// Thermal self adhesive label, yellow, width one point five seven inch, height one point one eight inch, two hundred thirty labels per box
db.products.updateOne(
  { _id: "69a2fff78f9bd9b91fc95c99" },
  { 
    $set: { 
      primaryCategory: "69a50ef1d1138dde5e717f42",
      updatedAt: new Date()
    } 
  }
)

// Thermal label, white, width zero point five nine inch, height one point nine seven inch, one hundred thirty labels per roll
db.products.updateOne(
  { _id: "69a300028f9bd9b91fc95cbd" },
  { 
    $set: { 
      primaryCategory: "69a50f2ad1138dde5e71801a",
      updatedAt: new Date()
    } 
  }
)

// Bottle cleaning brush, PBT bristle, total length eleven point four two inch, bristle width one point nine seven inch, bristle length one point nine seven inch
db.products.updateOne(
  { _id: "69a300048f9bd9b91fc95cc6" },
  { 
    $set: { 
      primaryCategory: "69a50eedd1138dde5e717f34",
      updatedAt: new Date()
    } 
  }
)

// AGV magnetic strip track protection tape, yellow, thickness two millimeter, width three point nine four inch, length thirty two point eight one yard
db.products.updateOne(
  { _id: "69a3000f8f9bd9b91fc95cea" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805c",
      updatedAt: new Date()
    } 
  }
)

// Silica gel desiccant, blue granules, zero point three five ounce, fifty bags, moisture absorption for storage
db.products.updateOne(
  { _id: "69a300178f9bd9b91fc95d05" },
  { 
    $set: { 
      primaryCategory: "69a50f0fd1138dde5e717fb2",
      updatedAt: new Date()
    } 
  }
)

// VCI rust inhibitor self sealing bag, yellow, length twenty seven point five six inch, width nineteen point six nine inch, height twenty seven point five six inch, one hundred pieces
db.products.updateOne(
  { _id: "69a300198f9bd9b91fc95d0e" },
  { 
    $set: { 
      primaryCategory: "69a50f2ad1138dde5e718019",
      updatedAt: new Date()
    } 
  }
)

// Anti static shielding bag, short side opening, length seven point eight seven inch, width eleven point eight one inch, thickness zero point zero zero three inch, one hundred pieces
db.products.updateOne(
  { _id: "69a3001c8f9bd9b91fc95d17" },
  { 
    $set: { 
      primaryCategory: "69a50f0ad1138dde5e717fa1",
      updatedAt: new Date()
    } 
  }
)

// Food grade silica gel desiccant, 0.35oz bags, Pkg Qty 50, reusable for food, medicine, electronics, and pet items
db.products.updateOne(
  { _id: "69a300618f9bd9b91fc95e0a" },
  { 
    $set: { 
      primaryCategory: "69a50ebbd1138dde5e717e7c",
      updatedAt: new Date()
    } 
  }
)

// Panoramic safety goggles 101141, anti fog, scratch resistant protective eyewear, Pkg Qty 2
db.products.updateOne(
  { _id: "69a300888f9bd9b91fc95e91" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// Multifunctional soft stretcher, composite PVC material, deployed 99.2in by 34.3in, folded 34.3in by 13.0in
db.products.updateOne(
  { _id: "69a300a48f9bd9b91fc95ef4" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Four piece scoop stretcher RC C1, aluminum alloy, deployed 79.6in by 16.5in by 2.8in, folded 46.5in by 16.5in by 2.8in
db.products.updateOne(
  { _id: "69a300a78f9bd9b91fc95efd" },
  { 
    $set: { 
      primaryCategory: "69a50f2dd1138dde5e718023",
      updatedAt: new Date()
    } 
  }
)

// Multifunctional roll up soft stretcher YJK F5, EVA material, deployed 99.2in by 34.3in by 0.2in, folded 36.2in by 14.2in by 14.2in, orange red color
db.products.updateOne(
  { _id: "69a300a98f9bd9b91fc95f06" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Economical four fold folding stretcher YHJ DJ06, aluminum alloy and blue Oxford cloth, deployed 82.7in by 21.3in by 3.9in, folded 23.6in by 9.8in by 5.9in, with storage bag
db.products.updateOne(
  { _id: "69a300ac8f9bd9b91fc95f0f" },
  { 
    $set: { 
      primaryCategory: "69a50f4fd1138dde5e7180a5",
      updatedAt: new Date()
    } 
  }
)

// Two fold galvanized iron thickened folding stretcher, high molecular Oxford cloth, deployed 78.7in by 20.9in by 7.1in, folded 40.2in by 11.8in by 3.9in, blue color
db.products.updateOne(
  { _id: "69a300ae8f9bd9b91fc95f18" },
  { 
    $set: { 
      primaryCategory: "69a50f21d1138dde5e717ff9",
      updatedAt: new Date()
    } 
  }
)

// Two fold aluminum alloy folding stretcher, high molecular Oxford cloth and thickened aluminum alloy, deployed 78.7in by 20.9in by 7.1in, folded 40.2in by 11.8in by 3.9in, blue color
db.products.updateOne(
  { _id: "69a300b18f9bd9b91fc95f21" },
  { 
    $set: { 
      primaryCategory: "69a50f21d1138dde5e717ff9",
      updatedAt: new Date()
    } 
  }
)

// Folding stretcher, aluminum alloy, deployed 82.7in by 20.9in by 7.1in, folded 41.5in by 4.3in by 9.8in, blue color
db.products.updateOne(
  { _id: "69a300b38f9bd9b91fc95f2a" },
  { 
    $set: { 
      primaryCategory: "69a50f21d1138dde5e717ff9",
      updatedAt: new Date()
    } 
  }
)

// Reinforced shoulder strap portable folding soft stretcher TJ2049, nylon cloth material, deployed 70.1in by 27.2in, folded 21.7in by 11.8in by 1.6in, blue color
db.products.updateOne(
  { _id: "69a300b68f9bd9b91fc95f33" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Portable folding soft stretcher TJ2049, nylon cloth material, deployed 70.1in by 27.2in, folded 21.7in by 11.8in by 1.6in, blue color, with storage bag
db.products.updateOne(
  { _id: "69a300b98f9bd9b91fc95f3c" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Multi purpose first aid kit K 001P, green aluminum case, single shoulder or handheld design, includes multiple emergency items, 12.6in by 7.9in by 7.9in
db.products.updateOne(
  { _id: "69a300bb8f9bd9b91fc95f45" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// Home First Aid Kit, White, Class I Medical Device, Contains Multiple Emergency Items, Size 9.4 by 6.9 by 6.0 in
db.products.updateOne(
  { _id: "69a300d78f9bd9b91fc95fa8" },
  { 
    $set: { 
      primaryCategory: "69a50ec3d1138dde5e717e9b",
      updatedAt: new Date()
    } 
  }
)

// First Aid Kit, Silver, Class I Medical Device, Contains 23 Types of Emergency Items, Size 13.8 by 9.1 by 9.1 in
db.products.updateOne(
  { _id: "69a300da8f9bd9b91fc95fb1" },
  { 
    $set: { 
      primaryCategory: "69a50ec3d1138dde5e717e9b",
      updatedAt: new Date()
    } 
  }
)

// Enterprise Enhanced Medical Kit, Metal Silver, Contains 30 Emergency Items, Size 17.7 by 10.6 by 10.6 in
db.products.updateOne(
  { _id: "69a300dd8f9bd9b91fc95fba" },
  { 
    $set: { 
      primaryCategory: "69a50ec3d1138dde5e717e9b",
      updatedAt: new Date()
    } 
  }
)

// Handheld Aluminum Medical Box, Silver, Empty Case, Size 9.8 by 5.5 by 6.3 in
db.products.updateOne(
  { _id: "69a300df8f9bd9b91fc95fc3" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// First Aid Kit, Silver, Aluminum Frame, Aluminum Plastic Panel, Standard Configuration, Size 11.8 by 7.1 by 7.9 in
db.products.updateOne(
  { _id: "69a300e28f9bd9b91fc95fcc" },
  { 
    $set: { 
      primaryCategory: "69a50edcd1138dde5e717ef8",
      updatedAt: new Date()
    } 
  }
)

// Practical First Aid Kit, Silver, Contains 6 Categories, 27 Types, 89 Emergency Items, Size 11 by 7.1 by 6.7 in
db.products.updateOne(
  { _id: "69a300e48f9bd9b91fc95fd5" },
  { 
    $set: { 
      primaryCategory: "69a50ec3d1138dde5e717e9b",
      updatedAt: new Date()
    } 
  }
)

// ANSI Certified Chemical Safety Goggles, Anti Fog, Scratch Resistant, Dustproof, Impact Resistant, UV Protective, Splash Proof Eyewear
db.products.updateOne(
  { _id: "69a300e78f9bd9b91fc95fde" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// ABS First Aid Kit, Orange, Handheld, Wall Mounted, Contains 30 Emergency Items, Size 12.4 by 8.5 by 4.9 in
db.products.updateOne(
  { _id: "69a300e98f9bd9b91fc95fe7" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// ANSI Certified Safety Glasses, Anti Fog, Scratch Resistant, Dustproof, Impact Resistant, UV Protective Eyewear
db.products.updateOne(
  { _id: "69a300ec8f9bd9b91fc95ff0" },
  { 
    $set: { 
      primaryCategory: "69a50f47d1138dde5e718084",
      updatedAt: new Date()
    } 
  }
)

// Wheeled Fire Emergency Stretcher, Aluminum, Oxford Cloth, Deployed Size 72.8 by 19.7 by 8.5 in, Folded Size 36.0 by 20.0 by 11.8 in
db.products.updateOne(
  { _id: "69a300f18f9bd9b91fc96002" },
  { 
    $set: { 
      primaryCategory: "69a50ec3d1138dde5e717e9b",
      updatedAt: new Date()
    } 
  }
)

// Multifunctional Stretcher, Fabric, Deployed Size 98.4 by 33.9 in, Orange Yellow
db.products.updateOne(
  { _id: "69a300f48f9bd9b91fc9600b" },
  { 
    $set: { 
      primaryCategory: "69a50f2dd1138dde5e718023",
      updatedAt: new Date()
    } 
  }
)

// Portable Inflatable Rescue Stretcher, Foot Pump Inflatable, TPU Double Coated Cloth, Deployed Size 74.8 by 27.6 in
db.products.updateOne(
  { _id: "69a300f68f9bd9b91fc96014" },
  { 
    $set: { 
      primaryCategory: "69a50f2dd1138dde5e718023",
      updatedAt: new Date()
    } 
  }
)

// Emergency Spinal Board Stretcher, High Density Polyethylene, Deployed Size 72.0 by 17.7 by 2.4 in, Load ≤350 lb, Orange Red
db.products.updateOne(
  { _id: "69a300f98f9bd9b91fc9601d" },
  { 
    $set: { 
      primaryCategory: "69a50ec3d1138dde5e717e9b",
      updatedAt: new Date()
    } 
  }
)

// Ambulance 2 Fold Stretcher, Stainless Steel, Oxford Cloth, Deployed Size 78.7 by 20.9 in, Folded Size 38.6 by 7.9 in
db.products.updateOne(
  { _id: "69a300fb8f9bd9b91fc96026" },
  { 
    $set: { 
      primaryCategory: "69a50f2dd1138dde5e718023",
      updatedAt: new Date()
    } 
  }
)

// Rescue Stretcher made from Plastic, offering Adjustable Straps for Safe Patient Transport, with Secure Straps, and 350 lbs Weight Capacity for Emergency Medical Applications
db.products.updateOne(
  { _id: "69a300fe8f9bd9b91fc9602f" },
  { 
    $set: { 
      primaryCategory: "69a50ec3d1138dde5e717e9b",
      updatedAt: new Date()
    } 
  }
)

// Emergency Wheeled Folding Stretcher, Aluminum Alloy, Oxford Cloth, Deployed Size 72.8 by 20.5 by 8.3 in, Folded Size 36.2 by 20.5 by 3.5 in
db.products.updateOne(
  { _id: "69a301008f9bd9b91fc96038" },
  { 
    $set: { 
      primaryCategory: "69a50ec3d1138dde5e717e9b",
      updatedAt: new Date()
    } 
  }
)

// Rescue Stretcher, Stainless Steel, Canvas, Blue, Deployed Size 78.7 by 20.9 by 11.8 in, Folded Size 39.4 by 9.8 by 3.1 in
db.products.updateOne(
  { _id: "69a301038f9bd9b91fc96041" },
  { 
    $set: { 
      primaryCategory: "69a50f2dd1138dde5e718023",
      updatedAt: new Date()
    } 
  }
)

// Economical 2 Fold Folding Stretcher, Galvanized Iron Pipe, Blue Oxford Cloth, Deployed Size 78.7 by 21.3 by 7.1 in, Folded Size 39.4 by 11.8 by 3.9 in
db.products.updateOne(
  { _id: "69a301068f9bd9b91fc9604a" },
  { 
    $set: { 
      primaryCategory: "69a50eb0d1138dde5e717e54",
      updatedAt: new Date()
    } 
  }
)

// Handheld Welding Helmet, Thickened PP Material, Protective Welding Mask, Black
db.products.updateOne(
  { _id: "69a301198f9bd9b91fc96089" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Handheld Welding Helmet, Shade 8, Polypropylene Material, Protective Welding Mask
db.products.updateOne(
  { _id: "69a3011c8f9bd9b91fc96092" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Head Mounted Welding Helmet, Shade 8 to 11, With Lens, PP Material, Protective Welding Mask
db.products.updateOne(
  { _id: "69a3011e8f9bd9b91fc9609b" },
  { 
    $set: { 
      primaryCategory: "69a50eaed1138dde5e717e4e",
      updatedAt: new Date()
    } 
  }
)

// Economical Auto Darkening Welding Helmet, Shade 4 9 to 13, Head Mounted Protective Welding Mask
db.products.updateOne(
  { _id: "69a301218f9bd9b91fc960a4" },
  { 
    $set: { 
      primaryCategory: "69a50f55d1138dde5e7180b9",
      updatedAt: new Date()
    } 
  }
)

// Head Mounted Welding Helmet, Shade 8, Compatible with Welding Lens, Protective Welding Mask
db.products.updateOne(
  { _id: "69a301238f9bd9b91fc960ad" },
  { 
    $set: { 
      primaryCategory: "69a50f55d1138dde5e7180b9",
      updatedAt: new Date()
    } 
  }
)

// Metal First Aid Kit, Wall Mounted, Handheld, White, Contains Multiple Emergency Items, Size 9.4×4.3×15.2 in
db.products.updateOne(
  { _id: "69a3014f8f9bd9b91fc96146" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// First Aid Kit Case, Empty, Silver, Aluminum Construction, Handheld, Shoulder Carry, Size 17.7×10.6×10.6 in
db.products.updateOne(
  { _id: "69a301528f9bd9b91fc9614f" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// First Aid Kit, Metal Silver, Aluminum Frame and Panel, Contains 30 Types, 139 Emergency Items, Size 13.8×9.1×9.1 in
db.products.updateOne(
  { _id: "69a301558f9bd9b91fc96158" },
  { 
    $set: { 
      primaryCategory: "69a50ec3d1138dde5e717e9b",
      updatedAt: new Date()
    } 
  }
)

// First Aid Kit, Standard Configuration, 132 Items, Size 13.8×9.1×9.1 in
db.products.updateOne(
  { _id: "69a301588f9bd9b91fc96161" },
  { 
    $set: { 
      primaryCategory: "69a50edcd1138dde5e717ef8",
      updatedAt: new Date()
    } 
  }
)

// First Aid Kit Case, Empty, Metal Silver, Aluminum Frame and Medium Fiber Panel, Handheld, Shoulder Carry, Size 11×7.1×6.7 in
db.products.updateOne(
  { _id: "69a3015a8f9bd9b91fc9616a" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// First Aid Kit Case, Empty, Metal Silver, Aluminum Frame and Medium Fiber Panel, Handheld, Shoulder Carry, Size 12.2×7.9×7.5 in
db.products.updateOne(
  { _id: "69a3015c8f9bd9b91fc96173" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// First Aid Kit, Basic, Metal Silver, Aluminum Frame and Panel, Contains 24 Types, 63 Emergency Items, Size 11×7.1×6.7 in
db.products.updateOne(
  { _id: "69a3015f8f9bd9b91fc9617c" },
  { 
    $set: { 
      primaryCategory: "69a50ec3d1138dde5e717e9b",
      updatedAt: new Date()
    } 
  }
)

// Medical First Aid Kit, White and Transparent, Medical Grade PP Plastic, Contains 17 Types, 49 Emergency Items, Size 10.2×7.1×5.9 in
db.products.updateOne(
  { _id: "69a301618f9bd9b91fc96185" },
  { 
    $set: { 
      primaryCategory: "69a50ec3d1138dde5e717e9b",
      updatedAt: new Date()
    } 
  }
)

// First Aid Kit Case, Empty, Metal Silver, Aluminum Frame and Panel, Handheld, Shoulder Carry, Size 13.8×9.1×9.1 in
db.products.updateOne(
  { _id: "69a301668f9bd9b91fc96197" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// Portable First Aid Kit Case, Empty Case, Silver, Approximate Size 12.4×7.1×7.1 in
db.products.updateOne(
  { _id: "69a3016b8f9bd9b91fc961a9" },
  { 
    $set: { 
      primaryCategory: "69a50edcd1138dde5e717ef8",
      updatedAt: new Date()
    } 
  }
)

// Arctic Fox Lined Warm Freezer Gloves, Blue
db.products.updateOne(
  { _id: "69a301ed8f9bd9b91fc9637d" },
  { 
    $set: { 
      primaryCategory: "69a50f41d1138dde5e71806d",
      updatedAt: new Date()
    } 
  }
)

// PVC Impact-Resistant High-Calf Rain Boots, Black with Yellow Sole
db.products.updateOne(
  { _id: "69a3023d8f9bd9b91fc96494" },
  { 
    $set: { 
      primaryCategory: "69a50f4bd1138dde5e718095",
      updatedAt: new Date()
    } 
  }
)

// High-Calf PVC Rain Boots, Black
db.products.updateOne(
  { _id: "69a302408f9bd9b91fc9649d" },
  { 
    $set: { 
      primaryCategory: "69a50f4bd1138dde5e718095",
      updatedAt: new Date()
    } 
  }
)

// PVC Mid-Calf Waterproof Rain Boots, Height 13.78 in
db.products.updateOne(
  { _id: "69a302428f9bd9b91fc964a6" },
  { 
    $set: { 
      primaryCategory: "69a50f2fd1138dde5e71802b",
      updatedAt: new Date()
    } 
  }
)

// PVC High-Calf Rain Boots, Black with Yellow Sole, Height 14.57 in
db.products.updateOne(
  { _id: "69a3024d8f9bd9b91fc964ca" },
  { 
    $set: { 
      primaryCategory: "69a50f4bd1138dde5e718095",
      updatedAt: new Date()
    } 
  }
)

// Manual Forklift Handle, Compatible with DFE20
db.products.updateOne(
  { _id: "69a3028d8f9bd9b91fc965ab" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// Light-Duty Swivel Caster, 1.65 in Wheel, Load 66 lb, Installation Height 2.52 in, Pkg Qty 2
db.products.updateOne(
  { _id: "69a3029d8f9bd9b91fc965e1" },
  { 
    $set: { 
      primaryCategory: "69a50ec8d1138dde5e717eae",
      updatedAt: new Date()
    } 
  }
)

// Forklift Wheel Support, Compatible with AC20, AC25, AC30
db.products.updateOne(
  { _id: "69a302b28f9bd9b91fc96629" },
  { 
    $set: { 
      primaryCategory: "69a50eded1138dde5e717f00",
      updatedAt: new Date()
    } 
  }
)

// Small Wheel Shaft, 0.79 in × 3.66 in
db.products.updateOne(
  { _id: "69a302cd8f9bd9b91fc96683" },
  { 
    $set: { 
      primaryCategory: "69a50f1cd1138dde5e717fe3",
      updatedAt: new Date()
    } 
  }
)

// Heavy-Duty Swivel Caster, 4 in Nylon Wheel, Load 639 lb, Installation Height 5.67 in
db.products.updateOne(
  { _id: "69a302e38f9bd9b91fc966d4" },
  { 
    $set: { 
      primaryCategory: "69a50ec8d1138dde5e717eae",
      updatedAt: new Date()
    } 
  }
)

// Hand Truck Caster Set, 3 in, 2 Fixed and 2 Swivel Wheels, Load 220 lb, Installation Height 4.13 in
db.products.updateOne(
  { _id: "69a302f08f9bd9b91fc96701" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// Stainless Steel Platform Cart, Single-Layer, Size 35.43 × 19.69 × 33.86 in, Rated Load 661 lb
db.products.updateOne(
  { _id: "69a303708f9bd9b91fc968c3" },
  { 
    $set: { 
      primaryCategory: "69a50ec8d1138dde5e717eae",
      updatedAt: new Date()
    } 
  }
)

// PE Foam Double-Sided Tape, Thickness 0.04 in, Width 0.39 in, Length 9.84 ft
db.products.updateOne(
  { _id: "69a303af8f9bd9b91fc969a4" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805c",
      updatedAt: new Date()
    } 
  }
)

// Platform Truck with Folding Handle, Size 18.50 × 27.95 in, Load Capacity 331 lb
db.products.updateOne(
  { _id: "69a303b28f9bd9b91fc969ad" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// Steel Platform Truck with Casters, Size 23.62 × 35.43 in, Fits 60 × 90 cm Containers
db.products.updateOne(
  { _id: "69a303be8f9bd9b91fc969da" },
  { 
    $set: { 
      primaryCategory: "69a50f16d1138dde5e717fcd",
      updatedAt: new Date()
    } 
  }
)

// Silent Steel Platform Truck, Size 41.34 × 24.80 in, Load Capacity 717 lb
db.products.updateOne(
  { _id: "69a303c38f9bd9b91fc969ec" },
  { 
    $set: { 
      primaryCategory: "69a50ec8d1138dde5e717eae",
      updatedAt: new Date()
    } 
  }
)

// Single Layer Plastic Platform Truck, YJD A1125006, 23.62 in Length, 35.43 in Width, 33.46 in Height, 661.39 lb Capacity
db.products.updateOne(
  { _id: "69a303d28f9bd9b91fc96a22" },
  { 
    $set: { 
      primaryCategory: "69a50f51d1138dde5e7180ac",
      updatedAt: new Date()
    } 
  }
)

// Silent Folding Stainless Steel Platform Truck, ZKH 700Q 1175 by 700, 46.26 in Length, 27.56 in Width, 1543.24 lb Capacity
db.products.updateOne(
  { _id: "69a303f18f9bd9b91fc96a8e" },
  { 
    $set: { 
      primaryCategory: "69a50f21d1138dde5e717ff9",
      updatedAt: new Date()
    } 
  }
)

// 304 Stainless Steel Platform Truck, 304609005S, 23.62 in Width, 35.43 in Length, 330.69 lb Capacity, 5 in Silent Brake Wheels
db.products.updateOne(
  { _id: "69a303fe8f9bd9b91fc96abb" },
  { 
    $set: { 
      primaryCategory: "69a50f16d1138dde5e717fce",
      updatedAt: new Date()
    } 
  }
)

// Tool Cart Accessory Partition, GC 10, 2.95 in Width, 22.2 in Length, Fits 22.2 in by 22.5 in Drawer
db.products.updateOne(
  { _id: "69a304058f9bd9b91fc96ad6" },
  { 
    $set: { 
      primaryCategory: "69a50ee2d1138dde5e717f0f",
      updatedAt: new Date()
    } 
  }
)

// Heavy Duty Platform Hand Truck, QH07032, 39.37 in Length, 31.5 in Width, 35.43 in Height, 2204.62 lb Rated Load
db.products.updateOne(
  { _id: "69a304088f9bd9b91fc96adf" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// Heavy Duty Square Tube Hand Truck, FGTC600 05, 23.62 in Length, 35.43 in Width, 661.39 lb Load Capacity
db.products.updateOne(
  { _id: "69a3040d8f9bd9b91fc96af1" },
  { 
    $set: { 
      primaryCategory: "69a50eb0d1138dde5e717e54",
      updatedAt: new Date()
    } 
  }
)

// Modular Platform Truck, 23652, 16.54 in Length, 11.42 in Width, 4.13 in Height, Fits 16.54 in by 11.42 in Containers
db.products.updateOne(
  { _id: "69a304148f9bd9b91fc96b0c" },
  { 
    $set: { 
      primaryCategory: "69a50f4fd1138dde5e7180a5",
      updatedAt: new Date()
    } 
  }
)

// Ultra Silent Platform Truck, PLA300 DX, 35.43 in Length, 23.62 in Width, 661.39 lb Capacity, Folding Handle
db.products.updateOne(
  { _id: "69a304178f9bd9b91fc96b15" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// Plastic Folding Platform Hand Truck, YL STC 11, 35.4 in Length, 23.6 in Width
db.products.updateOne(
  { _id: "69a3042c8f9bd9b91fc96b5d" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// Thickened Wooden Platform Truck, 10214, 35.43 in Length, 23.62 in Width, 5.12 in Height, Natural Wood, 330.69 lb Load Capacity
db.products.updateOne(
  { _id: "69a304368f9bd9b91fc96b81" },
  { 
    $set: { 
      primaryCategory: "69a50ec8d1138dde5e717eae",
      updatedAt: new Date()
    } 
  }
)

// PE Foam Double Sided Tape, 88623, White, 0.04 in Thickness, 0.39 in Width, 9.84 ft Length
db.products.updateOne(
  { _id: "69a304388f9bd9b91fc96b8a" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805c",
      updatedAt: new Date()
    } 
  }
)

// Stainless Steel Single Layer Cart, QH07210, 35.43 in Length, 19.69 in Width, 33.86 in Height, 661.39 lb Rated Load
db.products.updateOne(
  { _id: "69a3043d8f9bd9b91fc96b9c" },
  { 
    $set: { 
      primaryCategory: "69a50ec8d1138dde5e717eae",
      updatedAt: new Date()
    } 
  }
)

// Stainless Steel Single Layer Cart, QH07212, 39.37 in Length, 27.56 in Width, 35.43 in Height, 661.39 lb Rated Load
db.products.updateOne(
  { _id: "69a3044a8f9bd9b91fc96bc9" },
  { 
    $set: { 
      primaryCategory: "69a50ec8d1138dde5e717eae",
      updatedAt: new Date()
    } 
  }
)

// Mesh Shelving Hand Truck Support Accessories with Wheels, 75.98 in Pillar, 0.98 in Diameter, 4 Poles, 2 Brake Wheels, 2 Swivel Wheels
db.products.updateOne(
  { _id: "69a3044c8f9bd9b91fc96bd2" },
  { 
    $set: { 
      primaryCategory: "69a50f34d1138dde5e71803d",
      updatedAt: new Date()
    } 
  }
)

// VHB Foam Double Sided Tape, Black, 0.0433 in Thickness, 1.18 in Width, 10 ft Length
db.products.updateOne(
  { _id: "69a304548f9bd9b91fc96bed" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805c",
      updatedAt: new Date()
    } 
  }
)

// Patterned Steel Platform Truck, HWG 006, 26.14 in Length, 47.17 in Width, 34.45 in Height, 1984.16 lb Load Capacity
db.products.updateOne(
  { _id: "69a304578f9bd9b91fc96bf6" },
  { 
    $set: { 
      primaryCategory: "69a50ec8d1138dde5e717eae",
      updatedAt: new Date()
    } 
  }
)

// Reflective Warning Tape, Black, 7.874 in Width, 150 ft Length, High Reflectivity, Multi Resistant, Durable Safety Tape
db.products.updateOne(
  { _id: "69a304598f9bd9b91fc96bff" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805c",
      updatedAt: new Date()
    } 
  }
)

// Patterned Steel Platform Truck, HWG 005, 24.8 in Length, 37.8 in Width, 34.45 in Height, 1763.70 lb Load Capacity
db.products.updateOne(
  { _id: "69a3045e8f9bd9b91fc96c11" },
  { 
    $set: { 
      primaryCategory: "69a50ec8d1138dde5e717eae",
      updatedAt: new Date()
    } 
  }
)

// Patterned Steel Platform Truck, HWG 004, 24.8 in Length, 37.8 in Width, 34.45 in Height, 1763.70 lb Load Capacity
db.products.updateOne(
  { _id: "69a304618f9bd9b91fc96c1a" },
  { 
    $set: { 
      primaryCategory: "69a50ec8d1138dde5e717eae",
      updatedAt: new Date()
    } 
  }
)

// Full Silent Plastic Platform Truck, JHTT 02, 35.43 in Length, 23.62 in Width, 661.39 lb Capacity, Folding Handle
db.products.updateOne(
  { _id: "69a304638f9bd9b91fc96c23" },
  { 
    $set: { 
      primaryCategory: "69a50f4dd1138dde5e71809c",
      updatedAt: new Date()
    } 
  }
)

// Silent Folding Platform Truck, SL STC26, 28.35 in Length, 18.90 in Width, 31.50 in Height, 330.69 lb Capacity
db.products.updateOne(
  { _id: "69a304668f9bd9b91fc96c2c" },
  { 
    $set: { 
      primaryCategory: "69a50f21d1138dde5e717ff9",
      updatedAt: new Date()
    } 
  }
)

// Reflective Warning Tape, Black, 9.843 in Width, 150 ft Length, High Reflectivity, Multi Resistant, Durable Safety Tape
db.products.updateOne(
  { _id: "69a304688f9bd9b91fc96c35" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805c",
      updatedAt: new Date()
    } 
  }
)

// Reflective Warning Tape, Yellow, 9.843 in Width, 150 ft Length
db.products.updateOne(
  { _id: "69a3046b8f9bd9b91fc96c3e" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805c",
      updatedAt: new Date()
    } 
  }
)

// Primerless Acrylic Foam Tape, PX5011, Black, 0.045 in Thickness, 0.984 in Width, 108.27 ft Length
db.products.updateOne(
  { _id: "69a3046d8f9bd9b91fc96c47" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805c",
      updatedAt: new Date()
    } 
  }
)

// Polypropylene Elbow Hose Barb Fitting, 90 Degree Bend, Male Thread, for Fluid Transfer, Pkg Qty 20
db.products.updateOne(
  { _id: "69a305788f9bd9b91fc96ff8" },
  { 
    $set: { 
      primaryCategory: "69a50f2ed1138dde5e718027",
      updatedAt: new Date()
    } 
  }
)

// NBR TC Skeleton Oil Seal, Dual Lip, Shaft Seal, For Industrial Rotating Equipment
db.products.updateOne(
  { _id: "69a306328f9bd9b91fc9726e" },
  { 
    $set: { 
      primaryCategory: "69a50f46d1138dde5e718080",
      updatedAt: new Date()
    } 
  }
)

// FKM Skeleton Oil Seal, Fluororubber, High Temperature Resistant, Chemical Resistant, Shaft Seal
db.products.updateOne(
  { _id: "69a3063a8f9bd9b91fc97289" },
  { 
    $set: { 
      primaryCategory: "69a50f3cd1138dde5e71805a",
      updatedAt: new Date()
    } 
  }
)
