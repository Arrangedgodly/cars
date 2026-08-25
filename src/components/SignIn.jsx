// src/components/SignIn.js

import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Profile lookup and repair happen in ensureUserProfile(), driven by the
      // auth-state listener in App, so it covers every sign-in path at once.
    } catch (error) {
      console.error("Error signing in:", error);
      setError("Failed to sign in. Please check your email and password.");
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full sm:w-72">
      <h2 className="font-fancy text-xs uppercase tracking-wider text-base-content/60">
        Sign In
      </h2>
      <form onSubmit={handleSignIn} className="flex flex-col gap-3">
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
        <button type="submit" className="btn btn-primary btn-gradient-primary w-full mt-1">
          Sign In
        </button>
      </form>
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  );
};

export default SignIn;
