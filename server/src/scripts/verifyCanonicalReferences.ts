import mongoose from 'mongoose';
import assert from 'assert';
import { env } from '../config/env';
import { Partner } from '../modules/partners/partner.model';
import { User } from '../modules/auth/user.model';
import { Transaction } from '../modules/transactions/transaction.model';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';
import { Event } from '../modules/events/event.model';
import { Invoice } from '../modules/invoices/invoice.model';
import { Vendor } from '../modules/vendors/vendor.model';
import { VendorBill } from '../modules/vendors/vendorBill.model';

async function verifyCanonicalIntegrity() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('====================================================');
  console.log('🛡️ Comprehensive Canonical Partner & Reference Integrity Audit');
  console.log('====================================================\n');

  // 1. Exactly 3 active partners
  const allPartners = await Partner.find({});
  const activePartners = await Partner.find({ status: 'ACTIVE' });
  const allUsers = await User.find({});

  console.log(`1. PARTNER COUNTS CHECK:`);
  console.log(`   - Total Partner Documents in DB: ${allPartners.length}`);
  console.log(`   - Active Partner Documents in DB: ${activePartners.length}`);
  console.log(`   - Total User Documents in DB: ${allUsers.length}`);

  assert.strictEqual(allPartners.length, 3, 'Database must contain exactly 3 partner records');
  assert.strictEqual(activePartners.length, 3, 'Database must contain exactly 3 active partners');
  assert.strictEqual(allUsers.length, 3, 'Database must contain exactly 3 user accounts');

  const canonicalIds = activePartners.map((p) => p._id);
  console.log(`   - Canonical IDs: ${canonicalIds.map((id) => id.toString()).join(', ')}`);
  for (const p of activePartners) {
    const user = await User.findOne({ partner: p._id });
    assert.ok(user, `Partner ${p.name} must have a linked user account`);
    console.log(`   • Verified Canonical Partner: "${p.name}" (ID: ${p._id}) linked to User: "${user.username}" (${p.email})`);
  }
  console.log('   ✅ PASS: Exactly 3 canonical partners remain.\n');

  // 2. Transactions
  console.log(`2. TRANSACTION REFERENCES CHECK:`);
  const totalTx = await Transaction.countDocuments({});
  const invalidTxPartner = await Transaction.countDocuments({
    partner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidTxCreated = await Transaction.countDocuments({
    createdByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidTxUpdated = await Transaction.countDocuments({
    updatedByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidTxDeleted = await Transaction.countDocuments({
    deletedByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  console.log(`   - Total Transactions: ${totalTx}`);
  console.log(`   - Invalid 'partner' references: ${invalidTxPartner}`);
  console.log(`   - Invalid 'createdByPartner' references: ${invalidTxCreated}`);
  console.log(`   - Invalid 'updatedByPartner' references: ${invalidTxUpdated}`);
  console.log(`   - Invalid 'deletedByPartner' references: ${invalidTxDeleted}`);
  assert.strictEqual(invalidTxPartner, 0, 'No transaction should reference a non-canonical partner');
  assert.strictEqual(invalidTxCreated, 0, 'No transaction should have a non-canonical createdByPartner');
  assert.strictEqual(invalidTxUpdated, 0, 'No transaction should have a non-canonical updatedByPartner');
  assert.strictEqual(invalidTxDeleted, 0, 'No transaction should have a non-canonical deletedByPartner');
  console.log('   ✅ PASS: 100% of Transactions audit fields reference valid canonical partners.\n');

  // 3. Cash Movements
  console.log(`3. CASH MOVEMENT REFERENCES CHECK:`);
  const totalCm = await CashMovement.countDocuments({});
  const invalidCmFrom = await CashMovement.countDocuments({
    fromPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidCmTo = await CashMovement.countDocuments({
    toPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidCmCreated = await CashMovement.countDocuments({
    createdByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidCmUpdated = await CashMovement.countDocuments({
    updatedByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidCmDeleted = await CashMovement.countDocuments({
    deletedByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  console.log(`   - Total Cash Movements: ${totalCm}`);
  console.log(`   - Invalid 'fromPartner' references: ${invalidCmFrom}`);
  console.log(`   - Invalid 'toPartner' references: ${invalidCmTo}`);
  console.log(`   - Invalid 'createdByPartner' references: ${invalidCmCreated}`);
  console.log(`   - Invalid 'updatedByPartner' references: ${invalidCmUpdated}`);
  console.log(`   - Invalid 'deletedByPartner' references: ${invalidCmDeleted}`);
  assert.strictEqual(invalidCmFrom, 0, 'No cash movement should reference a non-canonical fromPartner');
  assert.strictEqual(invalidCmTo, 0, 'No cash movement should reference a non-canonical toPartner');
  assert.strictEqual(invalidCmCreated, 0, 'No cash movement should have a non-canonical createdByPartner');
  assert.strictEqual(invalidCmUpdated, 0, 'No cash movement should have a non-canonical updatedByPartner');
  assert.strictEqual(invalidCmDeleted, 0, 'No cash movement should have a non-canonical deletedByPartner');
  console.log('   ✅ PASS: 100% of Cash Movements audit fields reference valid canonical partners.\n');

  // 4. Invoices
  console.log(`4. INVOICE REFERENCES CHECK:`);
  const totalInvoices = await Invoice.countDocuments({});
  const invalidInvCreated = await Invoice.countDocuments({
    createdByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidInvUpdated = await Invoice.countDocuments({
    updatedByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidInvDeleted = await Invoice.countDocuments({
    deletedByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidInvRecv = await Invoice.countDocuments({
    'payments.receivedByPartner': { $exists: true, $ne: null, $nin: canonicalIds },
  });
  console.log(`   - Total Invoices: ${totalInvoices}`);
  console.log(`   - Invalid 'createdByPartner' references: ${invalidInvCreated}`);
  console.log(`   - Invalid 'updatedByPartner' references: ${invalidInvUpdated}`);
  console.log(`   - Invalid 'deletedByPartner' references: ${invalidInvDeleted}`);
  console.log(`   - Invalid 'payments.receivedByPartner' references: ${invalidInvRecv}`);
  assert.strictEqual(invalidInvCreated, 0, 'No invoice should have a non-canonical createdByPartner');
  assert.strictEqual(invalidInvUpdated, 0, 'No invoice should have a non-canonical updatedByPartner');
  assert.strictEqual(invalidInvDeleted, 0, 'No invoice should have a non-canonical deletedByPartner');
  assert.strictEqual(invalidInvRecv, 0, 'No invoice payment should have a non-canonical receivedByPartner');
  console.log('   ✅ PASS: 100% of Invoices & payment receipts reference valid canonical partners.\n');

  // 5. Vendors Directory
  console.log(`5. VENDOR DIRECTORY AUDIT FIELDS CHECK:`);
  const totalVendors = await Vendor.countDocuments({});
  const invalidVendCreated = await Vendor.countDocuments({
    createdByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidVendUpdated = await Vendor.countDocuments({
    updatedByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidVendDeleted = await Vendor.countDocuments({
    deletedByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  console.log(`   - Total Vendors: ${totalVendors}`);
  console.log(`   - Invalid 'createdByPartner' references: ${invalidVendCreated}`);
  console.log(`   - Invalid 'updatedByPartner' references: ${invalidVendUpdated}`);
  console.log(`   - Invalid 'deletedByPartner' references: ${invalidVendDeleted}`);
  assert.strictEqual(invalidVendCreated, 0, 'No vendor should have a non-canonical createdByPartner');
  assert.strictEqual(invalidVendUpdated, 0, 'No vendor should have a non-canonical updatedByPartner');
  assert.strictEqual(invalidVendDeleted, 0, 'No vendor should have a non-canonical deletedByPartner');
  console.log('   ✅ PASS: 100% of Vendors reference valid canonical partners.\n');

  // 6. Vendor Bills
  console.log(`6. VENDOR BILL REFERENCES CHECK:`);
  const totalBills = await VendorBill.countDocuments({});
  const invalidVbCreated = await VendorBill.countDocuments({
    createdByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidVbUpdated = await VendorBill.countDocuments({
    updatedByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidVbDeleted = await VendorBill.countDocuments({
    deletedByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidVbPaid = await VendorBill.countDocuments({
    'paymentHistory.paidByPartner': { $exists: true, $ne: null, $nin: canonicalIds },
  });
  console.log(`   - Total Vendor Bills: ${totalBills}`);
  console.log(`   - Invalid 'createdByPartner' references: ${invalidVbCreated}`);
  console.log(`   - Invalid 'updatedByPartner' references: ${invalidVbUpdated}`);
  console.log(`   - Invalid 'deletedByPartner' references: ${invalidVbDeleted}`);
  console.log(`   - Invalid 'paymentHistory.paidByPartner' references: ${invalidVbPaid}`);
  assert.strictEqual(invalidVbCreated, 0, 'No vendor bill should have a non-canonical createdByPartner');
  assert.strictEqual(invalidVbUpdated, 0, 'No vendor bill should have a non-canonical updatedByPartner');
  assert.strictEqual(invalidVbDeleted, 0, 'No vendor bill should have a non-canonical deletedByPartner');
  assert.strictEqual(invalidVbPaid, 0, 'No vendor bill payment should have a non-canonical paidByPartner');
  console.log('   ✅ PASS: 100% of Vendor Bills & payment settlements reference valid canonical partners.\n');

  // 7. Events
  console.log(`7. EVENT REFERENCES CHECK:`);
  const totalEvents = await Event.countDocuments({});
  const invalidEventCreated = await Event.countDocuments({
    createdByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidEventUpdated = await Event.countDocuments({
    updatedByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  const invalidEventDeleted = await Event.countDocuments({
    deletedByPartner: { $exists: true, $ne: null, $nin: canonicalIds },
  });
  console.log(`   - Total Events: ${totalEvents}`);
  console.log(`   - Invalid 'createdByPartner' references: ${invalidEventCreated}`);
  console.log(`   - Invalid 'updatedByPartner' references: ${invalidEventUpdated}`);
  console.log(`   - Invalid 'deletedByPartner' references: ${invalidEventDeleted}`);
  assert.strictEqual(invalidEventCreated, 0, 'No event should have a non-canonical createdByPartner');
  assert.strictEqual(invalidEventUpdated, 0, 'No event should have a non-canonical updatedByPartner');
  assert.strictEqual(invalidEventDeleted, 0, 'No event should have a non-canonical deletedByPartner');
  console.log('   ✅ PASS: 100% of Events reference valid canonical partners.\n');

  console.log('====================================================');
  console.log('🎉 ALL INTEGRITY AUDITS PASSED WITH ZERO VIOLATIONS!');
  console.log('====================================================');

  await mongoose.disconnect();
}

verifyCanonicalIntegrity().catch((err) => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
