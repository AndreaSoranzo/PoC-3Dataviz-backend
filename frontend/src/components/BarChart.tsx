import { useState, useRef, useEffect,useMemo } from "react";
import Bar from "./Bar";
import XAxis from "./XAxis";
import ZAxis from "./ZAxis";
import { ThreeEvent } from "@react-three/fiber";
import YAxis from "./YAxis";
import Tooltip from "./Tooltip";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { tabData } from "../App";
import { useDataContext } from "./context";
import { gsap } from "gsap"; // libreria per le animazioni

type BarChartProps = {
  selectedBar: tabData | null;
};

function BarChart({ selectedBar }: BarChartProps) {
  const { data, filteredData, setFilteredData, setSelectedBar, xLabels, zLabels, showAveragePlane, isGreaterChecked } = useDataContext();
  
  // const handleBarClick = (id: string, event: ThreeEvent<MouseEvent>) => {
  //   const clickedBar: tabData | undefined = data.find((bar) => bar.id.toString() === id);
    
  //   const intersections = event.intersections;

  //   if (intersections[0]?.object === event.object) {
  //     if (clickedBar) {
  //       setSelectedBar(clickedBar); // Imposta la barra selezionata
  //       if (isGreaterChecked)
  //         setFilteredData(data.filter((d) => d.value >= clickedBar.value)); // Filtra i dati
  //       else 
  //         setFilteredData(data.filter((d) => d.value <= clickedBar.value)); // Filtra i dati
  //     }
  //   }
  // }
  const handleBarClick = (id: number) => {
    const clickedBar: tabData | undefined = data.find((bar) => bar.id === id);
    if (clickedBar) {
      setSelectedBar(clickedBar); // Imposta la barra selezionata
      if (isGreaterChecked)
        setFilteredData(data.filter((d) => d.value >= clickedBar.value)); // Filtra i dati
      else 
        setFilteredData(data.filter((d) => d.value <= clickedBar.value)); // Filtra i dati
    }
  }

  // const instanceData = useMemo(() => {
  //     const array = [];
  //     for (let d of data) {
  //       array.push({
  //         key: d.id,
  //         labelX: d.labelX,
  //         value: d.value,
  //         labelZ: d.labelZ,
  //       });
  //     }
  //     return array;
  // }, [data]);
      

  const [hoveredBar, setHoveredBar] = useState<tabData | null>(null);
  // const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState(new THREE.Vector3());
  // const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const { camera, scene } = useThree();

  const handleMouseMove = (event: MouseEvent) => {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };
  // const handleMouseMove = (event: MouseEvent) => {
  //   if (hoverTimeout.current !== null) {
  //     clearTimeout(hoverTimeout.current);
  //   }
  //   hoverTimeout.current = setTimeout(() => {
  //     // Calcola le coordinate del mouse normalizzate (-1 a 1)
  //     const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
  //     mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  //     mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
  //     // Lancia il raggio
  //     raycaster.current.setFromCamera(mouse.current, camera);
      
  //     // Trova le intersezioni con le barre
  //     const intersects = raycaster.current.intersectObjects(scene.children);
  //     const filteredIntersects = intersects.filter(i => i.object.userData.id !== 'average');
  //     if (filteredIntersects.length > 0) {
  //       const firstObject = filteredIntersects[0].object; // L'oggetto più vicino
  //       const intersectedBar = data.find((bar) => bar.id === firstObject.userData.id);

  //       if (intersectedBar) {
  //         setHoveredBar(intersectedBar ? intersectedBar : null); // Mostra il tooltip
  //         setTooltipPosition(intersects[0].point.add(new THREE.Vector3(0.5, -0.5, 0)));
  //       }
  //     } else {
  //       setHoveredBar(null); // Nessuna barra sotto il mouse
  //     }
      
  //   }, 40);
  // };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [camera, scene, data]);

  // useEffect(() => {
  //   if (selectedBar) {
  //     // Centra la camera sulla barra selezionata
  //     const barPosition = new THREE.Vector3(selectedBar.labelX * 6, selectedBar.value + 10, selectedBar.labelZ * 5 + 3);
      
  //     //  GSAP per la transizione
  //     gsap.to(camera.position, {
  //       x: barPosition.x,
  //       y: barPosition.y , 
  //       z: barPosition.z -50,
  //       duration: 1, 
  //       ease: "power2.out",
  //     });

  //     gsap.to(camera, {
  //       zoom: 1.6, //livello del zoom
  //       duration: 1,
  //       ease: "power2.out",
  //       onUpdate: () => {
  //         camera.updateProjectionMatrix();
  //       },
  //     });

  //     camera.lookAt(barPosition); // positionare la camrea sul bar selezionato
  //   }
  // }, [selectedBar, camera]);

  const nLabel = xLabels.length;
  const xAxisLength = 6 * nLabel ;
  const zAxisLength = 6 * zLabels.length ;

  return (
    <>
      {
        <Bar
        mouse={mouse.current}
        instanceData={data}
        filteredData={filteredData}
        setHover={setHoveredBar}
        setTooltip={setTooltipPosition}
        onClickbar={handleBarClick}
      />
        };
      {/* {
        data.map((d: tabData) => {
          const isFiltered = filteredData.some((f) => f.labelX === d.labelX && f.labelZ === d.labelZ && f.value === d.value);
          return (
            <Bar
              key={d.id}
              row={d}
              isFiltered={isFiltered}
              userData={{ id: d.id }}
              onClick={handleBarClick}
              aura={selectedBar ? selectedBar.id === d.id : false}
            />
          );
        })
        }; */}
      {/* <XAxis length={xAxisLength} />
      <YAxis xLength={xAxisLength} />
      <ZAxis length={zAxisLength} /> */}
      <XAxis length={xAxisLength}/>
      <YAxis xLength={xAxisLength} />
      <ZAxis length={zAxisLength} />
      {hoveredBar && <Tooltip position={tooltipPosition} bar={hoveredBar} />}
      {/* Piano medio, visibile solo se showAveragePlane è true */}
      {showAveragePlane && (
        <mesh
          position={[xAxisLength/2, data.map((d) => d.value).reduce((acc, curr) => acc + curr, 0) / data.length, zAxisLength/2]}
          rotation={[-Math.PI / 2, 0, 0]} 
          userData={{ id: "average" }}
        >
          <planeGeometry args={[xAxisLength, zAxisLength]}/>
          <meshStandardMaterial color="lightgray" transparent={true} opacity={0.4} depthWrite={false} side={THREE.DoubleSide}/>
        </mesh>
      )}
    </>
  );
}

export default BarChart;