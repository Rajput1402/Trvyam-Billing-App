<<<<<<< HEAD
# BizTracker

backend/  ASP.NET Core 8 API (PostgreSQL: Neon or Supabase)
mobile/   Android app (React Native with Expo)

## 1. Backend
1. Create a free Postgres database (Neon or Supabase; for Supabase use the Session pooler details).
2. Edit backend/appsettings.json: connection string, a long random Jwt:Key, your admin username and password.
3. cd backend && dotnet run --urls http://0.0.0.0:5000
   (tables and the first admin are created on start)

## 2. Mobile app
1. Install Node.js 18+, then: cd mobile && npm install
2. Edit mobile/src/api.js and set BASE_URL (comments in the file explain emulator, phone and deployed cases).
3. npx expo start, then open it in the Expo Go app on your phone, or press "a" for an Android emulator.

## 3. First use
Sign in as admin, open Manage, create your 3 default accounts (Default switch on), then add businesses.

## Build an APK to install on phones
npm install -g eas-cli, then in mobile/: eas build -p android --profile preview
(needs a free Expo account; the backend must be on an https:// address for release builds)
=======
# Trvyam-Billing-App
Trvyam Group 
>>>>>>> e085e8a3eabca26f5b225706472327d4c779921f
