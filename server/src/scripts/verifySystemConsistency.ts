import mongoose from 'mongoose';
import assert from 'assert';
import { env } from '../config/env';
import { Partner } from '../modules/partners/partner.model';
import { User } from '../modules/auth/user.model';
import { dashboardService } from '../modules/dashboard/dashboard.service';
import { accountService } from '../modules/accounts/account.service';
import { cashCustodyService } from '../modules/cashCustody/cashCustody.service';
import { invoiceService } from '../modules/invoices/invoice.service';
import { vendorService } from '../modules/vendors/vendor.service';

async function verifyConsistency() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('====================================================');
  console.log('🔍 Comprehensive System Consistency Verification');
  console.log('====================================================\n');

  // 1. Check Partners Count
  const partners = await Partner.find({});
  const activePartners = await Partner.find({ status: 'ACTIVE' });
  const users = await User.find({});

  console.log(`1. PARTNER ACCOUNTS CHECK:`);
  console.log(`   Total Partners in DB: ${partners.length}`);
  console.log(`   Active Partners in DB: ${activePartners.length}`);
  console.log(`   Total Users in DB: ${users.length}`);

  assert.strictEqual(partners.length, 3, 'There must be exactly 3 partner records in the database');
  assert.strictEqual(activePartners.length, 3, 'There must be exactly 3 active partners');
  assert.strictEqual(users.length, 3, 'There must be exactly 3 user records');

  for (const p of activePartners) {
    const user = await User.findOne({ partner: p._id });
    assert.ok(user, `Partner ${p.name} must have a linked user account`);
    console.log(`   - Partner "${p.name}" (ID: ${p._id}) <-> User "${user.username}" (Email: ${p.email}, Phone: ${p.phone})`);
  }
  console.log('   ✅ PASS: Exactly 3 canonical partners with 1-to-1 user credentials.\n');

  // 2. Fetch Aggregations
  console.log(`2. FINANCIAL BALANCES & REPORTS AGGREGATION:`);
  const [
    dashboard,
    financialSummary,
    partnerSummaries,
    cashOverview,
    customerDues,
    vendorDues,
  ] = await Promise.all([
    dashboardService.getDashboardData(),
    accountService.getOverallFinancialSummary(),
    accountService.getPartnerWiseSummaries(),
    cashCustodyService.getCashCustodyOverview(),
    invoiceService.getCustomerDues(),
    vendorService.getVendorDues(),
  ]);

  console.log(`   • Total Business Income: ₹${financialSummary.totalBusinessIncome.toLocaleString()}`);
  console.log(`   • Total Business Expenses: ₹${financialSummary.totalBusinessExpenses.toLocaleString()}`);
  console.log(`   • Total Partner Contributions: ₹${financialSummary.totalPartnerContributions.toLocaleString()}`);
  console.log(`   • Common Business Balance (Ledger): ₹${financialSummary.commonBusinessBalance.toLocaleString()}`);
  console.log(`   • Total Business Cash In Hand: ₹${cashOverview.totalBusinessCashInHand.toLocaleString()}`);
  console.log(`   • Common Business Bank Balance: ₹${cashOverview.commonBusinessBankBalance.toLocaleString()}`);
  console.log(`   • Common Business Total Balance (Liquid Funds): ₹${cashOverview.commonBusinessTotalBalance.toLocaleString()}`);
  console.log(`   • Total Customer Dues Outstanding: ₹${customerDues.totalCustomerDue.toLocaleString()}`);
  console.log(`   • Total Vendor Dues Outstanding: ₹${vendorDues.totalVendorDue.toLocaleString()}`);

  // 3. Cross-Check Dashboard Consistency
  console.log(`\n3. CROSS-SYSTEM RECONCILIATION CHECKS:`);

  // Dashboard Income vs Ledger Income
  assert.strictEqual(
    dashboard.financialOverview.totalBusinessIncome,
    financialSummary.totalBusinessIncome,
    'Dashboard income must match ledger income'
  );
  console.log('   ✅ Income: Dashboard matches Centralized Ledger.');

  // Dashboard Expenses vs Ledger Expenses
  assert.strictEqual(
    dashboard.financialOverview.totalBusinessExpenses,
    financialSummary.totalBusinessExpenses,
    'Dashboard expenses must match ledger expenses'
  );
  console.log('   ✅ Expenses: Dashboard matches Centralized Ledger.');

  // Dashboard Bank Balance vs Cash Custody Bank Balance
  assert.strictEqual(
    dashboard.financialOverview.commonBusinessBankBalance,
    cashOverview.commonBusinessBankBalance,
    'Dashboard bank balance must match cash custody bank balance'
  );
  console.log('   ✅ Bank Balance: Dashboard matches Cash Custody Overview.');

  // Dashboard Cash In Hand vs Cash Custody Total Cash
  assert.strictEqual(
    dashboard.financialOverview.totalBusinessCashInHand,
    cashOverview.totalBusinessCashInHand,
    'Dashboard cash in hand must match custody cash in hand'
  );
  console.log('   ✅ Cash In Hand: Dashboard matches Cash Custody Overview.');

  // Customer Dues match
  assert.strictEqual(
    dashboard.financialOverview.totalCustomerDue,
    customerDues.totalCustomerDue,
    'Dashboard customer dues must match customer dues service'
  );
  console.log('   ✅ Customer Dues: Dashboard matches Customer Dues summary.');

  // Vendor Dues match
  assert.strictEqual(
    dashboard.financialOverview.totalVendorDue,
    vendorDues.totalVendorDue,
    'Dashboard vendor dues must match vendor dues service'
  );
  console.log('   ✅ Vendor Dues: Dashboard matches Vendor Dues summary.');

  // Partner Count in Cash Custody
  assert.strictEqual(cashOverview.partners.length, 3, 'Cash custody must contain exactly 3 partner profiles');
  assert.strictEqual(partnerSummaries.length, 3, 'Partner summaries must contain exactly 3 partner profiles');
  console.log('   ✅ Profiles: Cash custody and partner accounts contain exactly 3 canonical profiles.');

  // Partner Physical Cash In Hand Sum Reconciles Exactly
  const sumOfPartnerCash = Math.round(
    cashOverview.partners.reduce((acc, p) => acc + p.cashInHand, 0) * 100
  ) / 100;
  assert.strictEqual(
    sumOfPartnerCash,
    cashOverview.totalBusinessCashInHand,
    'Sum of individual partner cash must equal totalBusinessCashInHand'
  );
  console.log(`   ✅ Partner Cash Sum: ₹${sumOfPartnerCash.toLocaleString()} matches total business cash in hand.`);

  // Bank + Physical Cash = Total Business Liquid Funds
  const liquidFundsReconciliation = Math.round(
    (cashOverview.commonBusinessBankBalance + cashOverview.totalBusinessCashInHand) * 100
  ) / 100;
  assert.strictEqual(
    liquidFundsReconciliation,
    cashOverview.commonBusinessTotalBalance,
    'Bank balance + physical cash in hand must exactly equal total business liquid funds'
  );
  console.log(`   ✅ Liquid Funds: Bank (₹${cashOverview.commonBusinessBankBalance}) + Cash (₹${cashOverview.totalBusinessCashInHand}) = Total Funds (₹${cashOverview.commonBusinessTotalBalance}).`);

  console.log('\n====================================================');
  console.log('🎉 ALL 10 RECONCILIATION & CONSISTENCY CHECKS PASSED!');
  console.log('====================================================');

  await mongoose.disconnect();
}

verifyConsistency().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
