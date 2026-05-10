# fooddash Mobile (React Native)

This project has been upgraded to a cross-platform (Universal) app using **Expo**.

## Architecture
- **Web**: Standard React + Vite (located in `src/`).
- **Mobile**: React Native + Expo (Entry point: `index.js` -> `src/App.native.tsx`).
- **Styles**: Shared Tailwind CSS via **NativeWind**.

## How to run the Mobile App
1.  **Export to ZIP**: Use the Export feature in the AI Studio settings menu.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start Expo**:
    ```bash
    npx expo start
    ```
4.  **Open on Phone**: Scan the QR code with the **Expo Go** app (available on App Store/Play Store).

## Building for Download
To create a standalone downloadable app (.apk or .ipa):
1.  **Install EAS CLI**:
    ```bash
    npm install -g eas-cli
    ```
2.  **Login to Expo**:
    ```bash
    eas login
    ```
3.  **Configure build**:
    ```bash
    eas build:configure
    ```
4.  **Run build**:
    ```bash
    eas build --platform android # or ios
    ```

## Development
- Edit `src/App.native.tsx` to modify the mobile UI.
- Use `lucide-react-native` for icons on mobile.
- Use `tailwind-merge` and `nativewind` for shared classes.
