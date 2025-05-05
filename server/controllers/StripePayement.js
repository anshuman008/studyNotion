import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



const stripePayement = async(req,res) => {
   

    console.log("Hey im from payement gateway!!"); 


    // create stripe session

    const origin = 'https://google.com'


    const productData = [];


    const mockProduct1 = {
        name:"c++ crash course",
        price: 100,
    }

    const mockProduct2 = {
        name:"JAVA crash course",
        price: 100,
    }

    const mockProduct3 = {
        name:"Python crash course",
        price: 100,
    }

    const mockProduct4 = {
        name:"JS crash course",
        price: 100,
    }

    productData.push(mockProduct1);
    productData.push(mockProduct2);
    productData.push(mockProduct3);
    productData.push(mockProduct4);


    const line_data = productData.map((item) => {
        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name:item.name
                },
                unit_amount: item.price*100,
            },
            quantity: 1
        }
    })

    const session = await stripe.checkout.sessions.create({
        line_items: line_data,
        mode: 'payment',
        success_url: `${origin}`,
        cancel_url: `${origin}`,
        metadata: {
            orderId: '0070',
            userId: 'anshu009'
        }
    })


   
    return res.json({"message":"payement sucseed!!","url":session.url})
};


export {stripePayement};