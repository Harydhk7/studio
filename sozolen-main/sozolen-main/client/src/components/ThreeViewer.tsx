import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  useGLTF,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.005;
    }
  });

  return (
    <primitive ref={ref} object={scene} scale={1.5} position={[0, -1, 0]} />
  );
}

const FALLBACK_VARIANTS = [
  { color: "#0071e3", geometry: "torus" as const },
  { color: "#34c759", geometry: "box" as const },
  { color: "#af52de", geometry: "sphere" as const },
  { color: "#ff9500", geometry: "cylinder" as const },
  { color: "#00c7be", geometry: "cone" as const },
  { color: "#5856d6", geometry: "octahedron" as const },
  { color: "#e74c3c", geometry: "gear" as const },
  { color: "#1abc9c", geometry: "ring" as const },
] as const;

function FallbackModel({ variant = 0 }: { variant?: number }) {
  const ref = useRef<THREE.Group>(null);
  const { color, geometry } = FALLBACK_VARIANTS[variant % FALLBACK_VARIANTS.length];
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += 0.008;
      ref.current.rotation.y += 0.012;
    }
  });
  return (
    <group ref={ref} position={[0, 0, 0]}>
      {geometry === "torus" && (
        <mesh>
          <torusKnotGeometry args={[1, 0.3, 128, 16]} />
          <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.1} clearcoat={1} />
        </mesh>
      )}
      {geometry === "box" && (
        <mesh>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.1} clearcoat={1} />
        </mesh>
      )}
      {geometry === "sphere" && (
        <mesh>
          <icosahedronGeometry args={[1, 2]} />
          <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.1} clearcoat={1} />
        </mesh>
      )}
      {geometry === "cylinder" && (
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 1.6, 32]} />
          <meshPhysicalMaterial color={color} metalness={0.85} roughness={0.15} clearcoat={1} />
        </mesh>
      )}
      {geometry === "cone" && (
        <mesh position={[0, -0.3, 0]}>
          <coneGeometry args={[1, 1.8, 32]} />
          <meshPhysicalMaterial color={color} metalness={0.85} roughness={0.15} clearcoat={1} />
        </mesh>
      )}
      {geometry === "octahedron" && (
        <mesh>
          <octahedronGeometry args={[1.2, 0]} />
          <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.1} clearcoat={1} />
        </mesh>
      )}
      {geometry === "gear" && (
        <group>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.3, 24]} />
            <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.1} clearcoat={1} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 8]}>
            <torusGeometry args={[0.9, 0.15, 16, 24]} />
            <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.1} clearcoat={1} />
          </mesh>
        </group>
      )}
      {geometry === "ring" && (
        <mesh>
          <torusGeometry args={[1, 0.25, 32, 48]} />
          <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.1} clearcoat={1} />
        </mesh>
      )}
    </group>
  );
}

export function ThreeViewer({
  url,
  className,
  fallbackVariant = 0,
}: {
  url?: string;
  className?: string;
  /** 0 = torus knot, 1 = box, 2 = sphere (used when no url) */
  fallbackVariant?: number;
}) {
  return (
    <div
      className={`w-full h-full min-h-[400px] bg-[#fbfbfd] dark:bg-[#111] rounded-3xl overflow-hidden relative ${className}`}
    >
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
        />
        <Environment preset="city" />
        <Suspense fallback={null}>
          {url ? <Model url={url} /> : <FallbackModel variant={fallbackVariant} />}
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={false} />
        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
          far={4}
        />
      </Canvas>
    </div>
  );
}
