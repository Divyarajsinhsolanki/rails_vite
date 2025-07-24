import React, { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";

function AuthPage({ mode = "login" }) {
  const [current, setCurrent] = useState(mode);

  return current === "signup" ? (
    <Signup switchToLogin={() => setCurrent("login")} />
  ) : (
    <Login switchToSignup={() => setCurrent("signup")} />
  );
}

export default AuthPage;
