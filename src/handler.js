import config from 'config';
import PullRequest from './pull_request';
import Slack from './slack';

const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN || '';
const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN || '';
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || '';

const options = {
  debug: true,
  protocol: 'https',
  port: 443,
  host: 'api.github.com',
  pathPrefix: '',
  headers: {
    'user-agent': 'PR-Bot',
  },
  timeout: 10000,
};

if (config.host) {
  options.host = config.host;
}

if (config.pathPrefix) {
  options.pathPrefix = config.pathPrefix;
}

export async function handlePullRequestEvent(payload, callback) {
  try {
    const slack = new Slack(SLACK_API_TOKEN);

    let message;

    switch (payload.action) {
      case 'closed':
        if (payload.pull_request.merged) {
          message = Slack.buildMessage(
            payload,
            config.messages.merged.message,
            config.messages.merged.color
          );
        } else {
          message = Slack.buildMessage(
            payload,
            config.messages.closed.message,
            config.messages.closed.color
          );
        }
        break;
      case 'opened':
      case 'reopened':
        message = Slack.buildMessage(
          payload,
          config.messages.opened.message,
          config.messages.opened.color
        );
        break;
      default:
        break;
    }

    if (!message) {
      callback(new Error(`Invalid action on pull request: ${payload.action}`));
    }

    if (['opened', 'reopened', 'closed'].includes(payload.action)) {
      await slack.postMessage(SLACK_CHANNEL, message, 'pullRequest');
    }
  } catch (error) {
    callback(new Error(error.message));
  }

  callback(null, {
    message: 'Pull request event processing has been completed',
  });
}

export async function handlePullRequestReviewEvent(payload, callback) {
  try {
    const number = payload.pull_request.number;
    const repo = payload.repository.name;
    const owner = payload.repository.owner.login;

    const slack = new Slack(SLACK_API_TOKEN);

    const pr = new PullRequest(options, GITHUB_API_TOKEN);
    const reviewComments = await pr.getReviewComments(owner, repo, number);

    const approveComments = PullRequest.getApproveComments(
      reviewComments,
      config.approveComments
    );

    if (approveComments.length === config.numApprovers) {
      const message = Slack.buildMessage(
        payload,
        config.messages.approved.message,
        config.messages.approved.color
      );
      await slack.postMessage(SLACK_CHANNEL, message);
    }
  } catch (error) {
    callback(new Error(error.message));
  }

  callback(null, {
    message: 'Pull request review event processing has been completed',
  });
}
