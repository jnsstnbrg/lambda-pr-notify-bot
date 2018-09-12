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

  static buildMessage(payload, message, color) {
    const eventType = Object.prototype.hasOwnProperty.call(payload, 'issue')
      ? 'issue'
      : 'pull_request';
    const user = payload[`${eventType}`].user;
    const title = payload[`${eventType}`].title;
    const titleLink = payload[`${eventType}`].html_url;

    const attachments = [
      {
        color,
        author_name: `${user.login} (${payload.repository.name})`,
        author_icon: user.avatar_url,
        title,
        title_link: titleLink,
        text: message,
      },
    ];

    return attachments;
  }
}
