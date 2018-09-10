import sinon from 'sinon';
import { assert } from 'chai';
import rewire from 'rewire';
import requireReload from 'require-reload';
import readFixtures from '../../test/utils/fixtures';
import PullRequest from '../../src/pull_request';
import Slack from '../../src/slack';

/* global describe, it, beforeEach, afterEach */

describe('Index', () => {
  describe('Environment variable', () => {
    let callback;
    let event;
    let context;
    let env;

    beforeEach(() => {
      callback = sinon.spy();
      event = {
        headers: {
          'X-GitHub-Event': 'pull_request',
          'X-Hub-Signature': 'sha1=36e4d168d0d6c6bd92f639f830420ccd840d6214',
        },
        body: {},
      };
      context = {};
      env = Object.assign({}, process.env);
    });

    afterEach(() => {
      process.env = env;
    });

    it('can throw a secret token no set error', async () => {
      const reload = requireReload(require);
      const index = reload('../../src/index.js');
      await index.handler(event, context, callback);
      assert.match(callback.args[0], /Secret Token is not found./);
    });

    it('can throw a slack api token no set error', async () => {
      process.env.SECRET_TOKEN = 'secret token';
      const reload = requireReload(require);
      const index = reload('../../src/index.js');
      await index.handler(event, context, callback);
      assert.match(callback.args[0], /Slack API Token is not found./);
    });

    it('can throw a github api token no set error', async () => {
      process.env.SECRET_TOKEN = 'secret token';
      process.env.SLACK_API_TOKEN = 'slack api token';
      const reload = requireReload(require);
      const index = reload('../../src/index.js');
      await index.handler(event, context, callback);
      assert.match(callback.args[0], /GitHub API Token is not found./);
    });
  });

  describe('calculateSignature', () => {
    let callback;
    let event;
    let context;
    let env;

    beforeEach(() => {
      callback = sinon.spy();
      event = {
        headers: {
          'X-GitHub-Event': 'pull_request',
          'X-Hub-Signature': 'sha1=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
        body: {},
      };
      context = {};
      env = Object.assign({}, process.env);
    });

    afterEach(() => {
      process.env = env;
    });

    it('can throw a secret token no set error', async () => {
      process.env.SECRET_TOKEN = 'secret token';
      process.env.SLACK_API_TOKEN = 'slack api token';
      const reload = requireReload(require);
      const index = reload('../../src/index.js');
      await index.handler(event, context, callback);
      assert.match(
        callback.args[0],
        /X-Hub-Signature and Calculated Signature do not match./
      );
    });

    it('can throw a secret token no match error', async () => {
      process.env.SECRET_TOKEN = 'secret token';
      process.env.SLACK_API_TOKEN = 'slack api token';
      process.env.SECRET_TOKEN = 'secret token';
      const reload = requireReload(require);
      const index = reload('../../src/index.js');
      await index.handler(event, context, callback);
      assert.match(
        callback.args[0],
        /X-Hub-Signature and Calculated Signature do not match./
      );
    });
  });

  describe('Pull Request Event', () => {
    let callback;
    let event;
    let context;
    let env;
    let sandbox;

    beforeEach(() => {
      callback = sinon.spy();
      context = {};
      process.env.SECRET_TOKEN = 'secret token';
      process.env.SLACK_API_TOKEN = 'slack api token';
      process.env.SECRET_TOKEN = 'secret token';
      env = Object.assign({}, process.env);
      sandbox = sinon.createSandbox();
      sandbox.stub(Slack.prototype, 'postMessage').returns(Promise.resolve({}));
      const reload = requireReload(require);
      reload('../../src/handler');
    });

    afterEach(() => {
      process.env = env;
      sandbox.restore();
    });

    describe('handle a pull request event', () => {
      it('can send a review request message to reviewers using Slack', async () => {
        sandbox
          .stub(PullRequest.prototype, 'requestReview')
          .returns(Promise.resolve({}));
        sandbox
          .stub(PullRequest.prototype, 'assignReviewers')
          .returns(Promise.resolve({}));
        event = readFixtures('test/fixtures/request_review.json');
        const index = rewire('../../src/index.js');
        index.__set__('validateSignature', () => true);
        await index.handler(event, context, callback);
        assert.equal(
          callback.args[0][1].message,
          'Pull request event processing has been completed'
        );
      });

      it('can send a review request message, when a wip label is removed from wip pull request.', async () => {
        sandbox
          .stub(PullRequest.prototype, 'requestReview')
          .returns(Promise.resolve({}));
        sandbox
          .stub(PullRequest.prototype, 'assignReviewers')
          .returns(Promise.resolve({}));
        event = readFixtures('test/fixtures/work_in_progress.json');
        const index = rewire('../../src/index.js');
        index.__set__('validateSignature', () => true);
        await index.handler(event, context, callback);
        assert.equal(
          callback.args[0][1].message,
          'Pull request event processing has been completed'
        );
      });
    });

    describe('handle a pull request review event', () => {
      it('can send a able merge message to the author using Slack', async () => {
        const reviewComments = readFixtures(
          'test/fixtures/review_comments_approved.json'
        );
        sandbox
          .stub(PullRequest.prototype, 'getReviewComments')
          .returns(Promise.resolve(reviewComments));
        event = readFixtures('test/fixtures/merge.json');
        const index = rewire('../../src/index.js');
        index.__set__('validateSignature', () => true);
        await index.handler(event, context, callback);
        assert.equal(
          callback.args[0][1].message,
          'Pull request review event processing has been completed'
        );
      });

      it('can send a mention message to a member using Slack', async () => {
        const reviewComments = readFixtures(
          'test/fixtures/review_comments_changed.json'
        );
        sandbox
          .stub(PullRequest.prototype, 'getReviewComments')
          .returns(Promise.resolve(reviewComments));
        event = readFixtures('test/fixtures/mention_review.json');
        const index = rewire('../../src/index.js');
        index.__set__('validateSignature', () => true);
        await index.handler(event, context, callback);
        assert.equal(
          callback.args[0][1].message,
          'Pull request review event processing has been completed'
        );
      });
    });

    describe('handle a issue event', () => {
      it('can send a mention message to a member using Slack', async () => {
        event = readFixtures('test/fixtures/mention_issue.json');
        const index = rewire('../../src/index.js');
        index.__set__('validateSignature', () => true);
        await index.handler(event, context, callback);
        assert.equal(
          callback.args[0][1].message,
          'Issue event processing has been completed'
        );
      });
    });
  });
});
