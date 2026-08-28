import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FloatingShape({ geometry, position, color, speed }: { geometry: "torus" | "box" | "sphere"; position: [number, number, number]; color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * speed * 0.5;
      ref.current.rotation.y += delta * speed;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      {geometry === "torus" && <torusKnotGeometry args={[0.4, 0.15, 64, 8]} />}
      {geometry === "box" && <boxGeometry args={[0.7, 0.7, 0.7]} />}
      {geometry === "sphere" && <sphereGeometry args={[0.5, 32, 32]} />}
      <meshStandardMaterial color={color} transparent opacity={0.25} wireframe />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <FloatingShape geometry="torus" position={[-2, 0.5, -1]} color="#0071e3" speed={0.3} />
      <FloatingShape geometry="box" position={[2, -0.3, -1.5]} color="#34c759" speed={0.25} />
      <FloatingShape geometry="sphere" position={[0, 0.8, -2]} color="#af52de" speed={0.2} />
      <FloatingShape geometry="torus" position={[1.5, 0.2, -0.8]} color="#ff9500" speed={0.35} />
      <FloatingShape geometry="box" position={[-1.2, -0.5, -1.2]} color="#00c7be" speed={0.28} />
    </>
  );
}

export function HeroScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
        className="w-full h-full"
      >
        <Scene />
      </Canvas>
    </div>
  );
}
