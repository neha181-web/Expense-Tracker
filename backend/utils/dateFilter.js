const getDateRange = (range) => {
    const now = new Date();

    let start;
    let end = new Date(now);

    switch (range) {
        case "daily":
            // Today 00:00:00
            start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                0, 0, 0, 0
            );
            break;

        case "weekly": {
            // Start of current week (Sunday)
            const day = now.getDay();

            start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - day,
                0, 0, 0, 0
            );
            break;
        }

        case "monthly":
            // First day of current month
            start = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
                0, 0, 0, 0
            );
            break;

        case "yearly":
            // First day of current year
            start = new Date(
                now.getFullYear(),
                0,
                1,
                0, 0, 0, 0
            );
            break;

        default:
            // Default = monthly
            start = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
                0, 0, 0, 0
            );
    }

    return {
        start,
        end
    };
};

export default getDateRange;