import mongoose from 'mongoose';
import { env } from '../config/env';
import { Event } from '../modules/events/event.model';
import { Transaction } from '../modules/transactions/transaction.model';
import { Invoice } from '../modules/invoices/invoice.model';
import { Vendor } from '../modules/vendors/vendor.model';
import { VendorBill } from '../modules/vendors/vendorBill.model';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';

export async function purgeAllDummyData(dryRun = false) {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected to MongoDB. Running in ${dryRun ? 'DRY-RUN' : 'LIVE PURGE'} mode...`);

  const events = await Event.find({});
  const transactions = await Transaction.find({});
  const invoices = await Invoice.find({});
  const vendors = await Vendor.find({});
  const vendorBills = await VendorBill.find({});
  const cashMovements = await CashMovement.find({});

  console.log(`Found:`);
  console.log(`- Events: ${events.length}`);
  console.log(`- Transactions: ${transactions.length}`);
  console.log(`- Invoices: ${invoices.length}`);
  console.log(`- Vendors: ${vendors.length}`);
  console.log(`- Vendor Bills: ${vendorBills.length}`);
  console.log(`- Cash Movements: ${cashMovements.length}`);

  if (!dryRun) {
    const deletedEvents = await Event.deleteMany({});
    const deletedTransactions = await Transaction.deleteMany({});
    const deletedInvoices = await Invoice.deleteMany({});
    const deletedVendors = await Vendor.deleteMany({});
    const deletedVendorBills = await VendorBill.deleteMany({});
    const deletedCashMovements = await CashMovement.deleteMany({});

    console.log(`Purged successfully:`);
    console.log(`- Events deleted: ${deletedEvents.deletedCount}`);
    console.log(`- Transactions deleted: ${deletedTransactions.deletedCount}`);
    console.log(`- Invoices deleted: ${deletedInvoices.deletedCount}`);
    console.log(`- Vendors deleted: ${deletedVendors.deletedCount}`);
    console.log(`- Vendor Bills deleted: ${deletedVendorBills.deletedCount}`);
    console.log(`- Cash Movements deleted: ${deletedCashMovements.deletedCount}`);
  }

  await mongoose.disconnect();
}

if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  purgeAllDummyData(isDryRun).catch(console.error);
}

