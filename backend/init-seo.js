import { createSeoTables } from "./database/migrate-seo-complete.js";

// Initialize SEO tables and settings
async function initSeo() {
  try {
    console.log("🔄 Initializing SEO system...");
    await createSeoTables();
    console.log("✅ SEO system initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize SEO system:", error);
  }
}

// Auto-run if script is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  initSeo();
}

export { initSeo };
