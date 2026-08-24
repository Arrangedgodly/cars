# CarsDB

A collector's catalog and personal tracking tool for Disney/Pixar *Cars*-universe die-cast toys — browse the catalog, rate individual toys, and track what you own versus what you want.

## Language

**Car**:
A single die-cast toy/character in the catalog (e.g. Lightning McQueen), identified by name and image. Represents a toy, not a real-world automobile. Belongs to exactly one Series and may carry zero or more Tags.

**Series**:
The single named release line a Car belongs to — either an on-screen property (e.g. "Cars 2", "Cars on the Road") or a physical toy product line/finish (e.g. "NASCAR", "Racing Red", "Disney 100"). Both kinds of names live on the same axis by design; a Car has exactly one Series, chosen from an Admin-curated list.
_Avoid_: Franchise, category (when meaning Series)

**Tag**:
A freeform label an Admin applies to a Car (e.g. "Racecar", "Exclusive"). Unlike Series, a Car can carry multiple Tags, and Tags aren't drawn from a fixed list — they're created ad hoc through the Admin Tagging Tool.

**Personal Rating**:
One User's own star rating (0.5–5, half-star increments) for a specific Car. Private to that User; stored per-user, per-car.
_Avoid_: Your Rating (UI label, fine in UI copy, but "Personal Rating" is the canonical term)

**Average Rating**:
The mean of all Users' Personal Ratings for a Car, shown publicly on the Car's card. Not an ordinal ranking — no leaderboard/position concept exists in this domain.
_Avoid_: Average Ranking, Ranking (current UI mislabels this — flagged as a copy defect to fix, not a distinct concept)

**Collection**:
A User's tracked relationship to Cars, made up of two independent membership sets: Owned and Wishlist. A Car can be in one, both, or neither for a given User.
_Avoid_: Using "Collection" to mean Owned alone (current UserPage copy does this in one place — inconsistent with the term's real meaning, flagged as a copy defect)

**Owned**:
A Car the User has confirmed they physically possess. One of the two Collection membership sets.

**Wishlist**:
A Car the User wants but doesn't (yet) own. The other Collection membership set — used to avoid buying duplicates and to track what's still being looked for.

**User**:
An authenticated account (Firebase Auth) with a profile holding their Personal Ratings, Owned set, and Wishlist set. Has a public profile page.

**Admin**:
A User with elevated privileges who can add Cars to the catalog, edit existing Cars, and apply Tags in bulk. Series options are Admin-curated, not user-editable.
