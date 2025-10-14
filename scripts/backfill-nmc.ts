import { storage } from "../server/storage";
import { evaluateNMCStandards } from "../server/services/openai";
import { extractTextFromFile } from "../server/services/fileProcessor";
import path from "path";
import { promises as fs } from "fs";

async function backfillNMC() {
  console.log("🔍 Fetching evaluations without NMC assessment...");
  
  const allEvaluations = await storage.getAllEvaluations();
  const missingNmc = allEvaluations.filter(e => 
    e.status === "completed" && !e.nmcAssessment
  );

  console.log(`📚 Found ${missingNmc.length} books needing NMC assessment\n`);

  if (missingNmc.length === 0) {
    console.log("✅ All books already have NMC assessment!");
    return;
  }

  console.log("❌ Cannot automatically backfill - original files were deleted after processing.");
  console.log("\n📋 Books needing NMC assessment:");
  const separator = "=".repeat(80);
  console.log(separator);
  
  missingNmc.forEach((book, index) => {
    console.log(`${index + 1}. ${book.filename} (ID: ${book.id})`);
  });

  console.log("\n" + separator);
  console.log("\n💡 To backfill NMC assessment for these books:");
  console.log("1. Re-upload each book file using the API:");
  console.log("   curl -X POST http://localhost:5000/api/evaluations/{ID}/backfill-nmc \\");
  console.log("        -F 'file=@/path/to/book.pdf'");
  console.log("\n2. Or use the web interface (feature coming soon)");
  console.log("\n📝 Example for first book:");
  if (missingNmc[0]) {
    console.log(`   curl -X POST http://localhost:5000/api/evaluations/${missingNmc[0].id}/backfill-nmc \\`);
    console.log(`        -F 'file=@/path/to/${missingNmc[0].filename}'`);
  }
}

backfillNMC()
  .then(() => {
    console.log("\n✅ Backfill check complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
