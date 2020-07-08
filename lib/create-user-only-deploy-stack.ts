import * as cdk from '@aws-cdk/core'
import {
  User,
  Role,
  ServicePrincipal,
  Policy,
  PolicyDocument,
  PolicyStatement,
  Effect,
  ManagedPolicy
} from '@aws-cdk/aws-iam'
import { Duration } from '@aws-cdk/core'

export class CreateUserOnlyDeployStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // デプロイ用の IAM ユーザー
    const deployUser = new User(this, 'DeployUser', {
      userName: 'ads-submit-for-circleci'
    })

    // デプロイ用のIAMユーザに付与するIAMポリシー（AssumeRoleできる）
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['sts:AssumeRole'],
      // TODO: DeployRoleForUser.Arn の記述が必要
      resources: []
    })
    new Policy(this, 'DeployUserPoricy', {
      policyName: 'ads-submit-for-circleci-policy',
      users: [deployUser],
      statements: [policyStatement]
    })

    // CloudFormation用のIAMロール（AWS各サービスに対する権限）
    new Role(this, 'DeployRoleForCloudFormation', {
      roleName: 'deploy-iam-sample-deploy-role-for-cloudformation',
      assumedBy: new ServicePrincipal('cloudformation.amazonaws.com'),
      maxSessionDuration: Duration.hours(1),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayAdministrator')
      ]
    })

    new Policy(this, 'DeployRoleForUser2', {
      policyName: 'deploy-iam-sample-deploy-policy-for-user'
    })
    const policyStatementForCloudFormation = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'cloudformation:CreateStack',
        'cloudformation:CreateChangeSet',
        'cloudformation:DeleteChangeSet',
        'cloudformation:DescribeChangeSet',
        'cloudformation:DescribeStacks',
        'cloudformation:ExecuteChangeSet'
      ],
      resources: []
    })
    const policyDocument = new PolicyDocument()
    policyDocument.addStatements(policyStatementForCloudFormation)

    // デプロイ用のIAMユーザがAssumeRoleするIAMロール（CloudFormationとS3に対する権限）
    new Role(this, 'DeployRoleForUser', {
      roleName: 'deploy-iam-sample-deploy-role-for-user',
      assumedBy: new ServicePrincipal(deployUser.userArn),
      externalId: 'any-id-hoge-fuga',
      inlinePolicies: {
        '': policyDocument
      }
    })

    // const policyStatementForRole = new PolicyStatement({
    //   effect: Effect.ALLOW,
    //   actions: ['sts:AssumeRole'],
    //   principals: [deployUser],
    //   conditions: [
    //     { 'StringEquals': { "sts:ExternalId": "any-id-hoge-fuga" }}
    //   ]
    // })
    // // const policyDocument = new PolicyDocument().addStatements(policyStatementForRole)
    // const deployRole = new Role(this, 'DeployRoleForUser', {
    //   assumedBy: new ServicePrincipal(deployUser.userArn),
    //   roleName: 'ads-submit-for-deploy-role'
    // })
    // deployRole.addToPolicy(policyStatementForRole)

    // const policyStatement = new PolicyStatement({
    //   effect: Effect.ALLOW,
    //   actions: ['sts:AssumeRole'],
    //   resources: [deployRole.roleArn]
    // })
    // const policy = new Policy(this, 'DeployUserPoricy', {
    //   policyName: 'ads-submit-for-circleci-policy',
    //   users: [deployUser],
    //   statements: [policyStatement]
    // })

    // // const pCondition = new PrincipalWithConditions(deployRole, { conditions: { "StringEquals" : { "sts:ExternalId": "any-id-hoge-fuga" }}})
    // const doc = new PolicyStatement().addCondition('StringEquals', { "sts:ExternalId": "any-id-hoge-fuga" })
  }
}
