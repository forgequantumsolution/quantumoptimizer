import { PrismaClient, Role, Industry, Severity, AlertCategory, OrderStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const HASH = async (p: string) => bcrypt.hash(p, 12);

const PHARMA_SKUS = [
  { code: 'PH001', name: 'Paracetamol 500mg', category: 'Analgesics', unit: 'Strip' },
  { code: 'PH002', name: 'Amoxicillin 250mg', category: 'Antibiotics', unit: 'Capsule' },
  { code: 'PH003', name: 'Ibuprofen 400mg', category: 'Analgesics', unit: 'Tablet' },
  { code: 'PH004', name: 'Metformin 500mg', category: 'Diabetes', unit: 'Tablet' },
  { code: 'PH005', name: 'Omeprazole 20mg', category: 'GI', unit: 'Capsule' },
  { code: 'PH006', name: 'Azithromycin 500mg', category: 'Antibiotics', unit: 'Tablet' },
  { code: 'PH007', name: 'Atorvastatin 10mg', category: 'Cardiovascular', unit: 'Tablet' },
  { code: 'PH008', name: 'Amlodipine 5mg', category: 'Cardiovascular', unit: 'Tablet' },
  { code: 'PH009', name: 'Cetirizine 10mg', category: 'Antihistamine', unit: 'Tablet' },
  { code: 'PH010', name: 'Pantoprazole 40mg', category: 'GI', unit: 'Tablet' },
  { code: 'PH011', name: 'Metronidazole 400mg', category: 'Antibiotics', unit: 'Tablet' },
  { code: 'PH012', name: 'Ciprofloxacin 500mg', category: 'Antibiotics', unit: 'Tablet' },
  { code: 'PH013', name: 'Doxycycline 100mg', category: 'Antibiotics', unit: 'Capsule' },
  { code: 'PH014', name: 'Losartan 50mg', category: 'Cardiovascular', unit: 'Tablet' },
  { code: 'PH015', name: 'Vitamin D3 60K IU', category: 'Supplements', unit: 'Capsule' },
  { code: 'PH016', name: 'Aspirin 75mg', category: 'Analgesics', unit: 'Tablet' },
  { code: 'PH017', name: 'Insulin Glargine', category: 'Diabetes', unit: 'Vial' },
  { code: 'PH018', name: 'Salbutamol Inhaler', category: 'Respiratory', unit: 'Unit' },
  { code: 'PH019', name: 'Prednisolone 5mg', category: 'Steroids', unit: 'Tablet' },
  { code: 'PH020', name: 'Folic Acid 5mg', category: 'Supplements', unit: 'Tablet' },
];

const FNB_SKUS = [
  { code: 'FN001', name: 'Whole Milk 1L', category: 'Dairy', unit: 'Pack' },
  { code: 'FN002', name: 'Greek Yoghurt 400g', category: 'Dairy', unit: 'Cup' },
  { code: 'FN003', name: 'Basmati Rice 5kg', category: 'Grains', unit: 'Bag' },
  { code: 'FN004', name: 'Orange Juice 1L', category: 'Beverages', unit: 'Pack' },
  { code: 'FN005', name: 'Sliced Bread 400g', category: 'Bakery', unit: 'Loaf' },
  { code: 'FN006', name: 'Cheddar Cheese 200g', category: 'Dairy', unit: 'Pack' },
  { code: 'FN007', name: 'Chicken Breast 1kg', category: 'Proteins', unit: 'Pack' },
  { code: 'FN008', name: 'Mixed Vegetables 500g', category: 'Frozen', unit: 'Pack' },
  { code: 'FN009', name: 'Pasta 500g', category: 'Grains', unit: 'Pack' },
  { code: 'FN010', name: 'Tomato Sauce 400g', category: 'Condiments', unit: 'Can' },
  { code: 'FN011', name: 'Olive Oil 500ml', category: 'Oils', unit: 'Bottle' },
  { code: 'FN012', name: 'Eggs 12-pack', category: 'Proteins', unit: 'Tray' },
  { code: 'FN013', name: 'Coffee Beans 250g', category: 'Beverages', unit: 'Pack' },
  { code: 'FN014', name: 'Salmon Fillet 300g', category: 'Seafood', unit: 'Pack' },
  { code: 'FN015', name: 'Mixed Nuts 200g', category: 'Snacks', unit: 'Pack' },
];

const FMCG_SKUS = [
  { code: 'FM001', name: 'Shampoo 400ml', category: 'Hair Care', unit: 'Bottle' },
  { code: 'FM002', name: 'Toothpaste 150g', category: 'Oral Care', unit: 'Tube' },
  { code: 'FM003', name: 'Body Lotion 250ml', category: 'Skin Care', unit: 'Bottle' },
  { code: 'FM004', name: 'Laundry Detergent 2kg', category: 'Household', unit: 'Pack' },
  { code: 'FM005', name: 'Dish Soap 500ml', category: 'Household', unit: 'Bottle' },
  { code: 'FM006', name: 'Deodorant 150ml', category: 'Personal Care', unit: 'Can' },
  { code: 'FM007', name: 'Face Wash 100ml', category: 'Skin Care', unit: 'Bottle' },
  { code: 'FM008', name: 'Conditioner 400ml', category: 'Hair Care', unit: 'Bottle' },
  { code: 'FM009', name: 'Sunscreen SPF 50', category: 'Skin Care', unit: 'Tube' },
  { code: 'FM010', name: 'Floor Cleaner 1L', category: 'Household', unit: 'Bottle' },
  { code: 'FM011', name: 'Hand Sanitizer 200ml', category: 'Hygiene', unit: 'Bottle' },
  { code: 'FM012', name: 'Razors 4-pack', category: 'Personal Care', unit: 'Pack' },
  { code: 'FM013', name: 'Baby Powder 100g', category: 'Baby Care', unit: 'Bottle' },
  { code: 'FM014', name: 'Mouthwash 500ml', category: 'Oral Care', unit: 'Bottle' },
  { code: 'FM015', name: 'Toilet Cleaner 500ml', category: 'Household', unit: 'Bottle' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.replenishmentOrder.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.forecast.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.sKU.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.scenario.deleteMany();

  const demoPassword = await HASH('demo1234');

  // ── PHARMA TENANT ──
  const pharma = await prisma.tenant.create({
    data: {
      name: 'MedCore Pharma Ltd.',
      industry: Industry.PHARMA,
      mfaRequired: true,
      dataRegion: 'ap-south-1',
    },
  });

  const pharmaUsers = await Promise.all([
    prisma.user.create({ data: { email: 'admin@pharma.com', password: demoPassword, firstName: 'Arjun', lastName: 'Mehta', role: Role.SUPER_ADMIN, tenantId: pharma.id, department: 'IT Admin' } }),
    prisma.user.create({ data: { email: 'planner@pharma.com', password: demoPassword, firstName: 'Priya', lastName: 'Sharma', role: Role.SUPPLY_PLANNER, tenantId: pharma.id, department: 'Supply Chain' } }),
    prisma.user.create({ data: { email: 'retailer@pharma.com', password: demoPassword, firstName: 'Ravi', lastName: 'Kumar', role: Role.RETAILER, tenantId: pharma.id, department: 'Store Ops' } }),
    prisma.user.create({ data: { email: 'distributor@pharma.com', password: demoPassword, firstName: 'Sunita', lastName: 'Patel', role: Role.DISTRIBUTOR_MANAGER, tenantId: pharma.id, department: 'Distribution' } }),
    prisma.user.create({ data: { email: 'production@pharma.com', password: demoPassword, firstName: 'Vikram', lastName: 'Singh', role: Role.PRODUCTION_MANAGER, tenantId: pharma.id, department: 'Manufacturing' } }),
    prisma.user.create({ data: { email: 'finance@pharma.com', password: demoPassword, firstName: 'Meena', lastName: 'Iyer', role: Role.FINANCE, tenantId: pharma.id, department: 'Finance' } }),
  ]);

  const pharmaWarehouses = await Promise.all([
    prisma.warehouse.create({ data: { name: 'Mumbai Central DC', location: 'Mumbai', region: 'West', tenantId: pharma.id } }),
    prisma.warehouse.create({ data: { name: 'Delhi North Hub', location: 'Delhi', region: 'North', tenantId: pharma.id } }),
    prisma.warehouse.create({ data: { name: 'Bangalore South FC', location: 'Bangalore', region: 'South', tenantId: pharma.id } }),
  ]);

  const pharmaSkus = await Promise.all(
    PHARMA_SKUS.map(s => prisma.sKU.create({ data: { ...s, tenantId: pharma.id } }))
  );

  // Inventory records
  for (const sku of pharmaSkus) {
    for (const wh of pharmaWarehouses) {
      const stockDays = Math.floor(Math.random() * 60) + 5;
      const expiryDays = Math.floor(Math.random() * 180) + 30;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      await prisma.inventory.create({
        data: {
          skuId: sku.id,
          warehouseId: wh.id,
          quantity: Math.floor(Math.random() * 5000) + 500,
          stockDays: parseFloat(stockDays.toFixed(1)),
          expiryDate,
          batchNumber: `BATCH-${sku.code}-${Math.floor(Math.random() * 9000) + 1000}`,
        },
      });
    }
  }

  // Forecast records — 14 days
  for (const sku of pharmaSkus.slice(0, 10)) {
    for (let d = 0; d < 14; d++) {
      const fdate = new Date();
      fdate.setDate(fdate.getDate() + d);
      await prisma.forecast.create({
        data: {
          skuId: sku.id,
          warehouseId: pharmaWarehouses[0].id,
          forecastDate: fdate,
          horizon: 14,
          demandValue: Math.floor(Math.random() * 3000) + 1000,
          confidence: parseFloat((0.82 + Math.random() * 0.16).toFixed(3)),
          modelUsed: ['LSTM', 'XGBoost', 'Prophet', 'Ensemble'][Math.floor(Math.random() * 4)],
        },
      });
    }
  }

  // Alerts
  const alertData = [
    { severity: Severity.CRITICAL, category: AlertCategory.STOCKOUT_RISK, title: 'Stockout Risk — Ibuprofen 400mg', message: 'Current stock will run out in 5 days based on current demand trajectory.', skuId: pharmaSkus[2].id },
    { severity: Severity.CRITICAL, category: AlertCategory.EXPIRY, title: 'Expiry Alert — Batch #2241', message: 'Batch of Amoxicillin expires in 12 days. Redistribution to high-demand stores recommended.', skuId: pharmaSkus[1].id },
    { severity: Severity.CRITICAL, category: AlertCategory.SUPPLIER_DELAY, title: 'Supplier Delay — API Supplier', message: 'Primary API supplier for Metformin has reported a 14-day delay. Alternative sourcing required.', skuId: pharmaSkus[3].id },
    { severity: Severity.WARNING, category: AlertCategory.STOCKOUT_RISK, title: 'Reorder Point — Amoxicillin 250mg', message: '14 days stock remaining. Replenishment PO not yet approved by distributor.', skuId: pharmaSkus[1].id },
    { severity: Severity.WARNING, category: AlertCategory.OVERSTOCK, title: 'Overstock Risk — Vitamin D3 60K', message: 'Current stock represents 95 days of demand. Consider redistribution or promotional push.', skuId: pharmaSkus[14].id },
    { severity: Severity.WARNING, category: AlertCategory.EXPIRY, title: 'Expiry Warning — Prednisolone 5mg', message: 'Batch expiring in 21 days with 45% remaining stock. Expedite sales or consider disposal protocol.', skuId: pharmaSkus[18].id },
    { severity: Severity.WARNING, category: AlertCategory.STOCKOUT_RISK, title: 'Low Stock — Omeprazole 20mg', message: 'Stock at 18 days. Demand forecast shows 12% uptick next week.', skuId: pharmaSkus[4].id },
    { severity: Severity.INFO, category: AlertCategory.AI_PLAN_READY, title: 'AI Replenishment Plan Ready', message: 'New replenishment plan generated for 12 SKUs covering next 30-day horizon. Review and approve.', skuId: null },
    { severity: Severity.INFO, category: AlertCategory.AI_PLAN_READY, title: 'Forecast Accuracy Update', message: 'Monthly model accuracy report ready. LSTM model achieved 94.3% accuracy this month.', skuId: null },
    { severity: Severity.INFO, category: AlertCategory.OVERSTOCK, title: 'Inventory Optimisation Opportunity', message: 'Transfer 2,000 units of Paracetamol from Delhi to Bangalore to balance stock levels.', skuId: pharmaSkus[0].id },
  ];

  for (const a of alertData) {
    await prisma.alert.create({ data: { ...a, warehouseId: pharmaWarehouses[0].id } });
  }

  // Replenishment orders
  for (let i = 0; i < 15; i++) {
    const sku = pharmaSkus[i % pharmaSkus.length];
    const isAuto = Math.random() > 0.3;
    await prisma.replenishmentOrder.create({
      data: {
        skuId: sku.id,
        warehouseId: pharmaWarehouses[i % pharmaWarehouses.length].id,
        quantity: Math.floor(Math.random() * 5000) + 500,
        isAutomatic: isAuto,
        status: isAuto ? OrderStatus.AUTO_APPROVED : OrderStatus.HUMAN_APPROVED,
        approvedBy: pharmaUsers[1].id,
        erpRef: `SAP-PO-${2024000 + i}`,
      },
    });
  }

  // ── FNB TENANT ──
  const fnb = await prisma.tenant.create({
    data: { name: 'FreshBite Foods Ltd.', industry: Industry.FNB, mfaRequired: false, dataRegion: 'ap-south-1' },
  });

  await Promise.all([
    prisma.user.create({ data: { email: 'admin@fnb.com', password: demoPassword, firstName: 'Nisha', lastName: 'Rao', role: Role.SUPER_ADMIN, tenantId: fnb.id } }),
    prisma.user.create({ data: { email: 'planner@fnb.com', password: demoPassword, firstName: 'Karan', lastName: 'Verma', role: Role.SUPPLY_PLANNER, tenantId: fnb.id } }),
  ]);

  const fnbWarehouses = await Promise.all([
    prisma.warehouse.create({ data: { name: 'Pune Cold Chain Hub', location: 'Pune', region: 'West', tenantId: fnb.id } }),
    prisma.warehouse.create({ data: { name: 'Hyderabad Distribution Centre', location: 'Hyderabad', region: 'South', tenantId: fnb.id } }),
    prisma.warehouse.create({ data: { name: 'Chennai Dry Goods Hub', location: 'Chennai', region: 'South', tenantId: fnb.id } }),
  ]);

  const fnbSkus = await Promise.all(FNB_SKUS.map(s => prisma.sKU.create({ data: { ...s, tenantId: fnb.id } })));
  for (const sku of fnbSkus) {
    for (const wh of fnbWarehouses) {
      const exp = new Date(); exp.setDate(exp.getDate() + Math.floor(Math.random() * 30) + 7);
      await prisma.inventory.create({ data: { skuId: sku.id, warehouseId: wh.id, quantity: Math.floor(Math.random() * 2000) + 200, stockDays: parseFloat((Math.random() * 30 + 5).toFixed(1)), expiryDate: exp, batchNumber: `FNB-${sku.code}-${Math.floor(Math.random() * 9000) + 1000}` } });
    }
  }

  // ── FMCG TENANT ──
  const fmcg = await prisma.tenant.create({
    data: { name: 'EverFresh Consumer Goods', industry: Industry.FMCG, mfaRequired: false, dataRegion: 'ap-south-1' },
  });

  await Promise.all([
    prisma.user.create({ data: { email: 'admin@fmcg.com', password: demoPassword, firstName: 'Raj', lastName: 'Agarwal', role: Role.SUPER_ADMIN, tenantId: fmcg.id } }),
    prisma.user.create({ data: { email: 'planner@fmcg.com', password: demoPassword, firstName: 'Divya', lastName: 'Nair', role: Role.SUPPLY_PLANNER, tenantId: fmcg.id } }),
  ]);

  const fmcgWarehouses = await Promise.all([
    prisma.warehouse.create({ data: { name: 'Kolkata East Hub', location: 'Kolkata', region: 'East', tenantId: fmcg.id } }),
    prisma.warehouse.create({ data: { name: 'Ahmedabad West Hub', location: 'Ahmedabad', region: 'West', tenantId: fmcg.id } }),
    prisma.warehouse.create({ data: { name: 'Jaipur North FC', location: 'Jaipur', region: 'North', tenantId: fmcg.id } }),
  ]);

  const fmcgSkus = await Promise.all(FMCG_SKUS.map(s => prisma.sKU.create({ data: { ...s, tenantId: fmcg.id } })));
  for (const sku of fmcgSkus) {
    for (const wh of fmcgWarehouses) {
      await prisma.inventory.create({ data: { skuId: sku.id, warehouseId: wh.id, quantity: Math.floor(Math.random() * 8000) + 1000, stockDays: parseFloat((Math.random() * 90 + 10).toFixed(1)), batchNumber: `FM-${sku.code}-${Math.floor(Math.random() * 9000) + 1000}` } });
    }
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  admin@pharma.com    / demo1234  (Super Admin)');
  console.log('  planner@pharma.com  / demo1234  (Supply Planner)');
  console.log('  retailer@pharma.com / demo1234  (Retailer)');
  console.log('  finance@pharma.com  / demo1234  (Finance)');
  console.log('  admin@fnb.com       / demo1234  (Super Admin - F&B)');
  console.log('  admin@fmcg.com      / demo1234  (Super Admin - FMCG)');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
