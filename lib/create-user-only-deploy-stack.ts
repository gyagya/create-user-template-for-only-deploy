import * as cdk from '@aws-cdk/core'
import {
  User,
  Role,
  ServicePrincipal,
  Policy,
  PolicyDocument,
  PolicyStatement,
  Effect,
  ManagedPolicy,
  ArnPrincipal
} from '@aws-cdk/aws-iam'
import { Duration, CfnOutput } from '@aws-cdk/core'

export class CreateUserOnlyDeployStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const deployStackName = 'hogehoge'

    // デプロイ用の IAM ユーザー
    const userForDeploy = createDeployUser(
      this,
      'DeployUser',
      'deploy-iam-user'
    )

    // CloudFormation用のIAMロール（AWS各サービスに対する権限）
    const roleForCloudFormation = createCloudFormationRole(
      this,
      'DeployRoleForCloudFormation',
      'deploy-iam-deploy-role-for-cloudformation'
    )

    // デプロイ用のIAMユーザがAssumeRoleするIAMロール（CloudFormationとS3に対する権限）
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
      resources: [
        `arn:aws:cloudformation:${this.region}:${this.account}:stack/${deployStackName}/*`
      ]
    })
    const policyStatementForIam = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: [roleForCloudFormation.roleArn]
    })
    const policyDocument = new PolicyDocument()
    policyDocument.addStatements(policyStatementForCloudFormation)
    policyDocument.addStatements(policyStatementForIam)
    const deployRole = new Role(this, 'DeployRoleForUser', {
      roleName: 'deploy-iam-deploy-role-for-user',
      assumedBy: new ArnPrincipal(userForDeploy.userArn),
      externalId: 'any-id-hoge-fuga',
      inlinePolicies: {
        'deploy-iam-deploy-policy-for-user': policyDocument
      }
    })

    // デプロイ用のIAMユーザに付与するIAMポリシー（AssumeRoleできる）
    createDeployPolicy(
      this,
      'DeployUserPoricy',
      'ads-submit-for-circleci-policy',
      userForDeploy,
      deployRole
    )
    // const policyStatement = new PolicyStatement({
    //   effect: Effect.ALLOW,
    //   actions: ['sts:AssumeRole'],
    //   resources: [deployRole.roleArn]
    // })
    // new Policy(this, 'DeployUserPoricy', {
    //   policyName: 'ads-submit-for-circleci-policy',
    //   users: [userForDeploy],
    //   statements: [policyStatement]
    // })

    new CfnOutput(this, 'OutputDeployUser', {
      description: 'IAM User for Deploy',
      value: userForDeploy.userArn
    })
    new CfnOutput(this, 'OutputDeployRoleForUser', {
      description: 'IAM Role (AssumeRole) for Deploy User',
      value: deployRole.roleArn
    })
    new CfnOutput(this, 'OutputDeployRoleForCloudFormation', {
      description: 'IAM Role (AssumeRole) for  Deploy CloudFormation',
      value: roleForCloudFormation.roleArn
    })
  }
}

const createDeployUser = (
  scope: cdk.Construct,
  id: string,
  userName: string
) => {
  return new User(scope, id, {
    userName: userName
  })
}

const createCloudFormationRole = (
  scope: cdk.Construct,
  id: string,
  roleName: string
) => {
  return new Role(scope, id, {
    roleName: roleName,
    assumedBy: new ServicePrincipal('cloudformation.amazonaws.com'),
    maxSessionDuration: Duration.hours(1),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaFullAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayAdministrator')
    ]
  })
}

const createDeployPolicy = (
  scope: cdk.Construct,
  id: string,
  policyName: string,
  deployUser: User,
  deployRole: Role
) => {
  const policyStatement = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['sts:AssumeRole'],
    resources: [deployRole.roleArn]
  })
  new Policy(scope, id, {
    policyName: policyName,
    users: [deployUser],
    statements: [policyStatement]
  })
}
