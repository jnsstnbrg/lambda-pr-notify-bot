import { assert } from 'chai';
import config from 'config';

import Slack from '../../src/slack';
import readFixtures from '../../test/utils/fixtures';

/* global describe, it */

describe('Slack', () => {
  describe('constructor', () => {
    it('should initialize', () => {
      const slack = new Slack('dummy token');
      assert.instanceOf(slack, Slack);
    });
  });

  describe('buildMessage', () => {
    it('can create a default message', () => {
      const expected = [
        {
          color: 'good',
          author_name: 'kentaro-m (lambda-pr-notify-bot-test)',
          author_icon: 'https://avatars0.githubusercontent.com/u/7448569?v=4',
          title: 'bot test 4',
          title_link:
            'https://github.com/kentaro-m/lambda-pr-notify-bot-test/pull/19',
          text: ':eyes: Please review this pull request.',
        },
      ];

      const event = readFixtures('test/fixtures/request_review.json');
      const payload = event.body;
      const message = Slack.buildMessage(
        payload,
        config.messages.opened.message,
        config.messages.opened.color
      );
      assert.deepEqual(message, expected);
    });

    it('can create a merge message', () => {
      const event = readFixtures('test/fixtures/merge.json');
      const payload = event.body;
      const message = Slack.buildMessage(
        payload,
        config.messages.merged.message,
        config.messages.merged.color
      );
      assert.match(message[0].text, /:white_check_mark:/);
    });
  });
});
