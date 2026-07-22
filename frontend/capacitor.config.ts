import type { CapacitorConfig } from "@capacitor/cli";

const mode = process.env.CAPACITOR_BUILD_MODE ?? "development";
const configuredUrl = process.env.CAPACITOR_SERVER_URL?.trim();

if (mode === "production" && !configuredUrl) {
  throw new Error(
    "CAPACITOR_SERVER_URL is required for a production iOS sync because Persist uses Next.js server features.",
  );
}

const serverUrl = configuredUrl ?? "http://localhost:3000";
if (mode === "production" && !serverUrl.startsWith("https://")) {
  throw new Error("Production CAPACITOR_SERVER_URL must use HTTPS.");
}

const config: CapacitorConfig = {
  appId: "com.persistfitness.app",
  appName: "Persist Fitness",
  webDir: "native-shell",
  backgroundColor: "#050505",
  loggingBehavior: mode === "production" ? "none" : "debug",
  server: {
    url: serverUrl,
    cleartext: mode !== "production" && serverUrl.startsWith("http://"),
    errorPath: "index.html",
  },
  ios: {
    backgroundColor: "#050505",
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "App",
  },
  includePlugins: ["@capacitor/app", "@capacitor/splash-screen"],
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: "#050505",
      showSpinner: false,
    },
  },
};

export default config;
