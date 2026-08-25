# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Collectors of Disney/Pixar *Cars*-universe die-cast toys are the primary users. The product has one administrator: the owner of CarsDB, who maintains the catalog and its tags.

## Product Purpose

CarsDB is a collector-first catalog and personal tracking tool for browsing a catalog of *Cars*-universe die-cast toys, rating individual toys, and tracking which toys a collector owns or wants. Success means a collector can quickly understand the catalog and keep their personal collection records current.

## Positioning

CarsDB combines a structured shared catalog with each collector's private personal layer: Personal Ratings, Owned membership, and Wishlist membership. Each Car belongs to exactly one Series and can have multiple freeform Tags, allowing collectors to discover items while preserving the distinctions needed for collection tracking.

## Operating Context

Collectors use the web app to browse, search, sort, and filter the catalog by name, Series, Tags, or their own Owned/Wishlist state. Authenticated collectors can rate cars in half-star increments, manage their Owned and Wishlist sets, and view collector profiles. The administrator uses an internal dashboard to add and edit cars, maintain image URLs and Series assignments, and apply Tags to multiple cars.

## Capabilities and Constraints

- A Car is a single die-cast toy or character, not a real-world automobile.
- A Car belongs to exactly one Series. Series names may describe an on-screen property or a physical toy product line/finish, and the administrator curates the available Series.
- A Car may have zero or more freeform Tags created through the administrator's tagging tool.
- Personal Ratings are private per-user ratings from 0.5 to 5 in half-star increments.
- Average Rating is the public mean of users' Personal Ratings for a Car; there is no leaderboard or ranking concept.
- Collection means the two independent membership sets Owned and Wishlist. A Car may be in one, both, or neither for a user.
- Firebase Authentication and Firestore provide account, profile, catalog, and rating data services.
- Public catalog browsing is available without authentication; collection management and ratings require authentication.
- The current product vocabulary in `CONTEXT.md` is canonical. In particular, do not use “Ranking” for Average Rating or “Collection” to mean Owned alone.

## Brand Commitments

Preserve the CarsDB name, its focus on the Disney/Pixar *Cars* universe, and the canonical terminology defined in `CONTEXT.md`. Do not invent product claims, testimonials, customers, benchmarks, pricing, or other external proof.

## Evidence on Hand

- Product terminology and domain model: `CONTEXT.md`.
- Working React/Vite application: `src/` and `package.json`.
- Catalog, authentication, profile, rating, collection, and admin workflows: `src/App.jsx` and `src/components/`.
- Firebase security and data-access constraints: `firebase.js` and `firestore.rules`.
- Existing logo mark asset: `public/carsdb.svg`.
- No external testimonials, customer proof, or benchmark evidence is present in the repository.

## Product Principles

- Make catalog discovery fast for collectors.
- Keep shared catalog facts distinct from personal collection state.
- Preserve precise domain terminology so the product reflects how collectors organize their collections.
- Make the administrator's catalog maintenance workflow efficient and controlled.
- Never fabricate catalog, community, or product evidence.
