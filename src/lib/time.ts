/** Get UTC offset in hours for an IANA timezone (e.g. America/New_York → -5). */
export function getOffsetHoursForTimezone(timeZone: string): number {
    try {
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone,
            timeZoneName: "longOffset",
        });
        const parts = formatter.formatToParts(new Date());
        const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
        const match = tzName.match(/GMT([+-])(\d+)(?::(\d+))?/);
        if (!match) return 0;
        const [, sign, h, m] = match;
        const hours = parseInt(h, 10) + (parseInt(m ?? "0", 10) / 60);
        return sign === "-" ? -hours : hours;
    } catch {
        return 0;
    }
}

