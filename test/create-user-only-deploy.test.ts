import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CreateUserOnlyDeploy from '../lib/create-user-only-deploy-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CreateUserOnlyDeploy.CreateUserOnlyDeployStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
