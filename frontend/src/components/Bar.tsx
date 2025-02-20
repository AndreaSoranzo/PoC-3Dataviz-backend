import { useRef, useMemo,useEffect,useState,useLayoutEffect } from 'react';
import * as THREE from 'three';
import { ThreeEvent,useThree } from '@react-three/fiber';
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
    instanceData: tabData[];
    filteredData:tabData[];
    mouse: THREE.Vector2;
    setHover: React.Dispatch<React.SetStateAction<tabData | null>>;
    setTooltip: React.Dispatch<React.SetStateAction<THREE.Vector3>>;
    onClickbar: (id: number) => void;
};

var pevId: number = -1;

function Bar({ instanceData,filteredData,mouse, setHover,setTooltip, onClickbar }: BarPropsb) {

    const mesh = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
    const material = useMemo(() => new THREE.MeshPhysicalMaterial({ 
        color: 'white', 
        clearcoat: 0.9, 
        transparent:true, 
        opacity:1 }), []);

    const availableColors = [ // Array con i colori disponibili
        new THREE.Color('red'),
        new THREE.Color('blue'),
        new THREE.Color('yellow'),
        new THREE.Color('gray'),
      ];

      const count = instanceData.length;
      const op = new Float32Array(count).fill(1.0);
    //   var instanceOpacity: Float32Array<ArrayBuffer> =  new Float32Array(count);
      var [instanceOpacity, setInstanceOpacity] = useState(() => { // Inizializzazione con una funzione
        const array = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            array[i] = 1.0;
        }
        return array;
        });

    
    // const instanceData = useMemo(() => {
    //     const array = [];
    //     for (let d of data) {
    //       array.push({
    //         key: d.id,
    //         labelX: d.labelX,
    //         value: d.value,
    //         labelZ: d.labelZ
    //       });
    //     }
    //     return array;
    // }, [data]);
    
    // const { id, labelX, value, labelZ } = row;

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
          const color = availableColors[instanceData[i].labelZ];
        //   color.setHSL(Math.random(), 1, 0.5); // HSL per colori più vivaci
          colors.set([color.r, color.g, color.b], i * 3);

          instanceOpacity[i]=1.0;
    
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

          var colorBase = new Float32Array(colors);
          instancedMesh.geometry.setAttribute('colorBase', new THREE.BufferAttribute(colorBase, 3));

          instancedMesh.geometry.setAttribute('instanceOpacity', new THREE.InstancedBufferAttribute(instanceOpacity, 1));
        }
      }, [matriceswC]);

    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onHoverEnter = (e: ThreeEvent<PointerEvent>) => {
      if (hoverTimeout.current !== null) {
        clearTimeout(hoverTimeout.current);
      }
      hoverTimeout.current = setTimeout(() => {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, e.camera);
        
        const intersects = raycaster.intersectObject(mesh.current);
        
        if (intersects.length > 0) {
            const intersection = intersects[0];
            const instanceIndex = intersection.instanceId;
          if (instanceIndex !== undefined) {
            const clickedInstanceData = instanceData[instanceIndex];
            setHover(clickedInstanceData ? clickedInstanceData : null); // Mostra il tooltip
            setTooltip(intersection.point.add(new THREE.Vector3(0.5, -0.5, 0)));
          }
        }
      },500);
    }

    const onHoverExit = (_: ThreeEvent<PointerEvent>) => {
        setHover(null);
    }
    
    const highlightColor = new THREE.Color("black");
    const aura = (id:number, h: boolean) => {
        if(mesh.current != undefined) {
            mesh.current.geometry.attributes.color.setXYZ(
                id,
                h ? highlightColor.r : mesh.current.geometry.attributes.colorBase.getX(id),
                h ? highlightColor.g : mesh.current.geometry.attributes.colorBase.getY(id),
                h ? highlightColor.b : mesh.current.geometry.attributes.colorBase.getZ(id)
              );
            mesh.current.geometry.attributes.color.needsUpdate = true;
        }
    }

    useEffect(() => {
        const idsToHide: Set<number> = new Set(filteredData.map(dict => dict.id));
        const toHide: number[] = instanceData.filter(dict => !idsToHide.has(dict.id)).map(dict => dict.id);
        const instancesIdx: number[] = [];
        instanceData.forEach((dict, i) => {
            if (toHide.includes(dict.id)) {
                instancesIdx.push(i);
            }
        });

        // const newOpacity = new Float32Array(op); // Copia!
        // instancesIdx.forEach(i => {
        //     instanceOpacity[i] = 0.3;
        // });
        const bars: Set<number> = new Set(instanceData.map(dict => dict.id));
        bars.forEach(i=> {
            if (instancesIdx.includes(i)) {
                instanceOpacity[i] = 0.3;
            } else {
                instanceOpacity[i] = 1.0;
            }
        });
        // setInstanceOpacity(newOpacity);

        mesh.current.geometry.attributes.instanceOpacity.needsUpdate = true;
        // mesh.current.material = newMaterial;
    }, [filteredData]);

    useEffect(()=>{
        const newMaterial = new THREE.ShaderMaterial({
            // ... (uniforms)
            vertexShader: `
              attribute vec3 color; // Attributo per il colore di base
              attribute float instanceOpacity;
          
              varying vec3 vBaseColor; // Variabile per passare il colore di base al fragment shader
              varying float vOpacity;
          
              void main() {
                vBaseColor = color; // Assegna il valore dell'attributo alla variabile varying
                vOpacity = instanceOpacity;
          
                gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              varying vec3 vBaseColor; // Variabile per ricevere il colore di base dal vertex shader
              varying float vOpacity;
          
              void main() {
                gl_FragColor = vec4(vBaseColor, vOpacity); // Utilizza il colore di base e l'opacità variabile
              }
            `
          });
          mesh.current.material = newMaterial;
          console.log(newMaterial);
    },[filteredData]);

    // const newMaterial = useMemo(() => new THREE.ShaderMaterial({
    //     // ... (uniforms)
    //     vertexShader: `
    //       attribute vec3 color; // Attributo per il colore di base
    //       attribute float instanceOpacity;
      
    //       varying vec3 vBaseColor; // Variabile per passare il colore di base al fragment shader
    //       varying float vOpacity;
      
    //       void main() {
    //         vBaseColor = color; // Assegna il valore dell'attributo alla variabile varying
    //         vOpacity = instanceOpacity;
      
    //         gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    //       }
    //     `,
    //     fragmentShader: `
    //       varying vec3 vBaseColor; // Variabile per ricevere il colore di base dal vertex shader
    //       varying float vOpacity;
      
    //       void main() {
    //         gl_FragColor = vec4(vBaseColor, vOpacity); // Utilizza il colore di base e l'opacità variabile
    //       }
    //     `
    //   }),[instanceOpacity]);

    // useLayoutEffect(() => {
    //     if (mesh.current && mesh.current.material) {
    //         // mesh.current.material = newMaterial;
    //     }
    // }, [newMaterial]);




    const onClick = (e: ThreeEvent<MouseEvent>) => {   
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, e.camera);
        
        const intersects = raycaster.intersectObject(mesh.current);
    
    if (intersects.length > 0 ) {
        const intersection = intersects[0];
        const instanceIndex = intersection.instanceId;
        if (instanceIndex !== undefined && pevId!==instanceIndex) {
          const clickedInstanceData = instanceData[instanceIndex];
          onClickbar(clickedInstanceData.id);
          aura(instanceIndex,true);
          aura(pevId,false);
          pevId = instanceIndex;
        }
      }
    }
    

    return (
        <instancedMesh 
            ref={mesh} 
            args={[geometry, material, count]}
            onClick={onClick}
            onPointerOver={onHoverEnter}
            onPointerLeave={onHoverExit}
            >
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