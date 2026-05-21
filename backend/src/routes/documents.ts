/**
 * BMI UMS — Unified Document Verification Route
 *
 * POST /api/v1/documents/verify
 *
 * One endpoint to rule them all.  The frontend sends any BMI document serial
 * and the router dispatches to the correct collection based on the prefix:
 *
 *   BMI-TRANS-YYYY-NNNNNN  → transcripts collection
 *   BMI-YYYY-NNNNNN        → certificates collection  (legacy format)
 *   BMI-CERT-YYYY-NNNNNN   → certificates collection  (future format)
 *
 * This means the verification page needs zero knowledge of document types —
 * it just submits a serial and receives a unified result shape.
 */

import { Hono } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { getPocketBase } from "../services/pocketbase.js";
import { logger } from "../utils/logger.js";
import {
  verifyHiddenToken,
  verifyOfflineJWT,
  verifyCertificateSignature,
  buildSigningPayload,
} from "../services/certificateSigning.js";
import { errorMessage, isValidCertificateSerial } from "../utils/helpers.js";

const documentsRouter = new Hono();

const verifyRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for") ||
    c.req.header("x-real-ip") ||
    "unknown",
  message: {
    valid: false,
    error: "Too many requests. Please wait 15 minutes.",
    code: "RATE_LIMITED",
  },
});

// ─── Shared result shape ──────────────────────────────────────────────────────
interface UnifiedVerifyResult {
  valid: boolean;
  documentType?: "certificate" | "transcript";
  document?: {
    serial_number: string;
    holder_name: string;
    credential: string;       // degree (cert) or programme (transcript)
    institution: string;
    issued_at: string;
    status: "active" | "revoked" | "suspended";
    // cert-specific
    faculty?: string;
    department?: string;
    graduation_class?: string;
    gpa?: number;
    // transcript-specific
    academic_year?: string;
    // student-specific (new for premium portal features)
    student_photo?: string;
    student_photo_zoom?: number;
    student_photo_position?: { x: number; y: number };
    student_status?: string;
    student_reg_no?: string;
    student_campus?: string;
    student_mode_of_study?: string;
    student_admission_year?: string;
    student_year_of_study?: string;
  };
  verification?: {
    timestamp: string;
    method: string;
    token_verified: boolean;
    confidence: "high" | "medium" | "low";
    verification_count: number;
  };
  error?: string;
  code?: string;
}

async function logAttempt(
  serial: string,
  collection: string,
  result: string,
  ip: string,
): Promise<void> {
  try {
    const pb = getPocketBase();
    await pb.collection("verification_logs").create({
      certificate_serial: serial,
      result,
      method: "unified",
      ip_address: ip,
      user_agent: "",
      timestamp: new Date().toISOString(),
    });
  } catch {
    /* non-critical */
  }
}

