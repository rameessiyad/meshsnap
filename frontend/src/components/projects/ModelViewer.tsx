"use client";

import {
  Bounds,
  Center,
  OrbitControls,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { RotateCcw } from "lucide-react";
import {
  Component,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type * as THREE from "three";

import { useModelUrl } from "@/hooks/useModelUrl";

const TOOL_BUTTON =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground aria-pressed:border-primary aria-pressed:text-primary-text";

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

export default function ModelViewer({ assetId }: { assetId: string }) {
  const { data: url, isPending, isError, refetch } = useModelUrl(assetId);
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  // Changing the key rebuilds the canvas, which resets the camera.
  const [resetKey, setResetKey] = useState(0);

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
            >
              <ambientLight intensity={0.6} />
              <hemisphereLight args={["#ffffff", "#444444", 0.7]} />
              <directionalLight position={[5, 8, 5]} intensity={1.6} />
              <directionalLight position={[-5, 3, -4]} intensity={0.6} />
              <Suspense fallback={null}>
                <Bounds fit clip observe margin={1.25}>
                  <Center>
                    <Model url={url} wireframe={wireframe} />
                  </Center>
                </Bounds>
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
        <p className="ml-auto text-xs text-muted-foreground">
          Drag to rotate · scroll to zoom · right-drag to pan
        </p>
      </div>
    </div>
  );
}
