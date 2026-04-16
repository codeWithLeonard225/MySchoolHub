import React, { useRef, useEffect, useState } from "react";

const CameraCapture = ({ setPhoto, onClose, initialFacingMode }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // Use a ref to track the stream accurately
  const [facingMode, setFacingMode] = useState(initialFacingMode || "environment");
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      // Always stop existing tracks before starting new ones
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } }, // Use ideal for better compatibility
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        setCameraError("Camera access denied or device not found.");
      }
    };

    startCamera();

    // CLEANUP: This is the most important part
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]); // Remove onClose from dependencies to prevent unnecessary restarts

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Ensure video is actually playing/ready
    if (video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/png");
    setPhoto(imageData); // This calls handleCameraCapture in your parent
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', width: '90%', maxWidth: '500px' }}>
        {cameraError ? (
          <div className="p-4 bg-red-100 text-red-700 mb-4 rounded">{cameraError}</div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline // Crucial for iOS/Mobile browsers
            style={{ width: '100%', borderRadius: '0.5rem', transform: facingMode === "user" ? "scaleX(-1)" : "none" }} 
          />
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', justifyContent: 'center' }}>
          <button onClick={capturePhoto} style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '5px' }}>Capture</button>
          <button onClick={toggleCamera} style={{ background: '#eab308', color: 'white', padding: '10px 20px', borderRadius: '5px' }}>Switch</button>
          <button onClick={onClose} style={{ background: '#dc2626', color: 'white', padding: '10px 20px', borderRadius: '5px' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;