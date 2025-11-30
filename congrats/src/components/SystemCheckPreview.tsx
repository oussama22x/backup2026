import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, AlertCircle, Volume2, Mic as MicIcon } from "lucide-react";

interface SystemCheckPreviewProps {
  onReady?: (isReady: boolean) => void;
}

export const SystemCheckPreview = ({ onReady }: SystemCheckPreviewProps) => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  const [selectedCamera, setSelectedCamera] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Get available devices
  const getDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      setDevices(deviceList);

      // Set defaults
      const defaultMic = deviceList.find(d => d.kind === 'audioinput' && d.deviceId === 'default')?.deviceId ||
        deviceList.find(d => d.kind === 'audioinput')?.deviceId || '';
      const defaultSpeaker = deviceList.find(d => d.kind === 'audiooutput' && d.deviceId === 'default')?.deviceId ||
        deviceList.find(d => d.kind === 'audiooutput')?.deviceId || '';
      const defaultCamera = deviceList.find(d => d.kind === 'videoinput' && d.deviceId === 'default')?.deviceId ||
        deviceList.find(d => d.kind === 'videoinput')?.deviceId || '';

      setSelectedMic(defaultMic);
      setSelectedSpeaker(defaultSpeaker);
      setSelectedCamera(defaultCamera);
    } catch (error) {
      console.error("❌ Error getting devices:", error);
    }
  };

  const setupCamera = async () => {
    let mounted = true;
    let stream: MediaStream | null = null;

    setIsCameraReady(false);
    setCameraError(null);
    setIsRetrying(true);

    // Clean up existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    try {
      console.log("🎥 Requesting camera access...");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API not supported");
      }

      const constraints: MediaStreamConstraints = {
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log("✅ Camera and audio access granted");

      if (!mounted) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;

      // Get devices after permission granted
      await getDevices();

      if (!videoRef.current) {
        throw new Error("Video element not available");
      }

      const videoElement = videoRef.current;
      videoElement.srcObject = stream;

      return new Promise<void>((resolve, reject) => {
        if (!videoElement) {
          reject(new Error("Video element is null"));
          return;
        }

        const onLoadedMetadata = () => {
          console.log("✅ Video metadata loaded, ready to play");
          videoElement.play()
            .then(() => {
              console.log("✅ Video playing successfully");
              if (mounted) {
                setIsCameraReady(true);
                setIsRetrying(false);
                onReady?.(true);
              }
              resolve();
            })
            .catch((playError) => {
              console.error("❌ Video play error:", playError);
              reject(playError);
            });
        };

        const onError = (error: Event) => {
          console.error("❌ Video element error:", error);
          reject(new Error("Video element failed to render"));
        };

        videoElement.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
        videoElement.addEventListener('error', onError, { once: true });

        setTimeout(() => {
          videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
          videoElement.removeEventListener('error', onError);
          if (!mounted || isCameraReady) return;
          reject(new Error("Video load timeout"));
        }, 3000);
      });

    } catch (error: any) {
      console.error("❌ Camera access error:", error);

      if (!mounted) return;

      if (error.name === "NotFoundError") {
        setCameraError("No camera device found. You can continue without camera verification.");
      } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera access and click Retry.");
      } else {
        setCameraError(`Unable to access camera: ${error.message}`);
      }
      onReady?.(false);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    setupCamera();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Handle device changes
  const handleMicChange = (deviceId: string) => {
    setSelectedMic(deviceId);
    setupCamera();
  };

  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    setupCamera();
  };

  const handleSpeakerChange = (deviceId: string) => {
    setSelectedSpeaker(deviceId);
  };

  const handleTestMic = () => {
    // TODO: Implement mic test
    console.log("Testing microphone...");
  };

  const handlePlayTestSound = () => {
    // TODO: Implement test sound playback
    const audio = new Audio('data:audio/wav;base64,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');
    audio.play();
  };

  const micDevices = devices.filter(d => d.kind === 'audioinput');
  const speakerDevices = devices.filter(d => d.kind === 'audiooutput');
  const cameraDevices = devices.filter(d => d.kind === 'videoinput');

  return (
    <div className="space-y-3">
      {/* Compact Video Preview */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-contain transition-opacity duration-300 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Live indicator */}
        {isCameraReady && (
          <div className="absolute top-2 left-2 z-10">
            <div className="flex items-center gap-1.5 bg-green-500/90 backdrop-blur-sm rounded-full px-2.5 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-xs text-white font-semibold">LIVE</span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-black/90 to-black/95 z-20">
            <div className="bg-yellow-500/10 rounded-full p-3 mb-2">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="text-sm text-white font-semibold mb-1">Camera Unavailable</h3>
            <p className="text-xs text-gray-300 max-w-md mb-3">{cameraError}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={setupCamera}
              disabled={isRetrying}
            >
              {isRetrying ? "Retrying..." : "Retry"}
            </Button>
          </div>
        )}

        {/* Loading overlay */}
        {!isCameraReady && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/90 to-black/95 z-20">
            <div className="bg-primary/10 rounded-full p-3 mb-2">
              <Video className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <p className="text-sm text-gray-300 font-medium">
              {isRetrying ? "Initializing..." : "Loading..."}
            </p>
          </div>
        )}
      </div>

      {/* Device Selectors - Compact */}
      <div className="grid grid-cols-3 gap-2">
        {/* Microphone Source */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
            <MicIcon className="h-3 w-3 text-primary" />
            Microphone
          </label>
          <Select value={selectedMic} onValueChange={handleMicChange}>
            <SelectTrigger className="h-9 text-xs border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="Select mic" />
            </SelectTrigger>
            <SelectContent>
              {micDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId} className="text-xs">
                  {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Speaker Source */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
            <Volume2 className="h-3 w-3 text-primary" />
            Speaker
          </label>
          <Select value={selectedSpeaker} onValueChange={handleSpeakerChange}>
            <SelectTrigger className="h-9 text-xs border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="Select speaker" />
            </SelectTrigger>
            <SelectContent>
              {speakerDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId} className="text-xs">
                  {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Camera Source */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
            <Video className="h-3 w-3 text-primary" />
            Camera
          </label>
          <Select value={selectedCamera} onValueChange={handleCameraChange}>
            <SelectTrigger className="h-9 text-xs border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {cameraDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId} className="text-xs">
                  {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
