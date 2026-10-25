import "dotenv/config";
import { ChatCommandHandler } from "./chat-commands.js";
import { EventSubClient } from "./eventsub.js";
import { ProposalQueue } from "./proposals.js";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

const queue = new ProposalQueue();
const commands = new ChatCommandHandler(queue);
const eventSub = new EventSubClient(
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

queue.on("selected", (proposal) => {
  console.info(`Selected proposal ${proposal.id}: ${proposal.text} (${proposal.votes} votes)`);
});

eventSub.start();
console.info("Chat Commits EventSub listener starting");

function shutdown(signal: string): void {
  console.info(`Received ${signal}; stopping EventSub`);
  eventSub.stop();
  process.exitCode = 0;
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

export { commands, eventSub, queue };
