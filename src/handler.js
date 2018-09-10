import config from 'config';
import Slack from './slack';

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

export default async function handlePullRequestEvent(payload, callback) {
  try {
    const slack = new Slack(SLACK_API_TOKEN);

    if (
      ['opened', 'reopened', 'closed', 'synchronize'].includes(payload.action)
    ) {
      const message = Slack.buildMessage(payload, config.message.requestReview);
      await slack.postMessage(SLACK_CHANNEL, message);
    }
  } catch (error) {
    callback(new Error(error.message));
  }

  callback(null, {
    message: 'Pull request event processing has been completed',
  });
}
