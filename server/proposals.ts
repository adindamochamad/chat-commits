import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";

export interface ChatAuthor {
  id: string;
  name: string;
}

export interface Proposal {
  id: string;
  text: string;
  author: ChatAuthor;
  createdAt: string;
  votes: number;
  status: "open" | "selected";
}

export type ProposalResult =
  | { ok: true; proposal: Proposal }
  | { ok: false; reason: "empty" | "too_long" | "queue_full" };

export type VoteResult =
  | { ok: true; proposal: Proposal; changed: boolean }
  | { ok: false; reason: "not_found" | "closed" };

/** In-memory proposal queue. Each chatter has one vote across open proposals. */
export class ProposalQueue extends EventEmitter {
  private readonly proposals = new Map<string, Proposal>();
  private readonly voterChoices = new Map<string, string>();

  constructor(private readonly maxOpenProposals = 50) {
    super();
  }

  submit(text: string, author: ChatAuthor): ProposalResult {
    const idea = text.trim();
    if (!idea) return { ok: false, reason: "empty" };
    if (idea.length > 280) return { ok: false, reason: "too_long" };
    if (this.openProposals().length >= this.maxOpenProposals) {
      return { ok: false, reason: "queue_full" };
    }

    let id = randomUUID().slice(0, 8);
    while (this.proposals.has(id)) id = randomUUID().slice(0, 8);
    const proposal: Proposal = {
      id,
      text: idea,
      author: { ...author },
      createdAt: new Date().toISOString(),
      votes: 0,
      status: "open",
    };
    this.proposals.set(id, proposal);
    this.emit("proposal", proposal);
    this.emit("change", this.list());
    return { ok: true, proposal: { ...proposal, author: { ...proposal.author } } };
  }

  vote(proposalId: string, voterId: string): VoteResult {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return { ok: false, reason: "not_found" };
    if (proposal.status !== "open") return { ok: false, reason: "closed" };

    const previousId = this.voterChoices.get(voterId);
    if (previousId === proposalId) {
      return { ok: true, proposal: this.copy(proposal), changed: false };
    }
    if (previousId) {
      const previous = this.proposals.get(previousId);
      if (previous?.status === "open") previous.votes = Math.max(0, previous.votes - 1);
    }
    proposal.votes += 1;
    this.voterChoices.set(voterId, proposalId);
    this.emit("vote", { proposal: this.copy(proposal), voterId, previousId });
    this.emit("change", this.list());
    return { ok: true, proposal: this.copy(proposal), changed: true };
  }

  /** Closes and returns the current winner; ties go to the earliest proposal. */
  selectWinner(): Proposal | undefined {
    const winner = this.openProposals().filter((proposal) => proposal.votes > 0).sort((a, b) =>
      b.votes - a.votes || a.createdAt.localeCompare(b.createdAt),
    )[0];
    if (!winner) return undefined;
    winner.status = "selected";
    for (const [voterId, proposalId] of this.voterChoices) {
      if (proposalId === winner.id) this.voterChoices.delete(voterId);
    }
    const selected = this.copy(winner);
    this.emit("selected", selected);
    this.emit("change", this.list());
    return selected;
  }

  list(): Proposal[] {
    return [...this.proposals.values()]
      .map((proposal) => this.copy(proposal))
      .sort((a, b) => b.votes - a.votes || a.createdAt.localeCompare(b.createdAt));
  }

  get(id: string): Proposal | undefined {
    const proposal = this.proposals.get(id);
    return proposal ? this.copy(proposal) : undefined;
  }

  private openProposals(): Proposal[] {
    return [...this.proposals.values()].filter((proposal) => proposal.status === "open");
  }

  private copy(proposal: Proposal): Proposal {
    return { ...proposal, author: { ...proposal.author } };
  }
}
