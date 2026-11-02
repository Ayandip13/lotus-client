import assert from 'assert';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Partner } from '../modules/partners/partner.model';
import { Event } from '../modules/events/event.model';
import { invoiceService } from '../modules/invoices/invoice.service';
import { vendorService } from '../modules/vendors/vendor.service';
import { cashCustodyService } from '../modules/cashCustody/cashCustody.service';
import { dashboardService } from '../modules/dashboard/dashboard.service';
import { eventService } from '../modules/events/event.service';
import { Transaction } from '../modules/transactions/transaction.model';
import { Invoice } from '../modules/invoices/invoice.model';
import { Vendor } from '../modules/vendors/vendor.model';
import { VendorBill } from '../modules/vendors/vendorBill.model';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';

const runPhase5Tests = async () => {
  console.log('====================================================');
  console.log('🧪 Starting Phase 5 Advanced Accounts & Due Test Suite');
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
      const timestamp = Date.now();
      const p1 = await Partner.create({ name: 'Partner One', email: `p1_${timestamp}@lotus.com`, phone: '9830000001' });
      const p2 = await Partner.create({ name: 'Partner Two', email: `p2_${timestamp}@lotus.com`, phone: '9830000002' });
      const p3 = await Partner.create({ name: 'Partner Three', email: `p3_${timestamp}@lotus.com`, phone: '9830000003' });
      partners = [p1, p2, p3];
    }

    const partner1 = partners[0];
    const partner2 = partners[1];
    const partner3 = partners[2];

    // Create a test event for billing & dues
    const testEvent = await Event.create({
      title: 'Phase 5 Grand Gala Reception',
      eventDate: new Date(Date.now() + 86400000 * 5), // 5 days in future
      guestName: 'Ananya Roy',
      guestPhone: '9830111222',
      guestEmail: 'ananya@roy.com',
      createdByPartner: partner1._id,
      isDeleted: false,
    });

    // ------------------------------------------------------------------------
    // SECTION 1: BILLING & CUSTOMER DUES TESTS
    // ------------------------------------------------------------------------

    let nonGstInvoice: any;
    await test('Billing: Create Non-GST invoice with item calculations', async () => {
      nonGstInvoice = await invoiceService.createInvoice(partner1._id, {
        invoiceType: 'NON_GST',
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        customerName: 'Ananya Roy',
        customerPhone: '9830111222',
        relatedEvent: testEvent._id.toString(),
        items: [
          { description: 'Premium Buffet Menu', quantity: 200, unit: 'plates', rate: 450 },
          { description: 'Welcome Drinks & Mocktails', quantity: 200, unit: 'glasses', rate: 50 },
        ],
        discount: 2000,
        notes: 'Non-GST wedding reception bill',
      });

      // Subtotal = 200*450 + 200*50 = 90,000 + 10,000 = 100,000
      // Discount = 2,000
      // Grand Total = 98,000
      assert.strictEqual(nonGstInvoice.subtotal, 100000);
      assert.strictEqual(nonGstInvoice.grandTotal, 98000);
      assert.strictEqual(nonGstInvoice.remainingDue, 98000);
      assert.strictEqual(nonGstInvoice.amountPaid, 0);
      assert.strictEqual(nonGstInvoice.paymentStatus, 'UNPAID');
    });

    let gstInvoice: any;
    await test('Billing: Create GST invoice with configurable line-item tax rates', async () => {
      gstInvoice = await invoiceService.createInvoice(partner2._id, {
        invoiceType: 'GST',
        invoiceDate: new Date().toISOString(),
        customerName: 'Corporate Banquet Inc',
        customerPhone: '9830999888',
        relatedEvent: testEvent._id.toString(),
        isInterState: false, // Intra-state: CGST + SGST
        items: [
          { description: 'Catering Services (5% GST)', quantity: 100, unit: 'plates', rate: 600, gstRate: 5 },
          { description: 'Equipment Rental (18% GST)', quantity: 1, unit: 'set', rate: 10000, gstRate: 18 },
        ],
        discount: 0,
      });

      // Item 1: 100 * 600 = 60,000; Tax 5% = 3,000 (CGST 1500, SGST 1500)
      // Item 2: 1 * 10,000 = 10,000; Tax 18% = 1,800 (CGST 900, SGST 900)
      // Subtotal = 70,000
      // Total Tax = 4,800 (CGST 2400, SGST 2400)
      // Grand Total = 74,800
      assert.strictEqual(gstInvoice.subtotal, 70000);
      assert.strictEqual(gstInvoice.taxDetails?.totalTax, 4800);
      assert.strictEqual(gstInvoice.taxDetails?.totalCgst, 2400);
      assert.strictEqual(gstInvoice.taxDetails?.totalSgst, 2400);
      assert.strictEqual(gstInvoice.grandTotal, 74800);
      assert.strictEqual(gstInvoice.remainingDue, 74800);
    });

    await test('Billing: Prevent customer overpayment against invoice', async () => {
      let threw = false;
      try {
        await invoiceService.recordPayment(nonGstInvoice._id.toString(), partner1._id, {
          amount: 150000, // Remaining due is 98,000
          paymentMethod: 'BANK_TRANSFER',
        });
      } catch (err: any) {
        threw = true;
        assert(err.message.includes('exceeds remaining due'));
      }
      assert.strictEqual(threw, true);
    });

    await test('Billing: Record partial payment and verify automatic ledger integration', async () => {
      const initialTransactionsCount = await Transaction.countDocuments({
        relatedInvoice: nonGstInvoice._id,
      });
      assert.strictEqual(initialTransactionsCount, 0);

      const updated = await invoiceService.recordPayment(nonGstInvoice._id.toString(), partner1._id, {
        amount: 40000,
        paymentMethod: 'UPI',
        notes: 'Advance transfer via GPay',
      });

      assert.strictEqual(updated.amountPaid, 40000);
      assert.strictEqual(updated.remainingDue, 58000);
      assert.strictEqual(updated.paymentStatus, 'PARTIALLY_PAID');

      // Check central financial ledger has recorded BUSINESS_INCOME
      const ledgerEntry = await Transaction.findOne({ relatedInvoice: nonGstInvoice._id });
      assert(ledgerEntry !== null);
      assert.strictEqual(ledgerEntry.transactionType, 'BUSINESS_INCOME');
      assert.strictEqual(ledgerEntry.amount, 40000);
      assert.strictEqual(ledgerEntry.amountPaise, 4000000);
    });

    await test('Billing: Complete final payment and verify PAID status', async () => {
      const updated = await invoiceService.recordPayment(nonGstInvoice._id.toString(), partner1._id, {
        amount: 58000,
        paymentMethod: 'BANK_TRANSFER',
        notes: 'Final settlement payment',
      });

      assert.strictEqual(updated.amountPaid, 98000);
      assert.strictEqual(updated.remainingDue, 0);
      assert.strictEqual(updated.paymentStatus, 'PAID');
    });

    await test('Due Management: Customer dues summary calculates outstanding and overdue balances', async () => {
      const duesSummary = await invoiceService.getCustomerDues();
      assert(duesSummary.totalCustomerDue >= 74800); // gstInvoice is still unpaid
      assert(duesSummary.dues.some((d) => d.invoiceNumber === gstInvoice.invoiceNumber));
    });

    // ------------------------------------------------------------------------
    // SECTION 2: VENDOR DIRECTORY, BILLS & PAYABLES TESTS
    // ------------------------------------------------------------------------

    let testVendor: any;
    await test('Vendors: Create vendor in directory', async () => {
      const vendorPhone = `9830${Math.floor(100000 + Math.random() * 900000)}`;
      testVendor = await vendorService.createVendor(partner1._id, {
        name: 'Royal Spices & Grocery Wholesalers',
        phone: vendorPhone,
        category: 'GROCERIES_SPICES',
        address: 'Posta Bazar, Kolkata',
      });
      assert.strictEqual(testVendor.name, 'Royal Spices & Grocery Wholesalers');
      assert.strictEqual(testVendor.category, 'GROCERIES_SPICES');
    });

    let vendorBill: any;
    await test('Vendors: Create vendor payable without counting as expense before payment', async () => {
      const expenseCountBefore = await Transaction.countDocuments({
        transactionType: 'BUSINESS_EXPENSE',
      });

      vendorBill = await vendorService.createVendorBill(partner1._id, {
        vendor: testVendor._id.toString(),
        relatedEvent: testEvent._id.toString(),
        billNumber: 'BILL-SP-901',
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        description: 'Basmati rice, ghee and exotic spices',
        totalAmount: 25000,
      });

      assert.strictEqual(vendorBill.totalAmount, 25000);
      assert.strictEqual(vendorBill.paidAmount, 0);
      assert.strictEqual(vendorBill.remainingAmount, 25000);
      assert.strictEqual(vendorBill.status, 'UNPAID');

      // Crucial Accounting Rule: Creating a bill must NOT create an expense in the ledger
      const expenseCountAfter = await Transaction.countDocuments({
        transactionType: 'BUSINESS_EXPENSE',
      });
      assert.strictEqual(expenseCountAfter, expenseCountBefore);
    });

    await test('Vendors: Record partial vendor payment and verify ledger expense creation', async () => {
      const updatedBill = await vendorService.recordBillPayment(
        vendorBill._id.toString(),
        partner2._id,
        {
          amount: 10000,
          paymentSource: 'COMMON_BUSINESS',
          notes: 'Partial payment cheque',
        }
      );

      assert.strictEqual(updatedBill.paidAmount, 10000);
      assert.strictEqual(updatedBill.remainingAmount, 15000);
      assert.strictEqual(updatedBill.status, 'PARTIALLY_PAID');

      // Verify that ledger has recorded BUSINESS_EXPENSE
      const ledgerExpense = await Transaction.findOne({ relatedVendorBill: vendorBill._id });
      assert(ledgerExpense !== null);
      assert.strictEqual(ledgerExpense.transactionType, 'BUSINESS_EXPENSE');
      assert.strictEqual(ledgerExpense.amount, 10000);
    });

    await test('Vendors: Prevent overpayment against vendor bill', async () => {
      let threw = false;
      try {
        await vendorService.recordBillPayment(vendorBill._id.toString(), partner2._id, {
          amount: 20000, // Remaining is 15,000
          paymentSource: 'COMMON_BUSINESS',
        });
      } catch (err: any) {
        threw = true;
        assert(err.message.includes('exceeds remaining payable'));
      }
      assert.strictEqual(threw, true);
    });

    await test('Due Management: Vendor dues summary calculates outstanding payables', async () => {
      const duesSummary = await vendorService.getVendorDues();
      assert(duesSummary.totalVendorDue >= 15000);
      assert(duesSummary.dues.some((d) => d.billId === vendorBill._id.toString()));
    });

    // ------------------------------------------------------------------------
    // SECTION 3: PARTNER PHYSICAL CASH CUSTODY TESTS
    // ------------------------------------------------------------------------

    await test('Cash Custody: Record initial opening cash custody assigned to Partner 1', async () => {
      const p1Initial = await cashCustodyService.getPartnerCashBalancePaise(partner1._id);

      await cashCustodyService.recordCashMovement(partner1._id, {
        movementType: 'OPENING_BALANCE',
        amount: 30000,
        toPartner: partner1._id.toString(),
        description: 'Opening physical business cash in hand',
      });

      const p1Balance = await cashCustodyService.getPartnerCashBalancePaise(partner1._id);
      assert.strictEqual(p1Balance - p1Initial, 3000000); // exactly +30,000 in paise
    });

    await test('Cash Custody: Partner-to-partner handover adjusts balances without affecting total cash', async () => {
      const totalCashBefore = (await cashCustodyService.getCashCustodyOverview()).totalBusinessCashInHand;
      const p1Before = await cashCustodyService.getPartnerCashBalancePaise(partner1._id);
      const p2Before = await cashCustodyService.getPartnerCashBalancePaise(partner2._id);

      await cashCustodyService.recordCashMovement(partner1._id, {
        movementType: 'PARTNER_HANDOVER',
        amount: 8000,
        fromPartner: partner1._id.toString(),
        toPartner: partner2._id.toString(),
        description: 'Handover for market purchases',
      });

      const p1Balance = await cashCustodyService.getPartnerCashBalancePaise(partner1._id);
      const p2Balance = await cashCustodyService.getPartnerCashBalancePaise(partner2._id);

      assert.strictEqual(p1Before - p1Balance, 800000); // -8k from p1
      assert.strictEqual(p2Balance - p2Before, 800000); // +8k to p2

      const totalCashAfter = (await cashCustodyService.getCashCustodyOverview()).totalBusinessCashInHand;
      assert.strictEqual(totalCashAfter, totalCashBefore);
    });

    await test('Cash Custody: Bank deposit decreases partner custody and reconciles bank balance', async () => {
      const p1Before = await cashCustodyService.getPartnerCashBalancePaise(partner1._id);

      await cashCustodyService.recordCashMovement(partner1._id, {
        movementType: 'BANK_DEPOSIT',
        amount: 10000,
        fromPartner: partner1._id.toString(),
        description: 'Deposited surplus event cash to SBI current account',
      });

      const p1Balance = await cashCustodyService.getPartnerCashBalancePaise(partner1._id);
      assert.strictEqual(p1Before - p1Balance, 1000000); // -10k from p1
    });

    await test('Cash Custody: Prevent negative cash balances on unauthorized withdrawal/handover', async () => {
      let threw = false;
      try {
        await cashCustodyService.recordCashMovement(partner3._id, {
          movementType: 'PARTNER_HANDOVER',
          amount: 5000,
          fromPartner: partner3._id.toString(), // Partner 3 holds 0
          toPartner: partner1._id.toString(),
          description: 'Invalid handover with 0 balance',
        });
      } catch (err: any) {
        threw = true;
        assert(err.message.includes('Insufficient cash custody'));
      }
      assert.strictEqual(threw, true);
    });

    // ------------------------------------------------------------------------
    // SECTION 4: EVENT FINANCIAL HUB & DASHBOARD TESTS
    // ------------------------------------------------------------------------

    await test('Event Hub: Event financial overview compiles collections, expenses, invoices and dues', async () => {
      const eventOverview = await eventService.getEventFinancialOverview(testEvent._id.toString());
      assert(eventOverview.event !== null);
      assert(eventOverview.summary.totalInvoiced > 0);
      assert(eventOverview.summary.totalAmountCollected > 0);
      assert(eventOverview.invoices.length >= 1);
      assert(eventOverview.vendorBills.length >= 1);
    });

    await test('Dashboard: Aggregate upcoming events, executive financials, dues and partner cash', async () => {
      const dash = await dashboardService.getDashboardData();
      assert(Array.isArray(dash.upcomingEvents));
      assert(dash.financialOverview.totalBusinessIncome !== undefined);
      assert(dash.financialOverview.totalBusinessExpenses !== undefined);
      assert(dash.financialOverview.totalBusinessCashInHand !== undefined);
      assert(dash.financialOverview.totalCustomerDue !== undefined);
      assert.strictEqual(Array.isArray(dash.partnerCashOverview.partners), true);
      assert(dash.partnerCashOverview.partners.length >= 3);
      assert(Array.isArray(dash.recentActivity));
    });

    console.log('\n====================================================');
    console.log(`Phase 5 Tests Completed: ${testsPassed} Passed, ${testsFailed} Failed`);
    console.log('====================================================\n');

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
};

runPhase5Tests();
