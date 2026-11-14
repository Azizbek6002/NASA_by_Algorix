"use client";

import { Html, OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

import { clusterSurfacePoints, latLonToVector3 } from "@/lib/geo";
import type { SurfacePointLite } from "@/lib/types";

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
  accent: string;
  bodyName: string;
  autoRotate: boolean;
}

function Globe({ textureUrl }: { textureUrl: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let disposed = false;
    const loader = new THREE.TextureLoader();
    loader.load(textureUrl, (loaded) => {
      if (disposed) {
        loaded.dispose();
        return;
      }
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 8;
      setTexture(loaded);
    });
    return () => {
      disposed = true;
    };
  }, [textureUrl]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 128, 96]} />
        {texture ? (
          <meshStandardMaterial map={texture} roughness={1} metalness={0} />
        ) : (
          <meshStandardMaterial color="#1a222c" roughness={1} />
        )}
      </mesh>
      <mesh scale={1.004}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.02} side={THREE.BackSide} />
      </mesh>
    </group>
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
  accent,
  bodyName,
  autoRotate,
}: SurfaceGlobeCanvasProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.75, 2.9], fov: 42, near: 0.01, far: 100 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="canvas-shell"
    >
      <color attach="background" args={["#04060a"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 2.5, 3]} intensity={2.0} color="#fff6e8" />
      <directionalLight position={[-4, -1, -3]} intensity={0.35} color="#7f9dff" />
      <Stars radius={70} depth={40} count={1800} factor={2.6} saturation={0} fade speed={0.25} />
      <Globe textureUrl={textureUrl} />
      <Markers points={points} selectedId={selectedId} onSelect={onSelect} accent={accent} />
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
