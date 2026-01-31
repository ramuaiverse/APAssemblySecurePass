# AP Assembly Digital Pass

Secure pass application for AP Assembly - A React Native Expo app for scanning, validating, and issuing visitor passes.

## Features

- **Custom Splash Screen**: Beautiful splash screen with AP Assembly branding
- **Secure Authentication**: Login with username and password for admin and security roles
- **QR Code Scanner**: Scan visitor pass QR codes with camera integration
- **Pass Validation**: Validate scanned QR codes and display visitor details
- **Issue Visitor Pass**: Create new visitor passes with comprehensive form
- **Pass Preview**: Preview generated passes before finalizing
- **Gate Selection**: Select gate location (Gate 1, 2, 3, 4, or Gallery) for validation
- **Action Tracking**: Track entry and exit actions for visitor passes

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
├── App.tsx                          # Main app entry point
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
    │   ├── LoginMethodSelectionScreen.tsx  # Initial screen to choose login method (Username/Password or Username/OTP)
    │   ├── LoginScreen.tsx          # Username/password authentication screen for admin and security roles
    │   ├── UsernameOTPLoginScreen.tsx  # Username/OTP authentication screen
    │   ├── SetPasswordScreen.tsx   # Set password screen for first-time login users
    │   ├── ForgotPasswordScreen.tsx  # Forgot password screen (step 1: enter username to receive OTP)
    │   ├── ResetPasswordScreen.tsx  # Reset password screen (step 2: enter OTP and set new password)
    │   ├── PreCheckScreen.tsx       # Pre-check screen for security users to choose validation mode
    │   ├── QRScanScreen.tsx         # QR code scanner screen with gate/action selection for pass validation
    │   ├── ValidPassScreen.tsx      # Display valid pass details after successful validation
    │   ├── InvalidPassScreen.tsx    # Display invalid pass alert when validation fails
    │   ├── HomeScreen.tsx           # Dashboard screen showing statistics and quick actions (role-based)
    │   ├── VisitorsScreen.tsx       # List of visitor requests with filtering, search, and status management (legislative users)
    │   ├── VisitorDetailsScreen.tsx # Detailed view of a visitor pass with timeline and approval history
    │   ├── StatusAndApprovalsScreen.tsx  # Pass requests and approval screen for department and peshi users
    │   ├── RequestDetailsScreen.tsx # Request details screen showing visitor and request information
    │   ├── IssueVisitorPassScreen.tsx  # Form to create new visitor pass (insta pass for legislative users)
    │   ├── PreviewPassScreen.tsx    # Preview generated pass with QR code before sharing
    │   ├── MyPassRequestsScreen.tsx # List of user's own pass requests (department/peshi users)
    │   ├── RequestVisitorPassScreen.tsx  # Form to request a new visitor pass (department/peshi users)
    │   ├── MyPassRequestDetailsScreen.tsx  # Details of user's own pass request
    │   ├── LegislativeApproveScreen.tsx  # Screen for legislative users to approve visitor requests
    │   ├── LegislativeRejectScreen.tsx  # Screen for legislative users to reject visitor requests
    │   └── LegislativeRouteScreen.tsx  # Screen for legislative users to route requests to superiors
    ├── services/                    # API and business logic services
    │   └── api.ts                   # API client for backend communication
    └── types/                       # TypeScript type definitions
        └── index.ts                 # Navigation and API type definitions
```

## API Integration

The app integrates with backend APIs for authentication and pass management:

- **API Base URL**: `https://category-service-714903368119.us-central1.run.app`

### Authentication Endpoints

- `POST /api/v1/pass-requests/auth/login` - Username and password authentication (admin/security roles)
- `POST /api/v1/pass-requests/auth/otp/generate` - Generate OTP for username-based login or forgot password flow
  - Form fields: `username`, `expected_role` (empty string)
- `POST /api/v1/pass-requests/auth/otp/verify` - Verify OTP and complete login or reset password
  - Form fields: `username`, `otp_code`, `expected_role` (empty string)
- `POST /api/v1/pass-requests/auth/set-password` - Set password for first-time login (multipart/form-data)
  - Form fields: `username`, `password` (minimum 12 characters)

