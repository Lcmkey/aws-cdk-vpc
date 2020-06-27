#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsVpcCdkStack } from '../lib/aws-vpc-cdk-stack';

const app = new cdk.App();
new AwsVpcCdkStack(app, 'AwsVpcCdkStack');
