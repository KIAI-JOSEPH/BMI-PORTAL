/**
 * BMI UMS — Unified Document Verification Portal
 *
 * Public page — no authentication required.
 * Verifies BOTH certificates (BMI-YYYY-NNNNNN) and
 * transcripts (BMI-TRANS-YYYY-NNNNNN) through one unified backend endpoint.
 *
 * Three input paths:
 *   1. URL deep-link  /verify?id=SERIAL&t=TOKEN  (QR scan → opens this URL)
 *   2. Manual entry   user types serial number
 *   3. Camera QR scan via QRScanner component
 *
 * Confidence levels:
 *   HIGH  — serial found + HMAC token verified    (QR scan path)
 *   LOW   — serial found, no token provided        (manual serial only)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GraduationCap,
  Scroll,
  CalendarDays,
  Building2,
  Hash,
  Star,
  RefreshCcw,
  Copy,
  Check,
} from "lucide-react";
import QRScanner from "./QRScanner";
import {
  verifyDocument,
  verifyQRScan,
  parseQRPayload,
  type DocumentVerifyResult,
} from "../services/verificationService";

interface VerificationPageProps {
  logo?: string;
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function ConfidencePill({
  confidence,
}: {
  confidence?: "high" | "medium" | "low";
}) {
  if (!confidence) return null;
  const cfg = {
    high: {
      label: "High Confidence",
      cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    medium: {
      label: "Medium Confidence",
      cls: "bg-amber-100 text-amber-800 border-amber-200",
    },
    low: {
      label: "Serial Only — Low Confidence",
      cls: "bg-gray-100 text-gray-600 border-gray-200",
    },
  }[confidence];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${cfg.cls}`}
    >
      {confidence === "high" && <Check size={10} />}
      {cfg.label}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
const VerificationPage: React.FC<VerificationPageProps> = ({ logo }) => {
  const [serial, setSerial] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<DocumentVerifyResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Deep-link / URL auto-verify ──────────────────────────────────────────────
  useEffect(() => {
    // Use the unified parser so legacy ?s= format is handled identically
    // to the new ?id= format. The URL is treated as a QR payload.
    const fullUrl = window.location.href;
    const req = parseQRPayload(fullUrl);
    if (!req) return;

    setSerial(req.serial.toUpperCase());

    // Auto-verify immediately
    setIsVerifying(true);
    verifyDocument(req)
      .then(setResult)
      .catch(() =>
        setResult({
          valid: false,
          error: "Verification service unavailable.",
          code: "SERVICE_ERROR",
        }),
      )
      .finally(() => setIsVerifying(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manual verification ────────────────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    const clean = serial.trim().toUpperCase();
    if (!clean) return;
    setIsVerifying(true);
    setResult(null);
    try {
      const res = await verifyDocument({ serial: clean });
      setResult(res);
    } catch {
      setResult({
        valid: false,
        error: "Verification service unavailable.",
        code: "SERVICE_ERROR",
      });
    } finally {
      setIsVerifying(false);
    }
  }, [serial]);

  // ── QR scanner callback ────────────────────────────────────────────────────
  const handleQRScan = useCallback(async (qrContent: string) => {
    setShowScanner(false);
    const req = parseQRPayload(qrContent);
    if (!req) {
      setResult({
        valid: false,
        error: "This QR code is not from BMI University.",
        code: "INVALID_QR",
      });
      return;
    }
    setSerial(req.serial.toUpperCase());
    setIsVerifying(true);
    try {
      const res = await verifyQRScan(qrContent);
      setResult(res);
    } catch {
      setResult({
        valid: false,
        error: "QR verification failed.",
        code: "QR_ERROR",
      });
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const handleReset = () => {
    setSerial("");
    setResult(null);
    // Clear URL params without reload
    window.history.replaceState({}, "", "/verify");
  };

  const handleCopySerial = async () => {
    if (!result?.document?.serial_number) return;
    await navigator.clipboard
      .writeText(result.document.serial_number)
      .catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Document type label ────────────────────────────────────────────────────
  const docTypeLabel =
    result?.documentType === "transcript"
      ? "Academic Transcript"
      : result?.documentType === "certificate"
        ? "Graduation Certificate"
        : "BMI University Document";

  const docTypeIcon =
    result?.documentType === "transcript" ? (
      <Scroll size={20} />
    ) : (
      <GraduationCap size={20} />
    );

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0a0015]">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#4B0082] text-white py-3 px-6 text-center text-[10px] font-bold uppercase tracking-widest">
        Official Document Verification Portal · BMI University · Secure &amp;
        Private
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center gap-5">
          <img
            src={logo || "/BMI.svg"}
            alt="BMI University"
            className="w-14 h-14 object-contain rounded-xl border-2 border-[#FFD700] bg-white"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div>
            <h1 className="text-2xl font-black text-[#2E004F] uppercase tracking-tight">
              BMI University
            </h1>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
              Document Authenticity Verification
            </p>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2 text-[#4B0082]">
            <ShieldCheck size={18} />
            <span className="text-xs font-black uppercase tracking-widest">
              Cryptographically Secured
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* ── Input card ────────────────────────────────────────────────────── */}
        {!result && (
          <div className="bg-white border border-gray-100 shadow-sm rounded-none p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 rounded-none">
                <Search size={20} className="text-[#4B0082]" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">
                  Enter Document Serial Number
                </h2>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
                  Certificates: BMI-YYYY-NNNNNN · Transcripts:
                  BMI-TRANS-YYYY-NNNNNN
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="BMI-2026-123456"
                spellCheck={false}
                className="flex-1 px-4 py-3 border border-gray-200 font-mono text-sm outline-none focus:ring-2 focus:ring-[#4B0082] focus:border-transparent uppercase tracking-wider"
              />
              <button
                onClick={handleVerify}
                disabled={isVerifying || !serial.trim()}
                className="px-6 py-3 bg-[#4B0082] text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isVerifying ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {isVerifying ? "Verifying…" : "Verify"}
              </button>
            </div>

            {/* QR Scan button */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] text-gray-400 font-medium">
                Or scan the QR code on the document:
              </p>
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-2 px-4 py-2 border border-[#4B0082] text-[#4B0082] text-[10px] font-black uppercase tracking-widest hover:bg-[#4B0082] hover:text-white transition-all"
              >
                <QrCode size={14} />
                Scan QR Code
              </button>
            </div>
          </div>
        )}

        {/* QR Scanner overlay */}
        {showScanner && (
          <QRScanner
            isOpen={showScanner}
            onScan={handleQRScan}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* ── Loading state ─────────────────────────────────────────────────── */}
        {isVerifying && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 border-4 border-purple-100 border-t-[#4B0082] rounded-full animate-spin" />
            <p className="text-sm font-black text-gray-500 uppercase tracking-widest">
              Querying Registry…
            </p>
          </div>
        )}

        {/* ── Result ────────────────────────────────────────────────────────── */}
        {result && !isVerifying && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Status banner */}
            <div
              className={`flex items-center gap-4 p-6 border-l-8 ${
                result.valid
                  ? "bg-emerald-50 border-emerald-500"
                  : result.code === "REVOKED"
                    ? "bg-red-50 border-red-500"
                    : result.code === "TAMPERED"
                      ? "bg-red-50 border-red-600"
                      : "bg-gray-50 border-gray-400"
              }`}
            >
              <div>
                {result.valid ? (
                  <CheckCircle2 size={44} className="text-emerald-500" />
                ) : result.code === "TAMPERED" ? (
                  <ShieldX size={44} className="text-red-600" />
                ) : result.code === "REVOKED" ? (
                  <ShieldAlert size={44} className="text-red-500" />
                ) : (
                  <XCircle size={44} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h2
                    className={`text-xl font-black uppercase tracking-tight ${
                      result.valid ? "text-emerald-800" : "text-red-800"
                    }`}
                  >
                    {result.valid
                      ? "Document Verified — Authentic"
                      : result.code === "TAMPERED"
                        ? "Verification Failed — Possible Forgery"
                        : result.code === "REVOKED"
                          ? "Document Revoked"
                          : "Document Not Found"}
                  </h2>
                  {result.valid && (
                    <ConfidencePill
                      confidence={result.verification?.confidence}
                    />
                  )}
                </div>
                {result.valid ? (
                  <p className="text-sm text-emerald-700">
                    This {docTypeLabel.toLowerCase()} is registered in the BMI
                    University official registry and has been verified{" "}
                    {result.verification?.token_verified
                      ? "using a cryptographic HMAC token"
                      : "by serial number lookup"}
                    .
                  </p>
                ) : (
                  <p className="text-sm text-red-700">{result.error}</p>
                )}
              </div>
            </div>

            {/* Document details card */}
            {result.document && (
              <div className="bg-white border border-gray-100 shadow-sm">
                {/* Card header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="p-2 bg-white border border-gray-200 rounded-none text-[#4B0082]">
                    {docTypeIcon}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      {docTypeLabel}
                    </p>
                    <p className="text-xs font-black text-gray-700 uppercase tracking-wide">
                      {result.document.institution}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span
                      className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                        result.document.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : result.document.status === "revoked"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {result.document.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100">
                  {[
                    {
                      label: "Full Name",
                      value: result.document.holder_name,
                      icon: <GraduationCap size={14} />,
                    },
                    {
                      label:
                        result.documentType === "transcript"
                          ? "Programme"
                          : "Qualification",
                      value: result.document.credential,
                      icon: <Scroll size={14} />,
                    },
                    {
                      label: "Issuing Institution",
                      value: result.document.institution,
                      icon: <Building2 size={14} />,
                    },
                    {
                      label: "Issue Date",
                      value: formatDate(result.document.issued_at),
                      icon: <CalendarDays size={14} />,
                    },
                    result.document.faculty
                      ? {
                          label: "Faculty",
                          value: result.document.faculty,
                          icon: <Building2 size={14} />,
                        }
                      : null,
                    result.document.department
                      ? {
                          label: "Department",
                          value: result.document.department,
                          icon: <Building2 size={14} />,
                        }
                      : null,
                    result.document.graduation_class
                      ? {
                          label: "Graduation Class",
                          value: result.document.graduation_class,
                          icon: <Star size={14} />,
                        }
                      : null,
                    result.document.gpa != null
                      ? {
                          label: "GPA",
                          value: result.document.gpa.toFixed(2),
                          icon: <Star size={14} />,
                        }
                      : null,
                    result.document.academic_year
                      ? {
                          label: "Academic Year",
                          value: result.document.academic_year,
                          icon: <CalendarDays size={14} />,
                        }
                      : null,
                  ]
                    .filter(Boolean)
                    .map((f, i) => (
                      <div
                        key={i}
                        className="bg-white px-6 py-4 flex items-start gap-3"
                      >
                        <div className="mt-0.5 text-[#4B0082]">{f!.icon}</div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
                            {f!.label}
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {f!.value}
                          </p>
                        </div>
                      </div>
                    ))}

                  {/* Serial number with copy button */}
                  <div className="bg-white px-6 py-4 flex items-start gap-3 sm:col-span-2">
                    <div className="mt-0.5 text-[#4B0082]">
                      <Hash size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
                        Serial Number
                      </p>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-black text-gray-900 font-mono tracking-wider">
                          {result.document.serial_number}
                        </p>
                        <button
                          onClick={handleCopySerial}
                          className="p-1.5 text-gray-400 hover:text-[#4B0082] transition-colors"
                          title="Copy serial number"
                        >
                          {copied ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Verification metadata */}
            {result.verification && (
              <div className="bg-white border border-gray-100 shadow-sm px-6 py-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  Verification Record
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  {[
                    {
                      label: "Timestamp",
                      value: formatDate(result.verification.timestamp),
                    },
                    {
                      label: "Method",
                      value: result.verification.method
                        .replace("_", " ")
                        .toUpperCase(),
                    },
                    {
                      label: "Token Verified",
                      value: result.verification.token_verified
                        ? "YES ✓"
                        : "NO (serial only)",
                    },
                    {
                      label: "Verification #",
                      value: `#${result.verification.verification_count}`,
                    },
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                        {item.label}
                      </p>
                      <p className="text-xs font-black text-gray-700 mt-0.5">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error details when invalid */}
            {!result.valid && result.code !== "REVOKED" && (
              <div className="bg-amber-50 border border-amber-200 px-6 py-4 flex items-start gap-3">
                <AlertCircle
                  size={16}
                  className="text-amber-600 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p className="text-xs font-black text-amber-800 uppercase tracking-wide mb-1">
                    What to do
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    {result.code === "TAMPERED" && (
                      <>
                        <li>Do NOT accept this document as genuine.</li>
                        <li>
                          Contact the BMI University Registrar immediately.
                        </li>
                        <li>
                          Report the document reference number:{" "}
                          <span className="font-mono font-bold">{serial}</span>
                        </li>
                      </>
                    )}
                    {result.code === "NOT_FOUND" && (
                      <>
                        <li>
                          Confirm the serial number is entered exactly as
                          printed.
                        </li>
                        <li>
                          If recently issued, the system may take a few minutes
                          to update.
                        </li>
                        <li>
                          Contact the BMI University Registrar if the issue
                          persists.
                        </li>
                      </>
                    )}
                    {result.code === "INVALID_FORMAT" && (
                      <>
                        <li>
                          Certificates:{" "}
                          <span className="font-mono">BMI-YYYY-NNNNNN</span>
                        </li>
                        <li>
                          Transcripts:{" "}
                          <span className="font-mono">
                            BMI-TRANS-YYYY-NNNNNN
                          </span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:border-[#4B0082] hover:text-[#4B0082] transition-all"
              >
                <RefreshCcw size={13} />
                Verify Another
              </button>
              {!result.valid && (
                <button
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#4B0082] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                >
                  <QrCode size={13} />
                  Scan QR
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-gray-100 bg-white py-8 px-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-[#4B0082]">
          <img
            src={logo || "/BMI.svg"}
            alt=""
            className="w-6 h-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-xs font-black uppercase tracking-widest">
            BMI University
          </span>
        </div>
        <p className="text-[10px] text-gray-400 font-medium">
          This portal verifies documents issued by Bishop Medardo Isizoh
          University. All verification attempts are logged for security
          purposes.
        </p>
        <p className="text-[10px] text-gray-400">
          Registrar: registrar@bmiuniversity.ac.ke &nbsp;·&nbsp;
          <span className="font-mono">+254 XXX XXX XXX</span>
        </p>
      </footer>
    </div>
  );
};

export default VerificationPage;
