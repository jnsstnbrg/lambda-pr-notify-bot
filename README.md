# lambda-pr-notify-bot

[![CircleCI](https://img.shields.io/circleci/project/github/kentaro-m/lambda-pr-notify-bot.svg?style=flat-square)](https://circleci.com/gh/kentaro-m/lambda-pr-notify-bot)
[![license](https://img.shields.io/github/license/kentaro-m/lambda-pr-notify-bot.svg?style=flat-square)](https://github.com/kentaro-m/lambda-pr-notify-bot/blob/master/LICENSE)

:robot: A bot that improve pull request workflow on GitHub.

## Features

* :bell: Send a message to a Slack channel
  * When the pull request is opened
  * When the pull request is closed
  * When the pull request is approved
  * When the pull request is merged

## Configuration

### How to create oauth token for send messages to Slack

1. Access to [Your Apps](https://api.slack.com/apps)
2. Click the Create New App
3. Input App Name and Development Slack Workspace
4. Select Permissions in Add features and functionality
5. Add `chat:write:bot` in Permission Scopes
6. Create a token
7. Copy OAuth Access Token

### How to create oauth token for request GitHub API.

1. Access to [Personal access tokens](https://github.com/settings/tokens)
2. Click the Generate new token
3. Input description in Token description
4. Add `repo` in Select scopes
5. Create a token
6. Copy OAuth Access Token

### How to run the bot on AWS

Installing packages and building code.

```
$ git clone https://github.com/kentaro-m/lambda-pr-notify-bot.git
$ cd lambda-pr-notify-bot
$ npm install
$ npm run package
```

Change settings if needed in `config/default.json`.

```
{
  "host": "", // Required if using GitHub Enterprise
  "pathPrefix": "", // Required if using GitHub Enterprise
  "message": { // Message to notify to Slack
    "requestReview": "Please review this pull request."
  }
}
```

Create a parameters.json file.

```
[
  {
    "ParameterKey": "GitHubApiToken",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "SecretToken",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "SlackApiToken",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "SlackChannel",
    "ParameterValue": ""
  }
]
```

Upload the SAM template to S3 and deploy it.

```
$ aws cloudformation package --template-file pr-notify-bot.yml --s3-bucket <Your bucket name> --output-template sam-packaged.yml
$ aws cloudformation deploy --template-file sam-packaged.yml --parameter-overrides $(jq -r '.[] | [.ParameterKey, .ParameterValue] | join("=")' parameters.json) --stack-name <Your stack name> --capabilities CAPABILITY_IAM
```

### How to set up webhook on GitHub

* Go to your project (or organization) settings > Webhooks > Add webhook
* **Payload URL** `https://<API ID>.execute-api.<AWS Region>.amazonaws.com/<Stage Name>/webhook`
* **Content type** `application/json`
* **Secret** any value
* **Events** Pull request, Pull request review, Pull request review comment, Issue comment

### Options: Execute a Lambda Function on VPC

Please use it when assigning a static IP to execute a Lambda Function. Also, if necessary, please specify security group and subnet as parameters (An array of literal strings that are separated by commas.).

* **SecurityGroupIds** The list of Security Group IDs for the HTTPS Access.
* **PrivateSubnetIds** The list of VPC Private Subnet IDs for running the Lambda Function.

```
$ aws cloudformation package --template-file pr-notify-bot-on-vpc.yml --s3-bucket <Your bucket name> --output-template sam-packaged.yml
$ aws cloudformation deploy --template-file sam-packaged.yml --parameter-overrides $(jq -r '.[] | [.ParameterKey, .ParameterValue] | join("=")' parameters.json) --stack-name <Your stack name> --parameter-overrides SecurityGroupIds=<SecurityGroupIds value> PrivateSubnetIds=<PrivateSubnetIds value> --capabilities CAPABILITY_IAM
```

## License

MIT
