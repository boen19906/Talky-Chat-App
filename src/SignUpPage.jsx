import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";
import "./SignUpPage.css"; // Import the CSS file

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  // Function to validate password strength
  const validatePassword = (password) => {
    const minLength = 6;
    if (password.length < minLength) {
      return "Password must be at least 6 characters long.";
    }
    return "";
  };

  // Function to validate username - no spaces allowed
  const validateUsername = (username) => {
    if (username.includes(" ")) {
      return "Username cannot contain spaces.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUsernameError("");
    setPasswordError("");

    try {
      // Validate username format first (no spaces)
      const usernameValidationError = validateUsername(username);
      if (usernameValidationError) {
        setUsernameError(usernameValidationError);
        return; // Stop execution if username format is invalid
      }

      // Step 1: Check if the username already exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUsernameError("Username already exists.");
        return; // Stop execution if username is taken
      }

      // Step 2: Validate password strength
      const passwordValidationError = validatePassword(password);
      if (passwordValidationError) {
        setPasswordError(passwordValidationError);
        return; // Stop execution if password is weak
      }

      // Step 3: Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Step 4: Save additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: username,
        createdAt: new Date(),
        friends: []
      });

      // Step 5: Redirect to home page or dashboard
      navigate("/");
    } catch (error) {
      setError(error.message);
      console.error("Error signing up:", error);
    }
  };

  // Validate username on input change
  const handleUsernameChange = (e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    
    // Clear previous error when user starts typing again
    if (usernameError) {
      setUsernameError("");
    }
    
    // Optionally provide real-time validation feedback
    if (newUsername.includes(" ")) {
      setUsernameError("Username cannot contain spaces.");
    }
  };

  return (
    <div className="signup-container">
      <button className="back" onClick={() => navigate("/signin")}>
            Back
      </button>
      <img src="logo.png" alt="logo" className="logo" />
      <h1>Sign Up</h1>
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
            required
          />

        <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Enter your username (no spaces)"
            required
          />
          {usernameError && <p className="input-error">{usernameError}</p>}

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
          {passwordError && <p className="input-error">{passwordError}</p>}
        </div>
        <button type="submit">Start Chatting</button>
      </form>
    </div>
  );
};

export default SignUpPage;