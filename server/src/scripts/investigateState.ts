import mongoose from 'mongoose';
import { env } from '../config/env';
import { Event } from '../modules/events/event.model';
import { Transaction } from '../modules/transactions/transaction.model';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';
import { Invoice } from '../modules/invoices/invoice.model';
import { Vendor } from '../modules/vendors/vendor.model';
import { VendorBill } from '../modules/vendors/vendorBill.model';
import { Partner } from '../modules/partners/partner.model';

async function investigate() {
  await mongoose.connect(env.MONGODB_URI);

  console.log('--- 1. PARTNERS ---');
  const partners = await Partner.find({});
  for (const p of partners) {
    console.log(`Partner: ID=${p._id}, Name=${p.name}, Status=${p.status}`);
  }

  console.log('\n--- 2. CURRENT EVENTS ---');
  const events = await Event.find({});
  for (const e of events) {
    console.log(`Event: ID=${e._id}, Title="${e.title}", Guest="${e.guestName}", Date=${e.eventDate?.toISOString()}, CreatedBy=${e.createdByPartner}`);
  }

  console.log('\n--- 3. CURRENT TRANSACTIONS ---');
  const txs = await Transaction.find({});
  for (const t of txs) {
    console.log(`Tx: ID=${t._id}, Type=${t.transactionType}, Amount=₹${t.amount}, Source=${t.paymentSource}, Partner=${t.partner}, Desc="${t.description}"`);
  }

  console.log('\n--- 4. CASH MOVEMENTS ---');
  const cms = await CashMovement.find({});
  console.log(`Count: ${cms.length}`);

  console.log('\n--- 5. INVOICES ---');
  const invs = await Invoice.find({});
  console.log(`Count: ${invs.length}`);

  console.log('\n--- 6. VENDORS & BILLS ---');
  const vendors = await Vendor.find({});
  const bills = await VendorBill.find({});
  console.log(`Vendors: ${vendors.length}, Bills: ${bills.length}`);

  await mongoose.disconnect();
}

investigate().catch(console.error);
