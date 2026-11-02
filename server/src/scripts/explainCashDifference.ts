import mongoose from 'mongoose';
import { env } from '../config/env';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';
import { cashCustodyService } from '../modules/cashCustody/cashCustody.service';

async function explainCashDifference() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to DB');

  // Aggregate movements by movementType
  const agg = await CashMovement.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$movementType',
        totalPaise: { $sum: '$amountPaise' },
        count: { $sum: 1 },
      },
    },
  ]);

  console.log('Cash Movement Breakdown by Type:');
  const typeMap: Record<string, { paise: number; count: number }> = {};
  for (const item of agg) {
    typeMap[item._id] = { paise: item.totalPaise, count: item.count };
    console.log(`- ${item._id}: ₹${(item.totalPaise / 100).toLocaleString()} (${item.count} movements)`);
  }

  const openingPaise = typeMap['OPENING_BALANCE']?.paise || 0;
  const cashIncomePaise = typeMap['CASH_INCOME_ASSIGNED']?.paise || 0;
  const bankWithdrawalPaise = typeMap['BANK_WITHDRAWAL']?.paise || 0;
  const bankDepositPaise = typeMap['BANK_DEPOSIT']?.paise || 0;
  const cashExpensePaise = typeMap['CASH_EXPENSE']?.paise || 0;
  const handoverPaise = typeMap['PARTNER_HANDOVER']?.paise || 0;

  const totalInflowPaise = openingPaise + cashIncomePaise + bankWithdrawalPaise;
  const totalOutflowPaise = bankDepositPaise + cashExpensePaise;
  const currentPhysicalCashPaise = totalInflowPaise - totalOutflowPaise;

  const overview = await cashCustodyService.getCashCustodyOverview();

  console.log('\n====================================================');
  console.log('PHYSICAL CASH IN HAND RECONCILIATION:');
  console.log('====================================================');
  console.log(`1. Total Baseline Opening Cash: ₹${(openingPaise / 100).toLocaleString()}`);
  console.log(`2. Total Cash Income Assigned (+): ₹${(cashIncomePaise / 100).toLocaleString()}`);
  console.log(`3. Total Bank Withdrawals into Cash (+): ₹${(bankWithdrawalPaise / 100).toLocaleString()}`);
  console.log(`   -> Total Cash Inflows: ₹${(totalInflowPaise / 100).toLocaleString()}`);
  console.log(`4. Total Cash Deposited into Bank (-): ₹${(bankDepositPaise / 100).toLocaleString()}`);
  console.log(`5. Total Cash Expenses Paid (-): ₹${(cashExpensePaise / 100).toLocaleString()}`);
  console.log(`   -> Total Cash Outflows: ₹${(totalOutflowPaise / 100).toLocaleString()}`);
  console.log(`6. Current Physical Cash in Hand: ₹${(currentPhysicalCashPaise / 100).toLocaleString()}`);
  console.log(`   (Confirmed from cashCustodyService: ₹${overview.totalBusinessCashInHand.toLocaleString()})`);

  console.log('\n====================================================');
  console.log('EXACT EXPLANATION OF THE DIFFERENCE:');
  console.log('====================================================');
  const diffPaise = openingPaise - currentPhysicalCashPaise;
  console.log(`Opening Cash (₹${(openingPaise / 100).toLocaleString()}) - Current Physical Cash (₹${(currentPhysicalCashPaise / 100).toLocaleString()})`);
  console.log(`= Difference: ₹${(diffPaise / 100).toLocaleString()}`);
  console.log('\nMathematical breakdown:');
  console.log(`Difference = (Bank Deposits + Cash Expenses) - (Cash Income Assigned + Bank Withdrawals)`);
  console.log(`           = (₹${(bankDepositPaise / 100).toLocaleString()} + ₹${(cashExpensePaise / 100).toLocaleString()}) - (₹${(cashIncomePaise / 100).toLocaleString()} + ₹${(bankWithdrawalPaise / 100).toLocaleString()})`);
  console.log(`           = ₹${((bankDepositPaise + cashExpensePaise) / 100).toLocaleString()} - ₹${((cashIncomePaise + bankWithdrawalPaise) / 100).toLocaleString()}`);
  console.log(`           = ₹${(diffPaise / 100).toLocaleString()}`);

  // List all bank deposits and cash expenses that contributed to this outflow
  console.log('\nDetailed Outflow Movements:');
  const outflows = await CashMovement.find({
    isDeleted: false,
    movementType: { $in: ['BANK_DEPOSIT', 'CASH_EXPENSE'] },
  }).sort({ movementDate: 1 });
  for (const o of outflows) {
    console.log(`  - [${o.movementType}] Date: ${o.movementDate.toISOString().split('T')[0]}, Amount: ₹${o.amount.toLocaleString()}, Desc: "${o.description}"`);
  }

  console.log('\nDetailed Inflow Movements (excluding opening balance):');
  const inflows = await CashMovement.find({
    isDeleted: false,
    movementType: { $in: ['CASH_INCOME_ASSIGNED', 'BANK_WITHDRAWAL'] },
  }).sort({ movementDate: 1 });
  for (const inf of inflows) {
    console.log(`  - [${inf.movementType}] Date: ${inf.movementDate.toISOString().split('T')[0]}, Amount: ₹${inf.amount.toLocaleString()}, Desc: "${inf.description}"`);
  }

  await mongoose.disconnect();
}

explainCashDifference().catch(err => {
  console.error(err);
  process.exit(1);
});
