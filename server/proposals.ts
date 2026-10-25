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
  status: "queued" | "voting" | "selected";
}

export type ProposalResult =
  | { ok: true; proposal: Proposal }
  | { ok: false; reason: "empty" | "too_long" | "queue_full" };

export type VoteResult =
  | { ok: true; proposal: Proposal; changed: boolean }
  | { ok: false; reason: "not_found" | "closed" };

/** In-memory proposal queue with explicit voting rounds. */
export class ProposalQueue extends EventEmitter {
  private readonly proposals = new Map<string, Proposal>();
  private readonly voterChoices = new Map<string, string>();
  private votingRoundActive = false;

  constructor(private readonly maxOpenProposals = 50) {
    super();
  }

  submit(text: string, author: ChatAuthor): ProposalResult {
    const idea = text.trim();
    if (!idea) return { ok: false, reason: "empty" };
    if (idea.length > 280) return { ok: false, reason: "too_long" };
    if (this.queuedOrVotingProposals().length >= this.maxOpenProposals) {
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
      status: this.votingRoundActive ? "voting" : "queued",
    };
    this.proposals.set(id, proposal);
    this.emit("proposal", proposal);
    this.emit("change", this.list());
    return { ok: true, proposal: { ...proposal, author: { ...proposal.author } } };
  }

  vote(proposalId: string, voterId: string): VoteResult {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return { ok: false, reason: "not_found" };
    if (proposal.status !== "voting") return { ok: false, reason: "closed" };

    const previousId = this.voterChoices.get(voterId);
    if (previousId === proposalId) {
      return { ok: true, proposal: this.copy(proposal), changed: false };
    }
    if (previousId) {
      const previous = this.proposals.get(previousId);
      if (previous?.status === "voting") previous.votes = Math.max(0, previous.votes - 1);
    }
    proposal.votes += 1;
    this.voterChoices.set(voterId, proposalId);
    this.emit("vote", { proposal: this.copy(proposal), voterId, previousId });
    this.emit("change", this.list());
    return { ok: true, proposal: this.copy(proposal), changed: true };
  }

  /** Moves queued proposals into a new round. New proposals join an active round. */
  startVotingRound(): number {
    if (this.votingRoundActive) return 0;
    this.votingRoundActive = true;
    const queued = [...this.proposals.values()].filter((proposal) => proposal.status === "queued");
    for (const proposal of queued) {
      proposal.status = "voting";
      proposal.votes = 0;
    }
    this.voterChoices.clear();
    if (queued.length) this.emit("change", this.list());
    return queued.length;
  }

  hasVotingRound(): boolean {
    return this.votingRoundActive;
  }

  hasQueuedProposals(): boolean {
    return [...this.proposals.values()].some((proposal) => proposal.status === "queued");
  }

  /** Closes the round; ties go to the earliest proposal. */
  selectWinner(): Proposal | undefined {
    if (!this.votingRoundActive) return undefined;
    this.votingRoundActive = false;
    const voting = [...this.proposals.values()].filter((proposal) => proposal.status === "voting");
    const winner = voting.filter((proposal) => proposal.votes > 0).sort((a, b) =>
      b.votes - a.votes || a.createdAt.localeCompare(b.createdAt),
    )[0];
    for (const proposal of voting) {
      if (proposal === winner) {
        proposal.status = "selected";
      } else {
        proposal.status = "queued";
        proposal.votes = 0;
      }
    }
    this.voterChoices.clear();
    if (!winner) {
      this.emit("roundClosed", undefined);
      this.emit("change", this.list());
      return undefined;
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

  private queuedOrVotingProposals(): Proposal[] {
    return [...this.proposals.values()].filter((proposal) => proposal.status !== "selected");
  }

  private copy(proposal: Proposal): Proposal {
    return { ...proposal, author: { ...proposal.author } };
  }
}
