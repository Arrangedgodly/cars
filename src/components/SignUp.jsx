// src/components/SignUp.js

import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("User created successfully!", user);

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        isAdmin: false,
        ownedCars: [],
        wishlist: [],
        ratings: {},
      });
      
    } catch (error) {
      console.error("Error signing up:", error);
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full sm:w-72">
      <h2 className="font-fancy text-xs uppercase tracking-wider text-base-content/60">
        Sign Up
      </h2>
      <form onSubmit={handleSignUp} className="flex flex-col gap-3">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input input-bordered w-full"
            required
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input input-bordered w-full"
            required
          />
        </div>
        <button type="submit" className="btn btn-gradient-secondary w-full mt-1">
          Sign Up
        </button>
      </form>
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  );
};

export default SignUp;