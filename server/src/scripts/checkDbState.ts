import mongoose from 'mongoose';
import { env } from '../config/env';
import { Partner } from '../modules/partners/partner.model';
import { User } from '../modules/auth/user.model';
import { Event } from '../modules/events/event.model';
import { Transaction } from '../modules/transactions/transaction.model';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';
import { Invoice } from '../modules/invoices/invoice.model';
import { Vendor } from '../modules/vendors/vendor.model';
import { VendorBill } from '../modules/vendors/vendorBill.model';

export async function getDbCounts() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.MONGODB_URI);
  }
  const partners = await Partner.countDocuments({});
  const users = await User.countDocuments({});
  const events = await Event.countDocuments({});
  const transactions = await Transaction.countDocuments({});
  const cashMovements = await CashMovement.countDocuments({});
  const invoices = await Invoice.countDocuments({});
  const vendors = await Vendor.countDocuments({});
  const vendorBills = await VendorBill.countDocuments({});

  return {
    partners,
    users,
    events,
    transactions,
    cashMovements,
    invoices,
    vendors,
    vendorBills,
  };
}

async function main() {
  const counts = await getDbCounts();
  console.log('--- DATABASE STATE SNAPSHOT ---');
  console.log(JSON.stringify(counts, null, 2));
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch(console.error);
}
