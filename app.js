const path = require("path");
const express = require("express");
const ejs = require("ejs");
const app = express();
const bodyParser = require("body-parser");
const port = 3000;
const moment = require("moment");

app.set("view engine", "ejs");
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
            month: currentMonth,
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
    });
  });
});

app.get("/add", (req, res) => {
  res.render("add");
});

app.post("/add", (req, res) => {
  const { title, organizer, description, date } = req.body;
  console.log("Received date:", date);

  const formattedDate = moment(date, "YYYY-MM-D").format("YYYY-MM-DD");
  console.log("Formatted date:", formattedDate);

  const insertQuery = "INSERT INTO events (title, organizer, description, date) VALUES (?, ?, ?, ?)";
  console.log("Formatted date before inserting into database:", formattedDate);


  con.query(
    insertQuery,
    [title, organizer, description, formattedDate],
    (error, results) => {
      if (error) {
        console.error("Error adding event:", error);
        return res.status(500).send("Internal Server Error");
      }
      console.log("Event added successfully!");
      res.redirect("/");
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

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
