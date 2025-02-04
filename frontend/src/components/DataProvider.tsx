import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { rawData } from "../App";

// Definisci il tipo del contesto
interface DataContextType {
    data: rawData[] | null;
    loading: boolean;
    error: string | null;
}

// Crea il contesto con un valore iniziale
const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [data, setData] = useState<rawData[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/meteo1");
                console.log("data: "+ response); 
                setData(response.data); 
            } catch (err) {
                setError("Errore nel recupero dei dati");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <DataContext.Provider value={{ data, loading, error }}>
            {children}
        </DataContext.Provider>
    );
};

// Custom Hook per usare il contesto più facilmente
export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("useData deve essere usato dentro un DataProvider");
    }
    return context;
};