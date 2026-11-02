import assert from 'assert';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Partner } from '../modules/partners/partner.model';
import { Event } from '../modules/events/event.model';
import { eventService } from '../modules/events/event.service';
import {
  createEventSchema,
  updateEventSchema,
  queryEventsSchema,
} from '../modules/events/event.schema';
import { requireAuth } from '../middleware/auth.middleware';
import { UnauthorizedError, BadRequestError, NotFoundError } from '../utils/appError';

const runEventTests = async () => {
  console.log('====================================================');
  console.log('🧪 Starting Phase 3 Booking, Guest & Event Management Test Suite');
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

  let createdEventId: string = '';

  try {
    await connectDatabase();

    // 1. Setup / Resolve 3 Test Partners
    let partners = await Partner.find({ status: 'ACTIVE' }).limit(3);
    if (partners.length < 3) {
      // Create test partners if fewer than 3 exist in test DB
      const p1 = await Partner.create({ name: 'Test Partner 1' });
      const p2 = await Partner.create({ name: 'Test Partner 2' });
      const p3 = await Partner.create({ name: 'Test Partner 3' });
      partners = [p1, p2, p3];
    }

    const partner1 = partners[0];
    const partner2 = partners[1];
    const partner3 = partners[2];

    // --- 1. Create Booking / Event ---
    await test('Create Event: successfully creates booking with complete guest contact details', async () => {
      const payload = {
        title: 'Bose Family Golden Jubilee',
        eventDate: '2026-12-15T18:00:00.000Z',
        eventDetails: 'Complete dinner buffet catering for 200 guests with custom mocktail counter',
        guestName: 'Anirban Bose',
        guestPhone: '+91 98300 12345',
        guestEmail: 'anirban.bose@example.com',
        guestAddress: '54 Lake Gardens, South Kolkata',
      };

      const event = await eventService.createEvent(partner1._id, payload);

      assert(event._id, 'Event should have an _id');
      assert.strictEqual(event.title, payload.title);
      assert.strictEqual(event.guestName, payload.guestName);
      assert.strictEqual(event.guestPhone, payload.guestPhone);
      assert.strictEqual(event.guestEmail, payload.guestEmail);
      assert.strictEqual(event.guestAddress, payload.guestAddress);
      assert.strictEqual(event.isDeleted, false, 'New event should not be marked as deleted');
      assert.strictEqual(
        (event.createdByPartner as any)._id?.toString() || event.createdByPartner.toString(),
        partner1._id.toString(),
        'Creator partner ID must match partner1'
      );

      createdEventId = event._id.toString();
    });

    // --- 2. Creator Identity Derivation & Protection ---
    await test('Creator Identity: derived strictly from session; cannot be spoofed', async () => {
      const payload = {
        title: 'Roy Wedding Dinner',
        eventDate: '2026-11-28T19:00:00.000Z',
        guestName: 'Debabrata Roy',
        guestPhone: '9876543210',
        // Attempting to inject partner2 as creator
        createdByPartner: partner2._id.toString(),
      };

      // Service strictly uses the first argument (session partnerId), ignoring body injection
      const event = await eventService.createEvent(partner1._id, payload as any);

      assert.strictEqual(
        (event.createdByPartner as any)._id?.toString() || event.createdByPartner.toString(),
        partner1._id.toString(),
        'Event creator must be derived from authenticated session, not injected payload'
      );

      // Clean up auxiliary event
      await Event.findByIdAndDelete(event._id);
    });

    // --- 3. Validation: Missing Required Fields ---
    await test('Validation: rejects missing required fields (title, date, guestName, guestPhone)', async () => {
      // Missing title
      assert.throws(() => {
        createEventSchema.parse({
          eventDate: '2026-12-15T18:00:00.000Z',
          guestName: 'Rajesh',
          guestPhone: '9830011111',
        });
      }, /Event\/booking name is required/);

      // Missing guestName
      assert.throws(() => {
        createEventSchema.parse({
          title: 'Birthday Gala',
          eventDate: '2026-12-15T18:00:00.000Z',
          guestPhone: '9830011111',
        });
      }, /Guest name is required/);

      // Missing guestPhone
      assert.throws(() => {
        createEventSchema.parse({
          title: 'Birthday Gala',
          eventDate: '2026-12-15T18:00:00.000Z',
          guestName: 'Rajesh',
        });
      }, /Guest contact number is required/);
    });

    // --- 4. Validation: Invalid Email ---
    await test('Validation: rejects malformed guest email', async () => {
      assert.throws(() => {
        createEventSchema.parse({
          title: 'Corporate Lunch',
          eventDate: '2026-12-10T12:00:00.000Z',
          guestName: 'Suman Roy',
          guestPhone: '9831122334',
          guestEmail: 'not-an-email',
        });
      }, /Invalid email address format/);
    });

    // --- 5. Retrieve Individual Booking Details ---
    await test('Get Event By ID: retrieves complete details and populates creator partner', async () => {
      const event = await eventService.getEventById(createdEventId);

      assert.strictEqual(event._id.toString(), createdEventId);
      assert.strictEqual(event.title, 'Bose Family Golden Jubilee');
      assert.strictEqual(
        (event.createdByPartner as any).name,
        partner1.name,
        'Should populate partner name'
      );
    });

    // --- 6. Equal Partner Access: Partner 2 updates record created by Partner 1 ---
    await test('Equal Partner Access: Partner 2 can successfully update Partner 1 created event', async () => {
      const updateData = {
        title: 'Bose Family Golden Jubilee (Updated Banquet)',
        guestAddress: '54 Lake Gardens, Flat 3B, South Kolkata',
      };

      const updated = await eventService.updateEvent(createdEventId, partner2._id, updateData);

      assert.strictEqual(updated.title, updateData.title);
      assert.strictEqual(updated.guestAddress, updateData.guestAddress);
      // Verify other fields remain intact
      assert.strictEqual(updated.guestName, 'Anirban Bose');
    });

    // --- 7. Equal Partner Access: Partner 3 can view and list events ---
    await test('Equal Partner Access: Partner 3 can retrieve list containing Partner 1 created event', async () => {
      const result = await eventService.getEvents({
        page: 1,
        limit: 10,
        sortBy: 'eventDate',
        sortOrder: 'desc',
      });

      assert(result.items.length > 0, 'Items should not be empty');
      const found = result.items.find((item) => item._id.toString() === createdEventId);
      assert(found, 'Partner 3 must be able to view event created by Partner 1');
    });

    // --- 8. Search Functionality ---
    await test('Search Functionality: filters accurately by title, guestName, and guestPhone', async () => {
      // By Title
      const byTitle = await eventService.getEvents({
        page: 1,
        limit: 10,
        search: 'Golden Jubilee',
        sortBy: 'eventDate',
        sortOrder: 'desc',
      });
      assert(byTitle.items.some((e) => e._id.toString() === createdEventId));

      // By Guest Name
      const byGuest = await eventService.getEvents({
        page: 1,
        limit: 10,
        search: 'Anirban',
        sortBy: 'eventDate',
        sortOrder: 'desc',
      });
      assert(byGuest.items.some((e) => e._id.toString() === createdEventId));

      // By Phone
      const byPhone = await eventService.getEvents({
        page: 1,
        limit: 10,
        search: '98300',
        sortBy: 'eventDate',
        sortOrder: 'desc',
      });
      assert(byPhone.items.some((e) => e._id.toString() === createdEventId));

      // Non-matching search
      const noMatch = await eventService.getEvents({
        page: 1,
        limit: 10,
        search: 'NonExistentTitleXYZ999',
        sortBy: 'eventDate',
        sortOrder: 'desc',
      });
      assert.strictEqual(noMatch.items.length, 0);
      assert.strictEqual(noMatch.pagination.totalItems, 0);
    });

    // --- 9. Pagination Metadata Verification ---
    await test('Pagination: returns accurate pagination metadata and boundaries', async () => {
      const parsedQuery = queryEventsSchema.parse({ page: '1', limit: '2' });
      const result = await eventService.getEvents(parsedQuery);

      assert.strictEqual(result.pagination.page, 1);
      assert.strictEqual(result.pagination.limit, 2);
      assert(result.pagination.totalItems >= 1);
      assert(result.pagination.totalPages >= 1);
      assert.strictEqual(result.pagination.hasPrevPage, false);
    });

    // --- 10. Invalid IDs & Not Found Errors ---
    await test('Error Handling: handles invalid ObjectId and non-existent IDs', async () => {
      // Invalid hex format
      await assert.rejects(
        async () => {
          await eventService.getEventById('invalid-id-123');
        },
        BadRequestError
      );

      // Valid format, non-existent record
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await assert.rejects(
        async () => {
          await eventService.getEventById(nonExistentId);
        },
        NotFoundError
      );
    });

    // --- 11. Soft Deletion & Audit Trail ---
    await test('Delete Event: marks record as deleted and tracks deleting partner', async () => {
      await eventService.deleteEvent(createdEventId, partner3._id);

      // Verify soft deletion in database
      const rawDoc = await Event.findById(createdEventId);
      assert(rawDoc, 'Document should still exist in database for audit integrity');
      assert.strictEqual(rawDoc.isDeleted, true);
      assert(rawDoc.deletedAt instanceof Date);
      assert.strictEqual(
        rawDoc.deletedByPartner?.toString(),
        partner3._id.toString(),
        'Deleting partner must be recorded'
      );

      // Verify that service getEventById throws NotFoundError for soft-deleted event
      await assert.rejects(async () => {
        await eventService.getEventById(createdEventId);
      }, NotFoundError);

      // Verify that getEvents list excludes deleted event
      const list = await eventService.getEvents({ page: 1, limit: 100, sortBy: 'eventDate', sortOrder: 'desc' });
      assert(!list.items.some((e) => e._id.toString() === createdEventId));

      // Clean up test document
      await Event.findByIdAndDelete(createdEventId);
    });

    // --- 12. Unauthorized Access Protection ---
    await test('Authorization Guard: requireAuth rejects unauthenticated requests', async () => {
      const mockReq: any = { headers: {} };
      const mockRes: any = {};
      let nextCalledWith: any = null;
      const next = (err?: any) => {
        nextCalledWith = err;
      };

      await requireAuth(mockReq, mockRes, next);
      assert(nextCalledWith instanceof UnauthorizedError, 'Should throw UnauthorizedError when token is missing');
    });

  } finally {
    if (createdEventId) {
      await Event.findByIdAndDelete(createdEventId);
    }
    await disconnectDatabase();
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 3 Event Test Suite Completed: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('====================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
};

runEventTests();
