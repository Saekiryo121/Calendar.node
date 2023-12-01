const path = require("path");
const express = require("express");
const ejs = require("ejs");
const app = express();
const bodyParser = require("body-parser");
const port = 3000;
const moment = require("moment");

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const mysql = require("mysql2");

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "RyoArata0213",
  database: "express_db",
});

app.get("/", (req, res) => {
  const requestedDate = req.query.month || moment().format("YYYY-MM-DD");
  const currentMonth = moment(requestedDate).format("YYYY-MM-DD");
  const prevMonth = moment(currentMonth)
    .subtract(1, "month")
    .format("YYYY-MM-DD");
  const nextMonth = moment(currentMonth).add(1, "month").format("YYYY-MM-DD");

  con.query("SELECT * FROM events", (error, results) => {
    if (error) {
      console.error("Error fetching events:", error);
      return res.status(500).send("Internal Server Error");
    }

    console.log("All events:", results);

    const daysOfWeek = moment.weekdaysShort();
    const daysInMonth = moment(currentMonth).daysInMonth();
    const firstDay = moment(currentMonth).startOf("month").format("dddd");
    const calendar = [];

    let dayCounter = 1;
    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (
          (i === 0 && j < daysOfWeek.indexOf(firstDay)) ||
          dayCounter > daysInMonth
        ) {
          week.push({ day: "", month: "" });
        } else {
          const currentDate = moment(
            `${currentMonth}-${dayCounter}`,
            "YYYY-MM-D"
          ).format("YYYY-MM-DD");

          const eventsForDay = results
            .filter(
              (event) => moment(event.date).format("YYYY-MM-DD") === currentDate
            )
            .map((event) => ({
              title: event.title,
              date: moment(event.date).format("YYYY-MM-DD"),
              organizer: event.organizer,
            }));

          console.log("currentDate:", currentDate);
          console.log("eventsForDay:", eventsForDay);

          week.push({
            day: dayCounter,
            month: moment(currentDate).format("YYYY-MM"),
            events: eventsForDay,
          });

          dayCounter++;
        }
      }
      calendar.push(week);
    }

    console.log("Calendar data:", calendar);

    res.render("index", {
      calendar,
      daysOfWeek,
      currentMonth,
      prevMonth,
      nextMonth,
      moment: moment,
      events: results,
    });
  });
});

app.get("/add", (req, res) => {
  res.render("add");
});

app.post("/add", (req, res) => {
  console.log("Received request body:", req.body);

  const { title, organizer, description, date } = req.body;

  console.log("Received date:", date);

  const parsedDate = moment(date, "YYYY-MM-DD", true);

  if (!parsedDate.isValid()) {
    console.error("Invalid date format");
    return res.status(400).json({ error: "Invalid date format" });
  }

  const formattedDate = parsedDate.format("YYYY-MM-DD");
  console.log("Formatted date:", formattedDate);

  const insertQuery =
    "INSERT INTO events (title, organizer, description, date) VALUES (?, ?, ?, ?)";

  console.log("Insert query:", insertQuery);
  console.log("Insert values:", [title, organizer, description, formattedDate]);

  con.query(
    insertQuery,
    [title, organizer, description, formattedDate],
    (error, results) => {
      if (error) {
        console.error("Error adding event:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      console.log("Event added successfully!");
      res.json({ success: true });
    }
  );
});

app.get("/events/:date", (req, res) => {
  const requestedDate = req.params.date;
  const formattedDate = moment(requestedDate, "YYYY-MM-DD").format(
    "YYYY-MM-DD"
  );

  con.query(
    "SELECT * FROM events WHERE date = ? AND title = ?",
    [formattedDate, req.query.title],
    (error, results) => {
      if (error) {
        console.error("Error fetching event details:", error);
        return res.status(500).send("Internal Server Error");
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Event not found" });
      }

      const eventDetails = {
        title: results[0].title,
        organizer: results[0].organizer,
        description: results[0].description,
        date: moment(results[0].date).format("YYYY-MM-DD"),
      };

      res.json({ event: eventDetails });
    }
  );
});

app.post("/update", (req, res) => {
  console.log("Received update request body:", req.body);

  const { title, organizer, description, date } = req.body;

  console.log("Received update request with data:", {
    title,
    organizer,
    description,
    date,
  });

  const updateQuery =
    "UPDATE events SET title = ?, organizer = ?, description = ? WHERE date = ?";

  con.query(
    updateQuery,
    [title, organizer, description, date],
    (error, results) => {
      if (error) {
        console.error("Error updating event:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      console.log("Event updated successfully!");
      res.json({ success: true });
    }
  );
});

app.delete("/delete", (req, res) => {
  const date = req.query.date;
  const title = req.query.title;

  const formattedDate = moment(date).format("YYYY-MM-DD");

  const query = "DELETE FROM events WHERE date = ? AND title = ?";

  con.query(query, [formattedDate, title], (error, results) => {
    if (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Event deleted successfully:", results);
      res.json({ success: true });
    }
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
