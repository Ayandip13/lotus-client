import assert from 'assert';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Partner } from '../modules/partners/partner.model';
import { Event } from '../modules/events/event.model';
import { invoiceService } from '../modules/invoices/invoice.service';
import { vendorService } from '../modules/vendors/vendor.service';
import { cashCustodyService } from '../modules/cashCustody/cashCustody.service';
import { transactionService } from '../modules/transactions/transaction.service';
import { accountService } from '../modules/accounts/account.service';
import { Transaction } from '../modules/transactions/transaction.model';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';
import { Invoice } from '../modules/invoices/invoice.model';
import { Vendor } from '../modules/vendors/vendor.model';
import { VendorBill } from '../modules/vendors/vendorBill.model';

const runPhase5AuditTests = async () => {
  console.log('====================================================');
  console.log('🛡️ Starting Phase 5 Comprehensive Accounting Consistency & Audit Suite');
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

  let testEvent: any;
  let testVendor: any;
  const createdCashMovementIds: any[] = [];
  const origRecordCashMovement = cashCustodyService.recordCashMovement.bind(cashCustodyService);

  try {
    await connectDatabase();

    // Auto-capture any cash movement created in tests for guaranteed teardown
    cashCustodyService.recordCashMovement = async (...args: any[]) => {
      const result = await (origRecordCashMovement as any)(...args);
      if (result && result._id) {
        createdCashMovementIds.push(result._id);
      }
      return result;
    };

    // 1. Resolve / Ensure 3 active partners
    let partners = await Partner.find({ status: 'ACTIVE' }).limit(3);
    if (partners.length < 3) {
      const timestamp = Date.now();
      const p1 = await Partner.create({ name: 'Audit Partner 1', email: `ap1_${timestamp}@lotus.com`, phone: '9830000001' });
      const p2 = await Partner.create({ name: 'Audit Partner 2', email: `ap2_${timestamp}@lotus.com`, phone: '9830000002' });
      const p3 = await Partner.create({ name: 'Audit Partner 3', email: `ap3_${timestamp}@lotus.com`, phone: '9830000003' });
      partners = [p1, p2, p3];
    }

    const partner1 = partners[0];
    const partner2 = partners[1];
    const partner3 = partners[2];

    testEvent = await Event.create({
      title: 'Audit Multi-Partner Grand Event',
      eventDate: new Date(Date.now() + 86400000 * 3),
      guestName: 'Audit Client',
      guestPhone: '9830099999',
      createdByPartner: partner1._id,
      isDeleted: false,
    });

    // ------------------------------------------------------------------------
    // AUDIT CHECK 2: OPENING BALANCE CLASSIFICATION & RECONCILIATION
    // ------------------------------------------------------------------------

    const initialOverview = await cashCustodyService.getCashCustodyOverview();
    const p1Init = initialOverview.partners.find((p) => p.partnerId === partner1._id.toString())?.cashInHand || 0;
    const p2Init = initialOverview.partners.find((p) => p.partnerId === partner2._id.toString())?.cashInHand || 0;
    const p3Init = initialOverview.partners.find((p) => p.partnerId === partner3._id.toString())?.cashInHand || 0;

    await test('Opening Balance: Assign baseline physical cash without inflating revenue or partner contributions', async () => {
      const initialSummary = await accountService.getOverallFinancialSummary();

      const move = await cashCustodyService.recordCashMovement(partner1._id, {
        movementType: 'OPENING_BALANCE',
        amount: 50000,
        toPartner: partner1._id.toString(),
        description: `Audit Opening Cash Reserve (Ref: OPENING-${Date.now()})`,
      });

      assert.strictEqual(move.amount, 50000);
      assert.strictEqual(move.movementType, 'OPENING_BALANCE');
      assert.strictEqual(move.toPartner?.toString(), partner1._id.toString());

      // Verify that OPENING_BALANCE does NOT create a ledger transaction
      const syncTx = await Transaction.findOne({ relatedCashMovement: move._id });
      assert.strictEqual(syncTx, null, 'OPENING_BALANCE represents existing business cash baseline, NOT a new ledger transaction');

      // Verify that partner contributions and business income are NOT inflated
      const afterSummary = await accountService.getOverallFinancialSummary();
      assert.strictEqual(
        afterSummary.totalPartnerContributions,
        initialSummary.totalPartnerContributions,
        'Opening cash must not inflate partner contributions'
      );
      assert.strictEqual(
        afterSummary.totalBusinessIncome,
        initialSummary.totalBusinessIncome,
        'Opening cash must not inflate business income'
      );

      // Verify bank & cash reconciliation
      const overview = await cashCustodyService.getCashCustodyOverview();
      const reconciledSum = Math.round((overview.commonBusinessBankBalance + overview.totalBusinessCashInHand) * 100) / 100;
      assert.strictEqual(
        reconciledSum,
        overview.commonBusinessTotalBalance,
        'Bank balance + Cash in Hand must exactly equal Common Business Total Balance'
      );
    });

    await test('Cash Custody: Partner 1 hands over 20,000 cash to Partner 2', async () => {
      const move = await cashCustodyService.recordCashMovement(partner1._id, {
        movementType: 'PARTNER_HANDOVER',
        amount: 20000,
        fromPartner: partner1._id.toString(),
        toPartner: partner2._id.toString(),
        description: `Audit Cash Handover P1 -> P2 (Ref: HO1-${Date.now()})`,
      });

      assert.strictEqual(move.amount, 20000);
      assert.strictEqual(move.movementType, 'PARTNER_HANDOVER');
    });

    await test('Cash Custody: Partner 2 hands over 10,000 cash to Partner 3', async () => {
      const move = await cashCustodyService.recordCashMovement(partner2._id, {
        movementType: 'PARTNER_HANDOVER',
        amount: 10000,
        fromPartner: partner2._id.toString(),
        toPartner: partner3._id.toString(),
        description: `Audit Cash Handover P2 -> P3 (Ref: HO2-${Date.now()})`,
      });

      assert.strictEqual(move.amount, 10000);
    });

    await test('Cash Custody: Partner 3 deposits 5,000 into Bank', async () => {
      const move = await cashCustodyService.recordCashMovement(partner3._id, {
        movementType: 'BANK_DEPOSIT',
        amount: 5000,
        fromPartner: partner3._id.toString(),
        description: `Audit Bank Deposit by P3 (Ref: DEP-${Date.now()})`,
      });

      assert.strictEqual(move.amount, 5000);
      assert.strictEqual(move.movementType, 'BANK_DEPOSIT');
    });

    await test('Cash Custody: Partner 1 withdraws 2,000 from Bank', async () => {
      const move = await cashCustodyService.recordCashMovement(partner1._id, {
        movementType: 'BANK_WITHDRAWAL',
        amount: 2000,
        toPartner: partner1._id.toString(),
        description: `Audit Bank Withdrawal by P1 (Ref: WTH-${Date.now()})`,
      });

      assert.strictEqual(move.amount, 2000);
      assert.strictEqual(move.movementType, 'BANK_WITHDRAWAL');
    });

    await test('Cash Custody: Partner 2 spends 3,000 cash for Event Expense and verify ledger sync', async () => {
      const move = await cashCustodyService.recordCashMovement(partner2._id, {
        movementType: 'CASH_EXPENSE',
        amount: 3000,
        fromPartner: partner2._id.toString(),
        relatedEvent: testEvent._id.toString(),
        description: `Audit Cash Expense by P2 for Flowers (Ref: EXP-${Date.now()})`,
      });

      assert.strictEqual(move.amount, 3000);
      assert.strictEqual(move.movementType, 'CASH_EXPENSE');

      // Verify that this movement created a matching BUSINESS_EXPENSE in ledger
      const syncTx = await Transaction.findOne({ relatedCashMovement: move._id });
      assert.ok(syncTx, 'Ledger transaction should be automatically created for CASH_EXPENSE');
      assert.strictEqual(syncTx.amount, 3000);
      assert.strictEqual(syncTx.transactionType, 'BUSINESS_EXPENSE');
      assert.strictEqual(syncTx.paymentSource, 'COMMON_BUSINESS');
    });

    await test('Cash Custody: Verify exact balances across all 3 partners after complete lifecycle', async () => {
      const overview = await cashCustodyService.getCashCustodyOverview();
      const p1Current = overview.partners.find((p) => p.partnerId === partner1._id.toString())?.cashInHand || 0;
      const p2Current = overview.partners.find((p) => p.partnerId === partner2._id.toString())?.cashInHand || 0;
      const p3Current = overview.partners.find((p) => p.partnerId === partner3._id.toString())?.cashInHand || 0;

      // P1: p1Init + 50000 - 20000 + 2000 = p1Init + 32000
      assert.strictEqual(p1Current, p1Init + 32000, `P1 balance expected ${p1Init + 32000}, got ${p1Current}`);

      // P2: p2Init + 20000 - 10000 - 3000 = p2Init + 7000
      assert.strictEqual(p2Current, p2Init + 7000, `P2 balance expected ${p2Init + 7000}, got ${p2Current}`);

      // P3: p3Init + 10000 - 5000 = p3Init + 5000
      assert.strictEqual(p3Current, p3Init + 5000, `P3 balance expected ${p3Init + 5000}, got ${p3Current}`);
    });

    await test('Cash Custody: Negative cash balance prevention', async () => {
      let threw = false;
      try {
        await cashCustodyService.recordCashMovement(partner3._id, {
          movementType: 'PARTNER_HANDOVER',
          amount: 999999999, // Impossible amount
          fromPartner: partner3._id.toString(),
          toPartner: partner1._id.toString(),
          description: 'Excessive Handover Attempt',
        });
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes('Insufficient cash custody'), 'Should reject insufficient cash balance');
      }
      assert.ok(threw, 'Should have thrown error on negative cash balance');
    });

    // ------------------------------------------------------------------------
    // AUDIT CHECK 1: INVOICE PAYMENT & CASH ASSIGNMENT — NO DUPLICATE INCOME
    // ------------------------------------------------------------------------

    await test('Invoice Payment & Cash Assignment: Record cash payment and verify income is counted exactly once', async () => {
      const inv = await invoiceService.createInvoice(partner1._id, {
        invoiceType: 'NON_GST',
        invoiceDate: new Date().toISOString(),
        customerName: 'Audit Cash Income Client',
        customerPhone: '9830088888',
        relatedEvent: testEvent._id.toString(),
        items: [{ description: 'Reception Dinner', quantity: 60, unit: 'plates', rate: 500 }],
      });
      assert.strictEqual(inv.grandTotal, 30000);

      const incomeBefore = (await accountService.getOverallFinancialSummary()).totalBusinessIncome;
      const p1CashBefore = await cashCustodyService.getPartnerCashBalancePaise(partner1._id);

      // Record ₹10,000 cash payment with physical cash assigned to Partner 1
      const updatedInv = await invoiceService.recordPayment(inv._id.toString(), partner1._id, {
        amount: 10000,
        paymentMethod: 'CASH',
        assignCashToPartner: partner1._id.toString(),
        paymentDate: new Date().toISOString(),
        notes: `CASH-INCOME-AUDIT-${Date.now()}`,
      });

      assert.strictEqual(updatedInv.amountPaid, 10000);
      assert.strictEqual(updatedInv.remainingDue, 20000);

      // 1. Exactly ONE transaction exists for this payment in Transaction ledger
      const txCount = await Transaction.countDocuments({ relatedInvoice: inv._id });
      assert.strictEqual(txCount, 1, 'Exactly one ledger transaction must be created for invoice payment');

      const tx = await Transaction.findOne({ relatedInvoice: inv._id });
      assert.strictEqual(tx?.amount, 10000);
      assert.strictEqual(tx?.transactionType, 'BUSINESS_INCOME');

      // 2. Total business income increased by exactly ₹10,000 (not ₹20,000)
      const incomeAfter = (await accountService.getOverallFinancialSummary()).totalBusinessIncome;
      assert.strictEqual(
        incomeAfter - incomeBefore,
        10000,
        'Total business income must increase by exactly the payment amount without duplicate entries'
      );

      // 3. Physical cash custody credited to Partner 1
      const p1CashAfter = await cashCustodyService.getPartnerCashBalancePaise(partner1._id);
      assert.strictEqual(
        p1CashAfter - p1CashBefore,
        1000000,
        'Partner 1 physical cash custody must increase by exactly ₹10,000 in paise'
      );

      // 4. Verify that manual CASH_INCOME_ASSIGNED movement does NOT emit a ledger Transaction
      const manualMove = await cashCustodyService.recordCashMovement(partner1._id, {
        movementType: 'CASH_INCOME_ASSIGNED',
        amount: 4000,
        toPartner: partner1._id.toString(),
        description: 'Manual cash custody assignment from direct customer settlement',
      });
      const manualTx = await Transaction.findOne({ relatedCashMovement: manualMove._id });
      assert.strictEqual(
        manualTx,
        null,
        'CASH_INCOME_ASSIGNED in cashCustodyService must NOT create a duplicate BUSINESS_INCOME ledger record'
      );
    });

    // ------------------------------------------------------------------------
    // AUDIT CHECK 2: LEDGER INTEGRITY & DELETION REJECTION
    // ------------------------------------------------------------------------

    let testInvoice: any;
    let paymentTx: any;

    await test('Billing: Create invoice and record payment with ledger synchronization', async () => {
      testInvoice = await invoiceService.createInvoice(partner1._id, {
        invoiceType: 'NON_GST',
        invoiceDate: new Date().toISOString(),
        customerName: 'Audit Test Customer',
        customerPhone: '9830012345',
        relatedEvent: testEvent._id.toString(),
        items: [
          { description: 'Royal Dinner', quantity: 100, unit: 'plates', rate: 500 },
        ],
      });

      assert.strictEqual(testInvoice.grandTotal, 50000);
      assert.strictEqual(testInvoice.remainingDue, 50000);

      // Record ₹20,000 partial payment
      const updatedInv = await invoiceService.recordPayment(testInvoice._id.toString(), partner1._id, {
        amount: 20000,
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date().toISOString(),
        notes: `REF-AUDIT-${Date.now()}`,
      });

      assert.strictEqual(updatedInv.amountPaid, 20000);
      assert.strictEqual(updatedInv.remainingDue, 30000);
      assert.strictEqual(updatedInv.paymentStatus, 'PARTIALLY_PAID');

      // Find the associated transaction
      paymentTx = await Transaction.findOne({ relatedInvoice: testInvoice._id });
      assert.ok(paymentTx, 'Ledger transaction should be generated for invoice payment');
      assert.strictEqual(paymentTx.amount, 20000);
      assert.strictEqual(paymentTx.transactionType, 'BUSINESS_INCOME');
    });

    await test('Ledger Integrity: Prevent direct deletion of transactions linked to Invoices', async () => {
      let threw = false;
      try {
        await transactionService.deleteTransaction(paymentTx._id.toString(), partner1._id);
      } catch (err: any) {
        threw = true;
        assert.ok(
          err.message.includes('Cannot delete this transaction directly because it is tied to an Invoice payment'),
          'Should prevent direct deletion of invoice payments'
        );
      }
      assert.ok(threw, 'Should have thrown error preventing deletion');

      // Verify transaction is still intact and not soft-deleted
      const checkTx = await Transaction.findById(paymentTx._id);
      assert.strictEqual(checkTx?.isDeleted, false);
    });

    // ------------------------------------------------------------------------
    // AUDIT CHECK 3: IDEMPOTENCY KEY & DUPLICATE PAYMENT PROTECTION
    // ------------------------------------------------------------------------

    await test('Idempotency: Repeated invoice payment with same idempotencyKey is idempotent', async () => {
      const idempKey = `IDEMP-INV-${Date.now()}`;

      // First payment of ₹5,000
      const firstResult = await invoiceService.recordPayment(testInvoice._id.toString(), partner1._id, {
        amount: 5000,
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date().toISOString(),
        notes: 'First attempt with idempotency key',
        idempotencyKey: idempKey,
      });

      const paidAmountFirst = firstResult.amountPaid;
      const paymentsCountFirst = firstResult.payments.length;
      const txCountFirst = await Transaction.countDocuments({ relatedInvoice: testInvoice._id });

      // Immediate retry with the EXACT same idempotencyKey
      const retryResult = await invoiceService.recordPayment(testInvoice._id.toString(), partner1._id, {
        amount: 5000,
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date().toISOString(),
        notes: 'Retry attempt with same idempotency key',
        idempotencyKey: idempKey,
      });

      // Assert identical state - no duplicate charge, no duplicate transaction
      assert.strictEqual(retryResult.amountPaid, paidAmountFirst, 'amountPaid must not increase on idempotent retry');
      assert.strictEqual(retryResult.payments.length, paymentsCountFirst, 'payments array must not grow on idempotent retry');
      const txCountAfterRetry = await Transaction.countDocuments({ relatedInvoice: testInvoice._id });
      assert.strictEqual(txCountAfterRetry, txCountFirst, 'Transaction count must not increase on idempotent retry');

      // Assert that a distinct payment with a new idempotencyKey succeeds
      const secondDistinctKey = `IDEMP-INV-DISTINCT-${Date.now()}`;
      const distinctResult = await invoiceService.recordPayment(testInvoice._id.toString(), partner1._id, {
        amount: 2000,
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date().toISOString(),
        notes: 'Legitimate separate installment',
        idempotencyKey: secondDistinctKey,
      });

      assert.strictEqual(distinctResult.amountPaid, paidAmountFirst + 2000, 'Legitimate separate payment must succeed');
      assert.strictEqual(distinctResult.payments.length, paymentsCountFirst + 1);
    });

    await test('Idempotency & Legitimate Repeat Payments: Distinguishes distinct payments from idempotent retries without unsafe 3s clock', async () => {
      const sameRef = `REPEAT-REF-${Date.now()}`;

      // Payment 1 with its own unique key
      const p1 = await invoiceService.recordPayment(testInvoice._id.toString(), partner1._id, {
        amount: 1000,
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date().toISOString(),
        notes: sameRef,
        idempotencyKey: `KEY-A-${Date.now()}`,
      });

      // Payment 2: Immediate legitimate second payment of identical amount and notes with a distinct key
      const p2 = await invoiceService.recordPayment(testInvoice._id.toString(), partner1._id, {
        amount: 1000,
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date().toISOString(),
        notes: sameRef,
        idempotencyKey: `KEY-B-${Date.now()}`,
      });

      assert.strictEqual(
        p2.amountPaid,
        p1.amountPaid + 1000,
        'Legitimate second payment of identical amount must NOT be rejected by a 3s clock'
      );
      assert.strictEqual(p2.payments.length, p1.payments.length + 1);
    });

    await test('Network Timeout Retry: Reusing the same idempotencyKey never creates a second payment', async () => {
      const stableIdempKey = `TIMEOUT-RETRY-${Date.now()}`;
      const invBefore = await Invoice.findById(testInvoice._id);
      const initialPaid = invBefore?.amountPaid || 0;
      const initialPaymentsCount = invBefore?.payments.length || 0;
      const initialTxCount = await Transaction.countDocuments({ relatedInvoice: testInvoice._id });

      // First attempt (processed by backend, simulated client timeout)
      const firstAttempt = await invoiceService.recordPayment(testInvoice._id.toString(), partner1._id, {
        amount: 1500,
        paymentMethod: 'UPI',
        paymentDate: new Date().toISOString(),
        notes: 'Payment with potential network lag',
        idempotencyKey: stableIdempKey,
      });

      assert.strictEqual(firstAttempt.amountPaid, initialPaid + 1500);

      // Client retry reusing the SAME stable idempotencyKey
      const retryAttempt = await invoiceService.recordPayment(testInvoice._id.toString(), partner1._id, {
        amount: 1500,
        paymentMethod: 'UPI',
        paymentDate: new Date().toISOString(),
        notes: 'Payment with potential network lag',
        idempotencyKey: stableIdempKey,
      });

      assert.strictEqual(retryAttempt.amountPaid, initialPaid + 1500, 'amountPaid must not increase on network timeout retry');
      assert.strictEqual(retryAttempt.payments.length, initialPaymentsCount + 1, 'payments array must only contain 1 payment');
      const txCountAfterRetry = await Transaction.countDocuments({ relatedInvoice: testInvoice._id });
      assert.strictEqual(txCountAfterRetry, initialTxCount + 1, 'Exactly one transaction must exist in ledger');
    });

    await test('Boundary Protection: Reject payment exceeding remaining due on invoice', async () => {
      let threw = false;
      try {
        // Remaining due is less than 30000, try to pay 30000
        await invoiceService.recordPayment(testInvoice._id.toString(), partner1._id, {
          amount: 30000,
          paymentMethod: 'CASH',
          assignCashToPartner: partner1._id.toString(),
          paymentDate: new Date().toISOString(),
          notes: `OVERPAY-${Date.now()}`,
        });
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes('exceeds remaining due'));
      }
      assert.ok(threw, 'Should reject overpayment');
    });

    // ------------------------------------------------------------------------
    // AUDIT CHECK 4: CONCURRENCY-SAFE SEQUENTIAL INVOICE NUMBERING
    // ------------------------------------------------------------------------

    await test('Invoice Numbering: Verify sequential format LC-YYYY-XXXX and collision safety', async () => {
      const year = new Date().getFullYear();
      const currentYearPrefix = new RegExp(`^LC-${year}-\\d{4}$`);

      const [invA, invB] = await Promise.all([
        invoiceService.createInvoice(partner1._id, {
          invoiceType: 'NON_GST',
          invoiceDate: new Date().toISOString(),
          customerName: 'Concurrent Client A',
          customerPhone: '9830011111',
          relatedEvent: testEvent._id.toString(),
          items: [{ description: 'Item A', quantity: 10, unit: 'units', rate: 100 }],
        }),
        invoiceService.createInvoice(partner2._id, {
          invoiceType: 'NON_GST',
          invoiceDate: new Date().toISOString(),
          customerName: 'Concurrent Client B',
          customerPhone: '9830022222',
          relatedEvent: testEvent._id.toString(),
          items: [{ description: 'Item B', quantity: 10, unit: 'units', rate: 100 }],
        }),
      ]);

      assert.ok(currentYearPrefix.test(invA.invoiceNumber), `invA number ${invA.invoiceNumber} should match pattern`);
      assert.ok(currentYearPrefix.test(invB.invoiceNumber), `invB number ${invB.invoiceNumber} should match pattern`);
      assert.notStrictEqual(invA.invoiceNumber, invB.invoiceNumber, 'Sequential numbers must never collide');

      const seqA = parseInt(invA.invoiceNumber.split('-')[2], 10);
      const seqB = parseInt(invB.invoiceNumber.split('-')[2], 10);
      assert.strictEqual(Math.abs(seqA - seqB), 1, 'Invoices created sequentially must have consecutive sequence numbers');
    });

    // ------------------------------------------------------------------------
    // AUDIT CHECK 5: VENDOR BILL IDEMPOTENCY & PROTECTION
    // ------------------------------------------------------------------------

    // testVendor declared in outer scope
    let testBill: any;

    await test('Vendor Due Integrity: Record vendor bill and partial payment with idempotency key', async () => {
      testVendor = await vendorService.createVendor(partner1._id, {
        name: `Audit Vendor ${Date.now()}`,
        phone: `983${Date.now().toString().slice(-7)}`,
        category: 'DECOR_FLORAL',
      });

      testBill = await vendorService.createVendorBill(partner1._id, {
        vendor: testVendor._id.toString(),
        relatedEvent: testEvent._id.toString(),
        billNumber: `VB-AUDIT-${Date.now()}`,
        billDate: new Date().toISOString(),
        description: 'Stage Lighting & Flower Arch',
        totalAmount: 25000,
      });

      assert.strictEqual(testBill.totalAmount, 25000);
      assert.strictEqual(testBill.remainingAmount, 25000);
      assert.strictEqual(testBill.status, 'UNPAID');

      // 1. Partial payment with idempotency key
      const billIdempKey = `IDEMP-VB-${Date.now()}`;
      const firstBillPay = await vendorService.recordBillPayment(testBill._id.toString(), partner1._id, {
        amount: 8000,
        paymentSource: 'COMMON_BUSINESS',
        paidByPartner: partner1._id.toString(),
        deductFromPartnerCash: true,
        paymentDate: new Date().toISOString(),
        notes: 'Initial vendor installment',
        idempotencyKey: billIdempKey,
      });

      assert.strictEqual(firstBillPay.paidAmount, 8000);
      assert.strictEqual(firstBillPay.remainingAmount, 17000);
      assert.strictEqual(firstBillPay.status, 'PARTIALLY_PAID');

      // 2. Retry with same idempotencyKey
      const retryBillPay = await vendorService.recordBillPayment(testBill._id.toString(), partner1._id, {
        amount: 8000,
        paymentSource: 'COMMON_BUSINESS',
        paidByPartner: partner1._id.toString(),
        deductFromPartnerCash: true,
        paymentDate: new Date().toISOString(),
        notes: 'Retry attempt',
        idempotencyKey: billIdempKey,
      });

      assert.strictEqual(retryBillPay.paidAmount, 8000, 'paidAmount must not increase on idempotent retry');
      assert.strictEqual(retryBillPay.paymentHistory.length, 1, 'paymentHistory array must not grow on idempotent retry');
      const billTxCount = await Transaction.countDocuments({ relatedVendorBill: testBill._id });
      assert.strictEqual(billTxCount, 1, 'Transaction count must not duplicate on idempotent retry');

      // 3. Verify vendor bill transaction is protected from direct deletion
      const billTx = await Transaction.findOne({ relatedVendorBill: testBill._id });
      assert.ok(billTx, 'Transaction should exist for vendor bill payment');

      let delThrew = false;
      try {
        await transactionService.deleteTransaction(billTx._id.toString(), partner1._id);
      } catch (err: any) {
        delThrew = true;
        assert.ok(
          err.message.includes('Cannot delete this transaction directly because it is tied to a Vendor Bill payment')
        );
      }
      assert.ok(delThrew, 'Vendor bill transaction must be protected from direct deletion');
    });

    // ------------------------------------------------------------------------
    // AUDIT CHECK 6: COMPENSATING ROLLBACK RELIABILITY
    // ------------------------------------------------------------------------

    await test('Compensating Rollback: Cleanly deletes created transaction & cash movement if invoice save fails', async () => {
      const rollbackInvoice = await invoiceService.createInvoice(partner1._id, {
        invoiceType: 'NON_GST',
        invoiceDate: new Date().toISOString(),
        customerName: 'Rollback Test Client',
        customerPhone: '9830055555',
        relatedEvent: testEvent._id.toString(),
        items: [{ description: 'Test Item', quantity: 1, unit: 'unit', rate: 5000 }],
      });

      const txCountBefore = await Transaction.countDocuments({});
      const cashCountBefore = await CashMovement.countDocuments({});

      // Temporarily mock Invoice.prototype.save to simulate DB failure during invoice save
      const originalSave = Invoice.prototype.save;
      let mockTriggered = false;
      Invoice.prototype.save = async function (this: any, ...args: any[]) {
        if (this._id.toString() === rollbackInvoice._id.toString() && this.payments.length > 0 && !mockTriggered) {
          mockTriggered = true;
          throw new Error('SIMULATED_DB_WRITE_FAILURE_DURING_INVOICE_SAVE');
        }
        return originalSave.apply(this, args);
      };

      let threw = false;
      try {
        await invoiceService.recordPayment(rollbackInvoice._id.toString(), partner1._id, {
          amount: 2000,
          paymentMethod: 'CASH',
          assignCashToPartner: partner1._id.toString(),
          paymentDate: new Date().toISOString(),
          notes: 'Simulate failure',
        });
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes('SIMULATED_DB_WRITE_FAILURE'), 'Should throw simulated failure');
      } finally {
        Invoice.prototype.save = originalSave;
      }

      assert.ok(threw, 'recordPayment should have thrown error on simulated save failure');

      // Verify that compensating rollback deleted the temporary Transaction and CashMovement
      const txCountAfter = await Transaction.countDocuments({});
      const cashCountAfter = await CashMovement.countDocuments({});

      assert.strictEqual(
        txCountAfter,
        txCountBefore,
        'Transaction count must be restored to prior count (no orphaned transaction)'
      );
      assert.strictEqual(
        cashCountAfter,
        cashCountBefore,
        'CashMovement count must be restored to prior count (no orphaned cash movement)'
      );

      // Verify that invoice payment records in DB were NOT committed
      const freshInvoice = await Invoice.findById(rollbackInvoice._id);
      assert.strictEqual(freshInvoice?.payments.length, 0, 'Invoice payments must remain empty after rollback');
      assert.strictEqual(freshInvoice?.amountPaid, 0, 'Invoice amountPaid must remain 0 after rollback');
    });

  } catch (error: any) {
    console.error('Fatal Audit Test Suite Error:', error);
    testsFailed++;
  } finally {
    try {
      cashCustodyService.recordCashMovement = origRecordCashMovement;

      if (testEvent) {
        const testInvoices = await Invoice.find({ relatedEvent: testEvent._id });
        const invoiceIds = testInvoices.map((i) => i._id);
        const testBills = await VendorBill.find({ relatedEvent: testEvent._id });
        const billIds = testBills.map((b) => b._id);

        await Transaction.deleteMany({
          $or: [
            { relatedEvent: testEvent._id },
            { relatedInvoice: { $in: invoiceIds } },
            { relatedVendorBill: { $in: billIds } },
          ],
        });
        await CashMovement.deleteMany({
          $or: [
            { relatedEvent: testEvent._id },
            { relatedInvoice: { $in: invoiceIds } },
          ],
        });
        await Invoice.deleteMany({ relatedEvent: testEvent._id });
        await VendorBill.deleteMany({ relatedEvent: testEvent._id });
        await Event.findByIdAndDelete(testEvent._id);
      }

      if (testVendor) {
        await Vendor.findByIdAndDelete(testVendor._id);
      }

      if (createdCashMovementIds.length > 0) {
        await Transaction.deleteMany({ relatedCashMovement: { $in: createdCashMovementIds } });
        await CashMovement.deleteMany({ _id: { $in: createdCashMovementIds } });
      }
    } catch (cleanupErr) {
      console.warn('Phase 5 audit test cleanup notice:', cleanupErr);
    }
    await disconnectDatabase();
    console.log('\n====================================================');
    console.log(`Phase 5 Audit Test Results: ${testsPassed} Passed, ${testsFailed} Failed`);
    console.log('====================================================');
    if (testsFailed > 0) {
      process.exit(1);
    }
  }
};

runPhase5AuditTests();
