export const getTimeFrameRange = (timeFrame) => {
  const now = new Date();

  // Today at 00:00:00
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );

  // Today at 23:59:59.999
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  // DAILY
  if (timeFrame === "daily") {
    return {
      start: todayStart,
      end: todayEnd,
      label: "Today",
    };
  }

  // WEEKLY
  if (timeFrame === "weekly") {
    const startOfWeek = new Date(todayStart);

    // Sunday = 0
    const dayOfWeek = todayStart.getDay();

    startOfWeek.setDate(
      todayStart.getDate() - dayOfWeek
    );

    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);

    endOfWeek.setDate(
      startOfWeek.getDate() + 6
    );

    endOfWeek.setHours(
      23,
      59,
      59,
      999
    );

    return {
      start: startOfWeek,
      end: endOfWeek,
      label: "This Week",
    };
  }

  // MONTHLY
  if (timeFrame === "monthly") {
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    return {
      start: startOfMonth,
      end: endOfMonth,
      label: "This Month",
    };
  }

  // YEARLY
  if (timeFrame === "yearly") {
    const startOfYear = new Date(
      now.getFullYear(),
      0,
      1,
      0,
      0,
      0,
      0
    );

    const endOfYear = new Date(
      now.getFullYear(),
      11,
      31,
      23,
      59,
      59,
      999
    );

    return {
      start: startOfYear,
      end: endOfYear,
      label: "This Year",
    };
  }

  // DEFAULT = MONTHLY
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0
  );

  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  return {
    start: startOfMonth,
    end: endOfMonth,
    label: "This Month",
  };
};


// ============================================================
// PREVIOUS TIMEFRAME
// ============================================================

export const getPreviousTimeFrameRange = (timeFrame) => {
  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );

  // PREVIOUS DAY
  if (timeFrame === "daily") {
    const yesterday = new Date(todayStart);

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    const yesterdayEnd = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59,
      999
    );

    return {
      start: yesterday,
      end: yesterdayEnd,
      label: "Yesterday",
    };
  }

  // PREVIOUS WEEK
  if (timeFrame === "weekly") {
    const currentDay = todayStart.getDay();

    const startOfLastWeek = new Date(
      todayStart
    );

    startOfLastWeek.setDate(
      todayStart.getDate() -
        currentDay -
        7
    );

    startOfLastWeek.setHours(
      0,
      0,
      0,
      0
    );

    const endOfLastWeek = new Date(
      startOfLastWeek
    );

    endOfLastWeek.setDate(
      startOfLastWeek.getDate() + 6
    );

    endOfLastWeek.setHours(
      23,
      59,
      59,
      999
    );

    return {
      start: startOfLastWeek,
      end: endOfLastWeek,
      label: "Last Week",
    };
  }

  // PREVIOUS MONTH
  if (timeFrame === "monthly") {
    const startOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
      0,
      0,
      0,
      0
    );

    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    return {
      start: startOfLastMonth,
      end: endOfLastMonth,
      label: "Last Month",
    };
  }

  // PREVIOUS YEAR
  if (timeFrame === "yearly") {
    const startOfLastYear = new Date(
      now.getFullYear() - 1,
      0,
      1,
      0,
      0,
      0,
      0
    );

    const endOfLastYear = new Date(
      now.getFullYear() - 1,
      11,
      31,
      23,
      59,
      59,
      999
    );

    return {
      start: startOfLastYear,
      end: endOfLastYear,
      label: "Last Year",
    };
  }

  // DEFAULT = PREVIOUS MONTH
  const startOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
    0,
    0,
    0,
    0
  );

  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999
  );

  return {
    start: startOfLastMonth,
    end: endOfLastMonth,
    label: "Last Month",
  };
};


// ============================================================
// CALCULATE INCOME / EXPENSE
// ============================================================

export const calculateData = (transactions = []) => {
  const totals = transactions.reduce(
    (data, transaction) => {
      const amount =
        Number(transaction.amount) || 0;

      if (
        transaction.type === "income"
      ) {
        data.income += amount;
      } else if (
        transaction.type === "expense"
      ) {
        data.expenses += amount;
      }

      return data;
    },
    {
      income: 0,
      expenses: 0,
    }
  );

  return {
    income: totals.income,
    expenses: totals.expenses,
    savings:
      totals.income -
      totals.expenses,
  };
};


// ============================================================
// CHART POINTS
// ============================================================

export const generateChartPoints = (
  timeFrame
) => {
  const now = new Date();
  const points = [];

  // DAILY
  if (timeFrame === "daily") {
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now);

      hour.setHours(
        i,
        0,
        0,
        0
      );

      points.push({
        date: hour,

        label:
          hour.toLocaleTimeString(
            [],
            {
              hour: "2-digit",
            }
          ),

        hour: i,

        isCurrent:
          i === now.getHours(),
      });
    }
  }

  // WEEKLY
  else if (timeFrame === "weekly") {
    const start = new Date(now);

    start.setDate(
      now.getDate() -
        now.getDay()
    );

    start.setHours(
      0,
      0,
      0,
      0
    );

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);

      day.setDate(
        start.getDate() + i
      );

      points.push({
        date: day,

        label:
          day.toLocaleDateString(
            "en-US",
            {
              weekday: "short",
            }
          ),

        isCurrent:
          day.getDate() ===
            now.getDate() &&
          day.getMonth() ===
            now.getMonth() &&
          day.getFullYear() ===
            now.getFullYear(),
      });
    }
  }

  // MONTHLY
  else if (timeFrame === "monthly") {
    const daysInMonth =
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();

    for (
      let i = 1;
      i <= daysInMonth;
      i++
    ) {
      const day = new Date(
        now.getFullYear(),
        now.getMonth(),
        i
      );

      points.push({
        date: day,

        label:
          day.toLocaleDateString(
            "en-US",
            {
              day: "numeric",
            }
          ),

        isCurrent:
          i === now.getDate(),
      });
    }
  }

  // YEARLY
  else if (timeFrame === "yearly") {
    for (let i = 0; i < 12; i++) {
      const month = new Date(
        now.getFullYear(),
        i,
        1
      );

      points.push({
        date: month,

        label:
          month.toLocaleDateString(
            "en-US",
            {
              month: "short",
            }
          ),

        isCurrent:
          i === now.getMonth(),
      });
    }
  }

  // DEFAULT = MONTHLY
  else {
    const daysInMonth =
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();

    for (
      let i = 1;
      i <= daysInMonth;
      i++
    ) {
      const day = new Date(
        now.getFullYear(),
        now.getMonth(),
        i
      );

      points.push({
        date: day,

        label:
          day.toLocaleDateString(
            "en-US",
            {
              day: "numeric",
            }
          ),

        isCurrent:
          i === now.getDate(),
      });
    }
  }

  return points;
};