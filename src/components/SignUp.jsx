// src/components/SignUp.js

import React, { useState } from "react";
import { auth, db } from "../firebase"; // 1. Import the 'db' instance
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // 2. Import firestore functions

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("User created successfully!", user);

      // 3. Create a new document in the 'users' collection
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        isAdmin: false, // Default new users to not be admins
        ownedCars: [],
        wishlist: [],
        ratings: {}, // Can store carId: rating pairs here
      });
      
    } catch (error) {
      console.error("Error signing up:", error);
      setError(error.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl">Sign Up</h2>
      <form
        onSubmit={handleSignUp}
        className="flex flex-col items-center justify-center"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="text-center text-lg w-full"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="text-center text-lg w-full"
          required
        />
        <button type="submit" className="btn bg-slate-700">
          Sign Up
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default SignUp;