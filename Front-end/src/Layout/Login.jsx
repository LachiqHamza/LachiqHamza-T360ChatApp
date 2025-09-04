import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem("chat-username");
    if (storedUsername) {
      navigate("/chat");
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      setError("");
      setIsLoading(true);

      if (username && password) {
        const response = await axios.post(
          "http://localhost:8080/api/users/login",
          {
            username,
            password,
          }
        );

        if (response.status === 200) {
          localStorage.setItem("chat-username", username);
          navigate("/chat");
        }
      } else {
        setError("Please enter both username and password.");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      if (error.response && error.response.status === 401) {
        setError("Invalid username or password.");
      } else if (error.response && error.response.status === 404) {
        setError("User not found.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSuccess = (newUsername) => {
    localStorage.setItem("chat-username", newUsername);
    navigate("/chat");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      
      <div className="relative w-full max-w-md">
        {/* Animated background elements */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-white rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-purple-300 rounded-full opacity-10 animate-pulse delay-700"></div>
        
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:shadow-xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {isSignup ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-gray-600">
                {isSignup ? "Join our community today" : "Sign in to continue your conversation"}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {isSignup ? (
              <SignupForm onSignupSuccess={handleSignupSuccess} onSwitchToLogin={() => setIsSignup(false)} />
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyUp={(e) => {
                        if (e.key === "Enter") handleLogin();
                      }}
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyUp={(e) => {
                        if (e.key === "Enter") handleLogin();
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-75 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className="text-center pt-4">
                  <button
                    onClick={() => setIsSignup(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Don't have an account? Sign up
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-600">
              terrain 360 client-chat-App
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// SignupForm component (Updated to match your backend)
const SignupForm = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async () => {
    try {
      setError("");
      setIsLoading(true);

      // Validation
      if (!formData.username || !formData.name || !formData.email || !formData.password) {
        setError("All fields are required");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      // Use the correct endpoint and payload structure for your backend
      const response = await axios.post(
        "http://localhost:8080/api/users/signup",
        {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }
      );

      if (response.status === 200) {
        onSignupSuccess(formData.username);
      }
    } catch (error) {
      console.error("Error signing up:", error);
      if (error.response) {
        // Handle different error responses
        if (error.response.status === 409) {
          setError("Username or email already exists");
        } else if (error.response.data) {
          setError(error.response.data);
        } else {
          setError("An error occurred. Please try again.");
        }
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            name="username"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            name="name"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            type="email"
            name="email"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            type="password"
            name="password"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            type="password"
            name="confirmPassword"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onKeyUp={(e) => {
              if (e.key === "Enter") handleSignup();
            }}
            required
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <button
        onClick={handleSignup}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-75 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Account...
          </>
        ) : (
          "Create Account"
        )
        }
      </button>

      <div className="text-center pt-4">
        <button
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
};

export default Login;