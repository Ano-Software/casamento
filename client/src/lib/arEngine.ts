import * as THREE from 'three';
import type { RealidadeVideo } from '../config/realidade';

/**
 * Realidade aumentada por imagem: MindAR (rastreamento, servido de /vendor/mindar)
 * + three.js (desenha o vídeo dos noivos "colado" sobre o desenho impresso).
 *
 * O MindAR não vem do npm: o pacote depende de um módulo nativo (canvas) que quebra
 * o build da hospedagem. Usamos só o núcleo pronto do navegador (licença MIT).
 */
const MINDAR_URL = '/vendor/mindar/mindar-image.prod.js';

export type ArErrorCode = 'insecure' | 'unsupported' | 'denied' | 'nocamera' | 'missing' | 'failed';

export class ArError extends Error {
  constructor(public code: ArErrorCode) {
    super(code);
  }
}

export interface ArHandle {
  stop(): void;
  setMuted(muted: boolean): void;
}

interface MindarController {
  inputWidth: number;
  inputHeight: number;
  worker: Worker;
  addImageTargetsFromBuffer(buffer: ArrayBuffer): { dimensions: [number, number][] };
  dummyRun(input: HTMLVideoElement): void;
  processVideo(input: HTMLVideoElement): void;
  stopProcessVideo(): void;
  getProjectionMatrix(): number[];
}

interface MindarModule {
  Controller: new (opts: {
    inputWidth: number;
    inputHeight: number;
    maxTrack: number;
    filterMinCF: number;
    filterBeta: number;
    onUpdate: (data: { type: string; targetIndex: number; worldMatrix: number[] | null }) => void;
  }) => MindarController;
}

/**
 * Cria os vídeos dos noivos. Chame DENTRO do toque do usuário: assim o celular
 * libera o som (sem o toque, o navegador só aceita tocar sem áudio).
 */
export function prepareVideos(list: RealidadeVideo[]): HTMLVideoElement[] {
  return list.map(({ src }) => {
    const v = document.createElement('video');
    v.src = src;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    // Sem permissão de som, o vídeo toca mudo ao achar o desenho (veja onAutoMuted).
    v.play()
      .then(() => v.pause())
      .catch(() => {});
    return v;
  });
}

