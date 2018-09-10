'use struct';

import { WebClient } from '@slack/client';

export default class Slack {
  constructor(token) {
    this.web = new WebClient(token);
  }

  async postMessage(channel, attachments) {
    try {
      this.web.chat.postMessage(channel, '', { attachments });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static buildMessage(payload, message) {
    const eventType = Object.prototype.hasOwnProperty.call(payload, 'issue')
      ? 'issue'
      : 'pull_request';
    const user = payload[`${eventType}`].user;
    const title = payload[`${eventType}`].title;
    const titleLink = payload[`${eventType}`].html_url;

    const attachments = [
      {
        color: '#36a64f',
        author_name: `${user.login} (${payload.repository.name})`,
        author_icon: user.avatar_url,
        title,
        title_link: titleLink,
        text: message,
      },
    ];

    switch (payload.action) {
      case 'closed':
        if (payload.pull_request.merged) {
          attachments[0].color = 'good';
          attachments[0].text = ':white_check_mark: Pull request merged.';
        } else {
          attachments[0].color = 'warning';
          attachments[0].text =
            ':negative_squared_cross_mark: Pull request closed.';
        }
        break;
      default:
        attachments[0].color = 'good';
        attachments[0].text = `:eyes: ${message}`;
        break;
    }

    return attachments;
  }
}
