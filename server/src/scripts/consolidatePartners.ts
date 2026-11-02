import mongoose, { Types } from 'mongoose';
import { env } from '../config/env';
import { Partner } from '../modules/partners/partner.model';
import { User } from '../modules/auth/user.model';
import { Transaction } from '../modules/transactions/transaction.model';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';
import { Event } from '../modules/events/event.model';
import { Invoice } from '../modules/invoices/invoice.model';
import { Vendor } from '../modules/vendors/vendor.model';
import { VendorBill } from '../modules/vendors/vendorBill.model';

async function consolidatePartners() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB for partner consolidation.');

  // Find the canonical partners linked to users
  const user1 = await User.findOne({ username: 'partner1' });
  const user2 = await User.findOne({ username: 'partner2' });
  const user3 = await User.findOne({ username: 'partner3' });

  if (!user1 || !user2 || !user3) {
    throw new Error('Canonical users partner1, partner2, partner3 must exist.');
  }

  const canonP1Id = user1.partner as Types.ObjectId;
  const canonP2Id = user2.partner as Types.ObjectId;
  const canonP3Id = user3.partner as Types.ObjectId;

  console.log(`Canonical Partner 1 ID: ${canonP1Id}`);
  console.log(`Canonical Partner 2 ID: ${canonP2Id}`);
  console.log(`Canonical Partner 3 ID: ${canonP3Id}`);

  // Find all other partners in the DB that are not one of these 3
  const duplicates = await Partner.find({
    _id: { $nin: [canonP1Id, canonP2Id, canonP3Id] },
  });

  console.log(`Found ${duplicates.length} non-canonical / duplicate partner record(s).`);

  for (const dup of duplicates) {
    let targetCanonicalId: Types.ObjectId;

    // Map based on name or index
    if (dup.name.toLowerCase().includes('one') || dup.name.toLowerCase().includes('1')) {
      targetCanonicalId = canonP1Id;
    } else if (dup.name.toLowerCase().includes('two') || dup.name.toLowerCase().includes('2')) {
      targetCanonicalId = canonP2Id;
    } else if (dup.name.toLowerCase().includes('three') || dup.name.toLowerCase().includes('3')) {
      targetCanonicalId = canonP3Id;
    } else {
      // Default to P1 if unknown
      targetCanonicalId = canonP1Id;
    }

    console.log(`\nRe-mapping references from Duplicate Partner "${dup.name}" (${dup._id}) -> Canonical Partner (${targetCanonicalId})...`);

    // 1. Transactions
    const txPartnerRes = await Transaction.updateMany({ partner: dup._id }, { $set: { partner: targetCanonicalId } });
    const txCreatedRes = await Transaction.updateMany({ createdByPartner: dup._id }, { $set: { createdByPartner: targetCanonicalId } });
    const txUpdatedRes = await Transaction.updateMany({ updatedByPartner: dup._id }, { $set: { updatedByPartner: targetCanonicalId } });
    const txDeletedRes = await Transaction.updateMany({ deletedByPartner: dup._id }, { $set: { deletedByPartner: targetCanonicalId } });
    console.log(`- Transactions updated: partner=${txPartnerRes.modifiedCount}, createdBy=${txCreatedRes.modifiedCount}`);

    // 2. CashMovements
    const cmFromRes = await CashMovement.updateMany({ fromPartner: dup._id }, { $set: { fromPartner: targetCanonicalId } });
    const cmToRes = await CashMovement.updateMany({ toPartner: dup._id }, { $set: { toPartner: targetCanonicalId } });
    const cmCreatedRes = await CashMovement.updateMany({ createdByPartner: dup._id }, { $set: { createdByPartner: targetCanonicalId } });
    const cmDeletedRes = await CashMovement.updateMany({ deletedByPartner: dup._id }, { $set: { deletedByPartner: targetCanonicalId } });
    console.log(`- CashMovements updated: from=${cmFromRes.modifiedCount}, to=${cmToRes.modifiedCount}, createdBy=${cmCreatedRes.modifiedCount}`);

    // 3. Events
    const evCreatedRes = await Event.updateMany({ createdByPartner: dup._id }, { $set: { createdByPartner: targetCanonicalId } });
    const evDeletedRes = await Event.updateMany({ deletedByPartner: dup._id }, { $set: { deletedByPartner: targetCanonicalId } });
    console.log(`- Events updated: createdBy=${evCreatedRes.modifiedCount}`);

    // 4. Invoices
    const invCreatedRes = await Invoice.updateMany({ createdByPartner: dup._id }, { $set: { createdByPartner: targetCanonicalId } });
    const invDeletedRes = await Invoice.updateMany({ deletedByPartner: dup._id }, { $set: { deletedByPartner: targetCanonicalId } });
    const invRecvRes = await Invoice.updateMany(
      { 'payments.receivedByPartner': dup._id },
      { $set: { 'payments.$[elem].receivedByPartner': targetCanonicalId } },
      { arrayFilters: [{ 'elem.receivedByPartner': dup._id }] }
    );
    console.log(`- Invoices updated: createdBy=${invCreatedRes.modifiedCount}, payments.receivedBy=${invRecvRes.modifiedCount}`);

    // 5. Vendor Bills
    const vbCreatedRes = await VendorBill.updateMany({ createdByPartner: dup._id }, { $set: { createdByPartner: targetCanonicalId } });
    const vbDeletedRes = await VendorBill.updateMany({ deletedByPartner: dup._id }, { $set: { deletedByPartner: targetCanonicalId } });
    const vbPaidRes = await VendorBill.updateMany(
      { 'paymentHistory.paidByPartner': dup._id },
      { $set: { 'paymentHistory.$[elem].paidByPartner': targetCanonicalId } },
      { arrayFilters: [{ 'elem.paidByPartner': dup._id }] }
    );
    console.log(`- VendorBills updated: createdBy=${vbCreatedRes.modifiedCount}, paymentHistory.paidBy=${vbPaidRes.modifiedCount}`);

    // 6. Vendors
    const vCreatedRes = await Vendor.updateMany({ createdByPartner: dup._id }, { $set: { createdByPartner: targetCanonicalId } });
    console.log(`- Vendors updated: createdBy=${vCreatedRes.modifiedCount}`);

    // Delete the duplicate partner document
    await Partner.findByIdAndDelete(dup._id);
    console.log(`✅ Removed duplicate partner record: ${dup._id} (${dup.name})`);
  }

  // Update canonical partners with professional contact info if missing
  await Partner.findByIdAndUpdate(canonP1Id, {
    $set: {
      name: 'Partner 1',
      email: 'partner1@lotus.com',
      phone: '9830000001',
      status: 'ACTIVE',
    },
  });
  await Partner.findByIdAndUpdate(canonP2Id, {
    $set: {
      name: 'Partner 2',
      email: 'partner2@lotus.com',
      phone: '9830000002',
      status: 'ACTIVE',
    },
  });
  await Partner.findByIdAndUpdate(canonP3Id, {
    $set: {
      name: 'Partner 3',
      email: 'partner3@lotus.com',
      phone: '9830000003',
      status: 'ACTIVE',
    },
  });

  // Final verification
  const finalPartners = await Partner.find({});
  console.log(`\n====================================================`);
  console.log(`Consolidation Complete! Total Partners in DB: ${finalPartners.length}`);
  for (const p of finalPartners) {
    console.log(`- Partner ${p.name} (ID: ${p._id}, Email: ${p.email}, Phone: ${p.phone})`);
  }
  console.log(`====================================================`);

  await mongoose.disconnect();
}

consolidatePartners().catch(err => {
  console.error('Error during consolidation:', err);
  process.exit(1);
});