### Validation Endpoints (Public)

- `GET /api/v1/pass-requests/validate-qr/{qrCodeId}` - Validate QR code (public, no authentication required)
  - Query parameters: `gate` (optional), `gate_action` (optional: "entry" | "exit")
- `GET /api/v1/pass-requests/validate-pass-number/{passNumber}` - Validate pass number (public, no authentication required)
  - Query parameters: `auto_record_scan` (default: true), `scanned_by` (optional), `gate_location` (optional), `gate_action` (optional: "entry" | "exit")

### Category Endpoints

- `GET /api/v1/categories/main` - Get all main categories
- `GET /api/v1/categories/main/{categoryId}/pass-types` - Get pass type IDs for a specific category
- `GET /api/v1/categories/pass-types?active_only=true` - Get all active pass types
- `GET /api/v1/categories/sessions?limit=1000&active_only=true` - Get all active sessions

### Pass Request Endpoints

- `POST /api/v1/pass-requests/submit-with-files` - Submit pass request with visitor photos and documents (multipart/form-data)
- `PATCH /api/v1/pass-requests/{requestId}/status` - Update pass request status (approve/reject)
- `POST /api/v1/pass-requests/{requestId}/generate-pass` - Generate pass for a pass request
- `GET /api/v1/pass-requests/{requestId}` - Get pass request details

### Issuer Endpoints

- `GET /api/v1/issuers?limit=100&is_active=true` - Get all active pass issuers

### Visitor Endpoints

- `POST /api/v1/pass-requests/visitors/{visitorId}/suspend` - Suspend a visitor pass

## Authentication & Security

- **Login Methods**:
  - Username and password authentication
  - Username and OTP (One-Time Password) authentication
- **First-Time Login**: Users with `is_first_time_login: true` are redirected to set password screen
- **Forgot Password Flow**:
  1. User clicks "Forgot Password?" on login screen
  2. Enter username to receive OTP
  3. OTP is sent to registered email/phone
  4. Enter OTP and set new password
  5. User is automatically logged out after successful password reset
- **Password Requirements**: Minimum 12 characters for new passwords
- **Role-Based Access**: Separate login flows for admin and security roles
- **Admin Access**: Full access to issue visitor passes
- **Security Access**: Access to QR scanning and pass validation
- **Session Management**: Simple session-based navigation (no persistent storage)
- **OTP System**: OTP is sent to registered email/phone for username-based login and password reset

## Technologies Used

- **React Native** (0.81.4) - Mobile framework
- **Expo** (^54.0.0) - Development platform
- **TypeScript** (~5.9.2) - Type safety
- **React Navigation** - Navigation library
  - `@react-navigation/native` (^6.1.18)
  - `@react-navigation/native-stack` (^6.9.17)
- **Expo Camera** (~17.0.10) - QR code scanning
- **React Native SVG** (15.12.1) - SVG rendering
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

## Screens Overview

The application consists of 23 screens organized by functionality:

### Authentication Screens (6 screens)

1. **LoginMethodSelectionScreen** - Initial entry point allowing users to choose between Username/Password or Username/OTP login methods
2. **LoginScreen** - Username and password authentication for admin and security roles with role-based access control
3. **UsernameOTPLoginScreen** - Username and OTP-based authentication flow
4. **SetPasswordScreen** - First-time login screen for users who need to set their password (minimum 12 characters)
5. **ForgotPasswordScreen** - Step 1 of password reset: enter username to receive OTP
6. **ResetPasswordScreen** - Step 2 of password reset: enter OTP and set new password

### Security & Validation Screens (4 screens)

7. **PreCheckScreen** - Security user landing screen with options to choose validation mode (Gate Entry/Exit or Verify Visitor)
8. **QRScanScreen** - QR code scanner with camera integration, gate selection, and action tracking (entry/exit)
9. **ValidPassScreen** - Displays valid pass details after successful validation with visitor information
10. **InvalidPassScreen** - Shows error alert when pass validation fails (expired, rejected, or invalid)

