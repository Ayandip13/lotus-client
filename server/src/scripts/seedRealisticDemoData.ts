import mongoose from 'mongoose';
import { env } from '../config/env';
import { Partner } from '../modules/partners/partner.model';
import { Event } from '../modules/events/event.model';
import { Vendor } from '../modules/vendors/vendor.model';
import { VendorBill } from '../modules/vendors/vendorBill.model';
import { Invoice } from '../modules/invoices/invoice.model';
import { Transaction } from '../modules/transactions/transaction.model';
import { CashMovement } from '../modules/cashCustody/cashCustody.model';

export async function seedRealisticDemoData() {
  console.log('Connecting to MongoDB Atlas...');
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.MONGODB_URI);
  }
  console.log('Connected successfully!');

  // 1. Fetch the 3 partners
  const partners = await Partner.find({ status: 'ACTIVE' }).sort({ createdAt: 1 });
  if (partners.length < 3) {
    throw new Error(`Expected at least 3 active partners, found ${partners.length}. Please run seed:partners first.`);
  }

  const p1 = partners[0];
  const p2 = partners[1];
  const p3 = partners[2];

  console.log(`Using partners: ${p1.name} (${p1._id}), ${p2.name} (${p2._id}), ${p3.name} (${p3._id})`);

  // 2. Clean previous operational data (preserve users and partners)
  console.log('Cleaning old test data...');
  await Promise.all([
    Event.deleteMany({}),
    Vendor.deleteMany({}),
    VendorBill.deleteMany({}),
    Invoice.deleteMany({}),
    Transaction.deleteMany({}),
    CashMovement.deleteMany({}),
  ]);
  console.log('Old operational data cleared.');

  // 3. Create 8 Realistic Catering Events (4 Upcoming, 4 Completed)
  console.log('Seeding 8 Catering Bookings / Events...');
  const now = new Date();
  
  // Future dates
  const dateNov15 = new Date(now.getFullYear(), 10, 15, 19, 0, 0); // Nov 15
  const dateNov22 = new Date(now.getFullYear(), 10, 22, 20, 0, 0); // Nov 22
  const dateNov28 = new Date(now.getFullYear(), 10, 28, 18, 30, 0); // Nov 28
  const dateDec05 = new Date(now.getFullYear(), 11, 5, 12, 30, 0); // Dec 05

  // Past dates
  const dateOct28 = new Date(now.getFullYear(), 9, 28, 13, 0, 0); // Oct 28
  const dateOct20 = new Date(now.getFullYear(), 9, 20, 12, 0, 0); // Oct 20
  const dateOct14 = new Date(now.getFullYear(), 9, 14, 20, 0, 0); // Oct 14
  const dateOct06 = new Date(now.getFullYear(), 9, 6, 16, 0, 0); // Oct 06

  const eventsData = [
    {
      title: 'Banerjee & Chatterjee Royal Wedding Reception',
      eventDate: dateNov15,
      guestName: 'Subhashis Banerjee',
      guestPhone: '9830124567',
      guestEmail: 's.banerjee@gmail.com',
      guestAddress: 'Swabhumi The Heritage Plaza, Rangmanch Hall, EM Bypass, Kolkata',
      eventDetails: 'Grand Wedding Reception buffet for 650 guests. Live counters: Gondhoraj Fish Fry, Chicken Reshmi Kebab, Chaat & Fuchka. Main course: Basanti Pulao, Chingri Malai Curry, Kosha Mangsho, Chanar Kofta. Desserts: Baked Mihidana, Nolen Gur Ice Cream.',
      createdByPartner: p1._id,
    },
    {
      title: "Dr. Sen's 50th Golden Jubilee Birthday Gala",
      eventDate: dateNov22,
      guestName: 'Dr. Anirban Sen',
      guestPhone: '9831098765',
      guestEmail: 'dranirban.sen@medicare.in',
      guestAddress: 'ITC Royal Bengal Banquet Hall, Kolkata',
      eventDetails: 'Cocktail dinner for 220 guests. Continental starters, live pasta station, tandoor counter, Mutton Biryani, Chicken Chaap & Burhani. Premium confectionery dessert bar.',
      createdByPartner: p2._id,
    },
    {
      title: 'Debraj & Moumita Sangeet & Ring Ceremony',
      eventDate: dateNov28,
      guestName: 'Debraj Mukherjee',
      guestPhone: '9433011223',
      guestEmail: 'debraj.m@tcs.com',
      guestAddress: 'Silver Spring Club Banquet, EM Bypass, Kolkata',
      eventDetails: '300 pax evening engagement banquet. High tea snacks followed by royal North Indian & Bengali fusion dinner. Radha Ballabhi, Chholar Dal, Bhetki Paturi, Mutton Rogan Josh.',
      createdByPartner: p1._id,
    },
    {
      title: 'TCS Annual Leadership Corporate Luncheon',
      eventDate: dateDec05,
      guestName: 'Priyanka Roy (Admin Head)',
      guestPhone: '9874563210',
      guestEmail: 'priyanka.roy@tcs.corp',
      guestAddress: 'TCS Gitanjali Park, New Town Action Area II, Kolkata',
      eventDetails: 'Executive multi-cuisine buffet for 350 executives. Continental, Pan-Asian & Indian hot spreads with live dessert & fruit carving stations.',
      createdByPartner: p3._id,
    },
    {
      title: 'Bose Family Annaprashan (Rice Ceremony)',
      eventDate: dateOct28,
      guestName: 'Kaushik Bose',
      guestPhone: '9830554433',
      guestEmail: 'kaushik.bose@gmail.com',
      guestAddress: 'Sarat Sadan Banquet, Howrah',
      eventDetails: 'Traditional afternoon feast for 300 guests: Luchi, Chholar Dal, Bhetki Paturi, Golda Chingri Malaikari, Khasir Mangsho, Aamshotto Khejur Chutney, Rosogolla, Makha Sandesh.',
      createdByPartner: p2._id,
    },
    {
      title: 'Ghosh Villa Griha Pravesh Puja & Feast',
      eventDate: dateOct20,
      guestName: 'Soma Ghosh',
      guestPhone: '9831223344',
      guestAddress: 'Salt Lake Sector 3, Kolkata',
      eventDetails: 'Traditional pure vegetarian banquet for 180 pax. Radhaballavi, Kashmiri Dum Aloo, Bhoger Khichuri, Labra, Chanar Payesh, Jalbhora Sandesh.',
      createdByPartner: p1._id,
    },
    {
      title: 'Rotary Club Kolkata Diwali Fellowship Dinner',
      eventDate: dateOct14,
      guestName: 'Amitava Ganguly',
      guestPhone: '9836778899',
      guestAddress: 'Calcutta Club Lawns, Kolkata',
      eventDetails: 'Evening fellowship dinner for 160 members. Kebabs, Mughlai dinner spread, Firni, Kulfi counter.',
      createdByPartner: p3._id,
    },
    {
      title: 'Poddar Group Corporate Product Launch Hi-Tea',
      eventDate: dateOct06,
      guestName: 'Vikram Poddar',
      guestPhone: '9830119988',
      guestEmail: 'vikram@poddargroup.in',
      guestAddress: 'The Oberoi Grand Banquet, Kolkata',
      eventDetails: 'Hi-Tea & cocktail snacks for 120 guests. Live artisanal sandwich bar, Dimsum station, Darjeeling tea & pastries.',
      createdByPartner: p2._id,
    },
  ];

  const createdEvents = await Event.insertMany(eventsData);
  console.log(`Created ${createdEvents.length} events.`);

  const [evWedding, evJubilee, evSangeet, evCorporate, evAnnaprashan, evGrihaPravesh] = createdEvents;

  // 4. Seed 6 Suppliers / Vendors
  console.log('Seeding 6 Suppliers / Vendors...');
  const vendorsData = [
    {
      name: 'Das Fish & Prawn Supply',
      category: 'MEAT_FISH',
      phone: '9830441122',
      email: 'dasfish@kolkatamarket.in',
      address: 'Sealdah Fish Market, Stall 14, Kolkata',
      status: 'ACTIVE',
      bankDetails: 'SBI A/c 30219844211, IFSC: SBIN0000001',
      createdByPartner: p1._id,
    },
    {
      name: 'Posta Bazar Spices & Groceries',
      category: 'GROCERIES_SPICES',
      phone: '9831556677',
      email: 'postaspices@gmail.com',
      address: 'Posta Wholesale Market, Burrabazar, Kolkata',
      status: 'ACTIVE',
      bankDetails: 'HDFC A/c 50100234918231, IFSC: HDFC0000123',
      createdByPartner: p2._id,
    },
    {
      name: 'Balaram Mullick Dairy & Sweets',
      category: 'DAIRY_SWEETS',
      phone: '9830887766',
      email: 'orders@balarammullick.com',
      address: 'Bhowanipore, Kolkata',
      status: 'ACTIVE',
      bankDetails: 'ICICI A/c 001205001234, IFSC: ICIC0000012',
      createdByPartner: p3._id,
    },
    {
      name: 'Bengal Fresh Vegetables Wholesale',
      category: 'VEGETABLES',
      phone: '9831998877',
      email: 'bengalfresh@koley.in',
      address: 'Koley Market, Sealdah, Kolkata',
      status: 'ACTIVE',
      createdByPartner: p1._id,
    },
    {
      name: 'Raja Decorators & Crockery Rentals',
      category: 'CROCKERY_UTENSILS',
      phone: '9836112233',
      address: 'Gariahat, Kolkata',
      status: 'ACTIVE',
      createdByPartner: p2._id,
    },
    {
      name: 'Sunrise Commercial LPG Gas Agency',
      category: 'COOKING_GAS',
      phone: '9830332211',
      address: 'Park Circus, Kolkata',
      status: 'ACTIVE',
      createdByPartner: p3._id,
    },
  ];

  const createdVendors = await Vendor.insertMany(vendorsData);
  console.log(`Created ${createdVendors.length} vendors.`);
  const [vFish, vSpices, vSweets, vVeg, vCrockery, vGas] = createdVendors;

  // 5. Seed Invoices (GST & Non-GST) with payment tracking
  console.log('Seeding Customer Invoices...');
  const businessSnapshot = {
    legalName: 'Lotus Caterer',
    address: '12/1A, Rashbehari Avenue, Kolkata - 700029',
    phone: '+91 98300 12345',
    email: 'contact@lotuscaterer.com',
    bankName: 'HDFC Bank',
    bankAccountNumber: '50200088991122',
    bankIfsc: 'HDFC0001234',
    bankBranch: 'Rashbehari Branch, Kolkata',
  };

  // Invoice 1: Banerjee Wedding (Partially Paid)
  const inv1Items = [
    { description: 'Royal Wedding Reception Buffet (Gondhoraj Fish Fry, Basanti Pulao, Chingri Malai Curry, Mutton Kasha, Rasomalai)', quantity: 650, unit: 'plates', rate: 500, amount: 325000, amountPaise: 32500000, totalAmount: 325000 },
    { description: 'Live Chaat & Fuchka Counter Setup', quantity: 1, unit: 'setup', rate: 15000, amount: 15000, amountPaise: 1500000, totalAmount: 15000 },
    { description: 'Mocktail & Fresh Fruit Juice Bar', quantity: 1, unit: 'setup', rate: 10000, amount: 10000, amountPaise: 1000000, totalAmount: 10000 },
  ];
  const inv1GrandTotal = 350000;
  const inv1Paid = 150000; // Client paid advance

  // Invoice 2: Dr Sen Jubilee (Partially Paid)
  const inv2Items = [
    { description: 'Continental & Mughlai Cocktail Dinner (Starters, Tandoor, Mutton Biryani & Chaap)', quantity: 220, unit: 'plates', rate: 750, amount: 165000, amountPaise: 16500000, totalAmount: 165000 },
    { description: 'Live Pasta & Dimsum Station', quantity: 1, unit: 'setup', rate: 15000, amount: 15000, amountPaise: 1500000, totalAmount: 15000 },
  ];
  const inv2GrandTotal = 180000;
  const inv2Paid = 80000;

  // Invoice 3: Debraj Sangeet (Unpaid)
  const inv3Items = [
    { description: 'Sangeet Fusion High Tea & Dinner (Radha Ballabhi, Bhetki Paturi, Mutton Rogan Josh)', quantity: 300, unit: 'plates', rate: 400, amount: 120000, amountPaise: 12000000, totalAmount: 120000 },
  ];
  const inv3GrandTotal = 120000;
  const inv3Paid = 0;

  // Invoice 4: TCS Corporate Lunch (GST Invoice, Unpaid)
  const inv4Items = [
    {
      description: 'Executive Corporate Lunch Buffet Spread (350 pax)',
      quantity: 350,
      unit: 'plates',
      rate: 571.43,
      amount: 200000,
      amountPaise: 20000000,
      gstRate: 18,
      cgstAmount: 18000,
      sgstAmount: 18000,
      igstAmount: 0,
      totalAmount: 236000,
    },
  ];
  const inv4GrandTotal = 236000;
  const inv4Paid = 0;

  // Invoice 5: Bose Annaprashan (Fully Paid)
  const inv5Items = [
    { description: 'Traditional Bengali Annaprashan Feast (Vetki Paturi, Chingri Malaikari, Khasir Mangsho)', quantity: 300, unit: 'plates', rate: 550, amount: 165000, amountPaise: 16500000, totalAmount: 165000 },
  ];
  const inv5GrandTotal = 165000;
  const inv5Paid = 165000;

  // Invoice 6: Ghosh Griha Pravesh (Fully Paid)
  const inv6Items = [
    { description: 'Satvik Bengali Vegetarian Feast (Radhaballavi, Bhoger Khichuri, Chanar Payesh)', quantity: 180, unit: 'plates', rate: 527.78, amount: 95000, amountPaise: 9500000, totalAmount: 95000 },
  ];
  const inv6GrandTotal = 95000;
  const inv6Paid = 95000;

  const invoicesToInsert = [
    {
      invoiceNumber: 'LC-2026-0001',
      invoiceType: 'NON_GST',
      invoiceDate: new Date(now.getFullYear(), 10, 2),
      dueDate: new Date(now.getFullYear(), 10, 15),
      customerName: 'Subhashis Banerjee',
      customerPhone: '9830124567',
      customerEmail: 's.banerjee@gmail.com',
      customerAddress: 'Swabhumi The Heritage Plaza, Kolkata',
      relatedEvent: evWedding._id,
      items: inv1Items,
      subtotal: inv1GrandTotal,
      subtotalPaise: inv1GrandTotal * 100,
      discount: 0,
      discountPaise: 0,
      grandTotal: inv1GrandTotal,
      grandTotalPaise: inv1GrandTotal * 100,
      amountPaid: inv1Paid,
      amountPaidPaise: inv1Paid * 100,
      remainingDue: inv1GrandTotal - inv1Paid,
      remainingDuePaise: (inv1GrandTotal - inv1Paid) * 100,
      paymentStatus: 'PARTIALLY_PAID',
      payments: [
        {
          amount: inv1Paid,
          amountPaise: inv1Paid * 100,
          paymentDate: new Date(now.getFullYear(), 10, 2),
          paymentMethod: 'CASH',
          notes: 'Initial booking advance received in physical cash',
          receivedByPartner: p1._id,
          recordedAt: new Date(now.getFullYear(), 10, 2),
        },
      ],
      businessDetails: businessSnapshot,
      createdByPartner: p1._id,
    },
    {
      invoiceNumber: 'LC-2026-0002',
      invoiceType: 'NON_GST',
      invoiceDate: new Date(now.getFullYear(), 10, 3),
      dueDate: new Date(now.getFullYear(), 10, 22),
      customerName: 'Dr. Anirban Sen',
      customerPhone: '9831098765',
      customerEmail: 'dranirban.sen@medicare.in',
      customerAddress: 'ITC Royal Bengal, Kolkata',
      relatedEvent: evJubilee._id,
      items: inv2Items,
      subtotal: inv2GrandTotal,
      subtotalPaise: inv2GrandTotal * 100,
      discount: 0,
      discountPaise: 0,
      grandTotal: inv2GrandTotal,
      grandTotalPaise: inv2GrandTotal * 100,
      amountPaid: inv2Paid,
      amountPaidPaise: inv2Paid * 100,
      remainingDue: inv2GrandTotal - inv2Paid,
      remainingDuePaise: (inv2GrandTotal - inv2Paid) * 100,
      paymentStatus: 'PARTIALLY_PAID',
      payments: [
        {
          amount: inv2Paid,
          amountPaise: inv2Paid * 100,
          paymentDate: new Date(now.getFullYear(), 10, 3),
          paymentMethod: 'UPI',
          notes: 'Advance transfer via GPay to common business bank',
          receivedByPartner: p2._id,
          recordedAt: new Date(now.getFullYear(), 10, 3),
        },
      ],
      businessDetails: businessSnapshot,
      createdByPartner: p2._id,
    },
    {
      invoiceNumber: 'LC-2026-0003',
      invoiceType: 'NON_GST',
      invoiceDate: new Date(now.getFullYear(), 10, 4),
      dueDate: new Date(now.getFullYear(), 10, 20),
      customerName: 'Debraj Mukherjee',
      customerPhone: '9433011223',
      customerEmail: 'debraj.m@tcs.com',
      customerAddress: 'Silver Spring Club Banquet, Kolkata',
      relatedEvent: evSangeet._id,
      items: inv3Items,
      subtotal: inv3GrandTotal,
      subtotalPaise: inv3GrandTotal * 100,
      discount: 0,
      discountPaise: 0,
      grandTotal: inv3GrandTotal,
      grandTotalPaise: inv3GrandTotal * 100,
      amountPaid: 0,
      amountPaidPaise: 0,
      remainingDue: inv3GrandTotal,
      remainingDuePaise: inv3GrandTotal * 100,
      paymentStatus: 'UNPAID',
      payments: [],
      businessDetails: businessSnapshot,
      createdByPartner: p1._id,
    },
    {
      invoiceNumber: 'LC-2026-0004',
      invoiceType: 'GST',
      invoiceDate: new Date(now.getFullYear(), 10, 1),
      dueDate: new Date(now.getFullYear(), 11, 1),
      customerName: 'Tata Consultancy Services Ltd',
      customerPhone: '9874563210',
      customerEmail: 'priyanka.roy@tcs.corp',
      customerAddress: 'Gitanjali Park, New Town, Kolkata',
      customerGstin: '19AAACT2727Q1ZW',
      relatedEvent: evCorporate._id,
      items: inv4Items,
      subtotal: 200000,
      subtotalPaise: 20000000,
      discount: 0,
      discountPaise: 0,
      taxDetails: {
        isInterState: false,
        totalCgst: 18000,
        totalSgst: 18000,
        totalIgst: 0,
        totalTax: 36000,
        totalTaxPaise: 3600000,
      },
      grandTotal: inv4GrandTotal,
      grandTotalPaise: inv4GrandTotal * 100,
      amountPaid: 0,
      amountPaidPaise: 0,
      remainingDue: inv4GrandTotal,
      remainingDuePaise: inv4GrandTotal * 100,
      paymentStatus: 'UNPAID',
      payments: [],
      businessDetails: { ...businessSnapshot, gstin: '19AABCL1234F1Z5' },
      createdByPartner: p3._id,
    },
    {
      invoiceNumber: 'LC-2026-0005',
      invoiceType: 'NON_GST',
      invoiceDate: new Date(now.getFullYear(), 9, 25),
      dueDate: new Date(now.getFullYear(), 9, 28),
      customerName: 'Kaushik Bose',
      customerPhone: '9830554433',
      customerAddress: 'Sarat Sadan, Howrah',
      relatedEvent: evAnnaprashan._id,
      items: inv5Items,
      subtotal: inv5GrandTotal,
      subtotalPaise: inv5GrandTotal * 100,
      discount: 0,
      discountPaise: 0,
      grandTotal: inv5GrandTotal,
      grandTotalPaise: inv5GrandTotal * 100,
      amountPaid: inv5Paid,
      amountPaidPaise: inv5Paid * 100,
      remainingDue: 0,
      remainingDuePaise: 0,
      paymentStatus: 'PAID',
      payments: [
        {
          amount: inv5Paid,
          amountPaise: inv5Paid * 100,
          paymentDate: new Date(now.getFullYear(), 9, 28),
          paymentMethod: 'BANK_TRANSFER',
          notes: 'Full bill clearance via NEFT upon completion',
          receivedByPartner: p2._id,
          recordedAt: new Date(now.getFullYear(), 9, 28),
        },
      ],
      businessDetails: businessSnapshot,
      createdByPartner: p2._id,
    },
    {
      invoiceNumber: 'LC-2026-0006',
      invoiceType: 'NON_GST',
      invoiceDate: new Date(now.getFullYear(), 9, 18),
      dueDate: new Date(now.getFullYear(), 9, 20),
      customerName: 'Soma Ghosh',
      customerPhone: '9831223344',
      customerAddress: 'Salt Lake Sector 3, Kolkata',
      relatedEvent: evGrihaPravesh._id,
      items: inv6Items,
      subtotal: inv6GrandTotal,
      subtotalPaise: inv6GrandTotal * 100,
      discount: 0,
      discountPaise: 0,
      grandTotal: inv6GrandTotal,
      grandTotalPaise: inv6GrandTotal * 100,
      amountPaid: inv6Paid,
      amountPaidPaise: inv6Paid * 100,
      remainingDue: 0,
      remainingDuePaise: 0,
      paymentStatus: 'PAID',
      payments: [
        {
          amount: inv6Paid,
          amountPaise: inv6Paid * 100,
          paymentDate: new Date(now.getFullYear(), 9, 20),
          paymentMethod: 'CASH',
          notes: 'Cash settled on the day of event',
          receivedByPartner: p1._id,
          recordedAt: new Date(now.getFullYear(), 9, 20),
        },
      ],
      businessDetails: businessSnapshot,
      createdByPartner: p1._id,
    },
  ];

  const createdInvoices = await Invoice.insertMany(invoicesToInsert);
  console.log(`Created ${createdInvoices.length} invoices.`);

  // 6. Seed Vendor Bills
  console.log('Seeding Vendor Bills...');
  const vendorBillsData = [
    {
      billNumber: 'DF-2026-88',
      vendor: vFish._id,
      relatedEvent: evWedding._id,
      billDate: new Date(now.getFullYear(), 10, 3),
      dueDate: new Date(now.getFullYear(), 10, 16),
      description: 'Procurement of 75kg live Bhetki fish and 30kg Golda Chingri for Banerjee Wedding',
      totalAmount: 68500,
      totalAmountPaise: 6850000,
      paidAmount: 40000,
      paidAmountPaise: 4000000,
      remainingAmount: 28500,
      remainingAmountPaise: 2850000,
      status: 'PARTIALLY_PAID',
      paymentHistory: [
        {
          amount: 40000,
          amountPaise: 4000000,
          paymentDate: new Date(now.getFullYear(), 10, 3),
          paymentSource: 'COMMON_BUSINESS',
          paidByPartner: p1._id,
          notes: 'Advance paid from business account to reserve fish stock',
          recordedAt: new Date(now.getFullYear(), 10, 3),
        },
      ],
      createdByPartner: p1._id,
    },
    {
      billNumber: 'PB-2026-401',
      vendor: vSpices._id,
      relatedEvent: evWedding._id,
      billDate: new Date(now.getFullYear(), 10, 2),
      dueDate: new Date(now.getFullYear(), 10, 12),
      description: '5 bags Kohinoor Basmati Rice, 4 tins Fortune Kachi Ghani Mustard Oil, Spices, Ghee',
      totalAmount: 34200,
      totalAmountPaise: 3420000,
      paidAmount: 34200,
      paidAmountPaise: 3420000,
      remainingAmount: 0,
      remainingAmountPaise: 0,
      status: 'PAID',
      paymentHistory: [
        {
          amount: 34200,
          amountPaise: 3420000,
          paymentDate: new Date(now.getFullYear(), 10, 2),
          paymentSource: 'COMMON_BUSINESS',
          paidByPartner: p2._id,
          notes: 'Full bill clearance via RTGS to Posta Bazar wholesale',
          recordedAt: new Date(now.getFullYear(), 10, 2),
        },
      ],
      createdByPartner: p2._id,
    },
    {
      billNumber: 'BM-2026-192',
      vendor: vSweets._id,
      relatedEvent: evJubilee._id,
      billDate: new Date(now.getFullYear(), 10, 4),
      dueDate: new Date(now.getFullYear(), 10, 23),
      description: '250 pcs Mishti Doi earthen pots, 300 pcs Nolen Gur Sandesh, 25kg fresh Malai Paneer',
      totalAmount: 26000,
      totalAmountPaise: 2600000,
      paidAmount: 10000,
      paidAmountPaise: 1000000,
      remainingAmount: 16000,
      remainingAmountPaise: 1600000,
      status: 'PARTIALLY_PAID',
      paymentHistory: [
        {
          amount: 10000,
          amountPaise: 1000000,
          paymentDate: new Date(now.getFullYear(), 10, 4),
          paymentSource: 'COMMON_BUSINESS',
          paidByPartner: p3._id,
          notes: 'Booking advance for artisanal sweets preparation',
          recordedAt: new Date(now.getFullYear(), 10, 4),
        },
      ],
      createdByPartner: p3._id,
    },
    {
      billNumber: 'RD-2026-72',
      vendor: vCrockery._id,
      relatedEvent: evWedding._id,
      billDate: new Date(now.getFullYear(), 10, 3),
      dueDate: new Date(now.getFullYear(), 10, 18),
      description: 'Rental for 12 Roll-top Chafing Dishes, 650 Bone China Plates, Cutlery sets, Live Counter Canopies',
      totalAmount: 22000,
      totalAmountPaise: 2200000,
      paidAmount: 0,
      paidAmountPaise: 0,
      remainingAmount: 22000,
      remainingAmountPaise: 2200000,
      status: 'UNPAID',
      paymentHistory: [],
      createdByPartner: p1._id,
    },
    {
      billNumber: 'BF-2026-554',
      vendor: vVeg._id,
      relatedEvent: evJubilee._id,
      billDate: new Date(now.getFullYear(), 10, 4),
      dueDate: new Date(now.getFullYear(), 10, 21),
      description: 'Koley Market bulk procurement of seasonal vegetables, bell peppers, broccoli, baby corn',
      totalAmount: 18500,
      totalAmountPaise: 1850000,
      paidAmount: 0,
      paidAmountPaise: 0,
      remainingAmount: 18500,
      remainingAmountPaise: 1850000,
      status: 'UNPAID',
      paymentHistory: [],
      createdByPartner: p2._id,
    },
    {
      billNumber: 'SL-2026-118',
      vendor: vGas._id,
      relatedEvent: evAnnaprashan._id,
      billDate: new Date(now.getFullYear(), 9, 27),
      dueDate: new Date(now.getFullYear(), 9, 28),
      description: '8 Commercial 19kg Indane Gas Cylinders delivered to Sarat Sadan kitchen',
      totalAmount: 14800,
      totalAmountPaise: 1480000,
      paidAmount: 14800,
      paidAmountPaise: 1480000,
      remainingAmount: 0,
      remainingAmountPaise: 0,
      status: 'PAID',
      paymentHistory: [
        {
          amount: 14800,
          amountPaise: 1480000,
          paymentDate: new Date(now.getFullYear(), 9, 27),
          paymentSource: 'COMMON_BUSINESS',
          paidByPartner: p2._id,
          notes: 'Settled via cash on delivery',
          recordedAt: new Date(now.getFullYear(), 9, 27),
        },
      ],
      createdByPartner: p2._id,
    },
  ];

  const createdBills = await VendorBill.insertMany(vendorBillsData);
  console.log(`Created ${createdBills.length} vendor bills.`);

  // 7. Seed Physical Cash Custody Movements
  console.log('Seeding Physical Cash Custody Movements...');
  // We want:
  // Partner 1: ₹45,000 cash in hand
  // Partner 2: ₹35,000 cash in hand
  // Partner 3: ₹30,000 cash in hand
  // Total Physical Cash in Hand = ₹1,10,000
  const cashMovementsData = [
    // Opening balance allocations
    {
      movementType: 'OPENING_BALANCE',
      amount: 30000,
      amountPaise: 3000000,
      movementDate: new Date(now.getFullYear(), 9, 1),
      toPartner: p1._id,
      sourceAccount: 'PARTNER_CUSTODY',
      destinationAccount: 'PARTNER_CUSTODY',
      description: 'Initial physical cash-in-hand baseline for Partner 1',
      createdByPartner: p1._id,
    },
    {
      movementType: 'OPENING_BALANCE',
      amount: 25000,
      amountPaise: 2500000,
      movementDate: new Date(now.getFullYear(), 9, 1),
      toPartner: p2._id,
      sourceAccount: 'PARTNER_CUSTODY',
      destinationAccount: 'PARTNER_CUSTODY',
      description: 'Initial physical cash-in-hand baseline for Partner 2',
      createdByPartner: p2._id,
    },
    {
      movementType: 'OPENING_BALANCE',
      amount: 30000,
      amountPaise: 3000000,
      movementDate: new Date(now.getFullYear(), 9, 1),
      toPartner: p3._id,
      sourceAccount: 'PARTNER_CUSTODY',
      destinationAccount: 'PARTNER_CUSTODY',
      description: 'Initial physical cash-in-hand baseline for Partner 3',
      createdByPartner: p3._id,
    },
    // Partner 1 receives ₹1,50,000 advance in cash for Banerjee Wedding
    {
      movementType: 'CASH_INCOME_ASSIGNED',
      amount: 150000,
      amountPaise: 15000000,
      movementDate: new Date(now.getFullYear(), 10, 2),
      toPartner: p1._id,
      relatedEvent: evWedding._id,
      sourceAccount: 'CUSTOMER',
      destinationAccount: 'PARTNER_CUSTODY',
      description: 'Wedding booking cash advance assigned to Partner 1 custody',
      createdByPartner: p1._id,
    },
    // Partner 1 deposits ₹1,20,000 of cash into the business bank account
    {
      movementType: 'BANK_DEPOSIT',
      amount: 120000,
      amountPaise: 12000000,
      movementDate: new Date(now.getFullYear(), 10, 3),
      fromPartner: p1._id,
      sourceAccount: 'PARTNER_CUSTODY',
      destinationAccount: 'BANK',
      description: 'Cash deposited into HDFC business account from wedding advance collection',
      createdByPartner: p1._id,
    },
    // Partner 1 hands over ₹15,000 cash to Partner 2 for local grocery procurement
    {
      movementType: 'PARTNER_HANDOVER',
      amount: 15000,
      amountPaise: 1500000,
      movementDate: new Date(now.getFullYear(), 10, 3),
      fromPartner: p1._id,
      toPartner: p2._id,
      relatedEvent: evWedding._id,
      sourceAccount: 'PARTNER_CUSTODY',
      destinationAccount: 'PARTNER_CUSTODY',
      description: 'Cash handover for morning fish and vegetable market purchases',
      createdByPartner: p1._id,
    },
    // Partner 2 pays ₹5,000 direct cash expense for helper wages
    {
      movementType: 'CASH_EXPENSE',
      amount: 5000,
      amountPaise: 500000,
      movementDate: new Date(now.getFullYear(), 10, 4),
      fromPartner: p2._id,
      relatedEvent: evWedding._id,
      sourceAccount: 'PARTNER_CUSTODY',
      destinationAccount: 'EXPENSE',
      description: 'Daily cash wages for kitchen loading & cleaning helpers',
      createdByPartner: p2._id,
    },
  ];

  const createdMovements = await CashMovement.insertMany(cashMovementsData);
  console.log(`Created ${createdMovements.length} cash custody movements.`);

  // 8. Seed Centralized Ledger Transactions
  console.log('Seeding Centralized Ledger Transactions...');
  // Core Transactions:
  // - 3 Partner Contributions: ₹1,00,000 each (Total ₹3,00,000 capital)
  // - Business Incomes from Collections:
  //     - Subhashis Banerjee advance: ₹1,50,000 (CASH)
  //     - Dr. Anirban Sen advance: ₹80,000 (BANK_TRANSFER / UPI)
  //     - Kaushik Bose final settlement: ₹1,65,000 (BANK_TRANSFER)
  //     - Soma Ghosh final settlement: ₹95,000 (CASH)
  // - Business Expenses:
  //     - Das Fish partial bill settlement: ₹40,000 (COMMON_BUSINESS)
  //     - Posta Bazar wholesale spices settlement: ₹34,200 (COMMON_BUSINESS)
  //     - Balaram Mullick advance: ₹10,000 (COMMON_BUSINESS)
  //     - Sunrise LPG gas cylinders: ₹14,800 (COMMON_BUSINESS)
  //     - Kitchen helpers wages: ₹5,000 (COMMON_BUSINESS)
  //     - Catering chef master uniform & knives: ₹6,500 (PARTNER_PERSONAL - paid by Partner 1)
  //     - Spice tasting & trial samples: ₹3,500 (PARTNER_PERSONAL - paid by Partner 2)

  const transactionsData = [
    // Partner Capital Contributions
    {
      transactionType: 'PARTNER_CONTRIBUTION',
      paymentSource: 'PARTNER_PERSONAL',
      amount: 100000,
      amountPaise: 10000000,
      transactionDate: new Date(now.getFullYear(), 8, 15),
      partner: p1._id,
      description: 'Initial business capital contribution by Partner 1',
      createdByPartner: p1._id,
    },
    {
      transactionType: 'PARTNER_CONTRIBUTION',
      paymentSource: 'PARTNER_PERSONAL',
      amount: 100000,
      amountPaise: 10000000,
      transactionDate: new Date(now.getFullYear(), 8, 15),
      partner: p2._id,
      description: 'Initial business capital contribution by Partner 2',
      createdByPartner: p2._id,
    },
    {
      transactionType: 'PARTNER_CONTRIBUTION',
      paymentSource: 'PARTNER_PERSONAL',
      amount: 100000,
      amountPaise: 10000000,
      transactionDate: new Date(now.getFullYear(), 8, 15),
      partner: p3._id,
      description: 'Initial business capital contribution by Partner 3',
      createdByPartner: p3._id,
    },

    // Business Incomes
    {
      transactionType: 'BUSINESS_INCOME',
      paymentSource: 'COMMON_BUSINESS',
      amount: 150000,
      amountPaise: 15000000,
      transactionDate: new Date(now.getFullYear(), 10, 2),
      partner: p1._id,
      relatedEvent: evWedding._id,
      relatedInvoice: createdInvoices[0]._id,
      description: 'Booking advance for Banerjee Wedding Reception (650 pax)',
      createdByPartner: p1._id,
    },
    {
      transactionType: 'BUSINESS_INCOME',
      paymentSource: 'COMMON_BUSINESS',
      amount: 80000,
      amountPaise: 8000000,
      transactionDate: new Date(now.getFullYear(), 10, 3),
      partner: p2._id,
      relatedEvent: evJubilee._id,
      relatedInvoice: createdInvoices[1]._id,
      description: "Booking advance for Dr. Sen's Golden Jubilee Birthday (220 pax)",
      createdByPartner: p2._id,
    },
    {
      transactionType: 'BUSINESS_INCOME',
      paymentSource: 'COMMON_BUSINESS',
      amount: 165000,
      amountPaise: 16500000,
      transactionDate: new Date(now.getFullYear(), 9, 28),
      partner: p2._id,
      relatedEvent: evAnnaprashan._id,
      relatedInvoice: createdInvoices[4]._id,
      description: 'Full bill clearance for Bose Annaprashan feast (300 pax)',
      createdByPartner: p2._id,
    },
    {
      transactionType: 'BUSINESS_INCOME',
      paymentSource: 'COMMON_BUSINESS',
      amount: 95000,
      amountPaise: 9500000,
      transactionDate: new Date(now.getFullYear(), 9, 20),
      partner: p1._id,
      relatedEvent: evGrihaPravesh._id,
      relatedInvoice: createdInvoices[5]._id,
      description: 'Full bill settlement for Ghosh Villa Griha Pravesh feast (180 pax)',
      createdByPartner: p1._id,
    },

    // Business Expenses (Common Business)
    {
      transactionType: 'BUSINESS_EXPENSE',
      paymentSource: 'COMMON_BUSINESS',
      amount: 40000,
      amountPaise: 4000000,
      transactionDate: new Date(now.getFullYear(), 10, 3),
      partner: p1._id,
      relatedEvent: evWedding._id,
      relatedVendorBill: createdBills[0]._id,
      description: 'Vendor payment to Das Fish Supply for Vetki & Chingri stock',
      createdByPartner: p1._id,
    },
    {
      transactionType: 'BUSINESS_EXPENSE',
      paymentSource: 'COMMON_BUSINESS',
      amount: 34200,
      amountPaise: 3420000,
      transactionDate: new Date(now.getFullYear(), 10, 2),
      partner: p2._id,
      relatedEvent: evWedding._id,
      relatedVendorBill: createdBills[1]._id,
      description: 'Wholesale procurement bill settled to Posta Bazar Spices',
      createdByPartner: p2._id,
    },
    {
      transactionType: 'BUSINESS_EXPENSE',
      paymentSource: 'COMMON_BUSINESS',
      amount: 10000,
      amountPaise: 1000000,
      transactionDate: new Date(now.getFullYear(), 10, 4),
      partner: p3._id,
      relatedEvent: evJubilee._id,
      relatedVendorBill: createdBills[2]._id,
      description: 'Advance payment to Balaram Mullick for Mishti Doi & Sandesh',
      createdByPartner: p3._id,
    },
    {
      transactionType: 'BUSINESS_EXPENSE',
      paymentSource: 'COMMON_BUSINESS',
      amount: 14800,
      amountPaise: 1480000,
      transactionDate: new Date(now.getFullYear(), 9, 27),
      partner: p2._id,
      relatedEvent: evAnnaprashan._id,
      relatedVendorBill: createdBills[5]._id,
      description: 'Settlement for 8 commercial 19kg Indane gas cylinders to Sunrise LPG',
      createdByPartner: p2._id,
    },
    {
      transactionType: 'BUSINESS_EXPENSE',
      paymentSource: 'COMMON_BUSINESS',
      amount: 5000,
      amountPaise: 500000,
      transactionDate: new Date(now.getFullYear(), 10, 4),
      partner: p2._id,
      relatedEvent: evWedding._id,
      description: 'Daily cash wages paid to kitchen loading and dishwashing helpers',
      createdByPartner: p2._id,
    },

    // Business Expenses (Partner Personal Out-of-Pocket)
    {
      transactionType: 'BUSINESS_EXPENSE',
      paymentSource: 'PARTNER_PERSONAL',
      amount: 6500,
      amountPaise: 650000,
      transactionDate: new Date(now.getFullYear(), 9, 22),
      partner: p1._id,
      description: 'Executive chef apron sets and Japanese kitchen knives purchased personally by Partner 1',
      createdByPartner: p1._id,
    },
    {
      transactionType: 'BUSINESS_EXPENSE',
      paymentSource: 'PARTNER_PERSONAL',
      amount: 3500,
      amountPaise: 350000,
      transactionDate: new Date(now.getFullYear(), 10, 1),
      partner: p2._id,
      description: 'Sample organic saffron and cardamom spice testing batch paid personally by Partner 2',
      createdByPartner: p2._id,
    },
  ];

  const createdTransactions = await Transaction.insertMany(transactionsData);
  console.log(`Created ${createdTransactions.length} centralized ledger transactions.`);

  console.log('----------------------------------------------------');
  console.log('🎉 Realistic Catering Demo Seed Completed Successfully!');
  console.log('----------------------------------------------------');
  console.log(`- 8 Events (4 upcoming with guests & menus, 4 completed past feasts)`);
  console.log(`- 6 Suppliers/Vendors (Fish, Spices, Sweets, Veggies, Crockery, Gas)`);
  console.log(`- 6 Invoices (2 Paid, 2 Partial, 2 Unpaid across GST & Non-GST)`);
  console.log(`- 6 Vendor Bills (Procurement orders linked to events)`);
  console.log(`- 7 Cash Custody Movements (Physical cash in hand for all 3 partners)`);
  console.log(`- 13 Ledger Transactions (Income, Expenses, Capital Contributions)`);
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
}

if (require.main === module) {
  seedRealisticDemoData().catch((err) => {
    console.error('Seed script error:', err);
    process.exit(1);
  });
}
