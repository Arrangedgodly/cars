// src/components/SignIn.js

import React, { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("User signed in successfully!", user);

      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        console.log("User document not found, creating one...");
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          isAdmin: false,
          ownedCars: [],
          wishlist: [],
          ratings: {},
        });
      }

    } catch (error) {
      console.error("Error signing in:", error);
      setError("Failed to sign in. Please check your email and password.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl">Sign In</h2>
      <form
        onSubmit={handleSignIn}
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
          Sign In
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default SignIn;