### Dashboard & Navigation (1 screen)

11. **HomeScreen** - Role-based dashboard showing:
   - Statistics cards (Total Requests, Pending, Approved, Routed, Rejected, Visitors)
   - Quick action cards (Insta Pass/Request Pass, Visitors/Status & Approvals)
   - Different metrics and actions based on user role (legislative, department, peshi)

### Visitor Management Screens (3 screens)

12. **VisitorsScreen** - Comprehensive visitor request management for legislative users:
   - Filtering by status, pass type, category, date
   - Search functionality
   - Lazy loading with infinite scroll
   - Approve, reject, route for approval actions
   - Suspend/activate visitor passes
   - View visitor details

13. **VisitorDetailsScreen** - Detailed visitor pass view showing:
   - Visitor information (name, email, phone, identification, car passes)
   - Request information
   - Dates & timeline
   - Approval timeline with status history
   - Pass information (if generated)

14. **RequestDetailsScreen** - Request details view showing:
   - Visitor information with car pass details
   - Request information
   - Timeline of request status changes

### Department & Peshi User Screens (4 screens)

15. **StatusAndApprovalsScreen** - Pass requests and approval screen for department and peshi users:
   - View all pass requests filtered by role (department/peshi)
   - Filter by status, date, and search
   - Approve/reject individual visitors or bulk actions
   - HOD approval workflow
   - Lazy loading support

16. **MyPassRequestsScreen** - List of user's own pass requests (department/peshi users)
17. **RequestVisitorPassScreen** - Form to request a new visitor pass (department/peshi users)
18. **MyPassRequestDetailsScreen** - Details of user's own pass request

### Legislative Approval Screens (3 screens)

19. **LegislativeApproveScreen** - Screen for legislative users to approve visitor requests:
   - View visitor and request details
   - Select pass type and session
   - Approve and generate pass
   - Car pass information display

20. **LegislativeRejectScreen** - Screen for legislative users to reject visitor requests with reason
21. **LegislativeRouteScreen** - Screen for legislative users to route requests to superiors for approval

### Pass Issuance Screens (2 screens)

22. **IssueVisitorPassScreen** - Form to create new visitor pass instantly (legislative users):
   - Category and sub-category selection
   - Pass type selection
   - Visitor information form
   - Session selection
   - Date and time selection
   - File uploads (photos, documents)
   - Car pass information

23. **PreviewPassScreen** - Preview generated pass with QR code:
   - Pass details display
   - QR code visualization
   - Share and print options

## Features & Functionality

### Pass Issuance Flow

1. **Category Selection**: Select main category (e.g., Media, Department, etc.)
2. **Sub-Category & Pass Type**: Automatically filtered based on selected category
3. **Visitor Information**: Enter visitor details (name, email, phone, identification)
4. **Session Selection**: Optional session selection for the pass
5. **Date & Time**: Default valid from (8 AM) and valid to (5 PM) on current date
6. **File Uploads**: Support for visitor photos and identification documents
7. **Auto-Approval**: Passes are automatically approved and generated upon submission
8. **Pass Preview**: Preview generated pass with QR code before sharing

### Validation Flow

1. **Mode Selection**: Choose between "Gate Entry/Exit" or "Verify Visitor" mode
2. **Gate Selection**: Select gate location (Gate 1, 2, 3, 4, or Gallery) - required for entry/exit mode
3. **Action Selection**: Select action type (Entry or Exit) - required for entry/exit mode
4. **QR Scanning**: Scan QR code or enter 5-digit pass number
5. **Validation**: Pass is validated against backend system
6. **Result Display**: Show valid pass details or invalid pass alert

## Notes

- The app uses role-based authentication (admin/security)
- Two login methods available: Username/Password and Username/OTP
- Admin users can issue visitor passes
- Security users can scan and validate passes
- Gate selection (Gate 1, 2, 3, 4, or Gallery) is required for entry/exit validation mode
- Entry and exit actions can be tracked during validation
- The app supports various pass types including daily, single, multiple, and event passes
- Passes are automatically approved and generated upon submission for instant issuance
- All logout actions navigate to the login method selection screen
