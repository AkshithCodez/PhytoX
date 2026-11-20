import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.phytox.app",
  appName: "PhytoX",
  webDir: "out",
  bundledWebRuntime: false,
  server: {
    // When developing with live device or packaging PWA shell
    androidScheme: "https",
    iosScheme: "https",
    allowNavigation: ["phytox.vercel.app", "127.0.0.1", "localhost"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0A0F12",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0A0F12",
    },
  },
};

export default config;
