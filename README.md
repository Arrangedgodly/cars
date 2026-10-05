<p align="center">
  <img src="public/carsdb.svg" alt="CarsDB logo" width="56" height="56">
</p>

<h1 align="center">CarsDB</h1>

<p align="center">A searchable catalog and collection tracker for Disney/Pixar <em>Cars</em> die-cast toys.</p>

<p align="center">
  <a href="https://cars.arrangedgodly.com/">Open the live catalog</a> ·
  <a href="https://github.com/Arrangedgodly/cars">View source</a>
</p>

<p align="center">
  <img src="docs/assets/carsdb-catalog-desktop.jpg" alt="CarsDB catalog with search, sort and filter controls, pagination, and populated die-cast cards" width="960">
</p>

*Browse the catalog with search, sort, and filters. This signed-out view shows 1,455 entries.*

<p align="center">
  <img src="docs/assets/carsdb-lightning-desktop.jpg" alt="CarsDB search results for Lightning with 78 matching cars and populated Lightning McQueen cards" width="960">
</p>

*Search in action: Lightning narrows the catalog to 78 matching cars.*

## About

CarsDB brings a shared catalog of Cars-universe die-cast toys together with each collector's personal ratings and collection lists. Browse the catalog without an account; sign in to track what you own, what you want, and your ratings.

## Features

- Search by car name, Series, or Tags, with fuzzy matching for typos.
- Filter by Series and Tags, sort by name or Average Rating, and page through results.
- Track **Owned** and **Wishlist** independently on your account.
- Give a private Personal Rating from 0.5 to 5 stars in half-star steps. Average Rating is the public mean across personal ratings.
- Switch character themes and light or dark mode; the choice is saved in your browser.
- Admins can add and edit catalog entries and apply Tags in bulk.

## Run locally

Requires Node.js and npm. CarsDB reads its catalog from Cloud Firestore and uses Firebase Authentication for accounts. You need a Firebase project with Firestore and Authentication configured to use the catalog and account features.

```sh
git clone https://github.com/Arrangedgodly/cars.git
cd cars
npm install
```

Add the Firebase web app configuration to a `.env` file in the project root:

```dotenv
VITE_API_KEY=...
VITE_AUTH_DOMAIN=...
VITE_PROJECT_ID=...
VITE_STORAGE_BUCKET=...
VITE_MESSAGING_SENDER_ID=...
VITE_APP_ID=...
VITE_MEASUREMENT_ID=...
```

Start the development server:

```sh
npm run dev
```

Vite prints the local URL. Without a working Firebase configuration and catalog, the app cannot load the catalog data. Personal ratings and Owned/Wishlist tracking require signing in.

## Build and lint

```sh
npm run build
npm run lint
```

Use `npm run preview` to serve the production build locally. Firebase Hosting is configured to serve the `dist` directory with a single-page-app rewrite; deployment requires a configured Firebase project and credentials.

## Documentation

- [Product scope and workflows](PRODUCT.md)
- [Catalog terminology](CONTEXT.md)
- [Design direction](DESIGN.md)
- [Firestore security rules](firestore.rules)
