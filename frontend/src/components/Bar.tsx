import { useRef, useMemo,useEffect } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { rawData, tabData } from '../App';

type BarProps = {
    row: tabData;
    isFiltered: boolean;
    aura: boolean;
    userData: Record<string, any>;
    count: number;
    onClick: (id: string, e: ThreeEvent<MouseEvent>) => void;
    onHover?: (e: ThreeEvent<PointerEvent>, bar: rawData | null) => void;
};
type BarPropsb = {
    data: tabData[];
    // onClick: (id: string, e: ThreeEvent<MouseEvent>) => void;
    // onHover?: (e: ThreeEvent<PointerEvent>, bar: rawData | null) => void;
};

function Bar({ data }: BarPropsb) {

    const mesh = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
    const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 'white' }), []);

    const availableColors = [ // Array con i colori disponibili
        new THREE.Color('red'),
        new THREE.Color('blue'),
        new THREE.Color('yellow'),
        new THREE.Color('gray'),
      ];
    
    const instanceData = useMemo(() => {
        const array = [];
        for (let d of data) {
          array.push({
            key: d.id,
            labelX: d.labelX,
            value: d.value,
            labelZ: d.labelZ
          });
        }
        return array;
    }, [data]);
    
    // const { id, labelX, value, labelZ } = row;

    const count = instanceData.length;

    const matriceswC = useMemo(() => {
        const array = new Float32Array(count * 16);
        const colors = new Float32Array(count * 3); // Array per i colori (RGB)
    
        for (let i = 0; i < count; i++) {
          // Altezza casuale
          const height = instanceData[i].value; // Altezza tra 1 e 11
    
          // Posizione
          dummy.position.set(instanceData[i].labelX * 6 + 3, height / 2, instanceData[i].labelZ * 5 + 3); // Spaziatura e centraggio
    
          // Scala (solo l'altezza)
          dummy.scale.set(2, height, 2);
    
          // Rotazione (nessuna)
          dummy.rotation.set(0, 0, 0);
    
          // Colore casuale
          console.log(instanceData[i].labelZ);
          const color = availableColors[instanceData[i].labelZ];
        //   color.setHSL(Math.random(), 1, 0.5); // HSL per colori più vivaci
          colors.set([color.r, color.g, color.b], i * 3);
    
          dummy.updateMatrix();
          dummy.matrix.toArray(array, i * 16);
        }
        return { matrices: array, colors }; // Restituisci entrambe le array
      }, [count]);

      
      useEffect(() => {
        if (mesh.current) {
          const { matrices, colors } = matriceswC; // Destructure
          const instancedMesh = mesh.current; // Shorthand
    
          instancedMesh.instanceMatrix.array = matrices;
          instancedMesh.instanceMatrix.needsUpdate = true;
    
          // Crucial: Tell Three.js to use instance colors
          instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
          instancedMesh.instanceColor.needsUpdate = true;
    
          // Important for performance:  Set the mesh to have vertex colors
          instancedMesh.geometry.setAttribute('color', instancedMesh.instanceColor);
        }
      }, [matriceswC]);

    return (
        <instancedMesh 
            ref={mesh} 
            args={[geometry, material, count]}>
          <primitive object={geometry} />
          <primitive object={material} />
        </instancedMesh>
      );

    // return (
    //     <mesh
    //         key={id}
    //         position={[labelX * 6 + 3, value / 2, labelZ * 5 + 3]} // Alza la barra di metà altezza            
    //         onClick={(e) => onClick(id.toString(), e)}
    //         /* onPointerMove={(e) => onHover(e, rawRow)} // Trigger hover con altezza
    //         onPointerOut={(e) => onHover(e, null)} */ // Nasconde il tooltip all'uscita
    //         userData={userData}
    //     >
    //         {/* Geometria della barra */}
    //         < boxGeometry args={[2, value, 2]} />
    //         {/* Materiale della barra */}
    //         < meshPhysicalMaterial
    //             color={aura ? 'black' : colors[labelZ]}
    //             clearcoat={0.9} // Strato protettivo lucido
    //             transparent={true}
    //             opacity={isFiltered ? 1 : 0.1}
    //         />
            
      
    //     </mesh >
    // );
}

export default Bar;