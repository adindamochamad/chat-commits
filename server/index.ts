import "dotenv/config";
import { ChatCommandHandler } from "./chat-commands.js";
import { createHttpServer } from "./http-server.js";
import { EventSubClient } from "./eventsub.js";
import { PatchPipeline } from "./patch-pipeline.js";
import { ProposalQueue } from "./proposals.js";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

function integerEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

const queue = new ProposalQueue();
const patchPipeline = new PatchPipeline();
const commands = new ChatCommandHandler(queue);
const votingWindowMs = integerEnv("VOTING_WINDOW_MS", 60_000);
const httpPort = integerEnv("HTTP_PORT", 3000);
const skipTwitch = process.env.SKIP_TWITCH === "1";
const demoMode = process.env.DEMO_MODE === "1" || skipTwitch;

let votingTimer: NodeJS.Timeout | undefined;
function startVotingRound(): void {
  if (queue.hasVotingRound()) return;
  const count = queue.startVotingRound();
  if (!count) return;
  console.info(`Voting opened for ${count} proposal(s), closes in ${votingWindowMs}ms`);
  votingTimer = setTimeout(() => {
    votingTimer = undefined;
    const winner = queue.selectWinner();
    if (!winner && queue.hasQueuedProposals()) startVotingRound();
  }, votingWindowMs);
}

function closeVotingNow(): void {
  clearTimeout(votingTimer);
  votingTimer = undefined;
  const winner = queue.selectWinner();
  if (!winner && queue.hasQueuedProposals()) startVotingRound();
}

queue.on("proposal", startVotingRound);
queue.on("selected", (proposal) => {
  console.info(`Selected proposal ${proposal.id}: ${proposal.text} (${proposal.votes} votes)`);
  void patchPipeline.enqueue(proposal).then((record) => {
    if (record.status === "pending") {
      console.info(`Patch ${record.id} validated and pending streamer review`);
    } else {
      console.error(`Patch ${record.id} rejected: ${record.rejectionReason}`);
    }
    startVotingRound();
  });
});

patchPipeline.on("change", (record) => {
  if (record.status === "writing") console.info(`Codex is writing patch ${record.id}`);
});

patchPipeline.on("pending", (record) => console.info(`Patch ${record.id} is pending approval`));
patchPipeline.on("rejected", (record) => console.error(`Patch ${record.id} auto-rejected: ${record.rejectionReason}`));
patchPipeline.on("merged", ({ commit }) => console.info(`Merged commit ${commit.hash} from ${commit.author.name}`));

createHttpServer({
  port: httpPort,
  queue,
  pipeline: patchPipeline,
  votingWindowMs,
  demoMode,
  onCloseVoting: closeVotingNow,
  onDemoProposal: (text, author) => {
    const result = queue.submit(text, author);
    if (result.ok) console.info(`Demo proposal ${result.proposal.id}: ${result.proposal.text}`);
  },
});

let eventSub: EventSubClient | undefined;
if (!skipTwitch) {
  eventSub = new EventSubClient(
    {
      clientId: requiredEnv("TWITCH_CLIENT_ID"),
      userAccessToken: requiredEnv("TWITCH_BOT_TOKEN"),
      broadcasterId: requiredEnv("TWITCH_BROADCASTER_ID"),
      botUserId: requiredEnv("TWITCH_BOT_USER_ID"),
    },
    (message) => {
      const result = commands.handle(message);
      if (result.kind === "proposal_added") {
        const proposal = queue.get(result.proposalId);
        console.info(`Proposal ${result.proposalId} by ${message.chatterName}: ${proposal?.text}`);
      } else if (result.kind === "proposal_rejected") {
        console.info(`Rejected !commit from ${message.chatterName}: ${result.reason}`);
      } else if (result.kind === "vote_recorded") {
        console.info(`${message.chatterName} voted for ${result.proposalId} (${result.votes} votes)`);
      } else if (result.kind === "vote_rejected") {
        console.info(`Rejected !vote from ${message.chatterName}: ${result.reason}`);
      }
    },
    (message, error) => error === undefined
      ? console.info(message)
      : console.error(message, error),
  );
  eventSub.start();
  console.info("Chat Commits EventSub listener starting");
} else {
  console.info("SKIP_TWITCH=1 — EventSub disabled; use DEMO_MODE demo API on /api/demo/*");
}

function shutdown(signal: string): void {
  console.info(`Received ${signal}; stopping`);
  clearTimeout(votingTimer);
  eventSub?.stop();
  process.exitCode = 0;
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

export { commands, eventSub, patchPipeline, queue };
