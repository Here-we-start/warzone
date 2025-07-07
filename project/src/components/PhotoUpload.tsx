import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Camera } from 'lucide-react';
import GlassPanel from './GlassPanel';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  required?: boolean;
}

export default function PhotoUpload({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 2, 
  required = true 
}: PhotoUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newPhotos: string[] = [];
    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPhotos.push(e.target.result as string);
            if (newPhotos.length === filesToProcess) {
              onPhotosChange([...photos, ...newPhotos]);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setCameraStream(stream);
      setShowCameraModal(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Impossibile accedere alla fotocamera. Verifica i permessi del browser.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    onPhotosChange([...photos, photoDataUrl]);
    closeCameraModal();
  };

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const switchCamera = async () => {
    if (!cameraStream) return;

    try {
      cameraStream.getTracks().forEach(track => track.stop());

      const currentTrack = cameraStream.getVideoTracks()[0];
      const settings = currentTrack.getSettings();
      const currentFacingMode = settings.facingMode;
      const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';

      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: newFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });

      setCameraStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      alert('Impossibile cambiare fotocamera.');
    }
  };

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center space-x-2 text-ice-blue font-mono text-sm sm:text-base">
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>FOTO PROVA PARTITA</span>
          {required && <span className="text-red-400">*</span>}
        </div>

        {/* Main Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all duration-300 cursor-pointer ${
            dragOver
              ? 'border-ice-blue bg-ice-blue/10 scale-105'
              : photos.length >= maxPhotos
              ? 'border-gray-500/50 bg-gray-500/5 cursor-not-allowed'
              : 'border-ice-blue/40 hover:border-ice-blue hover:bg-ice-blue/5'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={photos.length < maxPhotos ? openFileDialog : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={photos.length >= maxPhotos}
          />

          <div className="space-y-3 sm:space-y-4">
            <Upload className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto transition-all duration-300 ${
              dragOver ? 'scale-110 text-ice-blue' :
              photos.length >= maxPhotos ? 'text-gray-500' : 'text-ice-blue'
            }`} />
            
            {photos.length >= maxPhotos ? (
              <div className="text-gray-400 font-mono">
                <div className="text-base sm:text-lg font-bold">LIMITE RAGGIUNTO</div>
                <div className="text-xs sm:text-sm">({photos.length}/{maxPhotos} foto caricate)</div>
              </div>
            ) : (
              <div className="text-ice-blue font-mono">
                <div className="text-base sm:text-xl font-bold mb-2">
                  {dragOver ? 'RILASCIA QUI LE FOTO' : 'TRASCINA LE FOTO QUI'}
                </div>
                <div className="text-xs sm:text-sm text-ice-blue/80 mb-3">
                  o clicca per selezionare ({photos.length}/{maxPhotos})
                </div>
                <div className="text-xs text-ice-blue/60">
                  Formati supportati: JPG, PNG, WEBP
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Camera Button */}
        {isMobile && photos.length < maxPhotos && (
          <button
            onClick={startCamera}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/50 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-all duration-300 hover:scale-105 font-mono flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>SCATTA FOTO CON FOTOCAMERA</span>
          </button>
        )}

        {/* Photo Preview Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group animate-fade-in">
                <img
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-24 sm:h-32 object-cover rounded-lg border border-ice-blue/30 transition-all duration-300 group-hover:border-ice-blue"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 w-6 h-6 sm:w-7 sm:h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full font-mono border border-ice-blue/30">
                  FOTO {index + 1}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* Validation Messages */}
        {required && photos.length === 0 && (
          <div className="flex items-center space-x-2 text-red-400 text-xs sm:text-sm font-mono bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4 animate-fade-in">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>DEVI CARICARE ALMENO {maxPhotos} FOTO PER CONTINUARE</span>
          </div>
        )}

        {photos.length > 0 && photos.length < maxPhotos && required && (
          <div className="flex items-center space-x-2 text-yellow-400 text-xs sm:text-sm font-mono bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4 animate-fade-in">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>CARICA ANCORA {maxPhotos - photos.length} FOTO</span>
          </div>
        )}

        {photos.length === maxPhotos && (
          <div className="flex items-center space-x-2 text-green-400 text-xs sm:text-sm font-mono bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4 animate-fade-in">
            <div className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-green-400">✓</div>
            <span>TUTTE LE FOTO SONO STATE CARICATE CORRETTAMENTE</span>
          </div>
        )}
      </div>

      {/* Camera Modal for Mobile */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <GlassPanel className="w-full max-w-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-white font-mono flex items-center space-x-2">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-ice-blue" />
                <span>SCATTA FOTO</span>
              </h3>
              <button
                onClick={closeCameraModal}
                className="text-ice-blue/60 hover:text-ice-blue transition-colors text-xl sm:text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-48 sm:h-64 md:h-80 object-cover rounded-lg border border-ice-blue/30 bg-black"
              />
              
              <canvas ref={canvasRef} className="hidden" />

              {/* Camera Controls */}
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={switchCamera}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-black/70 border border-ice-blue/50 text-ice-blue rounded-full flex items-center justify-center hover:bg-ice-blue/20 transition-all duration-300 hover:scale-110"
                  title="Cambia fotocamera"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                <button
                  onClick={capturePhoto}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black rounded-full flex items-center justify-center hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-110 transition-all duration-300 font-mono font-bold text-lg sm:text-2xl"
                  title="Scatta foto"
                >
                  📸
                </button>
                
                <button
                  onClick={closeCameraModal}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/70 border border-red-500/50 text-white rounded-full flex items-center justify-center hover:bg-red-500/90 transition-all duration-300 hover:scale-110"
                  title="Annulla"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 text-center text-ice-blue/60 text-xs sm:text-sm font-mono space-y-1">
              <div>• Clicca il pulsante centrale per scattare la foto</div>
              <div>• Usa il pulsante laterale per cambiare fotocamera</div>
              <div>• Assicurati che la foto sia chiara e leggibile</div>
            </div>
          </GlassPanel>
        </div>
      )}
    </>
  );
}