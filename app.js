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
  const requestedDate = req.query.month || moment().format('YYYY-MM-DD');
  const currentMonth = moment(requestedDate).format('YYYY-MM-DD');
  const prevMonth = moment(currentMonth).subtract(1, 'month').format('YYYY-MM-DD');
  const nextMonth = moment(currentMonth).add(1, 'month').format('YYYY-MM-DD');

  con.query("SELECT * FROM events", (error, results) => {
    if (error) throw error;
    const events = results.map(event => ({
      title: event.title,
      date: moment(event.date).format('YYYY-MM-DD')
    }));

    const daysOfWeek = moment.weekdaysShort();
    const daysInMonth = moment(currentMonth).daysInMonth();
    const firstDay = moment(currentMonth).startOf('month').format('dddd');
    const calendar = [];

    let dayCounter = 1;
    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < daysOfWeek.indexOf(firstDay)) || dayCounter > daysInMonth) {
          week.push({ day: "", month: "" });
        } else {
          const currentDate = moment(`${dayCounter}-${currentMonth}`, 'D-M-YYYY').format('YYYY-MM-DD');
          const eventsForDay = events.filter(event => event.date === currentDate);
          week.push({ day: dayCounter, month: currentMonth, events: eventsForDay });
          dayCounter++;
        }
      }
      calendar.push(week);
    }

    res.render("index", {
      calendar,
      daysOfWeek,
      currentMonth,
      prevMonth,
      nextMonth,
      moment: moment
    });
  });
});

app.get("/add", (req, res) => {
  res.render("add");
});

app.post("/add", (req, res) => {
  const { title, organizer, description, date } = req.body;
  const insertQuery =
    "INSERT INTO events (title, organizer, description, date) VALUES (?, ?, ?, ?)";

    con.query(
      insertQuery,
      [title, organizer, description, date],
      (error, results) => {
        if (error) {
          console.error("Error adding event:", error);
          throw error;
        }
        console.log("Event added successfully!");
        res.redirect("/");
      }
    );
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
