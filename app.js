/****************************************************************************** *** 
*	ITE5315 – Assignment 2 
*	I declare that this assignment is my own work in accordance with Humber Academic Policy. 
*  No part of this assignment has been copied manually or electronically from any other source 
*  (including web sites) or distributed to other students. 
*  
*	Name: Kiranjit Kaur   Student ID: n01702773 Date:28 October 2025
* 
* 
******************************************************************************
**/  



// importing Required Modules
const express = require("express");
const path = require("path");
const fs = require("fs");
const { body, validationResult } = require("express-validator");
const exphbs = require("express-handlebars");
const app = express();



// Allow form data to be read (for POST requests)
app.use(express.urlencoded({ extended: true }));

// Allow Express to serve files like CSS, images from the "public" folder
app.use(express.static(path.join(__dirname, "public")));


// Setup Handlebars (Template Engine)
app.engine(
  "hbs",
  exphbs.engine({
    extname: "hbs", // use .hbs files for templates
    defaultLayout: "main", // base layout file
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),

    // Step 10 Custom Helpers for displaying Formatting
    helpers: {
      // Show N/A when name is missing
      emptyName: (name) => (name && name.trim() !== "" ? name : "N/A"),

      // Check if name is missing (used for row highlighting)
      isEmptyName: (name) => !name || name.trim() === "",

      // Equality check (used in templates)
      eq: (a, b) => a === b,
    },
  })
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));


// Step 7 Load and Clean Airbnb Dataset
// Read Airbnb JSON data file
const rawData = JSON.parse(
  fs.readFileSync("./data/airbnb_with_photos.json", "utf-8")
);

// Cleaning the data and make sure price is a number
const airbnbData = rawData.map((item) => {
  let priceValue = item.price || item.Price || item.PRICE || "";

  // Remove symbols like $, commas, etc.
  if (typeof priceValue === "string") {
    priceValue = priceValue.replace(/[^0-9.]/g, "");
  }

  const numericPrice = parseFloat(priceValue) || 0;

  return {
    id: item.id,
    name: item.NAME || item.name || "",
    host_name: item["host name"] || "",
    neighbourhood: item.neighbourhood || item["neighbourhood group"] || "",
    room_type: item["room type"] || "",
    price: numericPrice,
    picture_url: item.thumbnail || (item.images ? item.images[0] : ""),
    images: item.images || [],
  };
});


// Routes
app.get("/", (req, res) => res.render("index", { title: "Home" }));
app.get("/about", (req, res) => res.render("about", { title: "About" }));
app.get("/users", (req, res) => {
  res.send("respond with a resource");//step3
});

// Step 7 Display All Airbnb Data(no filtering)
app.get("/allData", (req, res) => {
  res.render("allData", {
    title: "All Airbnb Data",
    data: airbnbData,
  });
});


// Search by Property Name
// Show search form
app.get("/search/name", (req, res) => {
  res.render("searchName", { title: "Search by Property Name" });
});

// Handle form submission(assignmnet 1 route)
app.post(
  "/search/name",
  [
    body("property_name")
      .notEmpty()
      .withMessage("Property name is required")
      .trim()
      .escape(),
  ],
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("searchName", {
        title: "Search by Property Name",
        errors: errors.array(),
      });
    }

    const nameInput = req.body.property_name.toLowerCase();

    // Filter Airbnb records that contain the searched name (case-insensitive)
    const results = airbnbData.filter((item) =>
      item.name.toLowerCase().includes(nameInput)
    );

    // If nothing found, show a message
    if (results.length === 0) {
      return res.render("searchNameResult", {
        title: "Search Results",
        notFound: true,
        nameInput,
      });
    }

    // Render results
    res.render("searchNameResult", {
      title: `Search Results for "${req.body.property_name}"`,
      results,
      nameInput,
    });
  }
);

// Step 8 View Data in Table Format with Helpers
app.get("/viewData", (req, res) => {
  res.render("viewData", {
    title: "View Airbnb Data",
    data: airbnbData,
  });
});


// Step 9 Cleaning Data — removing Empty Names
app.get("/viewData/clean", (req, res) => {
  const cleanData = airbnbData.filter(
    (item) => item.name && item.name.trim() !== ""
  );

  res.render("viewData", {
    title: "Clean Airbnb Data (No Empty Names)",
    data: cleanData,
    clean: true,
  });
});

//Search by Property ID (with Validation, assignment 1 route)
// Show Property ID search form
app.get("/search/PropertyID", (req, res) => {
  res.render("searchProperty", { title: "Search by Property ID" });
});

// Handle Property ID form submission
app.post(
  "/search/PropertyID",
  [
    body("property_id")
      .notEmpty()
      .withMessage("Property ID is required")
      .isNumeric()
      .withMessage("Property ID must be numeric")
      .trim()
      .escape(),
  ],
  (req, res) => {
    const errors = validationResult(req);

    // If validation errors, re-render form with messages
    if (!errors.isEmpty()) {
      return res.render("searchProperty", {
        title: "Search by Property ID",
        errors: errors.array(),
      });
    }

    // Find property by ID
    const propertyID = req.body.property_id;
    const result = airbnbData.find((item) => item.id == propertyID);

    // If not found
    if (!result) {
      return res.render("searchResult", {
        title: "Search Results",
        notFound: true,
      });
    }

    // If found, render result
    res.render("searchResult", {
      title: "Search Results",
      result,
    });
  }
);

// Step 11 Searching by Price Range (with Validation & Sanitization)
// Show form to enter min & max price
app.get("/viewData/price", (req, res) => {
  res.render("searchPrice", { title: "Search by Price Range" });
});

// Handle price range form submission
app.post(
  "/viewData/price",
  [
    // Validation rules
    body("minPrice")
      .notEmpty()
      .withMessage("Minimum price is required")
      .isNumeric()
      .withMessage("Minimum price must be a number")
      .toFloat(),

    body("maxPrice")
      .notEmpty()
      .withMessage("Maximum price is required")
      .isNumeric()
      .withMessage("Maximum price must be a number")
      .toFloat(),
  ],
  (req, res) => {
    const errors = validationResult(req);

    // If validation fails, re-render the form
    if (!errors.isEmpty()) {
      return res.render("searchPrice", {
        title: "Search by Price Range",
        errors: errors.array(),
      });
    }

    const { minPrice, maxPrice } = req.body;

    // Logical validation: min must be <= max
    if (minPrice > maxPrice) {
      return res.render("searchPrice", {
        title: "Search by Price Range",
        errors: [{ msg: "Minimum price cannot be greater than maximum price" }],
      });
    }

    // Filter Airbnb data by price range
    const results = airbnbData.filter(
      (item) => item.price >= minPrice && item.price <= maxPrice
    );

    // Render matching results
    res.render("searchPriceResult", {
      title: `Airbnb Listings from $${minPrice} to $${maxPrice}`,
      results,
      minPrice,
      maxPrice,
    });
  }
);

//404 Error Handling Page
app.use((req, res) => {
  res.status(404).render("error", {
    title: "404 - Page Not Found",
    message: "Oops! The page you’re looking for doesn’t exist.",
  });
});

// //  Starting the Server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () =>
//   console.log(`Server running at http://localhost:${PORT}`)
// );


module.exports = app;
