import { toast } from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiconnector";
import rzpLogo from "../../assets/Logo/rzp_logo.png"
import { setPaymentLoading } from "../../slices/courseSlice";
import { resetCart } from "../../slices/cartSlice";




const {COURSE_PAYMENT_API, COURSE_VERIFY_API, SEND_PAYMENT_SUCCESS_EMAIL_API} = studentEndpoints;

function loadScript(src) {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;

        script.onload = () => {
            resolve(true);
        }
        script.onerror= () =>{
            resolve(false);
        }
        document.body.appendChild(script);
    })
}


export async function buyCourse(token, courses, userDetails, navigate, dispatch) {
    const toastId = toast.loading("Loading...");
    try{
        //load the script
        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

        if(!res) {
            toast.error("RazorPay SDK failed to load");
            return;
        }

        //initiate the order


        console.log("Here is the bearer token!!", token)
        const orderResponse = await apiConnector("POST", COURSE_PAYMENT_API, 
                                {courses},
                                {
                                    Authorization: `Bearer ${token}`,
                                })



        console.log("HERE IS THE ORDERRESPONC------>>>", orderResponse);

        console.log("Api from studentFeatureApi.js......!!")


        console.log("Here is the razorpay key!!", process.env.REACT_APP_RAZORPAY_KEY)
        if(!orderResponse.data.success) {
            throw new Error(orderResponse?.data?.message);
        }
        console.log("PRINTING orderResponse", orderResponse);
        //options


        console.log("HERE is the user detailsss---->>",userDetails)
        const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY,
            currency: orderResponse?.data?.data?.message?.currency,
            amount: `${orderResponse?.data.data.amount}`,
            order_id:`${orderResponse?.data?.data?.id}`,
            name:"Learnify",
            description: "Thank You for Purchasing the Course",
            image:rzpLogo,
            prefill: {
                name:`${userDetails?.firstName}`,
                email:userDetails?.email
            },
            handler: function(response) {
                //send successful wala mail
                sendPaymentSuccessEmail({...response,razorpay_order_id:orderResponse?.data?.data?.id}, orderResponse?.data?.data?.amount,token );
                //verifyPayment
                verifyPayment({...response,razorpay_order_id:orderResponse?.data?.data?.id, courses, }, token, navigate, dispatch);
            }
        }

        console.log("yaha tak sab theeeeeek haiiiii-------->>>>",orderResponse?.data?.data?.amount)
        //miss hogya tha 
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

        console.log("AFTER PAYEMENT SUCESSSSS-------->>>>")

        paymentObject.on("payment.failed", function(response) {
            toast.error("oops, payment failed");
            console.log(response.error);
        })

    
        paymentObject.on("payment.success",(resp) => {
          console.log("LETS GOOOO, PAYEMENT DONONEEEE!!")       
        })
    }
    catch(error) {
        console.log("PAYMENT API ERROR.....", error);
        toast.error("Could not make Payment");
    }
    toast.dismiss(toastId);
}

async function sendPaymentSuccessEmail(response, amount, token) {


    console.log("API SENDPAYEMENT SUCCESSS EMAILLLL IS HERE -------->>>>>>>>>>>>>>>>>>>>>>",response);


    try{
        await apiConnector("POST", SEND_PAYMENT_SUCCESS_EMAIL_API, {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            amount,
        },{
            Authorization: `Bearer ${token}`
        })


    }
    catch(error) {
        console.log("PAYMENT SUCCESS EMAIL ERROR....", error);
    }
}

//verify payment
async function verifyPayment(bodyData, token, navigate, dispatch) {
    const toastId = toast.loading("Verifying Payment....");
    dispatch(setPaymentLoading(true));
    console.log("verify payement 1 IS HERE -------->>>>>>>>>>>>>>>>>>>>>>",bodyData)

    try{
        const response  = await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
            Authorization:`Bearer ${token}`,
        })

        if(!response.data.success) {
            throw new Error(response.data.message);
        }

        console.log("verify payement 2 IS HERE -------->>>>>>>>>>>>>>>>>>>>>>")

        toast.success("payment Successful, ypou are addded to the course");
        navigate("/dashboard/enrolled-courses");
        dispatch(resetCart());
    }   
    catch(error) {
        console.log("PAYMENT VERIFY ERROR....", error);
        toast.error("Could not verify Payment");
    }
    toast.dismiss(toastId);
    dispatch(setPaymentLoading(false));
}