"use strict";
// Copyright 2016-2018, Pulumi Corporation.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
const acmpca = require("./acmpca");
exports.acmpca = acmpca;
const apigateway = require("./apigateway");
exports.apigateway = apigateway;
const autoscaling = require("./autoscaling");
exports.autoscaling = autoscaling;
const billing = require("./billing");
exports.billing = billing;
const cloudfront = require("./cloudfront");
exports.cloudfront = cloudfront;
const cloudtrail = require("./cloudtrail");
exports.cloudtrail = cloudtrail;
const cloudwatch = require("./cloudwatch");
exports.cloudwatch = cloudwatch;
const codebuild = require("./codebuild");
exports.codebuild = codebuild;
const cognito = require("./cognito");
exports.cognito = cognito;
const dynamodb = require("./dynamodb");
exports.dynamodb = dynamodb;
const ebs = require("./ebs");
exports.ebs = ebs;
const ec2 = require("./ec2");
exports.ec2 = ec2;
const ecr = require("./ecr");
exports.ecr = ecr;
const ecs = require("./ecs");
exports.ecs = ecs;
const efs = require("./efs");
exports.efs = efs;
const lambda = require("./lambda");
exports.lambda = lambda;
const lb = require("./lb");
exports.elasticloadbalancingv2 = lb;
exports.lb = lb;
const rds = require("./rds");
exports.rds = rds;
const s3 = require("./s3");
exports.s3 = s3;
const sns = require("./sns");
exports.sns = sns;
const sqs = require("./sqs");
exports.sqs = sqs;
// @pulumi/awsx is a deployment-only module.  If someone tries to capture it, and we fail for some
// reason we want to give a good message about what the problem likely is.  Note that capturing a
// deployment time module can be ok in some cases.  For example, using "awsx.apigateway.authorizerResponse"
// as a helper function is fine. However, in general, the majority of this API is not safe to use
// at 'run time' and will fail.
/** @internal */
exports.deploymentOnlyModule = true;
//# sourceMappingURL=index.js.map