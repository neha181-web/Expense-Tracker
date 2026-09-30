import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Outlet } from "react-router-dom";
import axios from "axios";

import { styles } from "../assets/dummyStyles";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

import {
  Utensils,
  Home,
  Car,
  ShoppingCart,
  Gift,
  Zap,
  Activity,
  ArrowUp,
  CreditCard,
  PiggyBank,
  DollarSign,
} from "lucide-react";

// =====================================================
// API
// =====================================================

const API_BASE = "http://localhost:4000/api";

// =====================================================
// CATEGORY ICONS
// =====================================================

const CATEGORY_ICONS = {
  Food: <Utensils className="w-4 h-4" />,
  Housing: <Home className="w-4 h-4" />,
  Transport: <Car className="w-4 h-4" />,
  Shopping: <ShoppingCart className="w-4 h-4" />,
  Entertainment: <Gift className="w-4 h-4" />,
  Utilities: <Zap className="w-4 h-4" />,
  Healthcare: <Activity className="w-4 h-4" />,
  Salary: <ArrowUp className="w-4 h-4" />,
  Freelance: <CreditCard className="w-4 h-4" />,
  Savings: <PiggyBank className="w-4 h-4" />,
};

// =====================================================
// SAFE API RESPONSE
// =====================================================

const safeArrayFromResponse = (response) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data?.transactions)) {
    return response.data.transactions;
  }

  return [];
};

// =====================================================
// FILTER TRANSACTIONS
// =====================================================

const filterTransactions = (
  transactions,
  frame
) => {
  const now = new Date();

  const today = new Date(now);

  today.setHours(0, 0, 0, 0);

  switch (frame) {
    case "daily":
      return transactions.filter(
        (transaction) =>
          new Date(transaction.date) >= today
      );

    case "weekly": {
      const startOfWeek = new Date(today);

      startOfWeek.setDate(
        startOfWeek.getDate() -
          startOfWeek.getDay()
      );

      return transactions.filter(
        (transaction) =>
          new Date(transaction.date) >=
          startOfWeek
      );
    }

    case "monthly":
      return transactions.filter(
        (transaction) => {
          const transactionDate =
            new Date(transaction.date);

          return (
            transactionDate.getMonth() ===
              now.getMonth() &&
            transactionDate.getFullYear() ===
              now.getFullYear()
          );
        }
      );

    default:
      return transactions;
  }
};

// =====================================================
// LAYOUT
// =====================================================

