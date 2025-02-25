import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth"; // Use signInWithEmailAndPassword
import { auth } from "./firebase"; // Only auth is needed for sign-in
import { useNavigate } from "react-router-dom";
import "./SignInPage.css"; // Import the CSS file (you can rename it)

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

     // Manual validation
     if (email=="" || password=="") {
      setError("All fields must be filled out.");
      return;
    }

    try {
      // Step 1: Sign in the user with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Step 2: Redirect to home page or dashboard
      navigate("/");
    } catch (error) {
      setError(error.message);
      console.error("Error signing in:", error);
    }
  };

  return (
    <div className="signin-container">
      
      <img src="logo.png" alt="logo" className="logo" />
      <h1>Sign In</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>
        <button className="signin" onClick={handleSubmit}>Sign In</button>
        <button className="signup" onClick={() => navigate("/signup")}>Sign Up</button>
      </form>
    </div>
  );
};

export default SignInPage;