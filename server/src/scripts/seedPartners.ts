import mongoose from 'mongoose';
import { env } from '../config/env';
import { Partner } from '../modules/partners/partner.model';
import { User } from '../modules/auth/user.model';

interface PartnerSeedConfig {
  name: string;
  username: string;
  defaultPassword: string;
}

const defaultPartnerConfigs: PartnerSeedConfig[] = [
  {
    name: process.env.PARTNER_1_NAME || 'Partner 1',
    username: (process.env.PARTNER_1_USERNAME || 'partner1').toLowerCase().trim(),
    defaultPassword: process.env.PARTNER_1_PASSWORD || 'Partner1@Lotus2026',
  },
  {
    name: process.env.PARTNER_2_NAME || 'Partner 2',
    username: (process.env.PARTNER_2_USERNAME || 'partner2').toLowerCase().trim(),
    defaultPassword: process.env.PARTNER_2_PASSWORD || 'Partner2@Lotus2026',
  },
  {
    name: process.env.PARTNER_3_NAME || 'Partner 3',
    username: (process.env.PARTNER_3_USERNAME || 'partner3').toLowerCase().trim(),
    defaultPassword: process.env.PARTNER_3_PASSWORD || 'Partner3@Lotus2026',
  },
];

export const seedPartners = async (): Promise<void> => {
  console.log('----------------------------------------------------');
  console.log('🌱 Initiating Idempotent 3-Partner Provisioning...');
  console.log('----------------------------------------------------');

  for (let i = 0; i < defaultPartnerConfigs.length; i++) {
    const config = defaultPartnerConfigs[i];
    const partnerNumber = i + 1;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ username: config.username });

    if (existingUser) {
      console.log(
        `ℹ️ [Partner ${partnerNumber}] User '${config.username}' already exists. (Skipped to preserve existing credentials).`
      );
      continue;
    }

    // 2. Resolve or create Partner entity
    let partner = await Partner.findOne({ name: config.name });
    if (!partner) {
      partner = await Partner.create({
        name: config.name,
        status: 'ACTIVE',
      });
      console.log(`✅ [Partner ${partnerNumber}] Created partner record: '${partner.name}' (ID: ${partner._id})`);
    } else {
      console.log(`ℹ️ [Partner ${partnerNumber}] Existing partner record found: '${partner.name}'`);
    }

    // 3. Hash password and create User entity with 1-to-1 partner reference
    const passwordHash = await User.hashPassword(config.defaultPassword);
    const user = await User.create({
      partner: partner._id,
      username: config.username,
      passwordHash,
      status: 'ACTIVE',
    });

    console.log(
      `✅ [Partner ${partnerNumber}] Created user login credentials for username: '${user.username}'.`
    );
  }

  console.log('----------------------------------------------------');
  console.log('🎉 Partner Provisioning Process Completed.');
  console.log('All three partners have equal administrative rights & access.');
  console.log('----------------------------------------------------');
};

// Allow direct CLI execution: tsx src/scripts/seedPartners.ts
if (require.main === module) {
  mongoose
    .connect(env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB for provisioning.');
      await seedPartners();
      await mongoose.disconnect();
      console.log('Database disconnected cleanly.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Provisioning failed:', err.message || err);
      process.exit(1);
    });
}
