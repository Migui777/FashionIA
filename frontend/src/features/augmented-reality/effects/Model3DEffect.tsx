import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface Model3DEffectProps {
  assetUrl: string | null;
  intensity: number;
}

const GOLD = 0xd4af7a;

export function Model3DEffect({ assetUrl, intensity }: Model3DEffectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.DirectionalLight(GOLD, 1.2);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);

    // Sujeto de la escena: si el vestido trae un GLTF/GLB propio lo carga y
    // centra; si no, cae en una figura procedural (misma estética dorada de
    // los demás efectos) para que el tipo "model_3d" funcione sin depender
    // de un asset externo.
    let subject: THREE.Object3D;

    if (assetUrl) {
      const group = new THREE.Group();
      scene.add(group);
      subject = group;

      new GLTFLoader().load(
        assetUrl,
        (gltf) => {
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const size = box.getSize(new THREE.Vector3()).length() || 1;
          const scale = 2 / size;
          gltf.scene.scale.setScalar(scale);
          const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
          gltf.scene.position.sub(center);
          group.add(gltf.scene);
        },
        undefined,
        (err) => console.error("No se pudo cargar el modelo 3D del efecto:", err),
      );
    } else {
      const geometry = new THREE.IcosahedronGeometry(1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: GOLD,
        emissive: GOLD,
        emissiveIntensity: 0.25,
        metalness: 0.6,
        roughness: 0.3,
        wireframe: true,
      });
      subject = new THREE.Mesh(geometry, material);
      scene.add(subject);
    }

    const spinSpeed = 0.006 * (0.5 + Math.min(Math.max(intensity, 0.1), 1));
    let frameId: number;
    const tick = () => {
      subject.rotation.y += spinSpeed;
      subject.rotation.x += spinSpeed * 0.3;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [assetUrl, intensity]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
