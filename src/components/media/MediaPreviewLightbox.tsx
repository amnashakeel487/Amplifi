import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Download,
  Film,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface MediaAsset {
  id: string;
  url: string;
  title: string;
  type: 'image' | 'video' | 'carousel';
  sizeBytes?: number;
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9';
  slides?: string[]; // for carousels
  driveUrl?: string;
}

interface MediaPreviewLightboxProps {
  asset: MediaAsset;
  isOpen: boolean;
  onClose: () => void;
}

export const MediaPreviewLightbox: React.FC<MediaPreviewLightboxProps> = ({
  asset,
  isOpen,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  if (!isOpen) return null;

  const slides = asset.slides || [asset.url];

  const handleNextSlide = () => {
    setCurrentSlide(c => (c + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide(c => (c - 1 + slides.length) % slides.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 select-none animate-in fade-in-0">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 backdrop-blur">
            {asset.type === 'video' ? (
              <Film className="h-5 w-5 text-sky-400" />
            ) : (
              <ImageIcon className="h-5 w-5 text-indigo-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold truncate max-w-xs sm:max-w-md">{asset.title}</h3>
            <p className="text-xs text-white/60">
              {asset.aspectRatio || '1:1'} Format • {asset.sizeBytes ? formatBytes(asset.sizeBytes) : 'Drive Stream'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {asset.driveUrl && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(asset.driveUrl, '_blank')}
              leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
              className="text-xs h-8 bg-white/10 hover:bg-white/20 text-white border-0"
            >
              Open in Drive
            </Button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close Lightbox (ESC)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="relative max-w-4xl max-h-[75vh] w-full flex items-center justify-center overflow-hidden">
        {asset.type === 'video' ? (
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black max-w-sm aspect-[9/16]">
            {/* HTML5 Video or Mock Video Stream */}
            <video
              src={asset.url}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              autoPlay
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {/* Overlay Video Controls */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-2 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs">
              <button
                onClick={e => {
                  e.stopPropagation();
                  const v = e.currentTarget.closest('div')?.parentElement?.querySelector('video');
                  if (v) {
                    if (v.paused) v.play();
                    else v.pause();
                  }
                }}
                className="p-1.5 hover:text-primary-400"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <span className="font-mono text-[11px] text-white/70">0:24 / 0:59</span>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 hover:text-primary-400"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ) : (
          /* Image or Carousel */
          <div className="relative flex flex-col items-center">
            <div
              className="overflow-hidden rounded-xl border border-white/10 shadow-2xl transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              <img
                src={slides[currentSlide]}
                alt={`Slide ${currentSlide + 1}`}
                className="max-h-[68vh] max-w-full object-contain rounded-xl select-none"
              />
            </div>

            {/* Carousel navigation controls if multiple slides */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-5 z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 text-white text-xs">
        {asset.type !== 'video' && (
          <>
            <button
              onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}
              className="p-1 hover:text-primary-300"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="font-mono text-[11px] px-1">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
              className="p-1 hover:text-primary-300"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="h-3 w-px bg-white/20" />
          </>
        )}

        {slides.length > 1 && (
          <span className="font-medium text-white/90">
            Slide {currentSlide + 1} of {slides.length}
          </span>
        )}

        <button
          onClick={() => setZoom(1)}
          className="p-1 hover:text-primary-300 text-[11px] underline"
        >
          Reset View
        </button>
      </div>
    </div>
  );
};
