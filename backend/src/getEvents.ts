import { CalDAVClient } from "ts-caldav";

const password = process.env.password || "";
const username = process.env.username || "";

export async function getIcloudEvent() {
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

  if(!calendar) return;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  let events: any = await client.getEvents(calendar?.url, {
    start,
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
  });
  let scheduledEvents = [];

  return events;
}
