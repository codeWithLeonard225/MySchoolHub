import React, { useRef, useEffect, useState } from "react";

const CameraCapture = ({ setPhoto, onClose, initialFacingMode }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // ✅ STORE STREAM HERE
  const [facingMode, setFacingMode] = useState(initialFacingMode);
  const [cameraError, setCameraError] = useState(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
 const startCamera = async () => {
  try {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    let stream;

    try {
      // Try requested camera (mobile mostly)
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
    } catch {
      // Fallback for laptop
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
    }

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

  } catch (err) {
    console.error("Camera error:", err);
    setCameraError("No camera found or permission denied.");
  }
};

  startCamera();

  return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
}, [facingMode]);

 const capturePhoto = () => {
  if (!videoRef.current || !canvasRef.current) return;

  const video = videoRef.current;
  const canvas = canvasRef.current;
  const context = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = canvas.toDataURL("image/png");

  // 🔴 STOP CAMERA HERE
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }

  setPhoto(imageData);
  onClose();
};

  const handleClose = () => {
    stopCamera(); // ✅ FIX cancel issue
    onClose();
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', maxWidth: '24rem', width: '100%' }}>
        
      {cameraError ? (
  <div style={{ color: "red", textAlign: "center", marginBottom: "10px" }}>
    {cameraError}
  </div>
) : (
  <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
    {facingMode === "user" ? "Front Camera" : "Back Camera"}
  </h3>
)}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: "100%", borderRadius: "8px" }}
        />

        <canvas ref={canvasRef} hidden />

        <div style={{ display: "flex", justifyContent: "space-around", marginTop: "10px" }}>
          <button onClick={capturePhoto} style={{ background: "green", color: "#fff", padding: "8px" }}>
            Capture
          </button>

          <button onClick={toggleCamera} style={{ background: "orange", color: "#fff", padding: "8px" }}>
            Switch
          </button>

         <button
  onClick={() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    onClose();
  }}
>
  Cancel
</button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;