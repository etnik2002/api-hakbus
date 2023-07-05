const axios = require("axios");
const fetch = require('node-fetch');
const Agency = require("../models/Agency");

const CLIENT_ID = "AShTOLoaJm1fYBPuYn4AIG6x4s_k2KmYm7YU4-gBYfzbxbhHX1W7xnlYQQRxoxScSBRxKc0rMkb47MPV";
const APP_SECRET = "EIaVStYsJq_jGpy-dak6j8h0axKWQ2oxjvRpwiiqcuZw3tGPSZHz3_9F5LsA6_yv_SnXLOQlAYNqylfb"
const base = "https://api-m.sandbox.paypal.com";

async function createOrder(data, agencyID) {
  try {
    console.log("inside capture order")
    const accessToken = await generateAccessToken(agencyID);
    console.log("after accesstoken")
    const url = `${base}/v2/checkout/orders`;
    const response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "EUR",
              value: data.product.cost,
            },
          },
        ],
      }),
    });
    console.log("capture order finished")
  
    return handleResponse(response);
  } catch (error) {
    console.log(error)
  }
   
}

async function capturePayment(orderId, agencyID) {
    console.log("inside capture payment")
  const accessToken = await generateAccessToken(agencyID);
  const url = `${base}/v2/checkout/orders/${orderId}/capture`;
  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  console.log(" capture payment finished")

  return handleResponse(response);
}

async function generateAccessToken(agencyID) {
  console.log(agencyID)
  const agency = await Agency.findById(agencyID)
  console.log("inside generate token")
  const auth = Buffer.from(agency.idc + ":" + agency.scc).toString("base64");
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "post",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  const jsonData = await handleResponse(response);
  console.log("gt fiunieshed")

  return jsonData.access_token;
}

async function handleResponse(response) {
    console.log("inside handle res")
  if (response.status === 200 || response.status === 201) {
    console.log(response)
    return response.json();
  }

  const errorMessage = await response.text();
  console.log("hr finished")
  throw new Error(errorMessage);
}

module.exports = {
  createOrder,
  capturePayment,
  generateAccessToken,
};
