/**
 * KIRO: DO NOT MODIFY
 * This file contains stable production logic.
 * Do not edit unless explicitly instructed.
 * 
 * Enhanced QR Scanner Component with Real QR Code Detection
 * Uses jsQR library for actual QR code scanning
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RotateCcw, 
  Flashlight, 
  FlashlightOff,
  Upload,
  AlertCircle,
  CheckCircle2,
  Scan,
  Zap
} from 'lucide-react';
import jsQR from 'jsqr';

interface EnhancedQRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
  title?: string;
}

const EnhancedQRScanner: React.FC<EnhancedQRScannerProps> = ({ 
  onScan, 
  onClose, 
  isOpen, 
  title = "QR Code Scanner" 
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number>();

  // Get available camera devices
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      // Select back camera by default if available
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      if (backCamera) {
        setSelectedDeviceId(backCamera.deviceId);
      } else if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting devices:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      getDevices();
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, selectedDeviceId, getDevices]);

  const startCamera = async () => {
    try {
      setError('');
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...(selectedDeviceId && { deviceId: { exact: selectedDeviceId } })
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        videoRef.current.onloadedmetadata = () => {
          setTimeout(() => {
            startScanning();
          }, 1000);
        };
      }

    } catch (err) {
      console.error('Camera access error:', err);
      setHasPermission(false);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsScanning(false);
  };

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    scanQRCode();
  };

  const scanQRCode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use jsQR library for real QR code detection
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (qrCode) {
        console.log('QR Code detected:', qrCode.data);
        setScanResult(qrCode.data);
        onScan(qrCode.data);
        setIsScanning(false);
        return;
      }

    } catch (err) {
      console.error('QR scanning error:', err);
    }

    // Continue scanning
    if (isScanning) {
      animationRef.current = requestAnimationFrame(scanQRCode);
    }
  };
  const toggleFlash = async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if ('torch' in capabilities) {
        await track.applyConstraints({
          advanced: [{ torch: !isFlashOn } as any]
        });
        setIsFlashOn(!isFlashOn);
      } else {
        setError('Flash not supported on this device');
      }
    } catch (err) {
      console.error('Flash toggle error:', err);
      setError('Unable to control flash');
    }
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  const selectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        try {
          // Use jsQR to decode from uploaded image
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          
          if (qrCode) {
            console.log('QR Code detected from image:', qrCode.data);
            setScanResult(qrCode.data);
            onScan(qrCode.data);
          } else {
            setError('No QR code found in the uploaded image');
          }
        } catch (err) {
          console.error('QR decoding error:', err);
          setError('Could not read QR code from image');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const resetScanner = () => {
    setScanResult('');
    setError('');
    startScanning();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4B0082] to-[#6A0DAD] text-white p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Scan size={20} />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scanner Content */}
        <div className="p-6">
          {hasPermission === null && (
            <div className="text-center py-8">
              <Camera size={48} className="mx-auto text-gray-400 mb-4 animate-pulse" />
              <p className="text-gray-600">Requesting camera access...</p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B0082] mx-auto"></div>
              </div>
            </div>
          )}

          {hasPermission === false && (
            <div className="text-center py-8">
              <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
              <p className="text-red-600 mb-4 font-semibold">{error}</p>
              <div className="text-sm text-gray-600 mb-6 space-y-2">
                <p>To use the QR scanner, please:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Allow camera access when prompted</li>
                  <li>Ensure your camera is not being used by another app</li>
                  <li>Try refreshing the page</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-[#4B0082] text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2"
                >
                  <Camera size={16} />
                  Try Again
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <Upload size={16} />
                  Upload Image
                </button>
              </div>
            </div>
          )}

          {hasPermission === true && (
            <div className="space-y-4">
              {/* Camera Selection */}
              {devices.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Camera
                  </label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => selectDevice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B0082] focus:border-transparent text-sm"
                  >
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Video Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-[#FFD700] rounded-lg relative">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#FFD700]"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#FFD700]"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#FFD700]"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#FFD700]"></div>
                    
                    {/* Scanning line */}
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-[#FFD700] animate-pulse shadow-lg"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="absolute top-4 left-4">
                  {scanResult ? (
                    <div className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm">
                      <CheckCircle2 size={16} />
                      QR Code Detected!
                    </div>
                  ) : isScanning ? (
                    <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Scanning...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gray-500 text-white px-3 py-1 rounded-full text-sm">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      Ready
                    </div>
                  )}
                </div>

                {/* Flash indicator */}
                {isFlashOn && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-yellow-500 text-white p-2 rounded-full">
                      <Zap size={16} />
                    </div>
                  </div>
                )}
              </div>
              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={toggleFlash}
                  className={`p-3 rounded-lg transition-all ${
                    isFlashOn 
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Toggle Flash"
                >
                  {isFlashOn ? <FlashlightOff size={20} /> : <Flashlight size={20} />}
                </button>

                <button
                  onClick={switchCamera}
                  className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
                  title="Switch Camera"
                >
                  <RotateCcw size={20} />
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
                  title="Upload Image"
                >
                  <Upload size={20} />
                </button>

                {scanResult && (
                  <button
                    onClick={resetScanner}
                    className="p-3 bg-[#4B0082] hover:bg-purple-700 text-white rounded-lg transition-all"
                    title="Scan Again"
                  >
                    <Scan size={20} />
                  </button>
                )}
              </div>

              {/* Result Display */}
              {scanResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                    <h4 className="font-semibold text-emerald-800">QR Code Detected</h4>
                  </div>
                  <p className="text-sm text-emerald-700 font-mono break-all">
                    {scanResult}
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && !scanResult && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={20} className="text-red-600" />
                    <h4 className="font-semibold text-red-800">Error</h4>
                  </div>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Instructions */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Position the QR code within the yellow frame
                </p>
                <p className="text-xs text-gray-500">
                  Ensure good lighting and hold the device steady
                </p>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default EnhancedQRScanner;