import React, { useState, useRef, useEffect } from "react";
import { Camera, X, Check, RefreshCw } from "lucide-react";

interface CropModalProps {
  imageSrc: string; // Base64 data url of loaded raw file
  onCrop: (croppedBase64: string) => void;
  onClose: () => void;
  isDark: boolean;
}

export default function CropModal({ imageSrc, onCrop, onClose, isDark }: CropModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset positioning on image change
  useEffect(() => {
    setZoom(1);
    setPosX(0);
    setPosY(0);
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - posX, y: e.clientY - posY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosX(e.clientX - dragStart.current.x);
    setPosY(e.clientY - dragStart.current.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX - posX, y: e.touches[0].clientY - posY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosX(e.touches[0].clientX - dragStart.current.x);
    setPosY(e.touches[0].clientY - dragStart.current.y);
  };

  const handleCrop = () => {
    if (!imageRef.current) return;

    // Create a canvas for exactly 300x400 (3:4 ratio)
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 300, 400);

      const img = imageRef.current;
      
      // Calculate crop metrics based on zoom and positions
      const cropGuideWidth = 180;
      const cropGuideHeight = 240;
      const scale = zoom;

      // Draw active viewport onto 300x400 canvas
      ctx.save();
      
      // Center of canvas
      ctx.translate(150, 200);
      
      // Translate by offset mapped to final coordinates
      const scaleFactor = 300 / cropGuideWidth;
      ctx.translate(posX * scaleFactor, posY * scaleFactor);
      
      // Scale by zoom
      ctx.scale(scale * scaleFactor, scale * scaleFactor);
      
      // Draw image centered
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const displayWidth = 220; // baseline match
      const displayHeight = (imgHeight / imgWidth) * displayWidth;

      ctx.drawImage(img, -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight);
      ctx.restore();

      const croppedBase64 = canvas.toDataURL("image/jpeg", 0.85);
      onCrop(croppedBase64);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transition-all duration-200 border
        ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}
      `}>
        {/* Modal Header */}
        <div className={`p-4 flex justify-between items-center border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          <div className="flex items-center space-x-2">
            <Camera size={18} className="text-blue-500" />
            <h3 className="font-bold text-sm">Crop Pas Foto Siswa (Rasio 3x4)</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content / Crop Area */}
        <div className="p-6 flex flex-col items-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mb-4 leading-relaxed">
            Seret gambar untuk menggeser posisi pas foto, lalu sesuaikan zoom agar wajah siswa pas di dalam kotak merah (3x4).
          </p>

          {/* Interactive viewport container */}
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseDown={handleMouseDown}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onTouchStart={handleTouchStart}
            className="relative w-[280px] h-[340px] bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center cursor-move border border-slate-800"
          >
            {/* Image rendered inside container with dynamic styles */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Source student registration"
              style={{
                transform: `translate(${posX}px, ${posY}px) scale(${zoom})`,
                transition: isDragging ? "none" : "transform 0.1s ease-out",
                pointerEvents: "none",
                maxWidth: "220px",
              }}
              className="object-contain"
            />

            {/* Dark Mask Overlays around the crop boundary */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
              {/* Outer darken masking done manually for fine control */}
              <div className="absolute inset-0 bg-black/45 pointer-events-none" />
              
              {/* White Crop Guide Boundary in exact 3:4 ratio */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[240px] bg-transparent border-2 border-dashed border-red-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] rounded" />
              
              {/* 3:4 guideline indicators */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[240px] border border-red-500/30 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-b border-red-500/20 h-1/3" />
                <div className="w-full border-b border-red-500/20 h-1/3" />
              </div>
            </div>
            
            <span className="absolute bottom-2 left-2 text-[10px] bg-black/75 px-2 py-0.5 rounded text-white pointer-events-none uppercase font-mono tracking-wider">
              Preview 3x4
            </span>
          </div>

          {/* Controls */}
          <div className="w-full mt-5 space-y-4">
            {/* Zoom Slider */}
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-medium text-slate-400">Zoom</span>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[10px] font-mono w-8 text-right font-semibold text-blue-500">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Helper controls */}
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={() => { setPosX(0); setPosY(0); setZoom(1); }}
                className={`px-3 py-1 text-[10px] font-medium rounded-md border flex items-center space-x-1 transition-colors
                  ${isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-100 border-slate-200 hover:bg-slate-200"}
                `}
              >
                <RefreshCw size={12} />
                <span>Reset Posisi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 flex justify-end space-x-2 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors
              ${isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}
            `}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 flex items-center space-x-1 transition-all"
          >
            <Check size={14} />
            <span>Terapkan Potongan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
