export type TicketMessage = { id: string; author: string; text: string };
export type Ticket = { id: string; subject: string; messages: TicketMessage[] };
export type SummaryResponse =
  | { status: "ok"; summary: string; sourceIds: string[] }
  | { status: "insufficient_information" };
