import mongoose from 'mongoose';
import { env } from '../config/env';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';
import { Partner } from '../modules/partners/partner.model';
import { accountService } from '../modules/accounts/account.service';
import { cashCustodyService } from '../modules/cashCustody/cashCustody.service';

async function inspectOpeningBalances() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to DB');

  const openingMovements = await CashMovement.find({
    isDeleted: false,
    movementType: 'OPENING_BALANCE',
  }).populate('toPartner', 'name');

  console.log(`Total Non-Deleted OPENING_BALANCE Movements: ${openingMovements.length}`);
  let sumRupees = 0;
  for (const m of openingMovements) {
    const toName = (m.toPartner as any)?.name || m.toPartner || 'Unassigned';
    console.log(`- ID: ${m._id}, Date: ${m.movementDate.toISOString().split('T')[0]}, Amount: ₹${m.amount.toLocaleString()} (${m.amountPaise} paise), To: "${toName}", Desc: "${m.description}"`);
    sumRupees += m.amount;
  }

  console.log(`\nTotal Baseline Opening Cash Sum: ₹${sumRupees.toLocaleString()} (${sumRupees * 100} paise)`);

  const summary = await accountService.getOverallFinancialSummary();
  const overview = await cashCustodyService.getCashCustodyOverview();

  console.log(`\nFinancial Reconciliation Analysis:`);
  console.log(`1. Common Business Ledger Balance (Operating Surplus from Transactions): ₹${summary.commonBusinessBalance.toLocaleString()}`);
  console.log(`   Formula: Total Income (₹${summary.totalBusinessIncome.toLocaleString()}) + Partner Capital Injected (₹${summary.totalPartnerContributions.toLocaleString()}) - Common Expenses (₹${summary.commonAccountExpenses.toLocaleString()})`);
  console.log(`2. Baseline Opening Cash (Existing Cash Prior to Software Inception): ₹${sumRupees.toLocaleString()}`);
  console.log(`3. Total Business Liquid Funds (Available Funds = Opening Cash + Ledger Surplus): ₹${overview.commonBusinessTotalBalance.toLocaleString()}`);
  console.log(`   Calculation: ₹${sumRupees.toLocaleString()} + ₹${summary.commonBusinessBalance.toLocaleString()} = ₹${(sumRupees + summary.commonBusinessBalance).toLocaleString()}`);
  console.log(`   Difference (Total Liquid Funds - Ledger Balance): ₹${(overview.commonBusinessTotalBalance - summary.commonBusinessBalance).toLocaleString()}`);

  console.log(`4. Physical Cash vs Bank Breakdown:`);
  console.log(`   • Physical Cash in Hand (Held by 3 Partners): ₹${overview.totalBusinessCashInHand.toLocaleString()}`);
  for (const p of overview.partners) {
    console.log(`     - ${p.partnerName}: ₹${p.cashInHand.toLocaleString()}`);
  }
  console.log(`   • Common Business Bank Balance: ₹${overview.commonBusinessBankBalance.toLocaleString()}`);
  console.log(`   • Sum Check: Bank (₹${overview.commonBusinessBankBalance.toLocaleString()}) + Cash in Hand (₹${overview.totalBusinessCashInHand.toLocaleString()}) = ₹${(overview.commonBusinessBankBalance + overview.totalBusinessCashInHand).toLocaleString()}`);

  await mongoose.disconnect();
}

inspectOpeningBalances().catch((err) => {
  console.error(err);
  process.exit(1);
});
