import type { Ticket } from "./types";

export const currentTicket: Ticket = {
  id: "T-100",
  subject: "Unable to access account after password reset",
  messages: [
    { id: "m1", author: "Customer", text: "I reset my password this morning but cannot sign in." },
    { id: "m2", author: "Agent", text: "Are you seeing an error message?" },
    { id: "m3", author: "Customer", text: "The page says the reset link has expired. I tried twice." }
  ]
};
