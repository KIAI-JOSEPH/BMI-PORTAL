import { getPocketBase, authenticateAdmin } from "../src/services/pocketbase.js";

async function main() {
  try {
    console.log("🔓 Authenticating Admin...");
    await authenticateAdmin();
    const pb = getPocketBase();
    console.log("✅ Authenticated.");

    console.log("\n🏫 Creating test campus with name: 'GIATHUGU CAMPUS.' and location: 'KRIYINYAGA county'...");
    const testCampus = await pb.collection("campuses").create({
      name: "GIATHUGU CAMPUS.",
      location: "KRIYINYAGA county",
      code: "TEST-CAMPUS-123"
    });

    console.log("Created Campus Details:");
    console.log(`- ID: ${testCampus.id}`);
    console.log(`- Code: ${testCampus.code}`);
    console.log(`- Name: "${testCampus.name}" (Expected: "Giathugu Campus")`);
    console.log(`- Location: "${testCampus.location}" (Expected: "Kriyinyaga County")`);

    if (testCampus.name === "Giathugu Campus" && testCampus.location === "Kriyinyaga County") {
      console.log("\n🎉 POCKETBASE PROXY WRAPPER WRITE NORMALIZATION WORKS PERFECTLY!");
    } else {
      console.error("\n❌ NORMALIZATION FAILED!");
    }

    // Clean up
    console.log("\n🧹 Cleaning up test campus...");
    await pb.collection("campuses").delete(testCampus.id);
    console.log("✅ Cleaned up.");
    
  } catch (error) {
    console.error("❌ Error in test:", error);
    process.exit(1);
  }
}

main();
