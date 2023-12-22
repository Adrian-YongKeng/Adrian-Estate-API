let express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const { DATABASE_URL } = process.env;
require("dotenv").config();

let app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    require: true,
  },
});

async function getPostgresVersion() {
  const client = await pool.connect();
  try {
    const response = await client.query("SELECT version()");
    console.log(response.rows[0]);
  } finally {
    client.release();
  }
}

getPostgresVersion();

//Posts endpoint
app.post("/listings", async (req, res) => {
  const {
    user_id,
    username,
    email,
    phone_number,
    title,
    description,
    type,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    address,
    latitude,
    longitude,
    offer,
    price,
    discounted_price,
    firestore_doc_id,
    image_url,
  } = req.body;

  const client = await pool.connect();
  try {
    // Insert new listing into the listings table
    const newListing = await client.query(
      "INSERT INTO listings (user_id, username, email, phone_number, title, description, type, bedrooms, bathrooms, parking, furnished, address, latitude, longitude, offer, price, discounted_price, firestore_doc_id, image_url, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP) RETURNING *",
      [
        user_id,
        username,
        email,
        phone_number,
        title,
        description,
        type,
        bedrooms,
        bathrooms,
        parking,
        furnished,
        address,
        latitude,
        longitude,
        offer,
        price,
        discounted_price,
        firestore_doc_id,
        image_url,
      ],
    );

    // Send new listing data back to client
    res.json(newListing.rows[0]);
  } catch (error) {
    console.log(error.stack);
    res
      .status(500)
      .json({ error: "Something went wrong, please try again later!" });
  } finally {
    client.release();
  }
});

// Endpoint - get the latest 5 listings
app.get("/listings/latest", async (req, res) => {
  const client = await pool.connect();
  try {
    // Query to select the latest 5 listings ordered by timestamp descending
    const result = await client.query(
      "SELECT * FROM listings ORDER BY created_at DESC LIMIT 5",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "An error occurred, please try again." });
  } finally {
    client.release();
  }
});

// Endpoint- get the oldest 4 sale listings
app.get("/listings/sale", async (req, res) => {
  const client = await pool.connect();
  try {
    // Query to select sale listings ordered by timestamp ascending
    const result = await client.query(
      "SELECT * FROM listings WHERE type = 'sale' ORDER BY created_at ASC LIMIT 4",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "An error occurred, please try again." });
  } finally {
    client.release();
  }
});

// endpoint - get all sale listings
app.get("/listings/sale/all", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM listings WHERE type = 'sale' ORDER BY created_at ASC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "An error occurred, please try again." });
  } finally {
    client.release();
  }
});

// Endpoint- get the oldest 4 rent listings
app.get("/listings/rent", async (req, res) => {
  const client = await pool.connect();
  try {
    // Query to select rent listings ordered by timestamp ascending
    const result = await client.query(
      "SELECT * FROM listings WHERE type = 'rent' ORDER BY created_at ASC LIMIT 4",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "An error occurred, please try again." });
  } finally {
    client.release();
  }
});

// New endpoint - get all rent listings
app.get("/listings/rent/all", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM listings WHERE type = 'rent' ORDER BY created_at ASC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "An error occurred, please try again." });
  } finally {
    client.release();
  }
});

// Endpoint -get listings with offer
app.get("/listings/offer", async (req, res) => {
  const client = await pool.connect();
  try {
    // Query to select listings where offer is true
    const result = await client.query(
      "SELECT * FROM listings WHERE offer = true ORDER BY created_at ASC LIMIT 4",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "An error occurred, please try again." });
  } finally {
    client.release();
  }
});

// Endpoint - get all listings with discounted_price (offers)
app.get("/listings/discounted_price", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM listings WHERE discounted_price > 0 ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "An error occurred, please try again." });
  } finally {
    client.release();
  }
});

//endpoint GetListings by userid
app.get("/listings/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const client = await pool.connect();

  try {
    // Query to select listings for the given user ID
    const listings = await client.query(
      "SELECT * FROM listings WHERE user_id = $1",
      [user_id],
    );
    if (listings.rows.length > 0) {
      // Return the listings if found
      res.json(listings.rows);
    } else {
      res
        .status(404)
        .json({ error: "Listings not found for the given user ID." });
    }
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ error: "An error occurrred, please try again." });
  } finally {
    client.release();
  }
});

//edit post
app.put("/listings/:firestore_doc_id", async (req, res) => {
  const { firestore_doc_id } = req.params; // Extract listing ID
  const {
    user_id,
    username,
    email,
    phone_number,
    title,
    description,
    type,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    address,
    latitude,
    longitude,
    offer,
    price,
    discounted_price,
    image_url,
  } = req.body; // Extract the updated content from the request body
  const client = await pool.connect();

  try {
    // Perform UPDATE operation
    await client.query(
      "UPDATE listings SET user_id = $1, username = $2, email = $3, phone_number = $4, title = $5, description = $6, type = $7, bedrooms = $8, bathrooms = $9, parking = $10, furnished = $11, address = $12, latitude = $13, longitude = $14, offer = $15, price = $16, discounted_price = $17, image_url = $18 WHERE firestore_doc_id = $19",
      [
        user_id,
        username,
        email,
        phone_number,
        title,
        description,
        type,
        bedrooms,
        bathrooms,
        parking,
        furnished,
        address,
        latitude,
        longitude,
        offer,
        price,
        discounted_price,
        image_url,
        firestore_doc_id,
      ],
    );

    res.json({ message: "Listing updated successfully" });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ error: "An error occurrred, please try again." });
  } finally {
    client.release();
  }
});

//delete listing
app.delete("/listings/:firestore_doc_id", async (req, res) => {
  const { firestore_doc_id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM listings WHERE firestore_doc_id = $1", [
      firestore_doc_id,
    ]);
    res.json({ message: "Listing deleted successfully" });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ error: "An error occurrred, please try again." });
  } finally {
    client.release();
  }
});

app.get("/listing/:firestore_doc_id", async (req, res) => {
  const { firestore_doc_id } = req.params;
  //console.log("Received req.params.firestore_doc_id:", firestore_doc_id);
  const client = await pool.connect();
  try {
    const listing = await client.query(
      "SELECT * FROM listings WHERE firestore_doc_id = $1",
      [firestore_doc_id],
    );
    //console.log("Query result:", listing.rows);
    if (listing.rows.length > 0) {
      res.json(listing.rows[0]);
    } else {
      res.status(404).json({ error: "Listing not found for the given ID." });
    }
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "An error occurred, please try again." });
  } finally {
    client.release();
  }
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the real estate API!" });
});

app.listen(3000, () => {
  console.log("App is listening on port 3000");
});
