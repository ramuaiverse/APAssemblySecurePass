# AP Assembly Digital Pass

Secure pass application for AP Assembly - A React Native Expo app for scanning, validating, and issuing visitor passes.

## Features

- **Custom Splash Screen**: Beautiful splash screen with AP Assembly branding
- **Secure Authentication**: Login with username and password, automatic token refresh, and session management
- **QR Code Scanner**: Scan visitor pass QR codes with camera integration
- **Pass Validation**: Validate scanned QR codes and display visitor details
- **Issue Visitor Pass**: Create new visitor passes with comprehensive form
- **Pass Preview**: Preview generated passes before finalizing
- **Token Management**: Automatic token refresh and inactivity-based logout
- **Offline Support**: Token storage with AsyncStorage for persistent sessions

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli` or use `npx expo`)
- iOS Simulator (for Mac) or Android Emulator / Physical device with Expo Go app

## Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app on your physical device

## Project Structure

```
APAssemblySecurePass/
├── App.tsx                          # Main app entry point with token initialization
├── app.json                         # Expo configuration
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── babel.config.js                  # Babel configuration
├── metro.config.js                  # Metro bundler configuration with SVG support
├── svg.d.ts                         # SVG module type definitions
├── assets/                          # Static assets (SVG icons, images)
│   ├── icon.png
│   ├── approved.svg
│   ├── assembly.svg
│   ├── assemblyDigitalPass.svg
│   ├── assemblyIcon.svg
│   ├── backButton.svg
│   ├── backGround.svg
│   ├── calendar.svg
│   ├── chevronDown.svg
│   ├── close.svg
│   ├── digitalPass.svg
│   ├── download.svg
│   ├── eye.svg
│   ├── flash.svg
│   ├── login.svg
│   ├── logOut.svg
│   ├── password.svg
│   ├── print.svg
│   ├── questionMark.svg
│   ├── reference.svg
│   ├── share.svg
│   ├── userName.svg
│   ├── visitor.svg
│   └── visitorPass.svg
└── src/
    ├── Components/                  # Reusable components
    │   └── CustomSplashScreen.tsx   # Custom splash screen component
    ├── navigation/                  # Navigation setup
    │   └── index.tsx                # Navigation configuration with stack navigator
    ├── screens/                     # Screen components
    │   ├── LoginScreen.tsx          # Authentication screen
    │   ├── QRScanScreen.tsx        # QR code scanner screen
    │   ├── ValidPassScreen.tsx      # Display valid pass details
    │   ├── InvalidPassScreen.tsx    # Display invalid pass alert
    │   ├── IssueVisitorPassScreen.tsx  # Form to create new visitor pass
    │   └── PreviewPassScreen.tsx    # Preview generated pass
    ├── services/                    # API and business logic services
    │   ├── api.ts                   # API client with authentication
    │   ├── tokenManager.ts          # Token refresh and session management
    │   └── tokenStorage.ts          # AsyncStorage wrapper for token persistence
    └── types/                       # TypeScript type definitions
        └── index.ts                 # Navigation and API type definitions
```

## API Integration

The app integrates with a backend API for authentication and pass management:

- **Base URL**: `https://smart-gate-backend-714903368119.us-central1.run.app`
- **Authentication**: JWT-based with access and refresh tokens
- **Endpoints**:
  - `POST /api/v1/auth/login` - User authentication
  - `POST /api/v1/auth/refresh` - Token refresh
  - `POST /api/v1/passes/validate` - QR code validation
  - `POST /api/v1/passes` - Create new visitor pass

## Authentication & Security

- **Token Management**: Automatic token refresh before expiry
- **Session Management**: Inactivity-based logout (5 minutes of inactivity)
- **Secure Storage**: Tokens stored securely using AsyncStorage
- **Auto-refresh**: Tokens are refreshed automatically when app becomes active
- **Token Validation**: Automatic validation on app startup

## Technologies Used

- **React Native** (0.81.4) - Mobile framework
- **Expo** (^54.0.0) - Development platform
- **TypeScript** (~5.9.2) - Type safety
- **React Navigation** - Navigation library
  - `@react-navigation/native` (^6.1.18)
  - `@react-navigation/native-stack` (^6.9.17)
- **Expo Camera** (~15.0.0) - QR code scanning
- **AsyncStorage** (@react-native-async-storage/async-storage) - Token persistence
- **React Native SVG** (^15.12.1) - SVG rendering
- **React Native SVG Transformer** (^1.5.1) - SVG import support
- **Expo Linear Gradient** (^15.0.7) - Gradient backgrounds
- **Expo Vector Icons** (^14.0.0) - Icon library
- **React Native QRCode SVG** (^6.3.21) - QR code generation
- **React Native View Shot** (^4.0.3) - Screenshot/capture functionality
- **Expo Print** (~15.0.8) - Print functionality
- **React Native Calendars** (^1.1313.0) - Date picker
- **Expo File System** (~19.0.20) - File operations

## Configuration

### TypeScript Path Aliases

The project uses path aliases for cleaner imports:

- `@/*` maps to `src/*`

Example: `import { api } from "@/services/api"`

### SVG Support

SVG files are imported as React components thanks to `react-native-svg-transformer`:

```typescript
import Icon from "@/assets/icon.svg";
```

## Development Scripts

- `npm start` - Start Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start on web browser

## Testing QR Codes

The app validates QR codes by sending the `qr_code_id` to the backend API. The QR code should contain a valid pass ID that exists in the system.

**Valid Pass Response:**

- Status: `approved`
- Contains visitor details (name, phone, organization, purpose, dates, etc.)

**Invalid Pass Scenarios:**

- Status: `rejected` or `expired`
- QR code ID not found in system
- Pass has expired
- Pass has been revoked

## Permissions

- **Camera**: Required for QR code scanning
  - iOS: Configured in `app.json` infoPlist
  - Android: Configured in `app.json` permissions

## Notes

- The app automatically handles token refresh and session management
- Users are logged out after 5 minutes of inactivity
- Tokens are validated on app startup
- The app supports both single and multiple entry passes
- Pass types include: daily, single, multiple, and event passes
