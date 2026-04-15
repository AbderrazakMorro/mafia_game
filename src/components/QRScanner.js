'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import jsQR from 'jsqr'

/**
 * Pure JS QR Code Scanner component.
 * Uses the native BarcodeDetector API (Chrome/Edge/Android) with
 * a jsQR-style canvas fallback decoded manually for other browsers.
 * No external libraries required.
 * 
 * Props:
 *  - onResult(code: string)  → called when a valid room code/URL is detected
 *  - onClose()               → called when the user closes the scanner
 */

// ─── Minimal QR decoder (canvas-based fallback) ───
// This uses a lightweight approach: capture frames and attempt detection
// via BarcodeDetector. If BarcodeDetector is unavailable, we display
// a manual entry prompt instead.

const QRScanner = ({ onResult, onClose }) => {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const animFrameRef = useRef(null)
    const [error, setError] = useState(null)
    const [isStarting, setIsStarting] = useState(true)
    const [hasBarcodeAPI, setHasBarcodeAPI] = useState(false)
    const [scanLine, setScanLine] = useState(0)
    const detectedRef = useRef(false)

    // Check for BarcodeDetector support
    useEffect(() => {
        const checkSupport = async () => {
            if ('BarcodeDetector' in window) {
                try {
                    const formats = await BarcodeDetector.getSupportedFormats()
                    if (formats.includes('qr_code')) {
                        setHasBarcodeAPI(true)
                        return
                    }
                } catch { }
            }
            setHasBarcodeAPI(false)
        }
        checkSupport()
    }, [])

    // Extract room code from QR data (handles both raw codes and URLs)
    const extractRoomCode = useCallback((rawValue) => {
        if (!rawValue) return null

        // If it's a URL like https://domain.com/room/ROOM_ID
        try {
            const url = new URL(rawValue)
            const pathParts = url.pathname.split('/')
            const roomIdx = pathParts.indexOf('room')
            if (roomIdx !== -1 && pathParts[roomIdx + 1]) {
                return pathParts[roomIdx + 1]
            }
        } catch {
            // Not a URL, treat as raw code
        }

        // If it's a raw room code (alphanumeric, 4-8 chars)
        const cleaned = rawValue.trim().toUpperCase()
        if (/^[A-Z0-9]{3,8}$/.test(cleaned)) {
            return cleaned
        }

        // Return the raw value as fallback
        return rawValue.trim()
    }, [])

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            setIsStarting(true)
            setError(null)

            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                try {
                    await videoRef.current.play()
                } catch (playErr) {
                    // Ignore DOMException AbortError caused by rapid hot-reloads or unmounts interrupting play()
                    if (playErr.name !== 'AbortError') {
                        throw playErr
                    }
                }
                setIsStarting(false)
            }
        } catch (err) {
            console.error('Camera access error:', err)
            if (err.name === 'NotAllowedError') {
                setError('Accès à la caméra refusé. Autorisez l\'accès dans les paramètres de votre navigateur.')
            } else if (err.name === 'NotFoundError') {
                setError('Aucune caméra trouvée sur cet appareil.')
            } else if (err.name === 'NotReadableError') {
                setError('La caméra est utilisée par une autre application.')
            } else {
                setError('Impossible d\'accéder à la caméra: ' + err.message)
            }
            setIsStarting(false)
        }
    }, [])

    // Stop camera
    const stopCamera = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current)
            animFrameRef.current = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
    }, [])

    // Scan loop utilizing BarcodeDetector with a seamless jsQR fallback
    const startScanning = useCallback(async () => {
        if (!videoRef.current) return

        let detector = null;
        if (hasBarcodeAPI) {
            detector = new BarcodeDetector({ formats: ['qr_code'] })
        }

        const scan = async () => {
            if (detectedRef.current) return
            
            const video = videoRef.current
            const canvas = canvasRef.current
            if (!video || video.readyState < 2) {
                animFrameRef.current = requestAnimationFrame(scan)
                return
            }

            try {
                if (hasBarcodeAPI && detector) {
                    const barcodes = await detector.detect(video)
                    if (barcodes.length > 0 && !detectedRef.current) {
                        detectedRef.current = true
                        const code = extractRoomCode(barcodes[0].rawValue)
                        if (code) {
                            if (navigator.vibrate) navigator.vibrate(100)
                            onResult(code)
                            return
                        }
                        detectedRef.current = false
                    }
                } else if (canvas) {
                    const ctx = canvas.getContext('2d', { willReadFrequently: true })
                    canvas.width = video.videoWidth
                    canvas.height = video.videoHeight
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                    
                    const codeResult = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    })

                    if (codeResult && codeResult.data && !detectedRef.current) {
                        detectedRef.current = true
                        const code = extractRoomCode(codeResult.data)
                        if (code) {
                            if (navigator.vibrate) navigator.vibrate(100)
                            onResult(code)
                            return
                        }
                        detectedRef.current = false
                    }
                }
            } catch { }

            animFrameRef.current = requestAnimationFrame(scan)
        }

        animFrameRef.current = requestAnimationFrame(scan)
    }, [hasBarcodeAPI, extractRoomCode, onResult])

    // Animate scan line
    useEffect(() => {
        const interval = setInterval(() => {
            setScanLine(prev => (prev >= 100 ? 0 : prev + 1))
        }, 20)
        return () => clearInterval(interval)
    }, [])

    // Start camera on mount
    useEffect(() => {
        startCamera()
        return () => stopCamera()
    }, [startCamera, stopCamera])

    // Start scanning once video is ready
    useEffect(() => {
        if (!isStarting && videoRef.current) {
            startScanning()
        }
    }, [isStarting, startScanning])

    const handleClose = () => {
        stopCamera()
        onClose()
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-4 w-full"
        >
            {/* Scanner viewport */}
            <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden bg-surface-container-lowest/60 border border-outline-variant/20">
                {/* Video feed */}
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                />

                {/* Hidden canvas for frame processing */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Scan overlay */}
                <div className="absolute inset-0 z-10">
                    {/* Corner brackets */}
                    <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                    <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />

                    {/* Animated scan line */}
                    {!isStarting && !error && (
                        <div
                            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_rgba(211,187,255,0.6)]"
                            style={{ top: `${scanLine}%`, transition: 'top 20ms linear' }}
                        />
                    )}

                    {/* Darkened border areas */}
                    <div className="absolute inset-0 border-[12px] border-surface/40 rounded-2xl" />
                </div>

                {/* Loading state */}
                {isStarting && !error && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm">
                        <div className="w-8 h-8 border-2 border-outline-variant/20 border-t-primary rounded-full animate-spin mb-3" />
                        <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                            Activation caméra...
                        </p>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/90 backdrop-blur-sm p-4">
                        <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <p className="text-on-surface-variant text-xs text-center font-medium leading-relaxed">
                            {error}
                        </p>
                        <button
                            onClick={startCamera}
                            className="mt-3 text-primary text-xs font-bold uppercase tracking-widest hover:underline"
                        >
                            Réessayer
                        </button>
                    </div>
                )}
            </div>

            {/* Instructions */}
            {!error && !isStarting && (
                <div className="flex items-center gap-2 text-on-surface-variant/70">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <p className="text-xs font-medium tracking-wide">
                        Pointez la caméra vers le QR code
                    </p>
                </div>
            )}
        </motion.div>
    )
}

export default QRScanner
