import mongoose from 'mongoose';
import { env } from '../config/env';
import { Transaction } from '../modules/transactions/transaction.model';

async function clean() {
  await mongoose.connect(env.MONGODB_URI);
  const res = await Transaction.deleteMany({
    description: { $regex: 'Opening cash balance', $options: 'i' },
  });
  console.log(`Deleted ${res.deletedCount} obsolete opening balance transactions.`);
  const remaining = await Transaction.find({});
  console.log('Remaining Transactions:');
  for (const t of remaining) {
    console.log(`- ${t.transactionType}: ₹${t.amount} (${t.description})`);
  }
  await mongoose.disconnect();
}

clean().catch(console.error);
