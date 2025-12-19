import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AppDataSource } from './database';
import { User, UserRole, UserStatus } from '../entities/User';

const userRepository = AppDataSource.getRepository(User);

// Check if Google OAuth credentials are provided
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;

// Log the status of Google OAuth configuration
console.log('🔍 Checking Google OAuth configuration...');
console.log(`   GOOGLE_CLIENT_ID: ${googleClientId ? '✅ Set' : '❌ Missing'}`);
console.log(`   GOOGLE_CLIENT_SECRET: ${googleClientSecret ? '✅ Set' : '❌ Missing'}`);
console.log(`   GOOGLE_CALLBACK_URL: ${googleCallbackUrl ? '✅ Set' : '❌ Missing'}`);

// Only initialize Google Strategy if all credentials are available
if (googleClientId && googleClientSecret && googleCallbackUrl) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google email
          let user = await userRepository.findOne({
            where: { email: profile.emails![0].value },
          });

          if (user) {
            // User exists, update their info if needed
            if (!user.avatar && profile.photos && profile.photos.length > 0) {
              user.avatar = profile.photos[0].value;
              await userRepository.save(user);
            }
            return done(null, user);
          }

          // Create new user from Google profile
          user = userRepository.create({
            email: profile.emails![0].value,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            avatar: profile.photos?.[0]?.value || undefined,
            role: UserRole.CLIENT, // Default role for Google signin
            status: UserStatus.ACTIVE, // Google accounts are pre-verified
            emailVerifiedAt: new Date(),
            password: 'google-oauth', // Placeholder password for OAuth users
          });

          await userRepository.save(user);
          console.log(`✅ New Google OAuth user created: ${user.email}`);
          return done(null, user);
        } catch (error) {
          console.error('❌ Google OAuth error:', error);
          return done(error, undefined);
        }
      }
    )
  );

  console.log('✅ Google OAuth strategy initialized successfully');
} else {
  console.log('⚠️  Google OAuth strategy disabled - missing credentials');
  console.log('   To enable Google OAuth:');
  console.log('   1. Get credentials from: https://console.cloud.google.com/');
  console.log('   2. Uncomment GOOGLE_* variables in .env file');
  console.log('   3. Add your actual Google OAuth credentials');
}

// Serialize/deserialize user for session management
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userRepository.findOne({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;