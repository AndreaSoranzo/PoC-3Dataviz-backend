import express, { Request, Response } from "express";
import cors from "cors";
import axios from "axios";
import { deleteFromCache, getFromCache, setToCache } from './memcache';

require('dotenv').config()

interface rawData {
    id: number;
    labelX: string;
    value: number;
    labelZ: string;
}

interface Legend {
    x: string;
    y: string;
    z: string;
}

const app = express();
app.use(cors());
app.use(express.json());

const cities = [
    {
        id: 0,
        name: 'Berlin',
        latitude: 52.548,
        longitude: 13.41
    },
    {
        id: 1,
        name: 'Paris',
        latitude: 48.54,
        longitude: 2.27
    },
    {
        id: 2,
        name: 'Rome',
        latitude: 41.93,
        longitude: 12.56
    },
    {
        id: 3,
        name: 'Madrid',
        latitude: 40.39,
        longitude: -3.68
    }
];


app.get("/apiK/call", async (req: Request, res: Response) => {
    const key= process.env.API_KEY
    const url= process.env.API_URL

    const legend: Legend = {
        x: "DateTime",
        y: "Temperature",
        z: "City"
    }
    try {
        const cachedData = await getFromCache<{data: rawData[], legend: Legend}>("apiK");
        if(cachedData) {
            console.log("sto prendendo dalla cache");
            res.json(cachedData);
            await deleteFromCache("apiK"); // elimino dalla cache per testare il corretto funzionamento di memcache
            return;
        }

        console.log("sto facendo la request");

        const promises = cities.map(item => axios.get(url + "?access_key="+key+"&query="+item.name));
        const results = await Promise.all(promises);
        let data: rawData[] = [];
        
        results.forEach((r, index) => {
            const hour: string = r.data.location.localtime;
            const value: number = r.data.current.temperature;
            const entry: rawData = { id: index , labelX: r.data.location.name, value: value, labelZ: hour };
            data.push(entry);
        });
        const d = {data: data, legend: legend}
        await setToCache("apiK",d);
        res.json(d);
    }
    catch (error) {
        res.status(500).json({ error: "Errore nel recupero dei dati" });
    }
});

app.get("/api/call", async (req: Request, res: Response) => {
    const latitudes = cities.map(city => city.latitude).join(",");
    const longitudes = cities.map(city => city.longitude).join(",");
    const URL = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitudes}&longitude=${longitudes}&start_date=2024-01-01&end_date=2024-01-01&hourly=temperature_2m`;
    const legend = {
        x: "DateTime",
        y: "Temperature",
        z: "City"
    }

    try {

        const cachedData = await getFromCache<{data: rawData[], legend: Legend}>("api");
        if(cachedData) {
            console.log("sto prendendo dalla cache");
            res.json(cachedData);
            await deleteFromCache("api"); // elimino dalla cache per testare il corretto funzionamento di memcache
            return;
        }

        console.log("sto facendo la request");

        const response = await axios.get(URL);
        let data: rawData[] = [];
        for (let i = 0; i < cities.length; i++) {
            const hours: string[] = response.data[i].hourly.time;
            const values: number[] = response.data[i].hourly.temperature_2m;
            for (let j = 0; j < hours.length; j++) {
                const entry: rawData = { id: j * cities.length + i, labelX: hours[j].replace('T', ' '), value: values[j], labelZ: cities[i].name };
                data.push(entry);
            }
        }

        const d = {data: data, legend: legend}
        await setToCache("api",d);
        res.json(d);
    }
    catch (error) {
        res.status(500).json({ error: "Errore nel recupero dei dati" });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
