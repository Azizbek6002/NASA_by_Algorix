"use client";

import { Html, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { buildOrbitPath, propagateManyEcefScaled, toSatrec } from "@/lib/orbital";
import type { OrbitObjectLite } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  satellite: "#55C8FF",
  rocket_body: "#E5B45C",
  debris: "#6F7B8A",
  unknown: "#C3CAD4",
};

interface EarthOrbitCanvasProps {
  objects: OrbitObjectLite[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  timeScale: number;
  playing: boolean;
  showSelectionOrbit: boolean;
  resetToken?: number;
  onStats?: (stats: { valid: number; total: number; simTime: number }) => void;
}

function Earth() {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const map = loader.load("/textures/2k_earth_daymap.jpg");
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 96, 64]} />
        <meshStandardMaterial map={texture} roughness={0.92} metalness={0.02} />
      </mesh>
      {/* Thin atmosphere shell; purely decorative, no data encoded. */}
      <mesh scale={1.018}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshBasicMaterial
          color="#2a86c9"
          transparent
          opacity={0.11}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function SelectionMarker({
  objects,
  liveRef,
  selectedId,
}: {
  objects: OrbitObjectLite[];
  liveRef: React.MutableRefObject<Float32Array>;
  selectedId: string | null;
}) {
  const group = useRef<THREE.Group>(null);
  const index = useMemo(
    () => objects.findIndex((object) => object.id === selectedId),
    [objects, selectedId],
  );
  const selected = index >= 0 ? objects[index] : null;

  useFrame(() => {
    if (!group.current || index < 0) return;
    const offset = index * 3;
    group.current.position.set(
      liveRef.current[offset],
      liveRef.current[offset + 1],
      liveRef.current[offset + 2],
    );
  });

  if (!selected) return null;

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color="#E5B45C" />
      </mesh>
      <mesh>
        <ringGeometry args={[0.035, 0.05, 32]} />
        <meshBasicMaterial color="#E5B45C" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <Html center distanceFactor={5} zIndexRange={[20, 0]}>
        <div className="pointer-events-none -translate-y-7 whitespace-nowrap border border-artifact/40 bg-ink-950/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-artifact">
          {selected.name}
        </div>
      </Html>
    </group>
  );
}

function OrbitLine({
  object,
  simTimeRef,
}: {
  object: OrbitObjectLite | null;
  simTimeRef: React.MutableRefObject<number>;
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setRefreshKey((value) => value + 1), 20_000);
    return () => window.clearInterval(id);
  }, []);

  const line = useMemo(() => {
    if (!object) return null;
    const points = buildOrbitPath(object, new Date(simTimeRef.current), 220);
    if (points.length < 2) return null;
    const geometry = new THREE.BufferGeometry();
    const flattened = new Float32Array(points.length * 3);
    points.forEach((point, index) => {
      flattened[index * 3] = point[0];
      flattened[index * 3 + 1] = point[1];
      flattened[index * 3 + 2] = point[2];
    });
    geometry.setAttribute("position", new THREE.BufferAttribute(flattened, 3));
    return new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color: "#E5B45C", transparent: true, opacity: 0.55 }),
    );
    // refreshKey intentionally re-samples the orbit as the simulation advances
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object, refreshKey]);

  useEffect(() => () => {
    if (line) {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
  }, [line]);

  if (!line) return null;
  return <primitive object={line} />;
}

