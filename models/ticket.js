const client = require("../db");

const tickets = async (req, res) => {
  let company_id = parseInt(req.query.company_id) || null;
  let trip_id = parseInt(req.query.trip_id) || null;
  let user_id = parseInt(req.query.user_id) || null;
  let driver_id = parseInt(req.query.driver_id) || null;
  try {
    if (company_id !== null) {
      const result = await client.query(
        `SELECT * FROM Ticket 
        WHERE CompanyID = ${company_id} AND TripID = ${trip_id} `
      );
      res.send({ success: true, tickets: result.rows });
    } else if (user_id !== null) {
      const result = await client.query(
        `SELECT * FROM Ticket 
        WHERE UserID = ${user_id}' AND TripID = ${trip_id} 
        ORDER BY Price ASC`
      );
      res.send({ success: true, tickets: result.rows });
    } else if (
      company_id === null &&
      user_id === null &&
      trip_id === null &&
      driver_id === null
    ) {
      res.send({
        success: false,
        message: "require a params",
      });
    }
    if (driver_id !== null) {
      const result = await client.query(
        `SELECT * FROM Ticket 
        WHERE DriverID = ${driver_id}'
        ORDER BY Price ASC`
      );
      res.send({ success: true, tickets: result.rows });
    }
  } catch (error) {
    console.error(
      "Error fetching Companies try again and make sure that the require params are entered :",
      error
    );
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const addTicket = async (req, res) => {
  const company_id = Number(req.query.company_id) || null;
  const user_id = Number(req.query.user_id) || null;
  const trip_id = Number(req.query.trip_id) || null;
  const driver_id = Number(req.query.driver_id) || null;
  const {
    TicketType,
    PurchaseDate,
    Name,
    LastName,
    DateOfBirth,
    Nationality,
    Gender,
    PassportNumber,
    PlaceOfIssue,
    ExpiryDate,
  } = req.body;
  const price = parseFloat(req.body.price);
  try {
    const result = await client.query(
      `INSERT INTO Ticket(TicketType, Price, PurchaseDate, Name, LastName, 
        DateOfBirth, Nationality, Gender, PassportNumber, PlaceOfIssue, ExpiryDate,
        CompanyID, UserID, TripID, DriverID)
            VALUES('${TicketType}','${price}', '${PurchaseDate}','${Name}', 
            '${LastName}', '${DateOfBirth}','${Nationality}','${Gender}',
            '${PassportNumber}','${PlaceOfIssue}','${ExpiryDate}',${company_id},
            ${user_id}, ${trip_id},${driver_id}) 
            RETURNING *`
    );

    const newTicket = result.rows[0];

    res.send({
      success: true,
      newTicket: [newTicket],
    });
  } catch (error) {
    console.error("Error during addition, ", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const updateTicket = async (req, res) => {
  const ticket_id = req.params.id;
  const {
    Name,
    LastName,
    DateOfBirth,
    Nationality,
    Gender,
    PassportNumber,
    PlaceOfIssue,
    ExpiryDate,
  } = req.body;
  try {
    const result = await client.query(
      `UPDATE Ticket
       SET Name ='${Name}', LastName ='${LastName}', DateOfBirth ='${DateOfBirth}',
       Nationality='${Nationality}', Gender='${Gender}', PassportNumber='${PassportNumber}',
       PlaceOfIssue='${PlaceOfIssue}', ExpiryDate='${ExpiryDate}'
       WHERE TicketID=${ticket_id}
       RETURNING *`
    );

    const updatedTicket = result.rows[0];

    res.send({
      success: true,
      updatedTicket: [updatedTicket],
    });
  } catch (error) {
    console.error("Error during addition, ", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const deleteTicket = async (req, res) => {
  let ticket_id = parseInt(req.params.id);
  const result = await client.query(
    `DELETE FROM Ticket
         WHERE TripID = ${ticket_id}
         RETURNING *;`
  );
  const deletedTicket = result.rows[0];
  res.send({
    success: true,
    msg: "deleted successfully",
    deletedTicket: [deletedTicket],
  });
};

const getTicket = async (req, res) => {
  try {
    let ticket_id = Number(req.params.id);
    const result = await client.query(
      `SELECT * FROM Ticket WHERE TicketID ='${ticket_id}'`
    );

    if (result.rows.length === 0) {
      res.send({ success: false, msg: "Ticket not found" });
    } else {
      let ticket = result.rows[0];
      res.send({ success: true, ticket: [ticket] });
    }
  } catch (error) {
    console.error("Error during operation:", error);
    res.status(500).send({ success: false, msg: "Internal Server Error" });
  }
};

module.exports = { addTicket, deleteTicket, tickets, updateTicket, getTicket };
