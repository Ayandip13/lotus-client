import mongoose from 'mongoose';
import { env } from '../config/env';
import { Partner } from '../modules/partners/partner.model';
import { User } from '../modules/auth/user.model';
import { Transaction } from '../modules/transactions/transaction.model';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';
import { Event } from '../modules/events/event.model';
import { Invoice } from '../modules/invoices/invoice.model';
import { VendorBill } from '../modules/vendors/vendorBill.model';

async function inspect() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to DB:', env.MONGODB_URI.replace(/\/\/.*@/, '//<creds>@'));

  const partners = await Partner.find({});
  console.log(`Total Partners in DB: ${partners.length}`);
  for (const p of partners) {
    const users = await User.find({ partner: p._id });
    const txCount = await Transaction.countDocuments({ partner: p._id });
    const createdTxCount = await Transaction.countDocuments({ createdByPartner: p._id });
    const moveCount = await CashMovement.countDocuments({ $or: [{ fromPartner: p._id }, { toPartner: p._id }] });
    const eventCount = await Event.countDocuments({ createdByPartner: p._id });
    console.log(`- Partner ID: ${p._id}, Name: "${p.name}", Status: ${p.status}, Email: ${p.email || 'N/A'}, Phone: ${p.phone || 'N/A'}`);
    console.log(`  Users: [${users.map(u => u.username).join(', ')}] | Tx as partner: ${txCount} | Tx created: ${createdTxCount} | CashMovements: ${moveCount} | Events: ${eventCount}`);
  }

  const users = await User.find({});
  console.log(`\nTotal Users in DB: ${users.length}`);
  for (const u of users) {
    console.log(`- User ID: ${u._id}, Username: "${u.username}", Partner Ref: ${u.partner}`);
  }

  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
