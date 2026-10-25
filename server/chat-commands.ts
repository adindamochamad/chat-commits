import type { ProposalQueue } from "./proposals.js";

export interface ChatMessage {
  messageId: string;
  chatterId: string;
  chatterName: string;
  text: string;
}

export type CommandResult =
  | { kind: "ignored" }
  | { kind: "proposal_added"; proposalId: string }
  | { kind: "proposal_rejected"; reason: string }
  | { kind: "vote_recorded"; proposalId: string; votes: number; changed: boolean }
  | { kind: "vote_rejected"; reason: string };

export class ChatCommandHandler {
  constructor(private readonly queue: ProposalQueue) {}

  handle(message: ChatMessage): CommandResult {
    const input = message.text.trim();
    const command = /^!(commit|vote)(?:\s+(.*))?$/i.exec(input);
    if (!command) return { kind: "ignored" };

    const [, name, argument = ""] = command;
    if (name.toLowerCase() === "commit") {
      const result = this.queue.submit(argument, { id: message.chatterId, name: message.chatterName });
      return result.ok
        ? { kind: "proposal_added", proposalId: result.proposal.id }
        : { kind: "proposal_rejected", reason: result.reason };
    }

    const proposalId = argument.trim().split(/\s+/, 1)[0] ?? "";
    if (!proposalId) return { kind: "vote_rejected", reason: "missing_proposal_id" };
    const result = this.queue.vote(proposalId, message.chatterId);
    return result.ok
      ? {
          kind: "vote_recorded",
          proposalId: result.proposal.id,
          votes: result.proposal.votes,
          changed: result.changed,
        }
      : { kind: "vote_rejected", reason: result.reason };
  }
}
