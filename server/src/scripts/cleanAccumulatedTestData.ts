import mongoose from 'mongoose';
import { env } from '../config/env';
import { Event } from '../modules/events/event.model';
import { Transaction } from '../modules/transactions/transaction.model';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';
import { Invoice } from '../modules/invoices/invoice.model';
import { Vendor } from '../modules/vendors/vendor.model';
import { VendorBill } from '../modules/vendors/vendorBill.model';

async function cleanTestData() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB to purge leftover test-runner artifacts...');

  // 1. Delete test events and associated records
  const testEvents = await Event.find({
    $or: [
      { title: { $regex: /Audit/i } },
      { title: { $regex: /Phase 5/i } },
      { title: { $regex: /Bose Family Golden Jubilee/i } },
    ],
  });
  const testEventIds = testEvents.map(e => e._id);
  console.log(`Found ${testEventIds.length} test events.`);

  await Transaction.deleteMany({ relatedEvent: { $in: testEventIds } });
  await CashMovement.deleteMany({ relatedEvent: { $in: testEventIds } });
  await Invoice.deleteMany({ relatedEvent: { $in: testEventIds } });
  await VendorBill.deleteMany({ relatedEvent: { $in: testEventIds } });
  const deletedEvents = await Event.deleteMany({ _id: { $in: testEventIds } });
  console.log(`- Deleted test events: ${deletedEvents.deletedCount}`);

  // 2. Delete test vendors and bills
  const testVendors = await Vendor.find({
    $or: [
      { name: { $regex: /Audit/i } },
      { name: { $regex: /Royal Spices/i } },
    ],
  });
  const testVendorIds = testVendors.map(v => v._id);
  await Transaction.deleteMany({ relatedVendorBill: { $in: (await VendorBill.find({ vendor: { $in: testVendorIds } })).map(b => b._id) } });
  await VendorBill.deleteMany({ vendor: { $in: testVendorIds } });
  const deletedVendors = await Vendor.deleteMany({ _id: { $in: testVendorIds } });
  console.log(`- Deleted test vendors: ${deletedVendors.deletedCount}`);

  // 3. Delete test cash movements
  const deletedCm = await CashMovement.deleteMany({
    $or: [
      { description: { $regex: /Audit/i } },
      { description: { $regex: /Opening physical business cash in hand/i } },
      { description: { $regex: /Handover for market purchases/i } },
      { description: { $regex: /Deposited surplus event cash/i } },
      { description: { $regex: /Invalid handover/i } },
    ],
  });
  console.log(`- Deleted test cash movements: ${deletedCm.deletedCount}`);

  // 4. Delete test invoices and orphan test transactions
  const deletedInv = await Invoice.deleteMany({
    $or: [
      { customerName: { $regex: /Audit/i } },
      { customerName: { $regex: /Ananya Roy/i } },
      { customerName: { $regex: /Corporate Banquet/i } },
      { customerName: { $regex: /Concurrent Client/i } },
      { customerName: { $regex: /Rollback Test Client/i } },
    ],
  });
  console.log(`- Deleted test invoices: ${deletedInv.deletedCount}`);

  const deletedTx = await Transaction.deleteMany({
    $or: [
      { description: { $regex: /Audit/i } },
      { description: { $regex: /Flowers/i } },
      { description: { $regex: /Advance transfer via GPay/i } },
    ],
  });
  console.log(`- Deleted test transactions: ${deletedTx.deletedCount}`);

  console.log('\n✅ Database purged of leftover test artifacts.');
  await mongoose.disconnect();
}

cleanTestData().catch(err => {
  console.error(err);
  process.exit(1);
});
