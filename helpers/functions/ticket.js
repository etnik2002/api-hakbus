const generateTicketsForNextTwoYears = async (ticketData, selectedDayOfWeek) => {
    const adjustDayOfWeek = (startDate, dayOfWeek) => {
        const adjustedDate = new Date(startDate);
        adjustedDate.setDate(startDate.getDate() + ((dayOfWeek + 7 - startDate.getDay()) % 7));
        return adjustedDate;
    };
  
    const startDate = new Date();
    const ticketDate = adjustDayOfWeek(startDate, selectedDayOfWeek);
    startDate.setDate(ticketDate.getDate());
    startDate.setHours(8, 0, 0, 0);
  
    const tickets = [];
  
    for (let i = 0; i < 2 * 52; i++) {
        const ticketDateString = moment(ticketDate).subtract(1, 'days').toISOString();
  
        const ticketDataWithDate = {
            ...ticketData,
            date: ticketDateString,
        };
  
        tickets.push(ticketDataWithDate);
  
        ticketDate.setDate(ticketDate.getDate() + 7);
    }
  
    await Ticket.insertMany(tickets);
  
    return tickets;
  };

  module.exports = { generateTicketsForNextTwoYears };