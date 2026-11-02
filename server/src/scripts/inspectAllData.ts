import mongoose from 'mongoose';
import { env } from '../config/env';
import { Event } from '../modules/events/event.model';
import { Transaction } from '../modules/transactions/transaction.model';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';
import { Invoice } from '../modules/invoices/invoice.model';
import { Vendor } from '../modules/vendors/vendor.model';
import { VendorBill } from '../modules/vendors/vendorBill.model';

async function inspectAllData() {
  await mongoose.connect(env.MONGODB_URI);

  const events = await Event.find({});
  console.log(`Total Events: ${events.length}`);
  const testEvents = events.filter(e => e.title.includes('Audit') || e.title.includes('Test') || e.title.includes('Phase 5'));
  console.log(`Test Events: ${testEvents.length}, Non-test Events: ${events.length - testEvents.length}`);

  const invoices = await Invoice.find({});
  console.log(`Total Invoices: ${invoices.length}`);
  const testInvoices = invoices.filter(i => i.customerName.includes('Audit') || i.customerName.includes('Ananya Roy') || i.customerName.includes('Corporate Banquet') || i.customerName.includes('Concurrent Client'));
  console.log(`Test Invoices: ${testInvoices.length}, Non-test Invoices: ${invoices.length - testInvoices.length}`);

  const cashMovements = await CashMovement.find({});
  console.log(`Total Cash Movements: ${cashMovements.length}`);
  const testMovements = cashMovements.filter(m => (m.description || '').includes('Audit') || (m.description || '').includes('Handover for market purchases') || (m.description || '').includes('Deposited surplus event cash') || (m.description || '').includes('Opening physical business cash in hand'));
  console.log(`Test Cash Movements: ${testMovements.length}, Non-test Cash Movements: ${cashMovements.length - testMovements.length}`);

  const nonTestMovements = cashMovements.filter(m => !((m.description || '').includes('Audit') || (m.description || '').includes('Handover for market purchases') || (m.description || '').includes('Deposited surplus event cash') || (m.description || '').includes('Opening physical business cash in hand')));
  console.log('\nNon-test Cash Movements:');
  for (const m of nonTestMovements) {
    console.log(`- ${m.movementType}: ₹${m.amount} (${m.description})`);
  }

  await mongoose.disconnect();
}

inspectAllData().catch(err => {
  console.error(err);
  process.exit(1);
});