export async function startAr(opts: {
  container: HTMLElement;
  targetSrc: string;
  videos: HTMLVideoElement[];
  config: RealidadeVideo[];
  onTracking: (tracking: boolean) => void;
  /** O navegador bloqueou o som: o vídeo seguiu mudo. */
  onAutoMuted: () => void;
}): Promise<ArHandle> {
  const { container, targetSrc, videos, config, onTracking, onAutoMuted } = opts;
  const cleanups: (() => void)[] = [];
  const stop = () => cleanups.splice(0).reverse().forEach((fn) => fn());

  try {
    if (!window.isSecureContext) throw new ArError('insecure');
    if (!navigator.mediaDevices?.getUserMedia) throw new ArError('unsupported');

    // O desenho compilado e o motor baixam enquanto o usuário responde à permissão da câmera.
    const targetReq = fetch(targetSrc).then(async (res) => {
      // Arquivo ausente: o servidor devolve a página do site (HTML) no lugar.
      if (!res.ok || (res.headers.get('content-type') ?? '').includes('text/html')) throw new ArError('missing');
      return res.arrayBuffer();
    });
    const mindarReq = import(/* @vite-ignore */ new URL(MINDAR_URL, location.origin).href) as Promise<MindarModule>;
    targetReq.catch(() => {});
    mindarReq.catch(() => {});

    // Câmera traseira.
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'environment' } });
    } catch (err) {
      const name = (err as DOMException)?.name;
      throw new ArError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'denied'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? 'nocamera'
            : 'failed',
      );
    }
    cleanups.push(() => stream.getTracks().forEach((t) => t.stop()));

    const cam = document.createElement('video');
    cam.muted = true;
    cam.playsInline = true;
    cam.setAttribute('muted', '');
    cam.setAttribute('playsinline', '');
    Object.assign(cam.style, { position: 'absolute', objectFit: 'cover' });
    container.appendChild(cam);
    cleanups.push(() => cam.remove());
    cam.srcObject = stream;
    await new Promise<void>((resolve) =>
      cam.readyState >= 1 ? resolve() : cam.addEventListener('loadedmetadata', () => resolve(), { once: true }),
    );
    await cam.play().catch(() => {});

    // Cena 3D transparente por cima da câmera.
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0' });
    container.appendChild(renderer.domElement);
    cleanups.push(() => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.domElement.remove();
    });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const anchors = videos.map((video, i) => {
      const group = new THREE.Group();
      group.visible = false;
      group.matrixAutoUpdate = false;
      const mesh = createVideoPlane(video, config[i]);
      group.add(mesh);
      scene.add(group);
      cleanups.push(() => {
        video.pause();
        video.removeAttribute('src');
        video.load();
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        (mesh.userData.texture as THREE.Texture).dispose();
      });
      return { group, visible: false };
    });

    const [mindar, buffer] = await Promise.all([mindarReq, targetReq]).catch((err) => {
      throw err instanceof ArError ? err : new ArError('failed');
    });

    const postMatrices: THREE.Matrix4[] = [];
    const controller = new mindar.Controller({
      inputWidth: cam.videoWidth,
      inputHeight: cam.videoHeight,
      maxTrack: 1,
      // Mais estável (menos tremido), com um leve atraso ao mover o celular.
      filterMinCF: 0.0001,
      filterBeta: 0.001,
      onUpdate: ({ type, targetIndex, worldMatrix }) => {
        const anchor = anchors[targetIndex];
        if (type !== 'updateMatrix' || !anchor) return;
        const found = worldMatrix !== null;
        if (found) {
          anchor.group.matrix.fromArray(worldMatrix).multiply(postMatrices[targetIndex]);
          anchor.group.matrixWorldNeedsUpdate = true;
        }
        if (found !== anchor.visible) {
          anchor.visible = anchor.group.visible = found;
          const video = videos[targetIndex];
          if (!found) video.pause();
          else
            video.play().catch(() => {
              if (video.muted) return;
              video.muted = true;
              onAutoMuted();
              video.play().catch(() => {});
            });
          onTracking(anchors.some((a) => a.visible));
        }
      },
    });
    cleanups.push(() => {
      controller.stopProcessVideo();
      controller.worker.terminate();
    });

    // Unidades da cena: 1 = largura do desenho, com a origem no centro dele.
    const { dimensions } = controller.addImageTargetsFromBuffer(buffer);
    for (const [w, h] of dimensions) {
      postMatrices.push(
        new THREE.Matrix4().compose(new THREE.Vector3(w / 2, h / 2, 0), new THREE.Quaternion(), new THREE.Vector3(w, w, w)),
      );
    }

    // Ajusta câmera do vídeo e câmera 3D à tela (mesma lógica do MindARThree).
    const resize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const inputRatio = controller.inputWidth / controller.inputHeight;
      const coverW = inputRatio > cw / ch ? ch * inputRatio : cw;
      const coverH = inputRatio > cw / ch ? ch : cw / inputRatio;
      Object.assign(cam.style, {
        width: `${coverW}px`,
        height: `${coverH}px`,
        left: `${(cw - coverW) / 2}px`,
        top: `${(ch - coverH) / 2}px`,
      });

      const proj = controller.getProjectionMatrix();
      camera.fov = (2 * Math.atan((1 / proj[5]) * (ch / coverH)) * 180) / Math.PI;
      camera.near = proj[14] / (proj[10] - 1);
      camera.far = proj[14] / (proj[10] + 1);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    resize();
    window.addEventListener('resize', resize);
    cleanups.push(() => window.removeEventListener('resize', resize));

    controller.dummyRun(cam); // aquece a GPU (a primeira detecção é lenta)
    controller.processVideo(cam);
    renderer.setAnimationLoop(() => renderer.render(scene, camera));

    return {
      stop,
      setMuted: (muted) =>
        videos.forEach((v) => {
          v.muted = muted;
          if (!muted && !v.paused) v.play().catch(() => {});
        }),
    };
  } catch (err) {
    stop();
    throw err instanceof ArError ? err : new ArError('failed');
  }
}

/** Plano com o vídeo; com `chromaKey`, a cor de fundo vira transparente. */
function createVideoPlane(video: HTMLVideoElement, { chromaKey, scale }: RealidadeVideo) {
  const texture = new THREE.VideoTexture(video);
  let material: THREE.Material;

  if (chromaKey) {
    // Sem conversão de cor: o recorte compara os valores originais do vídeo.
    texture.colorSpace = THREE.NoColorSpace;
    const key = new THREE.Color().setRGB(...hexToRgb(chromaKey), THREE.NoColorSpace);
    material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        map: { value: texture },
        keyColor: { value: new THREE.Vector3(key.r, key.g, key.b) },
        similarity: { value: 0.16 },
        smoothness: { value: 0.08 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D map;
        uniform vec3 keyColor;
        uniform float similarity;
        uniform float smoothness;
        varying vec2 vUv;
        vec2 chroma(vec3 c) {
          return vec2(dot(c, vec3(-0.169, -0.331, 0.5)), dot(c, vec3(0.5, -0.419, -0.081)));
        }
        void main() {
          vec4 tex = texture2D(map, vUv);
          float d = distance(chroma(tex.rgb), chroma(keyColor));
          float alpha = smoothstep(similarity, similarity + smoothness, d);
          // Remove o reflexo da cor de fundo nas bordas (cabelo, roupa).
          float spill = pow(1.0 - smoothstep(similarity, similarity + 0.25, d), 1.5);
          vec3 color = mix(tex.rgb, vec3(dot(tex.rgb, vec3(0.299, 0.587, 0.114))), spill);
          gl_FragColor = vec4(color, alpha);
        }`,
    });
  } else {
    texture.colorSpace = THREE.SRGBColorSpace;
    material = new THREE.MeshBasicMaterial({ map: texture });
  }

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.userData.texture = texture;
  const fit = () => mesh.scale.set(scale, (scale * video.videoHeight) / video.videoWidth || scale, 1);
  fit();
  video.addEventListener('loadedmetadata', fit);
  return mesh;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
