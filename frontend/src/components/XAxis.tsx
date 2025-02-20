import { useState, useRef, useEffect,useMemo } from "react";
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import myFont from 'three/examples/fonts/helvetiker_regular.typeface.json';
import * as THREE from 'three';
import { extend, Object3DNode } from "@react-three/fiber";
import { useDataContext } from './context';
import { Text } from '@react-three/drei';
extend({ TextGeometry });

declare module "@react-three/fiber" {
    interface ThreeElements {
        textGeometry: Object3DNode<TextGeometry, typeof TextGeometry>;
    }
}

type XAxisProps = {
    length: number;
};

interface InstancedTextsProps {
    texts: string[];
  }

function XAxis({ length }: XAxisProps) {
    // Assi personalizzati con lunghezze differenti
    const { xLabels } = useDataContext();

    const meshRef = useRef<THREE.InstancedMesh>(null);


    const materials = useMemo(() => {
        return xLabels.map((text) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 296;
            canvas.height = 64;
            context!.clearRect(0, 0, canvas.width, canvas.height);
            context!.font = 'bold 18px Arial';
            context!.fillStyle = 'black';
            context!.fillText(text, canvas.width / 2, canvas.height / 2);
            const texture = new THREE.CanvasTexture(canvas);
            return new THREE.SpriteMaterial({ map: texture, transparent: true });
        });
    }, [xLabels]);

    console.log(materials);

    const matrices = useMemo(() => {
        const dummy = new THREE.Object3D();
        const matricesArray: THREE.Matrix4[] = [];
    
        xLabels.forEach((_, i) => {
          dummy.position.set(6 * i + 3, -1, 0); // Posiziona i testi lungo l'asse X
          dummy.rotation.set(0, Math.PI, 0);
          
          dummy.updateMatrix();
          matricesArray.push(dummy.matrix.clone());
        });
        return matricesArray;
      }, [xLabels]);

      console.log(matrices.length);
      
      useEffect(() => {
        if (meshRef.current) {
          matrices.forEach((matrix, i) => {
            meshRef.current!.setMatrixAt(i, matrix);
          });
          meshRef.current!.instanceMatrix.needsUpdate = true;
        }
      }, [matrices]);

    // Creazione delle linee degli assi
    const xAxis = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(length, 0, 0),
    ]);

    // const labels = xLabels.map((text, index) => ({
    //     text,
    //     position: new THREE.Vector3(6 * index + 4, -1, 0),
    //     rotation: new THREE.Euler(0, Math.PI, 0, 'XYZ')
    // }));

    const labels = xLabels.map((text, index) => ({
        text,
        material: materials[index],
        position: new THREE.Vector3(6 * index + 5, -1, 0),
        rotation: new THREE.Euler(0, Math.PI, 0, 'XYZ')
    }));

    // const font = new FontLoader().parse(myFont);

    //     const geometry = useMemo(() => new THREE.BoxGeometry(5, 1, 0), []);
    //     const material = useMemo(() => new THREE.MeshPhysicalMaterial({ 
    //         color: 'white', 
    //         clearcoat: 0.9, 
    //         transparent:true, 
    //         opacity:1 }), []);

    return (
        <>
            {/* Asse X */}
            <line>
                <bufferGeometry attach="geometry" {...xAxis} />
                <lineBasicMaterial attach="material" color={new THREE.Color('red')} />
            </line>
            {
            //    <Text  fontSize={99.5} material={new THREE.MeshBasicMaterial({ color: 'black' })}>
            //     prova
            //     </Text>
            }
            {
                // <instancedMesh ref={meshRef} args={[undefined, materials, xLabels.length]}>
                //     <primitive object={geometry} />
                //     <primitive object={materials[0]} />
                //     <planeGeometry args={[5, 1]} />
                // </instancedMesh>
            }{
                
            }
            {/* {labels.map((label, index) => (
                <mesh key={index} position={label.position} rotation={label.rotation} >
                    <textGeometry
                        args={[label.text, { font, size: 0.5, depth: 0.02 }]}
                    />
                    <meshStandardMaterial color="black" />
                </mesh>
            ))} */}
            {labels.map((text) => (
                // const textSprite = new THREE.Sprite(materials[i]);
                // textSprite.position.set(
                //     (Math.random() - 0.5) * 10,
                //     (Math.random() - 0.5) * 10,
                //     (Math.random() - 0.5) * 10
                // );
                <primitive key={text.text} object={new THREE.Sprite(text.material)} position={text.position} rotation={text.rotation} scale={[8,2,2]}/>
            ))}
        </>
    );
}

export default XAxis;