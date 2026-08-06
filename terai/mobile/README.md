# RecruitAI Mobile App

Mobile application for RecruitAI HR Management System built with React Native and Expo.

## Features

### ✅ Implemented Features
- **Authentication**: Login with JWT tokens
- **Attendance Tracking**: GPS-based clock in/out with photo verification
- **Leave Management**: Request and track leave applications
- **Employee Profile**: View and edit personal information
- **Payslip Access**: View and download salary slips
- **Dashboard**: Quick access to HR information and requests

### 🚧 Planned Features
- Push notifications for approvals and reminders
- Document upload for expense claims
- Biometric authentication
- Offline data synchronization
- QR code attendance scanning

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: React hooks + Context
- **API Client**: Axios with automatic token refresh
- **Location Services**: Expo Location
- **Camera**: Expo Camera
- **Storage**: AsyncStorage + SecureStore

## Project Structure

```
mobile/
├── src/
│   ├── screens/          # App screens
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── AttendanceScreen.tsx
│   │   ├── LeaveScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── PayslipScreen.tsx
│   ├── components/       # Reusable components
│   ├── services/         # API services
│   │   └── api.service.ts
│   ├── navigation/       # Navigation types
│   │   └── types.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── utils/           # Utility functions
├── App.tsx              # Main app component
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── index.ts            # App entry point
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (macOS) or Android Studio (Windows/Linux)

### Installation

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start Expo development server:**
   ```bash
   npm start
   # or
   npx expo start
   ```

3. **Run on device/simulator:**
   - **iOS**: Press `i` in Expo CLI or scan QR code with Camera app
   - **Android**: Press `a` in Expo CLI or scan QR code with Expo Go app
   - **Web**: Press `w` in Expo CLI

### Environment Configuration

Create `.env` file in mobile directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api
EXPO_PUBLIC_ENV=development
```

## API Integration

The mobile app integrates with the main RecruitAI backend API:

### Authentication
- JWT-based authentication
- Automatic token refresh
- Secure token storage with Expo SecureStore

### Key Endpoints Used
- `POST /login` - User authentication
- `GET /attendance/*` - Attendance tracking
- `GET /leaves/*` - Leave management
- `GET /profile` - User profile
- `GET /payslips/*` - Salary information

## Permissions Required

Add these to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow RecruitAI to access your location for attendance tracking."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow RecruitAI to access your camera for photo verification."
        }
      ]
    ]
  }
}
```

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling
- Add loading states for better UX

### Navigation
- Use React Navigation v6
- Implement deep linking support
- Handle authentication flows properly

### API Integration
- Use the mobile API service for all HTTP requests
- Handle network errors gracefully
- Implement offline data handling
- Cache frequently used data

### Performance
- Optimize images and assets
- Implement proper list virtualization
- Use React.memo for expensive components
- Minimize bridge communication

## Testing

### Running Tests
```bash
npm test
```

### Testing Strategy
- Unit tests for utilities and services
- Integration tests for API calls
- E2E tests with Detox (planned)

## Deployment

### Build for Production

1. **iOS:**
   ```bash
   npx expo build:ios
   ```

2. **Android:**
   ```bash
   npx expo build:android
   ```

3. **Submit to stores:**
   - iOS: Upload to App Store Connect
   - Android: Upload to Google Play Console

### OTA Updates
Expo provides over-the-air updates for bug fixes and minor improvements.

## Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npx expo start --clear
   ```

2. **Cache issues:**
   ```bash
   npx expo start --clear
   rm -rf node_modules/.cache
   ```

3. **Permission issues:**
   - Reset permissions in device settings
   - Reinstall the app

### Debug Mode
- Use `console.log` for debugging
- Check Expo DevTools in browser
- Use Flipper for advanced debugging (iOS/Android)

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Update documentation for API changes
4. Test on both iOS and Android
5. Follow Git flow for branching

## Support

For support and questions:
- Check existing issues on GitHub
- Review Expo documentation
- Contact the development team

## License

This project is part of the RecruitAI HR Management System.