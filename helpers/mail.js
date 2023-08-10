const Ticket = require("../models/Ticket");
const nodemailer = require("nodemailer")

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

async function sendOrderToUsersEmail ( userEmail, ticket, userID, buyerName, customersName, price, type )  {
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


async function sendAttachmentToOneForAll ( receiverEmail, passengers, attachments ) {
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
        to: receiverEmail,
        subject: 'HakBus Booking PDF!',
        html: `
          <html>
            <body>
              <p>Hello ${receiverEmail},</p>
              <p>This email contains your booking details as an attachment.</p>
              <p>Please find your booking details in the attached PDF.</p>
              <p>Thank you for choosing HakBus!</p>
            </body>
          </html>
        `,

        attachments: passengers.map((p, index) => ({
          filename: `hakbus-${p.fullName}-booking.pdf`,
          content: attachments[index], 
          contentType: 'application/pdf',
        }))
        
      });
       
    } catch (error) {
      console.log(error);
    }
}


module.exports = { getTicketsFromDateToDate, sendOrderToUsersEmail, sendOrderToUsersPhone, sendAttachmentToAllPassengers, sendAttachmentToOneForAll };
