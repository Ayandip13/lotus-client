import mongoose from 'mongoose';
import { env } from '../config/env';
import { cashCustodyService } from '../modules/cashCustody/cashCustody.service';
import { accountService } from '../modules/accounts/account.service';

import { Transaction } from '../modules/transactions/transaction.model';

async function check() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('--- CASH CUSTODY OVERVIEW ---');
  const cash = await cashCustodyService.getCashCustodyOverview();
  console.log(JSON.stringify(cash, null, 2));

  console.log('\n--- FINANCIAL SUMMARY ---');
  const summary = await accountService.getOverallFinancialSummary();
  console.log(JSON.stringify(summary, null, 2));

  console.log('\n--- DETAILED TRANSACTIONS ---');
  const txs = await Transaction.find({});
  for (const t of txs) {
    console.log(JSON.stringify(t.toObject(), null, 2));
  }
  await mongoose.disconnect();
}

check().catch(console.error);
