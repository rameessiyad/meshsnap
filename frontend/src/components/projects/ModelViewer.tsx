"use client";

import {
  Bounds,
  Center,
  OrbitControls,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Camera, ImagePlus, Loader2, RotateCcw } from "lucide-react";
import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type * as THREE from "three";

import { useModelUrl } from "@/hooks/useModelUrl";
import { saveBlob } from "@/lib/api/generation";

const TOOL_BUTTON =
  "landing-outline-button inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground aria-pressed:border-primary aria-pressed:text-primary-text disabled:cursor-not-allowed disabled:opacity-60";

const SELECT =
  "rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground outline-none focus:border-primary";

const BACKGROUNDS = {
  default: { label: "Default", color: null },
  dark: { label: "Dark", color: "#0b0f0d" },
  light: { label: "Light", color: "#eef2ef" },
  grey: { label: "Grey", color: "#6b7280" },
} as const;
type BackgroundKey = keyof typeof BACKGROUNDS;

const LIGHTING = {
  studio: { label: "Studio", ambient: 0.6, hemi: 0.7, key: 1.6, fill: 0.6 },
  soft: { label: "Soft", ambient: 1.1, hemi: 1.0, key: 0.8, fill: 0.5 },
  dramatic: {
    label: "Dramatic",
    ambient: 0.15,
    hemi: 0.2,
    key: 2.6,
    fill: 0.15,
  },
} as const;
type LightingKey = keyof typeof LIGHTING;

type CaptureFn = (maxWidth?: number) => Promise<Blob | null>;

/* A broken or unsupported file should show a message, not crash the page. */
class ViewerErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
          This model could not be displayed. You can still download the file.
        </div>
      );
    }
    return this.props.children;
  }
}

function Model({ url, wireframe }: { url: string; wireframe: boolean }) {
  // false = do not load the Draco decoder from the internet.
  const { scene } = useGLTF(url, false);

  useEffect(() => {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const material of materials) {
        if ("wireframe" in material) {
          (material as THREE.MeshStandardMaterial).wireframe = wireframe;
        }
      }
    });
  }, [scene, wireframe]);

  return <primitive object={scene} />;
}

/* Gives the toolbar a way to take a snapshot of the 3D canvas. */
function CaptureBridge({
  captureRef,
}: {
  captureRef: RefObject<CaptureFn | null>;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    captureRef.current = (maxWidth = 640) =>
      new Promise<Blob | null>((resolve) => {
        gl.render(scene, camera);
        const source = gl.domElement;
        const scale = Math.min(1, maxWidth / source.width);
        const out = document.createElement("canvas");
        out.width = Math.max(1, Math.round(source.width * scale));
        out.height = Math.max(1, Math.round(source.height * scale));
        const context = out.getContext("2d");
        if (!context) {
          resolve(null);
          return;
        }
        context.drawImage(source, 0, 0, out.width, out.height);
        out.toBlob((blob) => resolve(blob), "image/png");
      });
    return () => {
      captureRef.current = null;
    };
  }, [gl, scene, camera, captureRef]);

  return null;
}

