import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { rawData } from "../App";

// Definisci il tipo del contesto
interface DataContextType {
    fetched: {data: rawData[], legend: Legend } | null;
    loading: boolean;
    error: string | null;
}

interface Legend {
    x: string;
    y: string;
    z: string;
}

// Crea il contesto con un valore iniziale
const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [fetched, setFetched] = useState<{data: rawData[], legend: Legend }| null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // const response = await axios.get("http://127.0.0.1:5000/api/call/"); // chiamata a api no key
                const response = await axios.get("http://127.0.0.1:5000/api/hcall/"); // chiamata a api no key
                // const response = await axios.get("http://127.0.0.1:5000/apiK/call/"); // chiamata a api with key

                setFetched(response.data); 
            } catch (err) {
                setError("Errore nel recupero dei dati");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <DataContext.Provider value={{ fetched, loading, error }}>
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