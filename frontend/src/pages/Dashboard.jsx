import React, { useEffect, useMemo, useState } from "react";

import AddTransactionModal from "../components/Add";
import GaugeCard from "../components/GaugeCard";

import {
  dashboardStyles,
  trendStyles,
  chartStyles,
} from "../assets/dummyStyles";

import {
  GAUGE_COLORS,
  COLORS,
  INCOME_CATEGORY_ICONS,
  EXPENSE_CATEGORY_ICONS,
} from "../assets/Color";

import { useOutletContext } from "react-router-dom";

import {
  getTimeFrameRange,
  getPreviousTimeFrameRange,
  calculateData,
} from "../components/Helpers";

import axios from "axios";

import {
  ArrowDown,
  BarChart2,
  ChevronDown,
  TrendingUp as ProfitIcon,
  PieChart as PieChartIcon,
  ChevronUp,
  DollarSign,
  PiggyBank,
  ShoppingCart,
  TrendingDown,
  Plus,
  Wallet,
  TrendingUp,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

// API base URL
const API_BASE = "https://expense-tracker-backend-rla5.onrender.com/api";

// Get authentication header
const getAuthHeader = () => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

// Convert date to ISO timeline
function toIsoWithClientTime(dateValue) {
  if (!dateValue) {
    return new Date().toISOString();
  }

  if (typeof dateValue === "string" && dateValue.length === 10) {
    const now = new Date();
    const hhmmss = now.toTimeString().slice(0, 8);

    const combined = new Date(`${dateValue}T${hhmmss}`);

    return combined.toISOString();
  }

  try {
    return new Date(dateValue).toISOString();
  } catch (err) {
    return new Date().toISOString();
  }
}

// Financial Card Component
const FinancialCard = ({
  icon,
  label,
  value,
  additionalContent,
}) => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
            {icon}
            {label}
          </div>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {value}
          </p>

          {additionalContent}
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const {
    transactions: outletTransactions = [],
    timeFrame = "monthly",
    setTimeFrame = () => {},
    refreshTransactions,
  } = useOutletContext();

  const [showModal, setShowModal] = useState(false);
  const [gaugeData, setGaugeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overviewMeta, setOverviewMeta] = useState({});
  const [showAllIncome, setShowAllIncome] = useState(false);
  const [showAllExpense, setShowAllExpense] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense",
    category: "Food",
  });

  // Current timeframe
  const timeFrameRange = useMemo(
    () => getTimeFrameRange(timeFrame),
    [timeFrame]
  );

  // Previous timeframe
  const prevTimeFrameRange = useMemo(
    () => getPreviousTimeFrameRange(timeFrame),
    [timeFrame]
  );

  // Check whether date is inside selected range
  const isDateInRange = (date, start, end) => {
    if (!date) return false;

    const transactionDate = new Date(date);
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (
      Number.isNaN(transactionDate.getTime()) ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return false;
    }

    transactionDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return (
      transactionDate >= startDate &&
      transactionDate <= endDate
    );
  };

  // Filter current transactions
  const filteredTransactions = useMemo(
    () =>
      (outletTransactions || []).filter((transaction) =>
        isDateInRange(
          transaction.date,
          timeFrameRange.start,
          timeFrameRange.end
        )
      ),
    [outletTransactions, timeFrameRange]
  );

  // Filter previous transactions
  const prevFilteredTransactions = useMemo(
    () =>
      (outletTransactions || []).filter((transaction) =>
        isDateInRange(
          transaction.date,
          prevTimeFrameRange.start,
          prevTimeFrameRange.end
        )
      ),
    [outletTransactions, prevTimeFrameRange]
  );

  // Calculate current timeframe data
  const currentTimeFrameData = useMemo(() => {
    const data = calculateData(filteredTransactions);

    return {
      ...data,
      savings: data.income - data.expenses,
    };
  }, [filteredTransactions]);

  // Calculate previous timeframe data
  const prevTimeFrameData = useMemo(() => {
    const data = calculateData(prevFilteredTransactions);

    return {
      ...data,
      savings: data.income - data.expenses,
    };
  }, [prevFilteredTransactions]);

  // =========================================================
  // GAUGES
  // Daily / Weekly / Monthly gauges are calculated ONLY
  // from the currently filtered transactions.
  // =========================================================
  useEffect(() => {
    const income = Number(currentTimeFrameData.income || 0);
    const expenses = Number(currentTimeFrameData.expenses || 0);
    const savings = Number(currentTimeFrameData.savings || 0);

    const maxValues = {
      income: Math.max(income, 5000),
      expenses: Math.max(expenses, 3000),
      savings: Math.max(Math.abs(savings), 2000),
    };

    setGaugeData([
      {
        name: "Income",
        value: income,
        max: maxValues.income,
      },
      {
        name: "Spent",
        value: expenses,
        max: maxValues.expenses,
      },
      {
        name: "Savings",
        value: savings,
        max: maxValues.savings,
      },
    ]);
  }, [currentTimeFrameData]);

  // =========================================================
  // DISPLAY VALUES
  // =========================================================

  const displayIncome = currentTimeFrameData.income;

  const displayExpenses = currentTimeFrameData.expenses;

  const displaySavings = currentTimeFrameData.savings;

  // Expense change percentage
  const expenseChange = useMemo(() => {
    const prev = Number(prevTimeFrameData.expenses || 0);
    const curr = Number(displayExpenses || 0);

    if (!prev) {
      if (!curr) return 0;
      return 100;
    }

    return Math.round(((curr - prev) / prev) * 100);
  }, [prevTimeFrameData, displayExpenses]);

  // =========================================================
  // EXPENSE DISTRIBUTION PIE CHART
  // =========================================================

  const financialOverviewData = useMemo(() => {
    const categories = {};

    filteredTransactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        const category = transaction.category || "Other";

        categories[category] =
          (categories[category] || 0) +
          Number(transaction.amount || 0);
      }
    });

    return Object.keys(categories).map((category) => ({
      name: category,
      value: Math.round(categories[category]),
    }));
  }, [filteredTransactions]);

  // =========================================================
  // RECENT TRANSACTIONS
  // =========================================================

  const serverRecent = overviewMeta.recentTransactions || [];

  const serverRecentIncome = serverRecent
    .filter(
      (transaction) => transaction.type === "income"
    )
    .sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    );

  const serverRecentExpense = serverRecent
    .filter(
      (transaction) => transaction.type === "expense"
    )
    .sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    );

  // Income transactions
  const incomeTransactions = useMemo(
    () =>
      filteredTransactions
        .filter(
          (transaction) =>
            transaction.type === "income"
        )
        .sort(
          (a, b) =>
            new Date(b.date) -
            new Date(a.date)
        ),
    [filteredTransactions]
  );

  // Expense transactions
  const expenseTransactions = useMemo(
    () =>
      filteredTransactions
        .filter(
          (transaction) =>
            transaction.type === "expense"
        )
        .sort(
          (a, b) =>
            new Date(b.date) -
            new Date(a.date)
        ),
    [filteredTransactions]
  );

  // Use filtered transactions for all timeframes
  const incomeListForDisplay = incomeTransactions;

  const expenseListForDisplay = expenseTransactions;

  const displayedIncome = showAllIncome
    ? incomeListForDisplay
    : incomeListForDisplay.slice(0, 3);

  const displayedExpense = showAllExpense
    ? expenseListForDisplay
    : expenseListForDisplay.slice(0, 3);

  // =========================================================
  // FETCH DASHBOARD OVERVIEW
  // =========================================================

  const fetchDashboardOverview = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE}/dashboard`,
        {
          headers: getAuthHeader(),
        }
      );

      if (res?.data?.success) {
        const data = res.data.data;

        const recent = (
          data.recentTransactions || []
        ).map((item) => {
          const typeFromServer =
            item.type ||
            (item.category
              ? "expense"
              : "income");

          const amountNum =
            Number(item.amount) || 0;

          const isoDate = item.date
            ? new Date(item.date).toISOString()
            : item.createdAt
            ? new Date(
                item.createdAt
              ).toISOString()
            : new Date().toISOString();

          return {
            id:
              item._id ||
              item.id ||
              Date.now() + Math.random(),

            date: isoDate,

            description:
              item.description ||
              item.note ||
              item.title ||
              (typeFromServer === "income"
                ? item.source || "Income"
                : item.category || "Expense"),

            amount: amountNum,

            type: typeFromServer,

            category:
              item.category ||
              (typeFromServer === "income"
                ? "Salary"
                : "Other"),

            raw: item,
          };
        });

        setOverviewMeta((prev) => ({
          ...prev,

          monthlyIncome:
            Number(data.monthlyIncome || 0),

          monthlyExpense:
            Number(data.monthlyExpense || 0),

          savings:
            typeof data.savings !== "undefined"
              ? Number(data.savings)
              : Number(data.monthlyIncome || 0) -
                Number(data.monthlyExpense || 0),

          savingsRate:
            typeof data.savingsRate !== "undefined"
              ? Number(data.savingsRate)
              : null,

          spendByCategory:
            data.spendByCategory || {},

          expenseDistribution:
            data.expenseDistribution || [],

          recentTransactions: recent,
        }));
      } else {
        console.warn(
          "Dashboard endpoint returned success:false",
          res?.data
        );
      }
    } catch (err) {
      console.error(
        "Failed to fetch dashboard overview:",
        err?.response ||
          err.message ||
          err
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard when timeframe changes
  useEffect(() => {
    fetchDashboardOverview();
  }, [timeFrame]);

  // =========================================================
  // ADD TRANSACTION
  // =========================================================

  const handleAddTransaction = async () => {
    if (
      !newTransaction.description ||
      !newTransaction.amount
    ) {
      return;
    }

    const payload = {
      date: toIsoWithClientTime(
        newTransaction.date
      ),

      description:
        newTransaction.description,

      amount:
        parseFloat(newTransaction.amount),

      category:
        newTransaction.category,
    };

    try {
      setLoading(true);

      if (newTransaction.type === "income") {
        await axios.post(
          `${API_BASE}/income/add`,
          payload,
          {
            headers: getAuthHeader(),
          }
        );
      } else {
        await axios.post(
          `${API_BASE}/expense/add`,
          payload,
          {
            headers: getAuthHeader(),
          }
        );
      }

      if (refreshTransactions) {
        await refreshTransactions();
      }

      await fetchDashboardOverview();

      setNewTransaction({
        date:
          new Date()
            .toISOString()
            .split("T")[0],

        description: "",

        amount: "",

        type: "expense",

        category: "Food",
      });

      setShowModal(false);
    } catch (err) {
      console.error(
        "Failed to add transaction:",
        err?.response ||
          err.message ||
          err
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={dashboardStyles.container}>

      {/* Header */}
      <div className={dashboardStyles.headerContainer}>
        <div className={dashboardStyles.headerContent}>
          <div>
            <h1 className={dashboardStyles.headerTitle}>
              Finance Dashboard
            </h1>

            <p className={dashboardStyles.headerSubtitle}>
              Track your income and expenses
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className={dashboardStyles.addButton}
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>

        {/* Time Frame Buttons */}
        <div
          className={
            dashboardStyles.timeFrameWrapper
          }
        >
          {["daily", "weekly", "monthly"].map(
            (frame) => (
              <button
                key={frame}
                onClick={() =>
                  setTimeFrame(frame)
                }
                className={dashboardStyles.timeFrameButton(
                  timeFrame === frame
                )}
              >
                {frame.charAt(0).toUpperCase() +
                  frame.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className={dashboardStyles.summaryGrid}>

        {/* Total Balance */}
        <FinancialCard
          icon={
            <div
              className={
                dashboardStyles.walletIconContainer
              }
            >
              <Wallet className="w-5 h-5 text-teal-600" />
            </div>
          }
          label="Total Balance"
          value={`$${Math.round(
            displayIncome - displayExpenses
          ).toLocaleString()}`}
          additionalContent={
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span
                className={
                  dashboardStyles.balanceBadge
                }
              >
                +$
                {Math.round(
                  displayIncome
                ).toLocaleString()}
              </span>

              <span
                className={
                  dashboardStyles.expenseBadge
                }
              >
                -$
                {Math.round(
                  displayExpenses
                ).toLocaleString()}
              </span>
            </div>
          }
        />

        {/* Expenses */}
        <FinancialCard
          icon={
            <div
              className={
                dashboardStyles.arrowDownIconContainer
              }
            >
              <ArrowDown className="w-5 h-5 text-orange-600" />
            </div>
          }
          label={`${timeFrameRange.label} Expenses`}
          value={`$${Math.round(
            displayExpenses
          ).toLocaleString()}`}
          additionalContent={
            <div
              className={`mt-2 text-xs flex items-center gap-1 ${
                expenseChange >= 0
                  ? trendStyles.positive
                  : trendStyles.negative
              }`}
            >
              {expenseChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}

              <span>
                {Math.abs(expenseChange)}%{" "}
                {expenseChange >= 0
                  ? "increase"
                  : "decrease"}{" "}
                from {prevTimeFrameRange.label}
              </span>
            </div>
          }
        />

        {/* Savings */}
        <FinancialCard
          icon={
            <div
              className={
                dashboardStyles.PiggyBankIconContainer
              }
            >
              <PiggyBank className="w-5 h-5 text-cyan-600" />
            </div>
          }
          label={`${timeFrameRange.label} Savings`}
          value={`$${Math.round(
            displaySavings
          ).toLocaleString()}`}
          additionalContent={
            <div className="mt-2 text-xs text-cyan-600 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <BarChart2 className="w-4 h-4" />

                <span>
                  {displayIncome > 0
                    ? Math.round(
                        (displaySavings /
                          displayIncome) *
                          100
                      )
                    : 0}
                  % of income
                </span>
              </div>

              {typeof overviewMeta.savingsRate ===
                "number" && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    overviewMeta.savingsRate < 0
                      ? trendStyles.negativeRate
                      : trendStyles.positiveRate
                  }`}
                >
                  {overviewMeta.savingsRate}%
                </span>
              )}
            </div>
          }
        />
      </div>

      {/* Gauges */}
      <div className={dashboardStyles.gaugeGrid}>
        {gaugeData.map((gauge) => (
          <GaugeCard
            key={gauge.name}
            gauge={gauge}
            colorInfo={GAUGE_COLORS[gauge.name]}
            timeFrameLabel={
              timeFrameRange.label
            }
          />
        ))}
      </div>

      {/* Expense Distribution */}
      <div
        className={`${dashboardStyles.pieChartContainer} w-full min-w-0`}
      >
        <div
          className={
            dashboardStyles.pieChartHeader
          }
        >
          <h3
            className={
              dashboardStyles.pieChartTitle
            }
          >
            <PieChartIcon className="w-6 h-6 text-teal-500" />

            Expense Distribution

            <span
              className={
                dashboardStyles.listSubtitle
              }
            >
              {" "}
              ({timeFrameRange.label})
            </span>
          </h3>
        </div>

        <div className="w-full min-w-0 h-80">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={1}
          >
            <PieChart
              className={chartStyles.pieChart}
            >
              <Pie
                data={financialOverviewData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${Math.round(
                    percent * 100
                  )}%`
                }
                labelLine={false}
              >
                {financialOverviewData.map(
                  (entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        COLORS[
                          index % COLORS.length
                        ]
                      }
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  )
                )}
              </Pie>

              <Tooltip
                formatter={(value) => [
                  `$${Math.round(
                    value
                  ).toLocaleString()}`,
                  "Amount",
                ]}
                contentStyle={
                  dashboardStyles.tooltipContent
                }
                itemStyle={
                  dashboardStyles.tooltipItem
                }
              />

              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(v) => (
                  <span
                    className={
                      dashboardStyles.legendText
                    }
                  >
                    {v}
                  </span>
                )}
                iconSize={10}
                iconType="circle"
                wrapperStyle={
                  dashboardStyles.legendWrapper
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lists */}
      <div className={dashboardStyles.listsGrid}>

        {/* Income Column */}
        <div
          className={
            dashboardStyles.listContainer
          }
        >
          <div
            className={
              dashboardStyles.listHeader
            }
          >
            <h3
              className={
                dashboardStyles.listTitle
              }
            >
              <ProfitIcon className="w-6 h-6 text-green-500" />

              Recent Income{" "}

              <span
                className={
                  dashboardStyles.listSubtitle
                }
              >
                ({timeFrameRange.label})
              </span>
            </h3>

            <span
              className={
                dashboardStyles.incomeCountBadge
              }
            >
              {incomeListForDisplay.length} records
            </span>
          </div>

          <div
            className={
              dashboardStyles.transactionList
            }
          >
            {displayedIncome.map(
              (transaction) => {
                const IconComponent =
                  INCOME_CATEGORY_ICONS[
                    transaction.category
                  ] ||
                  INCOME_CATEGORY_ICONS.Other;

                return (
                  <div
                    key={transaction.id}
                    className={
                      dashboardStyles.incomeTransactionItem
                    }
                  >
                    <div
                      className={
                        dashboardStyles.transactionContent
                      }
                    >
                      <div
                        className={
                          dashboardStyles.incomeIconContainer
                        }
                      >
                        {IconComponent}
                      </div>

                      <div>
                        <p
                          className={
                            dashboardStyles.transactionDescription
                          }
                        >
                          {transaction.description}
                        </p>

                        <p
                          className={
                            dashboardStyles.transactionCategory
                          }
                        >
                          {transaction.category}
                        </p>
                      </div>
                    </div>

                    <div
                      className={
                        dashboardStyles.transactionAmount
                      }
                    >
                      <p
                        className={
                          dashboardStyles.incomeAmount
                        }
                      >
                        +$
                        {Math.abs(
                          transaction.amount
                        ).toLocaleString()}
                      </p>

                      <p
                        className={
                          dashboardStyles.transactionDate
                        }
                      >
                        {new Date(
                          transaction.date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              }
            )}

            {incomeListForDisplay.length === 0 && (
              <div
                className={
                  dashboardStyles.emptyState
                }
              >
                <div
                  className={dashboardStyles.emptyIconContainer(
                    "bg-green-50"
                  )}
                >
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>

                <p
                  className={
                    dashboardStyles.emptyText
                  }
                >
                  No income transactions
                </p>
              </div>
            )}

            {incomeListForDisplay.length > 3 && (
              <div
                className={
                  dashboardStyles.viewAllContainer
                }
              >
                <button
                  onClick={() =>
                    setShowAllIncome(
                      !showAllIncome
                    )
                  }
                  className={
                    dashboardStyles.viewAllButton
                  }
                >
                  {showAllIncome ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All Income (
                      {incomeListForDisplay.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expense Column */}
        <div
          className={
            dashboardStyles.listContainer
          }
        >
          <div
            className={
              dashboardStyles.listHeader
            }
          >
            <h3 className="text-lg md:text-xl lg:text-xl xl:text-xl font-bold text-gray-800 md:mt-3 mt-3 flex items-center gap-3">
              <ArrowDown className="w-6 h-6 text-orange-500" />

              Recent Expenses{" "}

              <span
                className={
                  dashboardStyles.listSubtitle
                }
              >
                ({timeFrameRange.label})
              </span>
            </h3>

            <span
              className={
                dashboardStyles.expenseCountBadge
              }
            >
              {expenseListForDisplay.length} records
            </span>
          </div>

          <div
            className={
              dashboardStyles.transactionList
            }
          >
            {displayedExpense.map(
              (transaction) => {
                const IconComponent =
                  EXPENSE_CATEGORY_ICONS[
                    transaction.category
                  ] ||
                  EXPENSE_CATEGORY_ICONS.Other;

                return (
                  <div
                    key={transaction.id}
                    className={
                      dashboardStyles.expenseTransactionItem
                    }
                  >
                    <div
                      className={
                        dashboardStyles.transactionContent
                      }
                    >
                      <div
                        className={
                          dashboardStyles.expenseIconContainer
                        }
                      >
                        {IconComponent}
                      </div>

                      <div>
                        <p
                          className={
                            dashboardStyles.transactionDescription
                          }
                        >
                          {transaction.description}
                        </p>

                        <p
                          className={
                            dashboardStyles.transactionCategory
                          }
                        >
                          {transaction.category}
                        </p>
                      </div>
                    </div>

                    <div
                      className={
                        dashboardStyles.transactionAmount
                      }
                    >
                      <p
                        className={
                          dashboardStyles.expenseAmount
                        }
                      >
                        -$
                        {Math.abs(
                          transaction.amount
                        ).toLocaleString()}
                      </p>

                      <p
                        className={
                          dashboardStyles.transactionDate
                        }
                      >
                        {new Date(
                          transaction.date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              }
            )}

            {expenseListForDisplay.length === 0 && (
              <div
                className={
                  dashboardStyles.emptyState
                }
              >
                <div
                  className={dashboardStyles.emptyIconContainer(
                    "bg-orange-50"
                  )}
                >
                  <ShoppingCart className="w-8 h-8 text-orange-400" />
                </div>

                <p
                  className={
                    dashboardStyles.emptyText
                  }
                >
                  No expense transactions
                </p>
              </div>
            )}

            {expenseListForDisplay.length > 3 && (
              <div
                className={
                  dashboardStyles.viewAllContainer
                }
              >
                <button
                  onClick={() =>
                    setShowAllExpense(
                      !showAllExpense
                    )
                  }
                  className={
                    dashboardStyles.viewAllButton
                  }
                >
                  {showAllExpense ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All Expenses (
                      {expenseListForDisplay.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddTransactionModal
        showModal={showModal}
        setShowModal={setShowModal}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        handleAddTransaction={handleAddTransaction}
        loading={loading}
      />
    </div>
  );
};

export default Dashboard;