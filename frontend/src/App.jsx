import React, { useEffect, useState } from "react";
import {
  Route,
  Routes,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import axios from "axios";

import Income from "./pages/income";
import Signup from "./components/Signup";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import Expense from "./pages/Expense";
import Profile from "./pages/Profile";

// Backend URL
const API_URL = "https://expense-tracker-backend-rla5.onrender.com/api";

// Get transactions from localStorage
const getTransactionsFromStorage = () => {
  const saved = localStorage.getItem("transactions");

  try {
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error parsing transactions:", error);
    return [];
  }
};

// ===============================
// Protected Route
// ===============================
const ProtectedRoute = ({ user, children }) => {
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");

  const hasToken = localToken || sessionToken;

  if (!user || !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ===============================
// Scroll to Top
// ===============================
const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  return null;
};

// ===============================
// App
// ===============================
const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  // ===============================
  // Save Authentication Information
  // ===============================
  const persistAuth = (
    userObj,
    tokenStr,
    remember = false
  ) => {
    try {
      if (!userObj || !tokenStr) {
        setUser(null);
        setToken(null);
        return;
      }

      if (remember) {
        // Save in localStorage
        localStorage.setItem(
          "user",
          JSON.stringify(userObj)
        );

        localStorage.setItem(
          "token",
          tokenStr
        );

        // Remove old session data
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      } else {
        // Save in sessionStorage
        sessionStorage.setItem(
          "user",
          JSON.stringify(userObj)
        );

        sessionStorage.setItem(
          "token",
          tokenStr
        );

        // Remove old localStorage data
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }

      setUser(userObj);
      setToken(tokenStr);
    } catch (err) {
      console.error(
        "persistAuth error:",
        err
      );
    }
  };

  // ===============================
  // Clear Authentication
  // ===============================
  const clearAuth = () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    } catch (err) {
      console.error(
        "clearAuth error:",
        err
      );
    }

    setUser(null);
    setToken(null);
  };

  // ===============================
  // Update User Data
  // ===============================
  const updateUserData = (updatedUser) => {
    setUser(updatedUser);

    const localToken =
      localStorage.getItem("token");

    const sessionToken =
      sessionStorage.getItem("token");

    try {
      if (localToken) {
        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );
      } else if (sessionToken) {
        sessionStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );
      }
    } catch (err) {
      console.error(
        "Error updating stored user:",
        err
      );
    }
  };

  // ===============================
  // Load Authentication on App Start
  // ===============================
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        // Get stored data
        const localUserRaw =
          localStorage.getItem("user");

        const sessionUserRaw =
          sessionStorage.getItem("user");

        const localToken =
          localStorage.getItem("token");

        const sessionToken =
          sessionStorage.getItem("token");

        // Get user
        let storedUser = null;

        if (localUserRaw) {
          try {
            storedUser = JSON.parse(
              localUserRaw
            );
          } catch (error) {
            console.error(
              "Invalid local user data:",
              error
            );

            localStorage.removeItem("user");
          }
        }

        if (!storedUser && sessionUserRaw) {
          try {
            storedUser = JSON.parse(
              sessionUserRaw
            );
          } catch (error) {
            console.error(
              "Invalid session user data:",
              error
            );

            sessionStorage.removeItem("user");
          }
        }

        // Get token
        const storedToken =
          localToken ||
          sessionToken ||
          null;

        // Remember where token came from
        const tokenFromLocal =
          !!localToken;

        // =====================================
        // CASE 1:
        // User + Token already available
        // =====================================
        if (storedUser && storedToken) {
          setUser(storedUser);
          setToken(storedToken);

          return;
        }

        // =====================================
        // CASE 2:
        // Token available but user missing
        // =====================================
        if (storedToken && !storedUser) {
          try {
            const res = await axios.get(
              `${API_URL}/api/user/me`,
              {
                headers: {
                  Authorization:
                    `Bearer ${storedToken}`,
                },
              }
            );

            const profile = res.data;

            persistAuth(
              profile,
              storedToken,
              tokenFromLocal
            );

            return;
          } catch (fetchErr) {
            console.warn(
              "Could not fetch profile with stored token:",
              fetchErr
            );

            clearAuth();

            return;
          }
        }

        // =====================================
        // CASE 3:
        // No authentication data
        // =====================================
        clearAuth();
      } catch (err) {
        console.error(
          "Error bootstrapping auth:",
          err
        );

        clearAuth();
      } finally {
        // Load transactions
        try {
          setTransactions(
            getTransactionsFromStorage()
          );
        } catch (txErr) {
          console.error(
            "Error loading transactions:",
            txErr
          );
        }

        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  // ===============================
  // Save Transactions
  // ===============================
  useEffect(() => {
    try {
      localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
      );
    } catch (err) {
      console.error(
        "Error saving transactions:",
        err
      );
    }
  }, [transactions]);

  // ===============================
  // Login
  // ===============================
  const handleLogin = (
    userData,
    remember = false,
    tokenFromApi = null
  ) => {
    persistAuth(
      userData,
      tokenFromApi,
      remember
    );

    navigate("/");
  };

  // ===============================
  // Signup
  // ===============================
  const handleSignup = (
    userData,
    remember = false,
    tokenFromApi = null
  ) => {
    persistAuth(
      userData,
      tokenFromApi,
      remember
    );

    navigate("/");
  };

  // ===============================
  // Logout
  // ===============================
  const handleLogout = () => {
    clearAuth();

    navigate("/login", {
      replace: true,
    });
  };

  // ===============================
  // Add Transaction
  // ===============================
  const addTransaction = (
    newTransaction
  ) => {
    setTransactions((prev) => [
      newTransaction,
      ...prev,
    ]);
  };

  // ===============================
  // Edit Transaction
  // ===============================
  const editTransaction = (
    id,
    updatedTransaction
  ) => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id
          ? {
              ...updatedTransaction,
              id,
            }
          : transaction
      )
    );
  };

  // ===============================
  // Delete Transaction
  // ===============================
  const deleteTransaction = (id) => {
    setTransactions((prev) =>
      prev.filter(
        (transaction) =>
          transaction.id !== id
      )
    );
  };

  // ===============================
  // Refresh Transactions
  // ===============================
  const refreshTransactions = () => {
    setTransactions(
      getTransactionsFromStorage()
    );
  };

  // ===============================
  // Loading Screen
  // ===============================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>

          <p className="mt-4 text-gray-600">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // ===============================
  // Routes
  // ===============================
  return (
    <>
      <ScrollToTop />

      <Routes>

        {/* =========================
            LOGIN
        ========================== */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to="/"
                replace
              />
            ) : (
              <Login
                onLogin={handleLogin}
              />
            )
          }
        />

        {/* =========================
            SIGNUP
        ========================== */}
        <Route
          path="/signup"
          element={
            <Signup
              onSignup={handleSignup}
            />
          }
        />

        {/* =========================
            PROTECTED ROUTES
        ========================== */}
        <Route
          element={
            <ProtectedRoute user={user}>
              <Layout
                user={user}
                onLogout={handleLogout}
                transactions={transactions}
                addTransaction={
                  addTransaction
                }
                editTransaction={
                  editTransaction
                }
                deleteTransaction={
                  deleteTransaction
                }
                refreshTransactions={
                  refreshTransactions
                }
              />
            </ProtectedRoute>
          }
        >

          {/* =========================
              DASHBOARD
          ========================== */}
          <Route
            path="/"
            element={
              <Dashboard
                transactions={
                  transactions
                }
                addTransaction={
                  addTransaction
                }
                editTransaction={
                  editTransaction
                }
                deleteTransaction={
                  deleteTransaction
                }
                refreshTransactions={
                  refreshTransactions
                }
              />
            }
          />

          {/* =========================
              INCOME
          ========================== */}
          <Route
            path="/income"
            element={
              <Income
                transactions={
                  transactions
                }
                addTransaction={
                  addTransaction
                }
                editTransaction={
                  editTransaction
                }
                deleteTransaction={
                  deleteTransaction
                }
                refreshTransactions={
                  refreshTransactions
                }
              />
            }
          />

          {/* =========================
              EXPENSE
          ========================== */}
          <Route
            path="/expense"
            element={
              <Expense
                transactions={
                  transactions
                }
                addTransaction={
                  addTransaction
                }
                editTransaction={
                  editTransaction
                }
                deleteTransaction={
                  deleteTransaction
                }
                refreshTransactions={
                  refreshTransactions
                }
              />
            }
          />

          {/* =========================
              PROFILE
          ========================== */}
          <Route
            path="/profile"
            element={
              <Profile
                user={user}
                onUpdateProfile={
                  updateUserData
                }
                onLogout={
                  handleLogout
                }
              />
            }
          />

        </Route>

        {/* =========================
            UNKNOWN ROUTES
        ========================== */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                user
                  ? "/"
                  : "/login"
              }
              replace
            />
          }
        />

      </Routes>
    </>
  );
};

export default App;