// ─── POST /api/v1/documents/verify ───────────────────────────────────────────
documentsRouter.post("/verify", verifyRateLimiter, async (c) => {
  const ip =
    c.req.header("x-forwarded-for") ||
    c.req.header("x-real-ip") ||
    "unknown";

  try {
    const body = await c.req.json();
    const {
      serial,
      t: token,
      sig,
      hash,
      offline_jwt,
    } = body as {
      serial?: string;
      t?: string;
      sig?: string;
      hash?: string;
      offline_jwt?: string;
    };

    if (!serial || typeof serial !== "string") {
      return c.json<UnifiedVerifyResult>({
        valid: false,
        error: "Serial number is required",
        code: "MISSING_SERIAL",
      });
    }

    const cleanSerial = serial.trim().toUpperCase();
    const pb = getPocketBase();
    const safe = (v: string) => v.replace(/["'\\]/g, "");

    // ══════════════════════════════════════════════════════════════════════
    // TRANSCRIPT  (BMI-TRANS-YYYY-NNNNNN)
    // ══════════════════════════════════════════════════════════════════════
    if (/^BMI-TRANS-\d{4}-\d{6}$/.test(cleanSerial)) {
      const results = await pb.collection("transcripts").getList(1, 1, {
        filter: `serial_number = "${safe(cleanSerial)}"`,
      });

      if (results.totalItems === 0) {
        await logAttempt(cleanSerial, "transcripts", "not_found", ip);
        return c.json<UnifiedVerifyResult>({
          valid: false,
          documentType: "transcript",
          error:
            "Transcript not found in the BMI University registry. " +
            "If recently issued, please try again shortly.",
          code: "NOT_FOUND",
        });
      }

      const tr = results.items[0];

      if (tr.status === "REVOKED") {
        await logAttempt(cleanSerial, "transcripts", "revoked", ip);
        return c.json<UnifiedVerifyResult>({
          valid: false,
          documentType: "transcript",
          document: {
            serial_number: tr.serial_number,
            holder_name: tr.student_name,
            credential: tr.programme,
            institution: "BMI University",
            issued_at: tr.issued_at,
            status: "revoked",
          },
          error: "This transcript has been revoked.",
          code: "REVOKED",
        });
      }

      // HMAC token check
      let tokenVerified = false;
      if (token && token.length === 24) {
        const issueDate = tr.issued_at
          ? new Date(tr.issued_at).toISOString().split("T")[0]
          : "";
        tokenVerified = verifyHiddenToken(token, {
          serial: cleanSerial,
          studentId: tr.student_id,
          issueDate,
          nonce: tr.issuance_nonce,
        });

        if (!tokenVerified) {
          await logAttempt(cleanSerial, "transcripts", "tampered", ip);
          return c.json<UnifiedVerifyResult>({
            valid: false,
            documentType: "transcript",
            error:
              "QR token verification failed. This document may have been forged.",
            code: "TAMPERED",
          });
        }
      }

      let studentPhoto: string | undefined = undefined;
      let studentPhotoZoom: number | undefined = undefined;
      let studentPhotoPosition: { x: number; y: number } | undefined = undefined;
      let studentStatus: string | undefined = undefined;
      let studentRegNo: string | undefined = undefined;
      let studentCampus: string | undefined = undefined;
      let studentMode: string | undefined = undefined;
      let studentAdmissionYear: string | undefined = undefined;
      let studentYearOfStudy: string | undefined = undefined;

      if (tr.student_id) {
        try {
          const student = await pb.collection("students").getOne(tr.student_id);
          studentPhoto = student.photo || undefined;
          studentPhotoZoom = typeof student.photo_zoom === "number" ? student.photo_zoom : undefined;
          studentPhotoPosition = student.photo_position || undefined;
          studentStatus = student.status || undefined;
          studentRegNo = student.reg_no || student.student_code || undefined;
          studentMode = student.mode_of_study || undefined;
          studentAdmissionYear = student.admissionYear || undefined;
          studentYearOfStudy = student.year_of_study || undefined;
          if (student.study_center_id) {
            try {
              const campus = await pb.collection("study_centers").getOne(student.study_center_id);
              studentCampus = campus.name;
            } catch {
              studentCampus = student.campus_name;
            }
          } else {
            studentCampus = student.campus_name;
          }
        } catch {
          // Ignore
        }
      }

      await pb.collection("transcripts").update(tr.id, {
        verification_count: (tr.verification_count || 0) + 1,
      });
      await logAttempt(cleanSerial, "transcripts", "valid", ip);

      return c.json<UnifiedVerifyResult>({
        valid: true,
        documentType: "transcript",
        document: {
          serial_number: tr.serial_number,
          holder_name: tr.student_name,
          credential: tr.programme,
          institution: "BMI University",
          issued_at: tr.issued_at,
          status: "active",
          academic_year: tr.academic_year,
          student_photo: studentPhoto,
          student_photo_zoom: studentPhotoZoom,
          student_photo_position: studentPhotoPosition,
          student_status: studentStatus,
          student_reg_no: studentRegNo,
          student_campus: studentCampus,
          student_mode_of_study: studentMode,
          student_admission_year: studentAdmissionYear,
          student_year_of_study: studentYearOfStudy,
        },
        verification: {
          timestamp: new Date().toISOString(),
          method: token ? "qr_scan" : "serial_only",
          token_verified: tokenVerified,
          confidence: tokenVerified ? "high" : "low",
          verification_count: (tr.verification_count || 0) + 1,
        },
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // OFFLINE JWT  (self-contained — no DB lookup required)
    // ══════════════════════════════════════════════════════════════════════
    if (offline_jwt) {
      const payload = await verifyOfflineJWT(offline_jwt);
      if (!payload) {
        await logAttempt(cleanSerial, "certificates", "tampered", ip);
        return c.json<UnifiedVerifyResult>({
          valid: false,
          documentType: "certificate",
          error:
            "Offline certificate token is invalid or has been tampered with.",
          code: "OFFLINE_JWT_INVALID",
        });
      }
      await logAttempt(payload.serial, "certificates", "valid", ip);
      return c.json<UnifiedVerifyResult>({
        valid: true,
        documentType: "certificate",
        document: {
          serial_number: payload.serial,
          holder_name: payload.studentName,
          credential: payload.degree,
          institution: "BMI University",
          issued_at: payload.issueDate,
          status: "active",
          faculty: payload.faculty,
          graduation_class: payload.graduationClass,
        },
        verification: {
          timestamp: new Date().toISOString(),
          method: "offline",
          token_verified: true,
          confidence: "high",
          verification_count: 0,
        },
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // CERTIFICATE  (BMI-YYYY-NNNNNN)
    // ══════════════════════════════════════════════════════════════════════
    if (!isValidCertificateSerial(cleanSerial)) {
      return c.json<UnifiedVerifyResult>({
        valid: false,
        error:
          "Unknown serial number format. Expected BMI-TRANS-YYYY-NNNNNN (transcript) " +
          "or BMI-YYYY-NNNNNN (certificate).",
        code: "INVALID_FORMAT",
      });
    }

    const certs = await pb.collection("certificates").getList(1, 1, {
      filter: `serial_number = "${safe(cleanSerial)}"`,
    });

    if (certs.totalItems === 0) {
      await logAttempt(cleanSerial, "certificates", "not_found", ip);
      return c.json<UnifiedVerifyResult>({
        valid: false,
        documentType: "certificate",
        error: "Certificate not found in the BMI University registry.",
        code: "NOT_FOUND",
      });
    }

    const cert = certs.items[0] as Record<string, unknown>;

    if (cert.status === "REVOKED") {
      await logAttempt(cleanSerial, "certificates", "revoked", ip);
      return c.json<UnifiedVerifyResult>({
        valid: false,
        documentType: "certificate",
        document: {
          serial_number: cert.serial_number as string,
          holder_name: cert.student_name as string,
          credential: cert.degree as string,
          institution: "BMI University",
          issued_at: cert.issue_date as string,
          status: "revoked",
        },
        error: "This certificate has been revoked by BMI University.",
        code: "REVOKED",
      });
    }

    // HMAC token check (new scheme)
    let tokenVerified = false;
    if (token && token.length === 24) {
      const issueDate =
        typeof cert.issue_date === "string" ? cert.issue_date : "";
      tokenVerified = verifyHiddenToken(token, {
        serial: cleanSerial,
        studentId: (cert.student_id as string) || "",
        issueDate,
        nonce: (cert.issuance_nonce as string) || "",
      });
    } else if (sig) {
      // Legacy HMAC signature
      const payload = buildSigningPayload({
        serial: cleanSerial,
        studentId: (cert.student_id as string) || "",
        studentName: (cert.student_name as string) || "",
        degree: (cert.degree as string) || "",
        faculty: (cert.faculty as string) || "",
        issueDate: (cert.issue_date as string) || "",
        gpa: typeof cert.gpa === "number" ? cert.gpa : 0,
      });
      tokenVerified = verifyCertificateSignature(payload, sig);
    } else if (hash) {
      // Legacy content hash check
      tokenVerified = hash === cert.content_hash;
    }

    // Fail on provided-but-wrong token (don't silently downgrade)
    if ((token || sig || hash) && !tokenVerified) {
      await logAttempt(cleanSerial, "certificates", "tampered", ip);
      return c.json<UnifiedVerifyResult>({
        valid: false,
        documentType: "certificate",
        error:
          "Token verification failed. This certificate may have been forged.",
        code: "TAMPERED",
      });
    }

      let studentPhoto: string | undefined = undefined;
      let studentPhotoZoom: number | undefined = undefined;
      let studentPhotoPosition: { x: number; y: number } | undefined = undefined;
      let studentStatus: string | undefined = undefined;
      let studentRegNo: string | undefined = undefined;
      let studentCampus: string | undefined = undefined;
      let studentMode: string | undefined = undefined;
      let studentAdmissionYear: string | undefined = undefined;
      let studentYearOfStudy: string | undefined = undefined;

      if (cert.student_id) {
        try {
          const student = await pb.collection("students").getOne(cert.student_id as string);
          studentPhoto = student.photo || undefined;
          studentPhotoZoom = typeof student.photo_zoom === "number" ? student.photo_zoom : undefined;
          studentPhotoPosition = student.photo_position || undefined;
          studentStatus = student.status || undefined;
          studentRegNo = student.reg_no || student.student_code || undefined;
          studentMode = student.mode_of_study || undefined;
          studentAdmissionYear = student.admissionYear || undefined;
          studentYearOfStudy = student.year_of_study || undefined;
          if (student.study_center_id) {
            try {
              const campus = await pb.collection("study_centers").getOne(student.study_center_id);
              studentCampus = campus.name;
            } catch {
              studentCampus = student.campus_name;
            }
          } else {
            studentCampus = student.campus_name;
          }
        } catch {
          // Ignore
        }
      }

      await pb.collection("certificates").update(cert.id as string, {
        verification_count: ((cert.verification_count as number) || 0) + 1,
      });
      await logAttempt(cleanSerial, "certificates", "valid", ip);
      logger.info("Certificate verified via unified endpoint", {
        serial: cleanSerial,
        tokenVerified,
      });

      return c.json<UnifiedVerifyResult>({
        valid: true,
        documentType: "certificate",
        document: {
          serial_number: cert.serial_number as string,
          holder_name: cert.student_name as string,
          credential: cert.degree as string,
          institution: "BMI University",
          issued_at: cert.issue_date as string,
          status: "active",
          faculty: cert.faculty as string | undefined,
          department: cert.department as string | undefined,
          graduation_class: cert.graduation_class as string | undefined,
          gpa: typeof cert.gpa === "number" ? cert.gpa : undefined,
          student_photo: studentPhoto,
          student_photo_zoom: studentPhotoZoom,
          student_photo_position: studentPhotoPosition,
          student_status: studentStatus,
          student_reg_no: studentRegNo,
          student_campus: studentCampus,
          student_mode_of_study: studentMode,
          student_admission_year: studentAdmissionYear,
          student_year_of_study: studentYearOfStudy,
        },
        verification: {
          timestamp: new Date().toISOString(),
          method: token ? "qr_scan" : sig ? "hmac_sig" : hash ? "hash" : "serial_only",
          token_verified: tokenVerified,
          confidence: tokenVerified ? "high" : "low",
          verification_count: ((cert.verification_count as number) || 0) + 1,
        },
      });
  } catch (error: unknown) {
    logger.error("Unified document verification error:", errorMessage(error));
    return c.json<UnifiedVerifyResult>(
      {
        valid: false,
        error: "Verification service temporarily unavailable.",
        code: "SERVICE_ERROR",
      },
      500,
    );
  }
});

export default documentsRouter;
