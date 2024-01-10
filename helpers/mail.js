const Ticket = require("../models/Ticket");
const nodemailer = require("nodemailer")
const qrcode = require("qrcode")
const fs = require('fs').promises;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const moment = require("moment");

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'qrcodes', 
  },
});

const multerUploader = multer({ storage: storage });

async function generateQRCode(data, passengers, destination, dateTime,dateString, freeLuggages) {
  try {
    const qrOptions = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    };

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      auth: {
        user: 'etnikz2002@gmail.com',
        pass: 'vysmnurlcmrzcwad',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const qrCodeBuffer = await qrcode.toBuffer(data, qrOptions);

    const qrCodeUrls = await Promise.all(passengers.map(async (passenger) => {
      console.log({passenger})
      const result = await cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'qrcodes',
        },
        async (error, result) => {
          if (error) {
            console.error('Error uploading QR code to Cloudinary:', error.message);
            throw error;
          }

          await transporter.sendMail({
            from: 'etnikz2002@gmail.com',
            to: passenger?.email,
            subject: 'HakBus Booking Details',
            html: `
                  <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>HakBus Booking Confirmation</title>
                        <style>
                            body {
                                font-family: 'Arial', sans-serif;
                                margin: 0;
                                padding: 0;
                                background-color: #f4f4f4;
                            }

                            .ticket-container {
                                max-width: 600px;
                                margin: 20px auto;
                                padding: 30px;
                                border: 2px solid #3498db;
                                border-radius: 15px;
                                background-color: #ffffff;
                                box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
                            }

                            .ticket-header {
                                text-align: center;
                                font-size: 28px;
                                font-weight: bold;
                                color: #333;
                                margin-bottom: 30px;
                            }

                            .booking-details {
                                font-size: 18px;
                                color: #555;
                                margin-bottom: 20px;
                            }

                            .qr-code {
                                display: block;
                                margin: 0 auto;
                                margin-top: 20px;
                                max-width: 100%;
                                height: auto;
                            }

                            .onboarding-message {
                                margin-top: 30px;
                                font-style: italic;
                                color: #888;
                                text-align: center;
                            }

                            .important-message {
                                margin-top: 30px;
                                font-weight: bold;
                                color: #e44d26;
                                text-align: center;
                            }

                            .thank-you {
                                text-align: center;
                                margin-top: 30px;
                                font-style: italic;
                                color: #333;
                            }
                        </style>
                    </head>

                    <body>
                        <div class="ticket-container">
                          <img class="qr-code" src=${result.secure_url} alt="QR Code" />
                          <div class="ticket-header">
                                <p>Hello ${passenger?.fullName || 'Passenger'},</p>
                                <p>Your HakBus Booking Details</p>
                            </div>
                            <div class="booking-details">
                                <p><strong>Destination:</strong> ${destination.from} -> ${destination.to}</p>
                                <p><strong>Date:</strong> ${moment(dateTime.date).format("DD-MM-YYYY")}, <strong>Time:</strong> ${dateTime.time}</p>
                                <p><strong>Day:</strong> ${dateString}</p>
                                <p> ${passenger?.age <= 10 ? "Child" : "Adult"}</p>
                                <p>Booking ID: ${data}</p>
                                <p>Free luggages: ${freeLuggages}</p>
                                <p>Extra luggages: ${passenger?.numberOfLuggages}</p>
                                <b>Luggages price:&euro; ${passenger?.luggagePrice}</b> <br />
                                <b>Ticket price:&euro; ${passenger?.price}</b> <br />
                                <b>Total price:&euro; ${passenger?.price + passenger?.luggagePrice}</b> <br />
                            </div>
                            <div class="onboarding-message">
                                <p>Use this QR code for onboarding when you travel with HakBus.</p>
                            </div>
                            <div class="important-message">
                                <p>Important: Keep this QR code safely as it serves as proof of your payment and is required for travel verification.</p>
                            </div>
                            <div class="thank-you">
                                <p>Thank you for choosing HakBus!</p>
                            </div>
                        </div>
                    </body>

                    </html>
                `,
              });
          console.log('QR code uploaded to Cloudinary:', result.secure_url);

          return result.secure_url;
        }
      ).end(qrCodeBuffer);

      return result.secure_url;
    }));

    return qrCodeUrls;
  } catch (error) {
    console.error('Error generating QR code:', error.message);
    throw error;
  }
}


