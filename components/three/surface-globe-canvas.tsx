"use client";

import { Html, OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import { clusterSurfacePoints, latLonToVector3 } from "@/lib/geo";
import type { SurfacePointLite } from "@/lib/types";

const NORMAL_SCALE = new THREE.Vector2(0.5, 0.5);

const TYPE_COLOR: Record<string, string> = {
  lander: "#E5B45C",
  rover: "#70C99B",
  instrument: "#55C8FF",
  descent_stage: "#C3CAD4",
  ascent_stage: "#8B96A5",
  impact_site: "#F07854",
  unknown: "#8B96A5",
};

export interface SurfaceGlobeCanvasProps {
  points: SurfacePointLite[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  textureUrl: string;
  /** Optional tangent-space normal map derived from the surface height field. */
  normalUrl?: string | null;
  accent: string;
  bodyName: string;
  autoRotate: boolean;
}

const textureCache = new Map<string, THREE.Texture>();

function loadTexture(url: string, colorSpace: THREE.ColorSpace) {
  // The maps outlive individual mounts: a module-level cache keeps React
  // StrictMode's double mount from disposing a texture that is still in use.
  const cached = textureCache.get(url);
  if (cached) return cached;
  const texture = new THREE.TextureLoader().load(url);
  texture.colorSpace = colorSpace;
  texture.anisotropy = 8;
  textureCache.set(url, texture);
  return texture;
}

function Globe({ textureUrl, normalUrl }: { textureUrl: string; normalUrl?: string | null }) {
  // Build the maps before the material exists so its shader is compiled with
  // USE_MAP/USE_NORMALMAP from the very first frame. Assigning a map to an
  // already-compiled material can leave it sampling the default white texture.
  const texture = useMemo(() => loadTexture(textureUrl, THREE.SRGBColorSpace), [textureUrl]);
  const normal = useMemo(
    () => (normalUrl ? loadTexture(normalUrl, THREE.NoColorSpace) : null),
    [normalUrl],
  );

  return (
    <mesh>
      <sphereGeometry args={[1, 192, 128]} />
      <meshStandardMaterial
        map={texture}
        normalMap={normal ?? undefined}
        normalScale={normal ? NORMAL_SCALE : undefined}
        roughness={0.96}
        metalness={0}
        envMapIntensity={0}
      />
    </mesh>
  );
}

function Markers({
  points,
  selectedId,
  onSelect,
  accent,
}: {
  points: SurfacePointLite[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  accent: string;
}) {
  const located = useMemo(
    () =>
      points.filter(
        (point): point is SurfacePointLite & { latitude: number; longitude: number } =>
          point.located && point.latitude !== null && point.longitude !== null,
      ),
    [points],
  );
  const clusters = useMemo(() => clusterSurfacePoints(located, 0.32), [located]);

  const selected = points.find((point) => point.id === selectedId);

  return (
    <>
      {clusters.map((cluster) => {
        const position = latLonToVector3(cluster.latitude, cluster.longitude, 1.006);
        const isSelected = cluster.items.some((item) => item.id === selectedId);
        const color = isSelected
          ? "#FFFFFF"
          : TYPE_COLOR[cluster.items[0].type] ?? accent;
        const size = cluster.items.length > 1 ? 0.016 : 0.012;

        return (
          <group key={cluster.key} position={position}>
            <mesh
              onClick={(event) => {
                event.stopPropagation();
                onSelect(cluster.items[0].id);
              }}
              onPointerOver={(event) => {
                event.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <sphereGeometry args={[size, 12, 12]} />
              <meshBasicMaterial color={color} />
            </mesh>
            <mesh rotation={[0, 0, 0]}>
              <ringGeometry args={[size * 1.6, size * 2.3, 20]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={isSelected ? 0.95 : 0.35}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            {cluster.items.length > 1 ? (
              <Html center distanceFactor={2.4} zIndexRange={[10, 0]}>
                <span className="pointer-events-none block -translate-y-3 font-mono text-[8px] tracking-[0.1em] text-mist-300">
                  {cluster.items.length}
                </span>
              </Html>
            ) : null}
          </group>
        );
      })}

      {selected && selected.latitude !== null && selected.longitude !== null ? (
        <group position={latLonToVector3(selected.latitude, selected.longitude, 1.02)}>
          <Html center distanceFactor={2.6} zIndexRange={[20, 0]}>
            <div className="pointer-events-none -translate-y-5 whitespace-nowrap border border-white/25 bg-ink-950/90 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-mist-100">
              {selected.name}
            </div>
          </Html>
        </group>
      ) : null}
    </>
  );
}

export default function SurfaceGlobeCanvas({
  points,
  selectedId,
  onSelect,
  textureUrl,
  normalUrl,
  accent,
  bodyName,
  autoRotate,
}: SurfaceGlobeCanvasProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.75, 2.9], fov: 42, near: 0.01, far: 100 }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMappingExposure: 1.45,
      }}
      className="canvas-shell"
    >
      <color attach="background" args={["#04060a"]} />
      {/* One hard sun plus a faint fill, so the terminator and relief stay readable. */}
      <ambientLight intensity={0.26} />
      <directionalLight position={[3.8, 2.0, 4.6]} intensity={4.0} color="#fff4e2" />
      <directionalLight position={[-4, -1, -3]} intensity={0.3} color="#8aa4ff" />
      <Stars radius={70} depth={40} count={1800} factor={2.6} saturation={0} fade speed={0.25} />
      {/* Rotate body and markers together so longitude 0° faces the camera and
          east stays to the right, matching the equirectangular texture layout. */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        <Globe textureUrl={textureUrl} normalUrl={normalUrl} />
        <Markers points={points} selectedId={selectedId} onSelect={onSelect} accent={accent} />
      </group>
      <OrbitControls
        enablePan={false}
        minDistance={1.25}
        maxDistance={6}
        autoRotate={autoRotate}
        autoRotateSpeed={0.35}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
        enableDamping
        dampingFactor={0.08}
      />
      <Html position={[0, -1.35, 0]} center>
        <span className="pointer-events-none whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.2em] text-mist-600">
          {bodyName} · equirectangular texture · CC BY 4.0 Solar System Scope
        </span>
      </Html>
    </Canvas>
  );
}
