import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .refine((port) => !isNaN(port) && port > 0 && port < 65536, {
      message: 'PORT must be a valid port number between 1 and 65535',
    }),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z
    .string()
    .default('mongodb://localhost:27017/lotus_caterer'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET should be at least 16 characters for security')
    .default('development_jwt_secret_must_be_overridden_in_production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:');
    result.error.issues.forEach((issue) => {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
export type Environment = z.infer<typeof envSchema>;
