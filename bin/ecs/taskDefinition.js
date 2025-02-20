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
const aws = require("@pulumi/aws");
const pulumi = require("@pulumi/pulumi");
const ecs = require(".");
const role = require("../role");
const utils = require("../utils");
class TaskDefinition extends pulumi.ComponentResource {
    constructor(type, name, isFargate, args, opts) {
        super(type, name, {}, opts);
        /**
         * Mapping from container in this task to the ELB listener exposing it through a load balancer.
         * Only present if a listener was provided in [Container.portMappings] or in
         * [Container.applicationListener] or [Container.networkListener].
         */
        this.listeners = {};
        this.applicationListeners = {};
        this.networkListeners = {};
        this.logGroup = args.logGroup === null ? undefined :
            args.logGroup ? args.logGroup : new aws.cloudwatch.LogGroup(name, {
                retentionInDays: 1,
            }, { parent: this });
        this.taskRole = args.taskRole === null ? undefined :
            args.taskRole ? args.taskRole : TaskDefinition.createTaskRole(`${name}-task`, /*assumeRolePolicy*/ undefined, /*policyArns*/ undefined, { parent: this });
        this.executionRole = args.executionRole === null ? undefined :
            args.executionRole ? args.executionRole : TaskDefinition.createExecutionRole(`${name}-execution`, /*assumeRolePolicy*/ undefined, /*policyArns*/ undefined, { parent: this });
        this.containers = args.containers;
        const containerDefinitions = computeContainerDefinitions(this, name, args.vpc, this.containers, this.applicationListeners, this.networkListeners, this.logGroup);
        this.listeners = Object.assign(Object.assign({}, this.applicationListeners), this.networkListeners);
        const containerString = containerDefinitions.apply(d => JSON.stringify(d));
        const defaultFamily = containerString.apply(s => name + "-" + utils.sha1hash(pulumi.getStack() + containerString));
        const family = utils.ifUndefined(args.family, defaultFamily);
        this.taskDefinition = new aws.ecs.TaskDefinition(name, Object.assign(Object.assign({}, args), { family: family, taskRoleArn: this.taskRole ? this.taskRole.arn : undefined, executionRoleArn: this.executionRole ? this.executionRole.arn : undefined, containerDefinitions: containerString }), { parent: this });
        // this.run = createRunFunction(isFargate, this.taskDefinition.arn);
        this.run = () => {
            throw new Error("DO NOT USE");
        };
    }
    /**
     * Creates the [taskRole] for a [TaskDefinition] if not provided explicitly. If
     * [assumeRolePolicy] is provided it will be used when creating the task, otherwise
     * [defaultRoleAssumeRolePolicy] will be used.  If [policyArns] are provided, they will be used
     * to create [RolePolicyAttachment]s for the Role.  Otherwise, [defaultTaskRolePolicyARNs] will
     * be used.
     */
    static createTaskRole(name, assumeRolePolicy, policyArns, opts) {
        return role.createRole(name, assumeRolePolicy || TaskDefinition.defaultRoleAssumeRolePolicy(), policyArns || TaskDefinition.defaultTaskRolePolicyARNs(), opts);
    }
    /**
     * Creates the [executionRole] for a [TaskDefinition] if not provided explicitly. If
     * [assumeRolePolicy] is provided it will be used when creating the task, otherwise
     * [defaultRoleAssumeRolePolicy] will be used.  If [policyArns] are provided, they will be used
     * to create [RolePolicyAttachment]s for the Role.  Otherwise, [defaultExecutionRolePolicyARNs] will
     * be used.
     */
    static createExecutionRole(name, assumeRolePolicy, policyArns, opts) {
        return role.createRole(name, assumeRolePolicy || TaskDefinition.defaultRoleAssumeRolePolicy(), policyArns || TaskDefinition.defaultExecutionRolePolicyARNs(), opts);
    }
    // The default ECS Task assume role policy for Task and Execution Roles
    static defaultRoleAssumeRolePolicy() {
        return {
            "Version": "2012-10-17",
            "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com",
                    },
                    "Effect": "Allow",
                    "Sid": "",
                }],
        };
    }
    // Default policy arns for the Task role.
    static defaultTaskRolePolicyARNs() {
        return [
            // Provides full access to Lambda
            aws.iam.ManagedPolicy.LambdaFullAccess,
            // Required for lambda compute to be able to run Tasks
            aws.iam.ManagedPolicy.AmazonECSFullAccess,
        ];
    }
    // Default policy arns for the Execution role.
    static defaultExecutionRolePolicyARNs() {
        return [
            "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole,
        ];
    }
}
exports.TaskDefinition = TaskDefinition;
const _ = utils.checkCompat();
function createRunFunction(isFargate, taskDefArn) {
    return async function run(params) {
        // @ts-ignore
        const ecs = new aws.sdk.ECS();
        const cluster = params.cluster;
        const clusterArn = cluster.id.get();
        const securityGroupIds = cluster.securityGroups.map(g => g.id.get());
        const publicSubnetIds = await cluster.vpc.publicSubnetIds;
        const subnetIds = publicSubnetIds.map(i => i.get());
        const assignPublicIp = isFargate; // && !usePrivateSubnets;
        // Run the task
        return ecs.runTask(Object.assign(Object.assign({ taskDefinition: taskDefArn.get(), launchType: isFargate ? "FARGATE" : "EC2", networkConfiguration: {
                awsvpcConfiguration: {
                    assignPublicIp: assignPublicIp ? "ENABLED" : "DISABLED",
                    securityGroups: securityGroupIds,
                    subnets: subnetIds,
                },
            } }, params), { cluster: clusterArn })).promise();
    };
}
function computeContainerDefinitions(parent, name, vpc, containers, applicationListeners, networkListeners, logGroup) {
    const result = [];
    for (const containerName of Object.keys(containers)) {
        const container = containers[containerName];
        result.push(ecs.computeContainerDefinition(parent, name, vpc, containerName, container, applicationListeners, networkListeners, logGroup));
    }
    return pulumi.all(result);
}
// Make sure our exported args shape is compatible with the overwrite shape we're trying to provide.
const test1 = utils.checkCompat();
//# sourceMappingURL=taskDefinition.js.map