import { useState } from 'react'
import './App.css'
import CustomCanvas from './components/CustomCanvas.tsx';
import DynamicTable from './components/DynamicTable.tsx';
import Filters from './components/Filters.tsx';
import Footer from './components/Footer.tsx';
import { DataContext } from './components/context.ts';
import { useData } from "./components/DataProvider.tsx";

export interface rawData {
  id: number;
  labelX: string;
  value: number;
  labelZ: string;
}

export interface tabData {
  id: number;
  labelX: number;
  value: number;
  labelZ: number;
}

function App() {
  const { fetched, loading, error } = useData();

  if (loading ) return <p>Caricamento...</p>;
  if (error || !fetched) return <p>Errore: {error}</p>;
  const data: rawData[] = fetched.data;
  let xLabels = Array.from(new Set(data.map((d) => d.labelX)));
  let zLabels = Array.from(new Set(data.map((d) => d.labelZ)));
  const processed_data: tabData[] = data.map((d) => ({
    ...d,
    labelX: Array.from(xLabels).indexOf(d.labelX),
    labelZ: Array.from(zLabels).indexOf(d.labelZ)
  }));

  console.log(processed_data);

  const [filteredData, setFilteredData] = useState(processed_data);
  const [selectedBar, setSelectedBar] = useState<tabData | null>(null);
  const [isGreaterChecked, setIsGreaterChecked] = useState(true); // Checkbox sopra una barra

  const [showAveragePlane, setShowAveragePlane] = useState(true); // Stato per la visibilità del piano medio

  // Funzione per toggle del piano medio
  const toggleAveragePlane = () => {
    setShowAveragePlane((prev) => !prev);
  };
  const resetFilters = () => {
    setFilteredData(processed_data); // Ripristina i dati originali
    setSelectedBar(null); // Deseleziona la barra
    /* setShowAveragePlane(true); */ // Mostra il piano medio
  };

  const handleCellClick = (id: string) => {
    const clickedBar: tabData | undefined = processed_data.find((bar) => bar.id.toString() === id);
    console.log(clickedBar);
    if (clickedBar) {
      setSelectedBar(clickedBar); // Imposta la barra selezionata
      if (isGreaterChecked)
        setFilteredData(processed_data.filter((d) => d.value >= clickedBar.value)); // Filtra i dati
      else
        setFilteredData(processed_data.filter((d) => d.value <= clickedBar.value)); // Filtra i dati
    }
  }

  return (
    <DataContext.Provider value={{ data: processed_data, filteredData, setFilteredData, setSelectedBar, xLabels, zLabels, showAveragePlane, isGreaterChecked }}>
      <div id='controls'>
        <div id="title">
          <h1>3Dataviz GROB</h1>
        </div>
        <div id='table-container'>
          <DynamicTable onCellClick={handleCellClick}/>
        </div>
        <div id='buttons'>
          <button onClick={toggleAveragePlane}>
            {showAveragePlane ? "Nascondi piano medio" : "Mostra piano medio"}
          </button>
          <button id='reset' onClick={resetFilters}>Resetta filtri</button>
        </div>
        <div id='wrapper'>
        <CustomCanvas selectedBar={selectedBar}
        />
        <Filters
          selectedBar={selectedBar}
          setIsGreaterChecked={setIsGreaterChecked}
        />     
        </div>
        <Footer />
      </div>
          
    </DataContext.Provider>
  );
}

export default App;