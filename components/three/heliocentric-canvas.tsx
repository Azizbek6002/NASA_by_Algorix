"use client";

import { Html, OrbitControls, Stars, useTexture } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";

import {
  auToSceneRadius,
  HELIOPAUSE_AU,
  icrfToScene,
  planetVisualRadius,
} from "@/lib/scene";
import type { ObjectStatus } from "@/lib/types";

export interface HeliocentricBody {
  id: string;
  name: string;
  kind: "planet" | "probe";
  radiusKm: number;
  distanceAu: number;
  meanDistanceAu?: number | null;
  visualColor: string;
  texture?: string | null;
  positionKm: [number, number, number];
  status?: ObjectStatus;
  meta?: string;
}

interface HeliocentricCanvasProps {
  bodies: HeliocentricBody[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  mode: "planets" | "deep";
  autoRotate: boolean;
}

function Sun() {
  return (
    <group>
      <pointLight intensity={3.1} distance={0} decay={0} color="#fff2d6" />
      <mesh>
        <sphereGeometry args={[1.35, 48, 32]} />
        <meshBasicMaterial color="#ffd58a" />
      </mesh>
      <mesh scale={1.22}>
        <sphereGeometry args={[1.35, 32, 24]} />
        <meshBasicMaterial
          color="#ff9d3c"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.6}>
        <sphereGeometry args={[1.35, 32, 24]} />
        <meshBasicMaterial
          color="#ff7a18"
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function OrbitRing({
  au,
  opacity = 0.16,
  color = "#9fb4c9",
}: {
  au: number;
  opacity?: number;
  color?: string;
}) {
  const radius = auToSceneRadius(au);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.008, radius + 0.008, 256]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function TexturedPlanet({
  body,
  selected,
  onSelect,
}: {
  body: HeliocentricBody;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const texture = useTexture(body.texture ?? "/textures/2k_earth_daymap.jpg");
  const radius = planetVisualRadius(body.radiusKm);
  const position = useMemo(
    () => icrfToScene(body.positionKm, body.distanceAu),
    [body.positionKm, body.distanceAu],
  );

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  return (
    <group position={position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect(body.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[radius, 48, 32]} />
        <meshStandardMaterial map={texture} roughness={0.95} metalness={0} />
      </mesh>

      {selected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.5, radius * 1.75, 48]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ) : null}

      <Html center position={[0, radius + 0.28, 0]} zIndexRange={[12, 0]}>
        <button
          type="button"
          onClick={() => onSelect(body.id)}
          className={`pointer-events-auto whitespace-nowrap border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] backdrop-blur ${
            selected
              ? "border-white/50 bg-ink-950/90 text-mist-50"
              : "border-white/15 bg-ink-950/70 text-mist-400 hover:border-white/40 hover:text-mist-50"
          }`}
        >
          {body.name}
        </button>
      </Html>
    </group>
  );
}

function ColoredPlanet({
  body,
  selected,
  onSelect,
  compact,
}: {
  body: HeliocentricBody;
  selected: boolean;
  onSelect: (id: string) => void;
  compact: boolean;
}) {
  const radius = compact ? 0.08 : planetVisualRadius(body.radiusKm);
  const position = useMemo(
    () => icrfToScene(body.positionKm, body.distanceAu),
    [body.positionKm, body.distanceAu],
  );

  return (
    <group position={position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect(body.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[radius, 24, 16]} />
        <meshBasicMaterial color={body.visualColor} />
      </mesh>
      {selected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 2.2, radius * 2.7, 40]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ) : null}
      {compact ? (
        <Html center position={[0, radius + 0.18, 0]} zIndexRange={[10, 0]}>
          <span className="pointer-events-none whitespace-nowrap font-mono text-[7px] uppercase tracking-[0.12em] text-mist-600">
            {body.name}
          </span>
        </Html>
      ) : null}
    </group>
  );
}

function ProbeMarker({
  body,
  selected,
  onSelect,
}: {
  body: HeliocentricBody;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const position = useMemo(
    () => icrfToScene(body.positionKm, body.distanceAu),
    [body.positionKm, body.distanceAu],
  );

  return (
    <group position={position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect(body.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <octahedronGeometry args={[selected ? 0.5 : 0.38, 0]} />
        <meshBasicMaterial color={selected ? "#ffffff" : "#9B8CFF"} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.68, 40]} />
        <meshBasicMaterial
          color="#9B8CFF"
          transparent
          opacity={selected ? 0.9 : 0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Html center position={[0, 0.85, 0]} zIndexRange={[14, 0]}>
        <button
          type="button"
          onClick={() => onSelect(body.id)}
          className={`pointer-events-auto whitespace-nowrap border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] backdrop-blur ${
            selected
              ? "border-artifact/60 bg-ink-950/95 text-artifact"
              : "border-white/15 bg-ink-950/70 text-mist-400 hover:border-white/40 hover:text-mist-50"
          }`}
        >
          {body.name}
        </button>
        {body.meta ? (
          <span className="mt-0.5 block whitespace-nowrap text-center font-mono text-[7px] tracking-[0.08em] text-mist-600">
            {body.meta}
          </span>
        ) : null}
      </Html>
    </group>
  );
}

function Heliopause() {
  const radius = auToSceneRadius(HELIOPAUSE_AU);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.02, radius + 0.02, 256]} />
        <meshBasicMaterial
          color="#9B8CFF"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Html position={[radius * 0.72, 0.4, radius * 0.72]} center zIndexRange={[8, 0]}>
        <span className="pointer-events-none whitespace-nowrap font-mono text-[7px] uppercase tracking-[0.16em] text-[#9B8CFF]/70">
          Heliopause ≈ 120 AU (schematic)
        </span>
      </Html>
    </group>
  );
}

