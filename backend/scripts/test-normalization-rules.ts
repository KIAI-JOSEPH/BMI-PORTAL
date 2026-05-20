import { normalizeText } from "../src/utils/dataNormalizer.js";

function runTest(input: string, type: 'name' | 'title', expected: string) {
  const result = normalizeText(input, type);
  if (result === expected) {
    console.log(`✅ PASSED: "${input}" (${type}) ➔ "${result}"`);
  } else {
    console.error(`❌ FAILED: "${input}" (${type}) | Expected: "${expected}" | Got: "${result}"`);
    process.exit(1);
  }
}

console.log("🧪 Running Text Normalization Rules Tests...\n");

// Test Name formatting
runTest("JOHN DOE", "name", "John Doe");
runTest("john doe", "name", "John Doe");
runTest("mary wanjiku kihara.", "name", "Mary Wanjiku Kihara");
runTest("mcdonald", "name", "McDonald");
runTest("O'CONNOR", "name", "O'Connor");
runTest("d'artagnan", "name", "d'Artagnan");
runTest("de la Cruz", "name", "De la Cruz"); // First word capitalized
runTest("marco de la Cruz", "name", "Marco de la Cruz"); // Inner particles lowercase
runTest("smith-jones", "name", "Smith-Jones");
runTest("   extra   spaces   ", "name", "Extra Spaces");

// Test Title formatting
runTest("DEPARTMENT OF THEOLOGY", "title", "Department of Theology");
runTest("school of ict", "title", "School of ICT");
runTest("DIPLOMA IN CHRISTIAN MINISTRY AND THEOLOGY", "title", "Diploma in Christian Ministry and Theology");
runTest("intro to theology", "title", "Intro to Theology");
runTest("master of divinity", "title", "Master of Divinity");
runTest("mdiv", "title", "MDiv");
runTest("GIATHUGU", "title", "Giathugu");

console.log("\n🎉 ALL NORMALIZATION TESTS PASSED SUCCESSFULLY!");