const Layout = ({
  onLogout,
  user,
}) => {
  const [transactions, setTransactions] =
    useState([]);

  const [timeFrame, setTimeFrame] =
    useState("monthly");

  const [loading, setLoading] =
    useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState(new Date());

  // ===================================================
  // GET AUTH TOKEN
  // ===================================================

  const getAuthToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };

  // ===================================================
  // FETCH TRANSACTIONS
  // ===================================================

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const token = getAuthToken();

      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const [
        incomeRes,
        expenseRes,
      ] = await Promise.all([
        axios.get(
          `${API_BASE}/income/get`,
          {
            headers,
          }
        ),

        axios.get(
          `${API_BASE}/expense/get`,
          {
            headers,
          }
        ),
      ]);

      const incomes =
        safeArrayFromResponse(
          incomeRes
        ).map((item) => ({
          ...item,
          type: "income",
        }));

      const expenses =
        safeArrayFromResponse(
          expenseRes
        ).map((item) => ({
          ...item,
          type: "expense",
        }));

      const allTransactions = [
        ...incomes,
        ...expenses,
      ]
        .map((transaction) => ({
          id:
            transaction._id ||
            transaction.id ||
            transaction.id_str ||
            Math.random()
              .toString(36)
              .slice(2),

          description:
            transaction.description ||
            transaction.title ||
            transaction.note ||
            "",

          amount:
            transaction.amount != null
              ? Number(
                  transaction.amount
                )
              : Number(
                  transaction.value
                ) || 0,

          date:
            transaction.date ||
            transaction.createdAt ||
            new Date().toISOString(),

          category:
            transaction.category ||
            transaction.type ||
            "Other",

          type: transaction.type,

          raw: transaction,
        }))
        .sort(
          (a, b) =>
            new Date(b.date).getTime() -
            new Date(a.date).getTime()
        );

      setTransactions(
        allTransactions
      );

      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Failed to fetch transactions:",
        error?.response ||
          error?.message ||
          error
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // ADD TRANSACTION
  // ===================================================

  const addTransaction = async (
    transaction
  ) => {
    try {
      const token = getAuthToken();

      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const endpoint =
        transaction.type === "income"
          ? "income/add"
          : "expense/add";

      await axios.post(
        `${API_BASE}/${endpoint}`,
        transaction,
        {
          headers,
        }
      );

      await fetchTransactions();

      return true;
    } catch (error) {
      console.error(
        "Failed to add transaction:",
        error?.response ||
          error?.message ||
          error
      );

      throw error;
    }
  };

  // ===================================================
  // EDIT TRANSACTION
  // ===================================================

  const editTransaction = async (
    id,
    transaction
  ) => {
    try {
      const token = getAuthToken();

      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const endpoint =
        transaction.type === "income"
          ? "income/update"
          : "expense/update";

      await axios.put(
        `${API_BASE}/${endpoint}/${id}`,
        transaction,
        {
          headers,
        }
      );

      await fetchTransactions();

      return true;
    } catch (error) {
      console.error(
        "Failed to edit transaction:",
        error?.response ||
          error?.message ||
          error
      );

      throw error;
    }
  };

  // ===================================================
  // DELETE TRANSACTION
  // ===================================================

  const deleteTransaction = async (
    id,
    type
  ) => {
    try {
      const token = getAuthToken();

      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const endpoint =
        type === "income"
          ? "income/delete"
          : "expense/delete";

      await axios.delete(
        `${API_BASE}/${endpoint}/${id}`,
        {
          headers,
        }
      );

      await fetchTransactions();

      return true;
    } catch (error) {
      console.error(
        "Failed to delete transaction:",
        error?.response ||
          error?.message ||
          error
      );

      throw error;
    }
  };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ===================================================
  // FILTERED TRANSACTIONS
  // ===================================================

  const filteredTransactions =
    useMemo(() => {
      return filterTransactions(
        transactions,
        timeFrame
      );
    }, [
      transactions,
      timeFrame,
    ]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const stats = useMemo(() => {
    const now = new Date();

    const thirtyDaysAgo =
      new Date(now);

    thirtyDaysAgo.setDate(
      now.getDate() - 30
    );

    const last30DaysTransactions =
      transactions.filter(
        (transaction) =>
          new Date(transaction.date) >=
          thirtyDaysAgo
      );

    const last30DaysIncome =
      last30DaysTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            "income"
        )
        .reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.amount
            ),
          0
        );

    const last30DaysExpenses =
      last30DaysTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            "expense"
        )
        .reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.amount
            ),
          0
        );

    const allTimeIncome =
      transactions
        .filter(
          (transaction) =>
            transaction.type ===
            "income"
        )
        .reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.amount
            ),
          0
        );

    const allTimeExpenses =
      transactions
        .filter(
          (transaction) =>
            transaction.type ===
            "expense"
        )
        .reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.amount
            ),
          0
        );

    const savingsRate =
      last30DaysIncome > 0
        ? Math.round(
            ((last30DaysIncome -
              last30DaysExpenses) /
              last30DaysIncome) *
              100
          )
        : 0;

    const last60DaysAgo =
      new Date(now);

    last60DaysAgo.setDate(
      now.getDate() - 60
    );

    const previous30DaysTransactions =
      transactions.filter(
        (transaction) => {
          const date = new Date(
            transaction.date
          );

          return (
            date >= last60DaysAgo &&
            date < thirtyDaysAgo
          );
        }
      );

    const previous30DaysExpenses =
      previous30DaysTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            "expense"
        )
        .reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.amount
            ),
          0
        );

    const expenseChange =
      previous30DaysExpenses > 0
        ? Math.round(
            ((last30DaysExpenses -
              previous30DaysExpenses) /
              previous30DaysExpenses) *
              100
          )
        : 0;

    return {
      totalTransactions:
        transactions.length,

      last30DaysIncome,

      last30DaysExpenses,

      last30DaysSavings:
        last30DaysIncome -
        last30DaysExpenses,

      allTimeIncome,

      allTimeExpenses,

      allTimeSavings:
        allTimeIncome -
        allTimeExpenses,

      last30DaysCount:
        last30DaysTransactions.length,

      savingsRate,

      expenseChange,
    };
  }, [transactions]);

  // ===================================================
  // TIMEFRAME LABEL
  // ===================================================

  const timeFrameLabel =
    useMemo(() => {
      if (timeFrame === "daily") {
        return "Today";
      }

      if (timeFrame === "weekly") {
        return "This Week";
      }

      return "This Month";
    }, [timeFrame]);

  // ===================================================
  // OUTLET CONTEXT
  // ===================================================

  const outletContext = {
    transactions:
      filteredTransactions,

    addTransaction,

    editTransaction,

    deleteTransaction,

    refreshTransactions:
      fetchTransactions,

    timeFrame,

    setTimeFrame,

    lastUpdated,

    loading,

    stats,

    timeFrameLabel,
  };

  // ===================================================
  // MAIN LAYOUT
  // ===================================================

  return (
    <div className={styles.layout.root}>

      {/* =========================
          NAVBAR
      ========================== */}

      <Navbar
        user={user}
        onLogout={onLogout}
      />

      {/* =========================
          SIDEBAR
      ========================== */}

      <Sidebar
        user={user}
        isCollapsed={
          sidebarCollapsed
        }
        setIsCollapsed={
          setSidebarCollapsed
        }
      />

      {/* =========================
          MAIN CONTENT
      ========================== */}

      <main
        className={`${styles.layout.mainContainer(
          sidebarCollapsed
        )} min-w-0 w-full`}
      >

        {/* 
          IMPORTANT:
          Dashboard / Income / Expense / Profile
          will render here through Outlet.
        */}

        <Outlet
          context={outletContext}
        />

      </main>

    </div>
  );
};

export default Layout;