import express from "express"
import client from "./redis.js";
import rateLimit from "express-rate-limit";


const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    message: {
        success: false,
        message: "Too many request. Try again later"
    }
})




const app = express()
const PORT = 3001

const dbData = [
    { id: 1, name: 'Laptop' },
    { id: 2, name: 'Phone' },
];



app.use(express.json())
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Server Successfully started"
    })
})

app.get("/products", limiter ,async (req, res) => {
    const cacheKey = 'all_products'

    try {
        const cachedData = await client.get(cacheKey)

        if (cachedData) {
            return res.json({
                source: 'cache (Redis)',
                data: JSON.parse(cachedData)
            })
        }


        await client.setEx(cacheKey, 120, JSON.stringify(dbData))

        res.json({
            source: 'database (MongoDB/SQL)',
            data: dbData
        })
    } catch (err) {
        res.json({
            success: false,
            message: err.message
        })
    }
})


app.post("/products", async (req, res) => {
    const cacheKey = 'all_products'

    try {

        const {id, name} = req.body

        await client.del(cacheKey)
        dbData.push({id, name})


        res.status(201).json({
            success: true,
            message: "Product successfully add!",
            data: {
                id,
                name
            }
        });
    } catch (err) {
        res.json({
            success: false,
            message: err.message
        })
    }
})




app.listen(PORT, () => {
    console.log(`Server liostening at http://localhost:${PORT}`);
})