function SatelliteField({
  objects,
  selectedId,
  onSelect,
  timeScale,
  playing,
  onStats,
  simTimeRef,
  liveRef,
}: EarthOrbitCanvasProps & {
  simTimeRef: React.MutableRefObject<number>;
  liveRef: React.MutableRefObject<Float32Array>;
}) {
  const { gl, camera, size } = useThree();

  const satrecs = useMemo(() => objects.map((object) => toSatrec(object)), [objects]);
  const groups = useMemo(() => {
    const buckets: Record<string, number[]> = { satellite: [], rocket_body: [], debris: [], unknown: [] };
    objects.forEach((object, index) => {
      const key = buckets[object.type] ? object.type : "unknown";
      buckets[key].push(index);
    });
    return buckets;
  }, [objects]);

  const pointsRefs = useRef<Record<string, THREE.Points | null>>({});

  const buffers = useMemo(() => {
    const make = (indices: number[]) => {
      const positions = new Float32Array(indices.length * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
      const material = new THREE.PointsMaterial({
        size: 0.014,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      });
      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      return { indices, positions, geometry, points };
    };
    return {
      satellite: make(groups.satellite),
      rocket_body: make(groups.rocket_body),
      debris: make(groups.debris),
      unknown: make(groups.unknown),
    };
  }, [groups]);

  useEffect(() => {
    (Object.keys(buffers) as (keyof typeof buffers)[]).forEach((key) => {
      const material = buffers[key].points.material as THREE.PointsMaterial;
      material.color.set(TYPE_COLORS[key] ?? "#C3CAD4");
      material.size = key === "debris" ? 0.009 : 0.015;
    });
  }, [buffers]);

  const lastRefresh = useRef(0);
  const statsClock = useRef(0);

  useFrame((_state, delta) => {
    if (playing) simTimeRef.current += delta * 1000 * timeScale;

    const now = performance.now();
    if (now - lastRefresh.current < 120) return;
    lastRefresh.current = now;

    const live = liveRef.current;
    const valid = propagateManyEcefScaled(satrecs, new Date(simTimeRef.current), live);

    (Object.keys(buffers) as (keyof typeof buffers)[]).forEach((key) => {
      const bucket = buffers[key];
      bucket.indices.forEach((objectIndex, i) => {
        bucket.positions[i * 3] = live[objectIndex * 3];
        bucket.positions[i * 3 + 1] = live[objectIndex * 3 + 1];
        bucket.positions[i * 3 + 2] = live[objectIndex * 3 + 2];
      });
      const attribute = bucket.geometry.getAttribute("position") as THREE.BufferAttribute;
      attribute.needsUpdate = true;
    });

    if (onStats && now - statsClock.current > 400) {
      statsClock.current = now;
      onStats({ valid, total: objects.length, simTime: simTimeRef.current });
    }
  });

  useEffect(() => {
    const element = gl.domElement;
    let downX = 0;
    let downY = 0;
    let downAt = 0;

    const onDown = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
      downAt = performance.now();
    };

    const onUp = (event: PointerEvent) => {
      const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
      if (moved > 6 || performance.now() - downAt > 600) return;
      if (event.button !== 0) return;

      const rect = element.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const live = liveRef.current;
      const vector = new THREE.Vector3();

      let bestIndex = -1;
      let bestDistance = 16; // px
      for (let i = 0; i < objects.length; i += 1) {
        vector.set(live[i * 3], live[i * 3 + 1], live[i * 3 + 2]);
        vector.project(camera);
        if (vector.z > 1) continue;
        const sx = (vector.x * 0.5 + 0.5) * rect.width;
        const sy = (-vector.y * 0.5 + 0.5) * rect.height;
        const distance = Math.hypot(sx - px, sy - py);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = i;
        }
      }

      if (bestIndex >= 0) onSelect(objects[bestIndex].id);
    };

    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointerup", onUp);
    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointerup", onUp);
    };
  }, [camera, gl, liveRef, objects, onSelect, size]);

  return (
    <>
      {(Object.keys(buffers) as (keyof typeof buffers)[]).map((key) => (
        <primitive
          key={key}
          object={buffers[key].points}
          ref={(node: THREE.Points | null) => {
            pointsRefs.current[key] = node;
          }}
        />
      ))}
      <SelectionMarker objects={objects} liveRef={liveRef} selectedId={selectedId} />
    </>
  );
}

function SceneContents(props: EarthOrbitCanvasProps) {
  const simTimeRef = useRef<number>(Date.now());
  const liveRef = useRef<Float32Array>(new Float32Array(props.objects.length * 3));

  useEffect(() => {
    liveRef.current = new Float32Array(props.objects.length * 3);
  }, [props.objects.length]);

  useEffect(() => {
    if (props.resetToken !== undefined) simTimeRef.current = Date.now();
  }, [props.resetToken]);

  const selected = props.objects.find((object) => object.id === props.selectedId) ?? null;

  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[5, 3, 5]} intensity={2.1} color="#fff5e6" />
      <directionalLight position={[-6, -2, -4]} intensity={0.35} color="#4a7dff" />
      <Stars radius={90} depth={45} count={2600} factor={3.2} saturation={0} fade speed={0.4} />
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
      <SatelliteField {...props} simTimeRef={simTimeRef} liveRef={liveRef} />
      {props.showSelectionOrbit ? (
        <OrbitLine object={selected as OrbitObjectLite | null} simTimeRef={simTimeRef} />
      ) : null}
      <OrbitControls
        enablePan={false}
        minDistance={1.35}
        maxDistance={22}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export default function EarthOrbitCanvas(props: EarthOrbitCanvasProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.9, 4.4], fov: 45, near: 0.01, far: 500 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
      className="canvas-shell"
    >
      <color attach="background" args={["#04060a"]} />
      <SceneContents {...props} />
    </Canvas>
  );
}
