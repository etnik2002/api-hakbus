const axios = require("axios");
const apiurl = process.env.API_URL;
const ticketSchema = require('../models/Ticket.js');

class Ticket {
    constructor() {}


    async getAllTickets() {
        const allTickets = await ticketSchema.find({}).populate([
            { path: 'agency', select: '-password' },
            { path: 'lineCode' },
          ]);
          
        return allTickets;
    }

    async getTicketById(id) {
        const ticket = await ticketSchema.findById(id);
        return ticket;
    }

    async deleteTicket(id) {
        await ticketSchema.findByIdAndRemove(id);
    }

    async editTicket(id, payload) {
        await ticketSchema.findByIdAndUpdate(id, payload);
    }


}

module.exports = Ticket;