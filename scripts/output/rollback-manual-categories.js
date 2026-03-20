// 回滚脚本 - 撤销手动分类更新
// 使用前请务必备份数据库！


// 回滚产品 69a2f8988f9bd9b91fc942c2
db.products.updateOne(
  { _id: "69a2f8988f9bd9b91fc942c2" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品 69a2f96f8f9bd9b91fc945b6
db.products.updateOne(
  { _id: "69a2f96f8f9bd9b91fc945b6" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品 69a2feb38f9bd9b91fc95822
db.products.updateOne(
  { _id: "69a2feb38f9bd9b91fc95822" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品 69a2ffb78f9bd9b91fc95bb8
db.products.updateOne(
  { _id: "69a2ffb78f9bd9b91fc95bb8" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品 69a3000c8f9bd9b91fc95ce1
db.products.updateOne(
  { _id: "69a3000c8f9bd9b91fc95ce1" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品 69a300218f9bd9b91fc95d29
db.products.updateOne(
  { _id: "69a300218f9bd9b91fc95d29" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品 69a303aa8f9bd9b91fc96992
db.products.updateOne(
  { _id: "69a303aa8f9bd9b91fc96992" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品 69a303f98f9bd9b91fc96aa9
db.products.updateOne(
  { _id: "69a303f98f9bd9b91fc96aa9" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品 69a304008f9bd9b91fc96ac4
db.products.updateOne(
  { _id: "69a304008f9bd9b91fc96ac4" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品 69a304218f9bd9b91fc96b39
db.products.updateOne(
  { _id: "69a304218f9bd9b91fc96b39" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)

// 回滚产品 69a304298f9bd9b91fc96b54
db.products.updateOne(
  { _id: "69a304298f9bd9b91fc96b54" },
  { 
    $unset: { primaryCategory: "" },
    $set: { updatedAt: new Date() }
  }
)
