/**
 * KIRO: DO NOT MODIFY
 * This file contains stable production logic.
 * Do not edit unless explicitly instructed.
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  Download, 
  Eye,
  Calendar,
  User,
  GraduationCap,
  Award,
  Building,
  Hash,
  Clock,
  Globe,
  Wifi,
  WifiOff,
  Scan
} from 'lucide-react';
import QRScanner from './QRScanner';
import { verificationService } from '../services/verificationService';

interface CertificateData {
  valid: boolean;
  certificate?: {
    serial_number: string;
    student_name: string;
    degree_title: string;
    graduation_class?: string;
    faculty: string;
    department: string;
    issue_date: string;
    graduation_date: string;
    gpa: number;
    status: 'active' | 'revoked' | 'suspended';
  };
  verification?: {
    timestamp: string;
    method: 'online' | 'offline' | 'qr_scan';
    hash_verified: boolean;
    verification_count: number;
  };
  error?: string;
  code?: string;
}

interface VerificationPageProps {
  logo?: string;
}

const VerificationPage: React.FC<VerificationPageProps> = ({ logo }) => {
  const [verificationMode, setVerificationMode] = useState<'online' | 'offline'>('online');
  const [serialNumber, setSerialNumber] = useState('');
  const [hashValue, setHashValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<CertificateData | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Parse URL parameters for direct verification links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const sig = urlParams.get('sig');
    const hash = urlParams.get('hash');

    if (id) {
      setSerialNumber(id);
      if (hash) setHashValue(hash);
      // Auto-verify using the service directly with URL params
      setTimeout(async () => {
        setIsVerifying(true);
        try {
          const result = await verificationService.verifyCertificate({
            serial: id,
            sig: sig || undefined,
            hash: hash || undefined,
            method: 'online',
          });
          setVerificationResult(result);
        } catch {
          setVerificationResult({ valid: false, error: 'Verification service unavailable', code: 'SERVICE_ERROR' });
        } finally {
          setIsVerifying(false);
        }
      }, 300);
    }
  }, []);

  const parseQRData = (qrContent: string) => {
    try {
      // Handle full verification URL
      if (qrContent.includes('/verify?')) {
        const url = new URL(qrContent);
        const id = url.searchParams.get('id');
        const hash = url.searchParams.get('hash');
        return { serial: id, hash: hash };
      }
      
      // Handle direct serial number
      if (qrContent.match(/^BMI-\d{4}-\d{6}$/)) {
        return { serial: qrContent, hash: null };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleVerification = async () => {
    if (!serialNumber.trim()) {
      setVerificationResult({ valid: false, error: 'Please enter a certificate serial number', code: 'MISSING_SERIAL' });
      return;
    }
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      if (!serialNumber.match(/^BMI-\d{4}-\d{6}$/)) {
        setVerificationResult({ valid: false, error: 'Invalid serial number format. Expected: BMI-YYYY-NNNNNN', code: 'INVALID_FORMAT' });
        return;
      }
      if (verificationMode === 'online' && !isOnline) {
        setVerificationResult({ valid: false, error: 'Online verification requires internet connection', code: 'NO_CONNECTION' });
        return;
      }
      const result = await verificationService.verifyCertificate({
        serial: serialNumber,
        hash: hashValue || undefined,
        method: verificationMode as 'online' | 'offline',
      });
      setVerificationResult(result);
    } catch {
      setVerificationResult({ valid: false, error: 'Verification service temporarily unavailable', code: 'SERVICE_ERROR' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQRScan = async (qrContent: string) => {
    try {
      const result = await verificationService.verifyQRCode(qrContent);
      if (result.valid && result.certificate) {
        setSerialNumber(result.certificate.serial_number);
      }
      setVerificationResult(result);
      setShowQRScanner(false);
    } catch {
      setVerificationResult({ valid: false, error: 'QR code verification failed', code: 'QR_VERIFICATION_ERROR' });
      setShowQRScanner(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-50';
      case 'revoked': return 'text-red-600 bg-red-50';
      case 'suspended': return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getGraduationClass = (gpa: number) => {
    if (gpa >= 3.6) return 'First Class Honours';
    if (gpa >= 3.0) return 'Second Class Honours (Upper Division)';
    if (gpa >= 2.5) return 'Second Class Honours (Lower Division)';
    return 'Pass';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0033] via-[#4B0082] to-[#320064] p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 mb-8">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#4B0082] via-[#FFD700] to-[#4B0082]"></div>
          
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <img 
                src={logo || "https://i.ibb.co/Gv2vPdJC/BMI-PNG.png"} 
                alt="BMI University" 
                className="w-16 h-16 object-contain rounded-xl border-2 border-[#FFD700] bg-white"
              />
              <div>
                <h1 className="text-3xl font-bold text-[#4B0082] tracking-tight">BMI University</h1>
                <p className="text-gray-600 font-medium">Certificate Verification System</p>
              </div>
            </div>
            
            <p className="text-gray-700 max-w-2xl mx-auto">
              Verify the authenticity of BMI University graduation certificates using our secure verification system. 
              Enter the certificate serial number or scan the QR code to validate credentials.
            </p>
          </div>
        </div>

        {/* Verification Mode Toggle */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 mb-8 p-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => setVerificationMode('online')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                verificationMode === 'online'
                  ? 'bg-[#4B0082] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
              Online Verification
            </button>
            <button
              onClick={() => setVerificationMode('offline')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                verificationMode === 'offline'
                  ? 'bg-[#4B0082] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Globe size={20} />
              Offline Verification
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            {verificationMode === 'online' ? (
              <p className="flex items-center justify-center gap-2">
                <Globe size={16} />
                Real-time verification against BMI University database
                {!isOnline && <span className="text-red-500 font-semibold">(No Internet Connection)</span>}
              </p>
            ) : (
              <p className="flex items-center justify-center gap-2">
                <QrCode size={16} />
                Verify certificates using QR code data and local validation
              </p>
            )}
          </div>
        </div>

        {/* Verification Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-[#4B0082] mb-6 flex items-center gap-3">
              <Search size={24} />
              Certificate Verification
            </h2>

            <div className="space-y-6">
              {/* Serial Number Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Certificate Serial Number *
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                  placeholder="BMI-2024-123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4B0082] focus:border-transparent font-mono text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Format: BMI-YYYY-XXXXXX</p>
              </div>

              {/* Hash Input (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Content Hash (Optional)
                </label>
                <input
                  type="text"
                  value={hashValue}
                  onChange={(e) => setHashValue(e.target.value)}
                  placeholder="a1b2c3d4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4B0082] focus:border-transparent font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">For additional security verification</p>
              </div>

              {/* QR Code Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">QR Code Verification</h3>
                  <button
                    onClick={() => setShowQRScanner(!showQRScanner)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-[#4B0082] rounded-xl font-semibold hover:bg-yellow-400 transition-all"
                  >
                    <Scan size={18} />
                    {showQRScanner ? 'Hide Scanner' : 'Scan QR Code'}
                  </button>
                </div>

                {showQRScanner && (
                  <QRScanner
                    isOpen={showQRScanner}
                    onScan={handleQRScan}
                    onClose={() => setShowQRScanner(false)}
                    title="Certificate QR Scanner"
                  />
                )}
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerification}
                disabled={isVerifying || !serialNumber.trim()}
                className="w-full py-4 bg-[#4B0082] text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    Verify Certificate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-[#4B0082] mb-6 flex items-center gap-3">
              <Award size={24} />
              Verification Results
            </h2>

            {!verificationResult ? (
              <div className="text-center py-12">
                <ShieldCheck size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Enter certificate details to verify</p>
                <p className="text-gray-400 text-sm mt-2">Results will appear here after verification</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Verification Status */}
                <div className={`p-4 rounded-xl border-2 ${
                  verificationResult.valid 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {verificationResult.valid ? (
                      <CheckCircle2 size={24} className="text-emerald-600" />
                    ) : (
                      <XCircle size={24} className="text-red-600" />
                    )}
                    <h3 className={`text-lg font-bold ${
                      verificationResult.valid ? 'text-emerald-800' : 'text-red-800'
                    }`}>
                      {verificationResult.valid ? 'Certificate Verified' : 'Verification Failed'}
                    </h3>
                  </div>
                  
                  {verificationResult.error && (
                    <p className="text-red-700 text-sm">
                      {verificationResult.error} ({verificationResult.code})
                    </p>
                  )}
                </div>

                {/* Certificate Details */}
                {verificationResult.valid && verificationResult.certificate && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <User size={18} className="text-[#4B0082]" />
                        <div>
                          <p className="text-sm text-gray-600">Graduate Name</p>
                          <p className="font-semibold">{verificationResult.certificate.student_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <GraduationCap size={18} className="text-[#4B0082]" />
                        <div>
                          <p className="text-sm text-gray-600">Degree/Certificate</p>
                          <p className="font-semibold">{verificationResult.certificate.degree_title}</p>
                          {verificationResult.certificate.graduation_class && (
                            <p className="text-sm text-[#FFD700] font-medium">
                              {verificationResult.certificate.graduation_class}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Building size={18} className="text-[#4B0082]" />
                        <div>
                          <p className="text-sm text-gray-600">Faculty</p>
                          <p className="font-semibold">{verificationResult.certificate.faculty}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar size={18} className="text-[#4B0082]" />
                        <div>
                          <p className="text-sm text-gray-600">Issue Date</p>
                          <p className="font-semibold">
                            {new Date(verificationResult.certificate.issue_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Hash size={18} className="text-[#4B0082]" />
                        <div>
                          <p className="text-sm text-gray-600">Serial Number</p>
                          <p className="font-mono font-semibold">{verificationResult.certificate.serial_number}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <ShieldCheck size={18} className="text-[#4B0082]" />
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(verificationResult.certificate.status)}`}>
                              {verificationResult.certificate.status.toUpperCase()}
                            </span>
                          </div>
                          {verificationResult.verification?.hash_verified && (
                            <div className="text-right">
                              <p className="text-xs text-gray-600">Hash Verified</p>
                              <CheckCircle2 size={16} className="text-emerald-600 ml-auto" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Verification Metadata */}
                    {verificationResult.verification && (
                      <div className="border-t pt-4 mt-6">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Clock size={16} />
                          Verification Details
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Verified At</p>
                            <p className="font-medium">
                              {new Date(verificationResult.verification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Method</p>
                            <p className="font-medium capitalize">{verificationResult.verification.method}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Verification Count</p>
                            <p className="font-medium">{verificationResult.verification.verification_count} times</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Hash Status</p>
                            <p className={`font-medium ${verificationResult.verification.hash_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {verificationResult.verification.hash_verified ? 'Verified' : 'Not Verified'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6">
            <p className="text-gray-600 mb-2">
              <strong>BMI University Certificate Verification System</strong>
            </p>
            <p className="text-sm text-gray-500">
              For technical support or to report fraudulent certificates, contact: 
              <a href="mailto:registrar@bmi.edu" className="text-[#4B0082] hover:underline ml-1">
                registrar@bmi.edu
              </a>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              © 2024 BMI University. All rights reserved. | "Excellence in Faith and Knowledge"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;