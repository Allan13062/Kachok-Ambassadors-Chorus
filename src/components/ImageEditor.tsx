import React, { useState, useRef, useEffect } from "react";
import { Upload, RotateCw, ZoomIn, ZoomOut, Check, X, ShieldAlert, Image as ImageIcon } from "lucide-react";

interface ImageEditorProps {
  initialImage?: string;
  onSave: (base64Image: string) => void;
  onCancel: () => void;
}

export default function ImageEditor({ initialImage, onSave, onCancel }: ImageEditorProps) {
  // If we have an existing initial image, we can pre-load it!
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Sync state if initialImage changes
  useEffect(() => {
    if (initialImage) {
      // If it's a relative URL or absolute on same host, fetch it as a blob
      // to convert it to a raw base64 data-url. This prevents any Canvas Taint (CORS)
      // issues inside sandboxed Google AI Studio preview iframes!
      if (!initialImage.startsWith("data:") && !initialImage.startsWith("blob:")) {
        fetch(initialImage)
          .then(res => {
            if (!res.ok) throw new Error("Fetch failed; status " + res.status);
            return res.blob();
          })
          .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === "string") {
                setImageSrc(reader.result);
              }
            };
            reader.readAsDataURL(blob);
          })
          .catch(err => {
            console.warn("Failed to pre-fetch image as blob, falling back to original URL.", err);
            setImageSrc(initialImage);
          });
      } else {
        setImageSrc(initialImage);
      }
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    } else {
      setImageSrc(null);
    }
  }, [initialImage]);

  // Reset offset states when changing image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImageSrc(reader.result);
          setZoom(1);
          setRotation(0);
          setPosition({ x: 0, y: 0 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Pointer-based seamless dragging of the profile image directly within limits
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageSrc) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  // Prevent scroll when dragging on mobile browsers
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
      }
    };
    const element = containerRef.current;
    if (element) {
      element.addEventListener("touchmove", handleTouchMove, { passive: false });
    }
    return () => {
      if (element) {
        element.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [isDragging]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const doCrop = () => {
    if (!imageSrc || !imageRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement("canvas");
    const cropSize = 1200; // High resolution 1200x1200px cropped output for retina/high-DPI screens
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      // Fallback if context is unsupported
      onSave(imageSrc);
      return;
    }

    // Enable high quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Fill with dark slate background
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, cropSize, cropSize);

    const natW = img.naturalWidth || img.width;
    const natH = img.naturalHeight || img.height;

    if (!natW || !natH) {
      onSave(imageSrc);
      return;
    }

    // Calculate DOM render dimensions
    const scaleFit = Math.min(280 / natW, 280 / natH);
    const renderWidth = natW * scaleFit;
    const renderHeight = natH * scaleFit;

    // The visible crop area in DOM is 210x210
    const cropFrameSize = 210;
    const scaleDOM2Canvas = cropSize / cropFrameSize;

    const CW = renderWidth * zoom * scaleDOM2Canvas;
    const CH = renderHeight * zoom * scaleDOM2Canvas;

    ctx.save();
    // Translate origin to where the image center should be relative to crop center
    ctx.translate(
      cropSize / 2 + position.x * scaleDOM2Canvas,
      cropSize / 2 + position.y * scaleDOM2Canvas
    );
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.drawImage(
      img,
      -CW / 2,
      -CH / 2,
      CW,
      CH
    );

    ctx.restore();

    try {
      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
      onSave(croppedDataUrl);
    } catch (e) {
      console.error("Failed to extract cropped image from canvas, falling back to original imageSrc:", e);
      // Fallback to original imageSrc if tainted or other canvas issue occurs
      onSave(imageSrc);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="font-sans font-bold text-sm text-white flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Interactive Image Studio</span>
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
        >
          Cancel
        </button>
      </div>

      {!imageSrc ? (
        <div className="border border-dashed border-slate-800 bg-slate-950/60 rounded-xl p-8 text-center flex flex-col items-center justify-center">
          <Upload className="w-8 h-8 text-slate-500 mb-2.5" />
          <p className="text-white text-xs font-semibold mb-1">Pick/Upload Leader Headshot</p>
          <p className="text-[10px] text-slate-500 max-w-[240px] leading-relaxed mb-4">
            Upload from camera roll/photos. High resolution portrait files are compatible!
          </p>
          <label className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono py-2 px-4 rounded-lg cursor-pointer transition-all uppercase">
            Choose Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
              onChange={handleFileChange}
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          <p className="text-[11px] text-slate-400 leading-relaxed text-center px-1">
            💻 Drag the image directly inside the box below, adjust zoom/rotation controls, and click <strong>Apply & Save</strong>.
          </p>

          {/* Interactive display container */}
          <div className="relative flex justify-center items-center bg-slate-950 rounded-xl overflow-hidden py-4">
            
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              className="relative w-[280px] h-[280px] overflow-hidden border-2 border-slate-850 rounded-xl cursor-move touch-none bg-slate-900 select-none shadow-2xl"
            >
              <img
                ref={imageRef}
                src={imageSrc}
                crossOrigin={!imageSrc.startsWith("data:") ? "anonymous" : undefined}
                alt="Crop preview window"
                draggable={false}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
                className="max-w-full max-h-full object-contain pointer-events-none absolute inset-0 m-auto"
              />

              {/* Shading area mask */}
              <div 
                className="absolute inset-0 pointer-events-none border-[35px] border-slate-950/70 flex items-center justify-center animate-fade-in"
              >
                {/* 210x210 inner framing guide */}
                <div className="w-full h-full border border-dashed border-amber-500 rounded-lg relative flex items-center justify-center bg-transparent">
                  <span className="absolute bottom-2 bg-slate-950/80 text-amber-400 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-amber-500/20">
                    Leader Portrait Box
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Control tools (Sliders & Rotator) */}
          <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-850">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-slate-500" />
              <input
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <ZoomIn className="w-4 h-4 text-amber-500" />
              <span className="font-mono text-xs text-amber-400 w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Rotation and File Changes row */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-900/60">
              <button
                type="button"
                onClick={handleRotate}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Rotate 90°</span>
              </button>

              <label className="text-slate-400 hover:text-white underline cursor-pointer text-[11px] font-medium">
                Upload New Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-950 border border-slate-805 hover:bg-slate-900 text-slate-400 hover:text-white font-sans text-xs py-2.5 rounded-lg transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={doCrop}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