function Scene({
  bodies,
  selectedId,
  onSelect,
  mode,
  autoRotate,
}: HeliocentricCanvasProps) {
  const planets = bodies.filter((body) => body.kind === "planet");
  const probes = bodies.filter((body) => body.kind === "probe");

  return (
    <>
      <ambientLight intensity={0.34} />
      <Stars radius={260} depth={120} count={4200} factor={6} saturation={0} fade speed={0.2} />
      <Sun />

      {planets.map((planet) => (
        <Suspense key={planet.id} fallback={null}>
          {mode === "planets" && planet.texture ? (
            <TexturedPlanet
              body={planet}
              selected={planet.id === selectedId}
              onSelect={(id) => onSelect(id)}
            />
          ) : (
            <ColoredPlanet
              body={planet}
              selected={planet.id === selectedId}
              onSelect={(id) => onSelect(id)}
              compact={mode === "deep"}
            />
          )}
          {planet.meanDistanceAu ? (
            <OrbitRing
              au={planet.meanDistanceAu}
              opacity={mode === "deep" ? 0.07 : 0.14}
            />
          ) : null}
        </Suspense>
      ))}

      {probes.map((probe) => (
        <ProbeMarker
          key={probe.id}
          body={probe}
          selected={probe.id === selectedId}
          onSelect={(id) => onSelect(id)}
        />
      ))}

      {mode === "deep" ? <Heliopause /> : null}

      <OrbitControls
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.22}
        rotateSpeed={0.45}
        zoomSpeed={0.6}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export default function HeliocentricCanvas(props: HeliocentricCanvasProps) {
  const isDeep = props.mode === "deep";
  return (
    <Canvas
      dpr={[1, 2]}
      camera={
        isDeep
          ? { position: [0, 34, 66], fov: 45, near: 0.1, far: 2000 }
          : { position: [0, 16, 31], fov: 45, near: 0.1, far: 2000 }
      }
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="canvas-shell"
      onPointerMissed={() => props.onSelect(null)}
    >
      <color attach="background" args={["#04060a"]} />
      <Scene {...props} />
    </Canvas>
  );
}
