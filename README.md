# MathSprint Android (GitHub APK build)

This repository contains the MathSprint web app and a GitHub Actions workflow that builds an Android debug APK.

## Build the APK on GitHub

1. Create a new **public or private** GitHub repository named `MathSprint`.
2. Upload the contents of this ZIP to the repository root. Make sure `.github/workflows/build-apk.yml` is included.
3. Commit the files to the `main` branch.
4. Open the repository's **Actions** tab.
5. Select **Build MathSprint APK** and click **Run workflow** (or wait for the automatic build after pushing to `main`).
6. Open the completed workflow run.
7. At the bottom, under **Artifacts**, download **MathSprint-debug-apk**.
8. Extract the downloaded ZIP. Install `app-debug.apk` on your Android phone.

## Notes

- This produces a **debug APK** for testing and direct installation, not a Play Store release.
- The Android project is generated in GitHub Actions, so you do not need Android Studio on your computer.
- App ID: `com.mathsprint.app`.
- To change the app ID or display name, edit `capacitor.config.json` before the first build.
- GitHub Actions may need to be enabled in the repository's Settings.