async function getTicketsFromDateToDate(from, to) {
    // const selectedDateFrom = moment(req.body.selectedDateFrom).format("DD:MM:YYYY");
    // const selectedDateTo = moment(req.body.selectedDateTo).format("DD:MM:YYYY");

    const tickets = await Ticket.find({$and: 
        [
            { "time" : { $gte : from } },
            { "time" : { $lte : to } }
        ]
    })

    return tickets;
}

async function cancelNotPaidBookingImmediately (booking) {
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      auth: {
        user: 'etnikz2002@gmail.com',
        pass: 'vysmnurlcmrzcwad',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const userEmail = [];
    booking.passengers.map((p) => {
      userEmail.push(p.email)
    })

    let info = await transporter.sendMail({
      from: 'etnikz2002@gmail.com', 
      to: userEmail, 
      subject: 'Booking Cancelled Due to Unsuccessful Payment',
      html: `
        <html>
          <head>
            <style>

            </style>
          </head>
          <body>
            <div style="font-family: 'Arial', sans-serif; padding: 20px; background-color: #f4f4f4; text-align: center;">
              <h2 style="color: #333;">Booking Cancelled</h2>
              <p style="color: #555;">Dear customer,</p>
              <p style="color: #555;">We regret to inform you that your booking has been cancelled due to an unsuccessful payment and the qrcode you received will not be working for onboarding.</p>
              <p style="color: #555;">If you have any questions or concerns, please contact our support team.</p>
              <p style="color: #555;">Thank you for choosing HakBus!</p>
              <div style="margin-top: 20px; padding: 10px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 5px;">
                <p style="color: #333; font-weight: bold;">Contact Information:</p>
                <p style="color: #555;">Email: support@hakbus.com</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    

  } catch (error) {
    console.log(error)
    return JSON.stringify(error);
  }
}

async function sendOrderToUsersEmail ( userEmail, ticket, buyerName, customersName, price, type )  {
    try {

    //   const sendToHistory = `${process.env.APIURL}/user/tickets/${userID}`;

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            auth: {
              user: 'etnikz2002@gmail.com',
              pass: 'vysmnurlcmrzcwad',
            },
            tls: {
              rejectUnauthorized: false,
            },
          });
        
          let info = await transporter.sendMail({
            from: 'etnikz2002@gmail.com', 
            to: userEmail, 
            subject: 'Ticket successfully purchased!',
            html: `
              <html>
                <head>
                <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">

                  <style>
                  .card {
                    overflow: hidden;
                    position: relative;
                    display:flex;
                    margin: 0 auto;
                    text-align: left;
                    border-radius: 0.5rem;
                    max-width: 290px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    background-color: #fff;
                  }
                  
                  .dismiss {
                    position: absolute;
                    right: 10px;
                    top: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.5rem 1rem;
                    background-color: #fff;
                    color: black;
                    border: 2px solid #D1D5DB;
                    font-size: 1rem;
                    font-weight: 300;
                    width: 30px;
                    height: 30px;
                    border-radius: 7px;
                    transition: .3s ease;
                  }
                  
                  .dismiss:hover {
                    background-color: #ee0d0d;
                    border: 2px solid #ee0d0d;
                    color: #fff;
                  }
                  
                  .header {
                    padding: 1.25rem 1rem 1rem 1rem;
                  }
                  
                  .image {
                    display: flex;
                    margin-left: auto;
                    margin-right: auto;
                    background-color: #e2feee;
                    flex-shrink: 0;
                    justify-content: center;
                    align-items: center;
                    width: 3rem;
                    height: 3rem;
                    border-radius: 9999px;
                    animation: animate .6s linear alternate-reverse infinite;
                    transition: .6s ease;
                  }
                  
                  .image svg {
                    color: #0afa2a;
                    width: 2rem;
                    height: 2rem;
                  }
                  
                  .content {
                    margin-top: 0.75rem;
                    text-align: center;
                  }
                  
                  .title {
                    color: #066e29;
                    font-size: 1rem;
                    font-weight: 600;
                    line-height: 1.5rem;
                  }
                  
                  .message {
                    margin-top: 0.5rem;
                    color: #595b5f;
                    font-size: 0.875rem;
                    line-height: 1.25rem;
                  }
                  
                  .actions {
                    margin: 0.75rem 1rem;
                  }

                  a { 
                    text-decoration:none;
                    list-style-type:none;
                    color:white;
                    text-align:center;
                  }
                  
                  .history {
                    display: inline-flex;
                    padding: 0.5rem 1rem;
                    background-color: #1aa06d;
                    color: white;
                    list-style-type:none;
                    font-size: 1rem;
                    line-height: 1.5rem;
                    font-weight: 500;
                    justify-content: center;
                    width: 100%;
                    border-radius: 0.375rem;
                    border: none;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                  }
                  
                  .track {
                    display: inline-flex;
                    margin-top: 0.75rem;
                    padding: 0.5rem 1rem;
                    color: #242525;
                    font-size: 1rem;
                    line-height: 1.5rem;
                    font-weight: 500;
                    justify-content: center;
                    width: 100%;
                    border-radius: 0.375rem;
                    border: 1px solid #D1D5DB;
                    background-color: #fff;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                  }

                  .capitalize {
                    text-transform: capitalize;
                  }
                  
                  a {
                    color:white;
                  }

                  @keyframes animate {
                    from {
                      transform: scale(1);
                    }
                  
                    to {
                      transform: scale(1.09);
                    }
                  }

                  </style>
                </head>

                <div class="card">
                <div class="header">
                  <div class="image">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                      <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                      <g id="SVGRepo_iconCarrier">
                        <path d="M20 7L9.00004 18L3.99994 13" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                      </g>
                    </svg>
                  </div>
                  <div class="content">
                    <span class="title">Booking Validated</span>
                    <p class="message capitalize">Dear ${buyerName},</p>

                    <p className="message">
                      Thank you for entrusting us with your journey! We're thrilled to confirm the successful purchase of a ticket for ${customersName}. 
                      To complete the process, please visit our agency and make the payment in cash. This will ensure you receive your ticket via email promptly or obtain a printed copy as per your preference. Your total amount payable is ${price}.
                    </p>

                  

                    <p class="message">Your ticket ID is: ${ticket._id}.</p>
                    <p class="message capitalize">Destination: ${ticket.from} → ${ticket.to}.</p>
                    <p class="message capitalize">Departure: ${ticket.date} at ${ticket.time}.</p>

                    <h3>${type == 'both' && 'Return ticket'} </h3>
                    
                    <p class="message">${type == 'both' && 'Destination:'} ${ticket.type === 'both' ? `${ticket.to} → ${ticket.from}` : ""}.</p>
                    <p class="message">${type == 'both' && 'Departure:'} ${ticket.type === 'both' ? `${ticket.returnDate} → ${ticket.returnTime}` : ""}.</p>
                    <div>
                      <h2  class="message"> Hak Bus </h2>
                    </div>
                  </div>
                </div>
              </div>
                </html>
            `, 
          });
    
        
    } catch (error) {
        console.error({error})
    }
}

async function sendOrderToUsersPhone( userPhone, ticket, userID, buyerName, customersName ) {
  const accountSid = 'AC0f8479956f3e5dff3b951b4dc2464923'; 
  const authToken = '38e28139451b2d883f3350e402c0383b'; 
  
  const client = require('twilio')(accountSid, authToken);

  await client.messages.create({
      body: `Dear ${buyerName}, Thank you for your purchase. We are pleased to inform you that the ticket for ${customersName} has been successfully sent to the agency.
      Please note that payment can only be made in cash at the agency. We apologize for any inconvenience this may cause.
      Your ticket ID is: ${ticket.ticket._id}. Destination: ${ticket.ticket.from} → ${ticket.ticket.to}. Departure: ${ticket.ticket.date} at ${ticket.ticket.time}.
      Return ticket:  Destination: ${ticket.ticket.type === 'return' ? `${ticket.ticket.to} → ${ticket.ticket.from}` : "No return ticket"}.
      Departure: ${ticket.ticket.type === 'return' ? `${ticket.ticket.returnDate} → ${ticket.ticket.returnTime}` : "No return ticket"}.
      `,
      to: userPhone,
      from: '+12562977581'
    })
  }
  
  async function sendAttachmentToAllPassengers ( passengers, attachments ) {
    try {
      console.log({passengers, attachments})
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        auth: {
          user: 'etnikz2002@gmail.com',
          pass: 'vysmnurlcmrzcwad',
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      
      passengers.forEach(async (p, i) => {
        await transporter.sendMail({
          from: 'etnikz2002@gmail.com', 
          to: p.email, 
          subject: 'HakBus Booking PDF!',
          html: `
            <html>
              <body>
                <p>Hello ${p.fullName},</p>
                <p>This email contains your booking details as an attachment.</p>
                <p>Please find your booking details in the attached PDF.</p>
                <p>Thank you for choosing HakBus!</p>
              </body>
            </html>
          `,
          attachments: [
            {
              filename: `hakbus-${p.fullName}-booking.pdf`,
              content: attachments[i],
              contentType: 'application/pdf',
            },
          ],
        })      
      })
      
  } catch (error) {
    console.log(error);
  }
}


const sendAttachmentToOneForAll = async (receiverEmail, passengers, attachments) => {
  try {
      console.log({ attachments });
      let transporter = nodemailer.createTransport({
          service: 'gmail',
          port: 587,
          auth: {
              user: 'etnikz2002@gmail.com',
              pass: 'vysmnurlcmrzcwad',
          },
          tls: {
              rejectUnauthorized: false,
          },
      });

      await transporter.sendMail({
          from: 'etnikz2002@gmail.com',
          to: receiverEmail,
          subject: 'HakBus Booking PDF!',
          html: `
              <html>
                  <body>
                      <p>Hello ${receiverEmail},</p>
                      <p>This email contains your booking details as an attachment.</p>
                      <p>Please find your booking details in the attached PDF:</p>
                      ${passengers.map((p, index) => `
                          <p>
                              <a href="${attachments[index]?.path}" target="_blank">
                                  hakbus-${p.fullName}-booking.pdf
                              </a>
                          </p>
                      `).join('')}
                      <p>Thank you for choosing HakBus!</p>
                  </body>
              </html>
          `,
        //   attachments: passengers.map((p, index) => ({
        //     filename: `hakbus-${p.fullName}-booking.pdf`,
        //     content: attachments[index]?.path, 
        //     encoding: 'base64', 
        //     contentType: 'application/pdf',
        //     disposition: 'inline', 
        // })),
      });
  } catch (error) {
      console.log({ error });
  }
};

async function sendBookingCancellationNotification(passenger, booking) {
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      auth: {
          user: 'etnikz2002@gmail.com',
          pass: 'vysmnurlcmrzcwad',
      },
      tls: {
          rejectUnauthorized: false,
      },
  });

  await transporter.sendMail({
      from: 'etnikz2002@gmail.com',
      to: passenger?.email,
      subject: 'HakBus Booking cancellation notification!',
      html: `
          <html>
              <body>
                <p>Dear ${passenger?.fullName},</p>
              <p>We regret to inform you that your booking from <b>${booking?.from}</b> to <b>${booking?.to}</b> with bookingID: ${booking?._id} has been canceled due to a non-confirmed payment.</p>
                <p>Ensuring a smooth booking process is important to us, and it appears that there was an issue with the payment confirmation for your reservation.</p>
                <p>If you believe this cancellation is in error or if you have any questions regarding the payment status, please contact our customer support at hakkomerc@gmail.com at your earliest convenience. We will do our best to assist you in resolving this matter promptly.</p>
                <p>We appreciate your understanding and look forward to serving you in the future.</p>
              </body>
          </html>
      `,
  });
  } catch (error) {
    console.log(error);
    return "error happened => " + error ;
  }
}



module.exports = { getTicketsFromDateToDate, sendOrderToUsersEmail, sendOrderToUsersPhone,cancelNotPaidBookingImmediately, sendAttachmentToAllPassengers, sendAttachmentToOneForAll, generateQRCode, sendBookingCancellationNotification };
