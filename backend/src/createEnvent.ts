import { CalDAVClient } from "ts-caldav";

const password = process.env.password || "";
const username = process.env.username || "";

export async function createIcloudEvent(
  summary = "",
  description = "",
  start,
  end
) {
  if (!password || username) return;

  const client = await CalDAVClient.create({
    baseUrl: "https://caldav.icloud.com",
    auth: {
      type: "basic",
      username: username,
      password: password,
    },
    logRequests: true,
  });

  const calendar = (await client.getCalendars()).find(
    (cal) => cal.displayName === "Trabalho"
  );

  if (!calendar) return;

  const result = await client.createEvent(calendar.url, {
    summary: summary,
    start: new Date(start),
    end: new Date(end),
    description: description,
    startTzid: "America/Sao_Paulo",
    endTzid: "America/Sao_Paulo",
  });

  return result;
}