/* Mounts only after the model has loaded (it sits next to it inside Suspense). */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const latest = useRef(onReady);
  useEffect(() => {
    latest.current = onReady;
  });
  useEffect(() => {
    // Give the camera a moment to finish fitting the model.
    const timer = setTimeout(() => latest.current(), 1200);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

function ModelLoadingStatus() {
  const { active } = useProgress();

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <span
        role="status"
        className="whitespace-nowrap text-xs text-muted-foreground"
      >
        Loading model…
      </span>
    </div>
  );
}

type ModelViewerProps = {
  assetId: string;
  /** Used for the screenshot file name. */
  name?: string;
  /** When given, the viewer can save a snapshot as the project thumbnail. */
  onThumbnail?: (blob: Blob, auto: boolean) => void;
  thumbnailSaving?: boolean;
  /** Save a thumbnail automatically once the model has loaded. */
  autoThumbnail?: boolean;
};

export default function ModelViewer({
  assetId,
  name = "model",
  onThumbnail,
  thumbnailSaving = false,
  autoThumbnail = false,
}: ModelViewerProps) {
  const { data: url, isPending, isError, refetch } = useModelUrl(assetId);
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [background, setBackground] = useState<BackgroundKey>("default");
  const [lighting, setLighting] = useState<LightingKey>("studio");
  // Changing the key rebuilds the canvas, which resets the camera.
  const [resetKey, setResetKey] = useState(0);

  const captureRef = useRef<CaptureFn | null>(null);
  const autoDoneFor = useRef<string | null>(null);

  const light = LIGHTING[lighting];
  const backgroundColor = BACKGROUNDS[background].color;

  async function onScreenshot() {
    const blob = await captureRef.current?.(1600);
    if (blob) saveBlob(blob, `${name}.png`);
  }

  async function onUseAsThumbnail() {
    const blob = await captureRef.current?.(640);
    if (blob) onThumbnail?.(blob, false);
  }

  function onModelReady() {
    if (!autoThumbnail || !onThumbnail || autoDoneFor.current === assetId) {
      return;
    }
    autoDoneFor.current = assetId;
    captureRef.current?.(640).then((blob) => {
      if (blob) onThumbnail(blob, true);
    });
  }

  const ready = !isPending && !isError && !!url;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-raised">
        {isPending ? (
          <div className="h-full w-full animate-pulse" />
        ) : isError || !url ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
            <p>Could not load the model file.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className={TOOL_BUTTON}
            >
              Try again
            </button>
          </div>
        ) : (
          <ViewerErrorBoundary>
            <Canvas
              key={resetKey}
              dpr={[1, 2]}
              camera={{ position: [3, 2, 4], fov: 45 }}
              gl={{ preserveDrawingBuffer: true }}
            >
              {backgroundColor && (
                <color attach="background" args={[backgroundColor]} />
              )}
              <ambientLight intensity={light.ambient} />
              <hemisphereLight args={["#ffffff", "#444444", light.hemi]} />
              <directionalLight position={[5, 8, 5]} intensity={light.key} />
              <directionalLight position={[-5, 3, -4]} intensity={light.fill} />
              <CaptureBridge captureRef={captureRef} />
              <Suspense fallback={null}>
                <Bounds fit clip observe margin={1.25}>
                  <Center>
                    <Model url={url} wireframe={wireframe} />
                  </Center>
                </Bounds>
                <ReadySignal onReady={onModelReady} />
              </Suspense>
              <OrbitControls
                makeDefault
                enableDamping
                autoRotate={autoRotate}
                autoRotateSpeed={2}
              />
            </Canvas>
            <ModelLoadingStatus />
          </ViewerErrorBoundary>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setResetKey((key) => key + 1)}
          className={TOOL_BUTTON}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset view
        </button>
        <button
          type="button"
          aria-pressed={autoRotate}
          onClick={() => setAutoRotate((value) => !value)}
          className={TOOL_BUTTON}
        >
          Auto-rotate
        </button>
        <button
          type="button"
          aria-pressed={wireframe}
          onClick={() => setWireframe((value) => !value)}
          className={TOOL_BUTTON}
        >
          Wireframe
        </button>
        <button
          type="button"
          onClick={onScreenshot}
          disabled={!ready}
          className={TOOL_BUTTON}
        >
          <Camera className="size-3.5" aria-hidden="true" />
          Screenshot
        </button>
        {onThumbnail && (
          <button
            type="button"
            onClick={onUseAsThumbnail}
            disabled={!ready || thumbnailSaving}
            className={TOOL_BUTTON}
          >
            {thumbnailSaving ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-3.5" aria-hidden="true" />
            )}
            Use as thumbnail
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Background
          <select
            value={background}
            onChange={(event) =>
              setBackground(event.target.value as BackgroundKey)
            }
            className={SELECT}
          >
            {Object.entries(BACKGROUNDS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Lighting
          <select
            value={lighting}
            onChange={(event) => setLighting(event.target.value as LightingKey)}
            className={SELECT}
          >
            {Object.entries(LIGHTING).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
        <p className="hidden text-xs text-muted-foreground sm:ml-auto sm:block">
          Drag to rotate · scroll to zoom · right-drag to pan
        </p>
      </div>
    </div>
  );
}
