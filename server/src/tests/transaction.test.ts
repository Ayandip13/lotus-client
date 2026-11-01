import assert from 'assert';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Partner } from '../modules/partners/partner.model';
import { Event } from '../modules/events/event.model';
import { Transaction } from '../modules/transactions/transaction.model';
import { transactionService } from '../modules/transactions/transaction.service';
import { accountService } from '../modules/accounts/account.service';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '../modules/transactions/transaction.schema';
import { storageService } from '../services/storage';
import { BadRequestError, NotFoundError } from '../utils/appError';

const runTransactionTests = async () => {
  console.log('====================================================');
  console.log('🧪 Starting Phase 4 Centralized Ledger & Accounting Test Suite');
  console.log('====================================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      testsPassed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message || err}`);
      testsFailed++;
    }
  };

  try {
    await connectDatabase();

    // 1. Setup / Resolve 3 Test Partners
    let partners = await Partner.find({ status: 'ACTIVE' }).limit(3);
    if (partners.length < 3) {
      const p1 = await Partner.create({ name: 'Ledger Partner 1' });
      const p2 = await Partner.create({ name: 'Ledger Partner 2' });
      const p3 = await Partner.create({ name: 'Ledger Partner 3' });
      partners = [p1, p2, p3];
    }

    const partner1 = partners[0];
    const partner2 = partners[1];
    const partner3 = partners[2];

    // Create a test event for transaction association
    const testEvent = await Event.create({
      title: 'Ledger Test Event Banquet',
      eventDate: new Date('2026-12-31'),
      guestName: 'Somnath Sen',
      guestPhone: '9830099999',
      createdByPartner: partner1._id,
    });

    const createdTxIds: string[] = [];

    // --- 1. Business Income Creation ---
    await test('Create Transaction: records BUSINESS_INCOME with common business destination', async () => {
      const incomeTx = await transactionService.createTransaction(partner1._id, {
        transactionType: 'BUSINESS_INCOME',
        amount: 50000,
        transactionDate: '2026-11-01T10:00:00.000Z',
        description: 'Advance payment for New Year Banquet',
        paymentSource: 'COMMON_BUSINESS',
        relatedEvent: testEvent._id.toString(),
      });

      assert(incomeTx._id, 'Income transaction should have an _id');
      assert.strictEqual(incomeTx.amount, 50000);
      assert.strictEqual(incomeTx.amountPaise, 5000000, 'amountPaise must be exact integer');
      assert.strictEqual(incomeTx.paymentSource, 'COMMON_BUSINESS');
      assert.strictEqual(incomeTx.transactionType, 'BUSINESS_INCOME');
      createdTxIds.push(incomeTx._id.toString());
    });

    // --- 2. Partner Contribution Creation ---
    await test('Create Transaction: records PARTNER_CONTRIBUTION from partner into common account', async () => {
      const contributionTx = await transactionService.createTransaction(partner1._id, {
        transactionType: 'PARTNER_CONTRIBUTION',
        amount: 25000,
        transactionDate: '2026-11-01T11:00:00.000Z',
        description: 'Capital contribution by Partner 2 for kitchen equipment',
        paymentSource: 'COMMON_BUSINESS',
        partner: partner2._id.toString(),
      });

      assert.strictEqual(contributionTx.amount, 25000);
      assert.strictEqual(contributionTx.amountPaise, 2500000);
      assert.strictEqual(
        (contributionTx.partner as any)._id?.toString() || contributionTx.partner?.toString(),
        partner2._id.toString()
      );
      createdTxIds.push(contributionTx._id.toString());
    });

    // --- 3. Partner Contribution Validation: Requires Partner ---
    await test('Validation: rejects PARTNER_CONTRIBUTION if contributing partner is omitted', async () => {
      assert.throws(() => {
        createTransactionSchema.parse({
          transactionType: 'PARTNER_CONTRIBUTION',
          amount: 10000,
          transactionDate: '2026-11-01T11:00:00.000Z',
          description: 'Contribution missing partner',
        });
      }, /Contributing partner must be identified/);
    });

    // --- 4. Common Business Expense Creation ---
    await test('Create Transaction: records BUSINESS_EXPENSE paid from COMMON_BUSINESS', async () => {
      const commonExpenseTx = await transactionService.createTransaction(partner1._id, {
        transactionType: 'BUSINESS_EXPENSE',
        amount: 15000,
        transactionDate: '2026-11-01T14:00:00.000Z',
        description: 'Raw groceries and spices purchase',
        paymentSource: 'COMMON_BUSINESS',
        relatedEvent: testEvent._id.toString(),
      });

      assert.strictEqual(commonExpenseTx.amount, 15000);
      assert.strictEqual(commonExpenseTx.paymentSource, 'COMMON_BUSINESS');
      createdTxIds.push(commonExpenseTx._id.toString());
    });

    // --- 5. Partner Personally Paid Expense Creation ---
    await test('Create Transaction: records BUSINESS_EXPENSE paid by PARTNER_PERSONAL (identifying partner)', async () => {
      const personalExpenseTx = await transactionService.createTransaction(partner1._id, {
        transactionType: 'BUSINESS_EXPENSE',
        amount: 8000,
        transactionDate: '2026-11-01T15:00:00.000Z',
        description: 'Emergency fuel & transport paid personally by Partner 3',
        paymentSource: 'PARTNER_PERSONAL',
        partner: partner3._id.toString(),
        relatedEvent: testEvent._id.toString(),
      });

      assert.strictEqual(personalExpenseTx.amount, 8000);
      assert.strictEqual(personalExpenseTx.paymentSource, 'PARTNER_PERSONAL');
      assert.strictEqual(
        (personalExpenseTx.partner as any)._id?.toString() || personalExpenseTx.partner?.toString(),
        partner3._id.toString()
      );
      createdTxIds.push(personalExpenseTx._id.toString());
    });

    // --- 6. Personal Expense Validation: Requires Partner ---
    await test('Validation: rejects PARTNER_PERSONAL expense if paying partner is omitted', async () => {
      assert.throws(() => {
        createTransactionSchema.parse({
          transactionType: 'BUSINESS_EXPENSE',
          amount: 5000,
          transactionDate: '2026-11-01T15:00:00.000Z',
          description: 'Personal expense without paying partner',
          paymentSource: 'PARTNER_PERSONAL',
        });
      }, /Paying partner must be identified/);
    });

    // --- 7. Accounting Calculation: Formulas & Boundaries ---
    await test('Accounting Calculations: verifies exact mathematical balance and separation of funds', async () => {
      const summary = await accountService.getOverallFinancialSummary();

      // In our test state:
      // Income: 50,000
      // Partner Contributions: 25,000
      // Common Expenses: 15,000
      // Partner Paid Expenses: 8,000
      // Total Business Expenses: 15,000 + 8,000 = 23,000
      // Common Business Balance = Income (50k) + Contributions (25k) - Common Expenses (15k) = 60,000
      // (Partner personal expense of 8k must NOT reduce common business cash!)

      assert(summary.totalBusinessIncome >= 50000, 'Income must include 50k');
      assert(summary.totalPartnerContributions >= 25000, 'Contributions must include 25k');
      assert(summary.commonAccountExpenses >= 15000, 'Common expenses must include 15k');
      assert(summary.partnerPersonallyPaidExpenses >= 8000, 'Partner paid expenses must include 8k');
      assert(
        summary.totalBusinessExpenses >= 23000,
        'Total business expenses must equal sum of common + personal'
      );

      // Verify the crucial provisional rule:
      // Common Business Balance = Total Income + Total Contributions - Common Account Expenses
      const expectedBalance =
        summary.totalBusinessIncome +
        summary.totalPartnerContributions -
        summary.commonAccountExpenses;
      assert.strictEqual(
        summary.commonBusinessBalance,
        expectedBalance,
        'Common business balance formula must hold exactly'
      );
    });

    // --- 8. Partner-wise Financial Summaries ---
    await test('Partner-wise Summary: tracks contributions and personal expenses per partner', async () => {
      const summaries = await accountService.getPartnerWiseSummaries();

      // Partner 2 contributed 25,000
      const p2Summary = summaries.find((s) => s.partnerId === partner2._id.toString());
      assert(p2Summary, 'Partner 2 summary should exist');
      assert(p2Summary.totalContributions >= 25000, 'Partner 2 contributions should reflect 25k');

      // Partner 3 paid 8,000 personally
      const p3Summary = summaries.find((s) => s.partnerId === partner3._id.toString());
      assert(p3Summary, 'Partner 3 summary should exist');
      assert(
        p3Summary.totalPersonallyPaidExpenses >= 8000,
        'Partner 3 personally paid expenses should reflect 8k'
      );
    });

    // --- 9. Date-wise Expense History ---
    await test('Date-wise History: aggregates transactions and calculates total expenses for selected date', async () => {
      const result = await accountService.getDateWiseFinancialHistory('2026-11-01');

      assert.strictEqual(result.targetDate, '2026-11-01');
      assert(result.totalTransactions >= 4, 'Should contain at least the 4 test transactions');
      assert(result.totalExpenses >= 23000, 'Total expenses for date should include 15k + 8k');
      assert(result.commonAccountExpenses >= 15000);
      assert(result.partnerPaidExpenses >= 8000);
      assert(result.totalIncome >= 50000);
      assert(result.totalContributions >= 25000);
    });

    // --- 10. Attachment Handling & Storage Abstraction ---
    await test('Storage Service: uploads bill attachment and associates with transaction', async () => {
      const fakeBuffer = Buffer.from('FAKE_RECEIPT_IMAGE_DATA_BYTES');
      const uploadResult = await storageService.uploadFile(
        {
          buffer: fakeBuffer,
          originalname: 'vegetables_receipt.jpg',
          mimetype: 'image/jpeg',
          size: fakeBuffer.length,
        },
        'receipts'
      );

      assert(uploadResult.url, 'Upload result must provide a url');
      assert(uploadResult.publicId, 'Upload result must provide a publicId');
      assert.strictEqual(uploadResult.mimeType, 'image/jpeg');

      // Clean up file
      await storageService.deleteFile(uploadResult.publicId);
    });

    // --- 11. Soft-Delete & Audit Integrity ---
    await test('Delete Transaction: soft-deletes and excludes from financial calculations', async () => {
      const txToDelete = await transactionService.createTransaction(partner1._id, {
        transactionType: 'BUSINESS_EXPENSE',
        amount: 2000,
        transactionDate: '2026-11-01T16:00:00.000Z',
        description: 'Temporary expense to be deleted',
        paymentSource: 'COMMON_BUSINESS',
      });

      const beforeSummary = await accountService.getOverallFinancialSummary();

      // Soft delete
      await transactionService.deleteTransaction(txToDelete._id.toString(), partner2._id);

      const afterSummary = await accountService.getOverallFinancialSummary();

      // Total common expenses after deletion should decrease by exactly 2,000
      assert.strictEqual(
        Math.round((beforeSummary.commonAccountExpenses - afterSummary.commonAccountExpenses) * 100) /
          100,
        2000,
        'Deleted transaction must be cleanly excluded from financial totals'
      );

      // Verify raw doc in DB retains soft delete audit stamp
      const rawDoc = await Transaction.findById(txToDelete._id);
      assert(rawDoc?.isDeleted);
      assert.strictEqual(rawDoc.deletedByPartner?.toString(), partner2._id.toString());

      // Clean up
      await Transaction.findByIdAndDelete(txToDelete._id);
    });

    // Clean up test event and transactions
    for (const id of createdTxIds) {
      await Transaction.findByIdAndDelete(id);
    }
    await Event.findByIdAndDelete(testEvent._id);

  } finally {
    await disconnectDatabase();
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 4 Ledger Test Suite Completed: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('====================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
};

runTransactionTests();
