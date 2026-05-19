import { Hono } from "hono";
import { z } from "zod";
import { logger } from "../utils/logger.js";
import { getGoogleSheetRange } from "../services/googleAuth.js";
import { importRelationalData } from "../services/importService.js";
import { getPocketBase } from "../services/pocketbase.js";

const sheetsRouter = new Hono();

const webhookPayloadSchema = z.object({
  spreadsheetId: z.string(),
  sheets: z.array(z.string()),
});

/**
 * Converts 2D string grid from Google Sheets into JSON rows using the first row as headers.
 */
function parseSheetRows(rows: string[][]): any[] {
  if (!rows || rows.length < 2) return [];
  
  // Clean headers (trim whitespace, handle undefined)
  const headers = rows[0].map(h => String(h || "").trim());
  const parsed: any[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Skip entirely blank rows
    if (!row || row.every(cell => !cell || String(cell).trim() === "")) {
      continue;
    }
    
    const obj: any = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (header) {
        obj[header] = row[j] !== undefined ? String(row[j]).trim() : "";
      }
    }
    parsed.push(obj);
  }
  return parsed;
}

/**
 * POST /api/v1/import/sheets-webhook
 * 
 * Secure webhook triggered by Google Sheets Apps Script on request/edit.
 * Verifies authenticity, retrieves the spreadsheet data in batch, runs schemas, and inserts into PocketBase.
 */
sheetsRouter.post("/sheets-webhook", async (c) => {
  const incomingToken = c.req.header("X-BMI-Webhook-Token");
  const configuredSecret = process.env.BMI_WEBHOOK_SECRET || "default_test_secret";

  if (!incomingToken || incomingToken !== configuredSecret) {
    logger.warn("Blocked unauthorized Google Sheets webhook sync attempt. Invalid header token.");
    return c.json({ success: false, error: "Unauthorized webhook token" }, 401);
  }

  try {
    const body = await c.req.json();
    const parseResult = webhookPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json(
        {
          success: false,
          error: "Invalid payload format. Required 'spreadsheetId' and 'sheets' list.",
          details: parseResult.error.issues,
        },
        400
      );
    }

    const { spreadsheetId, sheets } = parseResult.data;
    logger.info(`Processing Google Sheets webhook sync for Spreadsheet: ${spreadsheetId}`);

    // Map of sheet tab prefix/patterns to our relational payload keys
    const tabMap: Record<string, string> = {
      "FACULTIES": "faculties",
      "DEPARTMENTS": "departments",
      "PROGRAMS": "programs",
      "COURSES": "courses",
      "PROG_COURSES": "program_courses",
      "STAFF": "staff",
      "STUDENTS": "students",
      "ENROLLMENTS": "enrollments",
      "GRADES": "grades",
    };

    const importPayload: Record<string, any[]> = {
      faculties: [],
      departments: [],
      programs: [],
      courses: [],
      program_courses: [],
      staff: [],
      students: [],
      enrollments: [],
      grades: [],
    };

    // Retrieve sheet data from Google API
    for (const tabName of sheets) {
      // Find matching schema collection based on tab suffix/containment
      const upperTab = tabName.toUpperCase();
      let matchedKey: string | null = null;
      for (const [pattern, key] of Object.entries(tabMap)) {
        if (upperTab.includes(pattern)) {
          matchedKey = key;
          break;
        }
      }

      if (!matchedKey) {
        logger.info(`Skipping Sheet Tab: "${tabName}" (no matching UMS collection pattern)`);
        continue;
      }

      try {
        // Fetch values. Example range: '01_FACULTIES'!A1:Z5000
        const range = `'${tabName}'!A1:Z5000`;
        const rawGrid = await getGoogleSheetRange(spreadsheetId, range);
        const parsedRows = parseSheetRows(rawGrid);
        
        importPayload[matchedKey] = parsedRows;
        logger.info(`Loaded ${parsedRows.length} rows from Sheet Tab: "${tabName}" (UMS collection: ${matchedKey})`);
      } catch (err: any) {
        logger.error(`Error loading Sheet Tab "${tabName}":`, err.message);
        // Continue loading other sheets even if one fails (partial resilience)
      }
    }

    // Call relational import engine
    logger.info("Executing relational import on sheet payloads");
    const results = await importRelationalData(importPayload);

    // Save sync audit record in database for administrators to monitor
    try {
      const pb = getPocketBase();
      // Ensure sync_logs / verification_logs can store this
      await pb.collection("verification_logs").create({
        certificate_serial: `SYNC-SHEET-${new Date().getFullYear()}`,
        result: `success: ${JSON.stringify(results)}`,
        method: "google_sheets_sync",
        ip_address: c.req.header("x-forwarded-for") || "google_apps_script",
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      logger.error("Failed to write to verification_logs for sheets sync audit trail:", e.message);
    }

    return c.json({
      success: true,
      message: "Spreadsheet records successfully synchronized.",
      results,
    });
  } catch (error: any) {
    logger.error("Google Sheets webhook processing failed:", error.message);
    return c.json(
      {
        success: false,
        error: "Synchronization processing failed. Check server logs.",
        details: error.message,
      },
      500
    );
  }
});

export default sheetsRouter;
