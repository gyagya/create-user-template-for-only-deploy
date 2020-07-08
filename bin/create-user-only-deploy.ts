#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CreateUserOnlyDeployStack } from '../lib/create-user-only-deploy-stack';

const app = new cdk.App();
new CreateUserOnlyDeployStack(app, 'CreateUserOnlyDeployStack');
