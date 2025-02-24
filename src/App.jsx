import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import SignInPage from "./SignInPage";
import HomePage from "./HomePage";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state

  // Listen for changes in the user's authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); // Set loading to false once the user state is determined
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // Show a loading spinner while checking authentication state
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Redirect to HomePage if user is authenticated, otherwise to SignUpPage */}
          <Route
            path="/"
            element={user ? <HomePage /> : <Navigate to="/signin" />}
          />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;