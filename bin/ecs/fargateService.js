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
const pulumi = require("@pulumi/pulumi");
const ecs = require(".");
const x = require("..");
const utils = require("../utils");
class FargateTaskDefinition extends ecs.TaskDefinition {
    constructor(name, args, opts = {}) {
        if (!args.container && !args.containers) {
            throw new Error("Either [container] or [containers] must be provided");
        }
        const containers = args.containers || { container: args.container };
        const computedMemoryAndCPU = computeFargateMemoryAndCPU(containers);
        const computedMemory = computedMemoryAndCPU.memory;
        const computedCPU = computedMemoryAndCPU.cpu;
        const argsCopy = Object.assign(Object.assign({}, args), { containers, requiresCompatibilities: ["FARGATE"], networkMode: "awsvpc", memory: utils.ifUndefined(args.memory, computedMemory), cpu: utils.ifUndefined(args.cpu, computedCPU) });
        delete argsCopy.container;
        super("awsx:x:ecs:FargateTaskDefinition", name, /*isFargate:*/ true, argsCopy, opts);
        this.registerOutputs();
    }
    /**
     * Creates a service with this as its task definition.
     */
    createService(name, args, opts = {}) {
        if (args.taskDefinition) {
            throw new Error("[args.taskDefinition] should not be provided.");
        }
        if (args.taskDefinitionArgs) {
            throw new Error("[args.taskDefinitionArgs] should not be provided.");
        }
        return new ecs.FargateService(name, Object.assign(Object.assign({}, args), { taskDefinition: this }), Object.assign({ parent: this }, opts));
    }
}
exports.FargateTaskDefinition = FargateTaskDefinition;
/**
 * Gets the list of all supported fargate configs.  We'll compute the amount of memory/vcpu
 * needed by the containers and we'll return the cheapest fargate config that supplies at
 * least that much memory/vcpu.
 */
function* getAllFargateConfigs() {
    // from https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
    // Supported task CPU and memory values for Fargate tasks are as follows.
    // CPU value                    Memory value (MiB)
    // .25 vCPU                     0.5GB, 1GB, 2GB
    yield* makeFargateConfigs(.25, [.5, 1, 2]);
    // .5 vCPU                     1GB, 2GB, 3GB, 4GBs
    yield* makeFargateConfigs(.5, makeMemoryConfigs(1, 4));
    // 1 vCPU                     2GB, 3GB, 4GB, 5GB, 6GB, 7GB, 8GB
    yield* makeFargateConfigs(1, makeMemoryConfigs(2, 8));
    // 2 vCPU                     Between 4GB and 16GB in increments of 1GB
    yield* makeFargateConfigs(2, makeMemoryConfigs(4, 16));
    // 4 vCPU                     Between 8GB and 30GB in increments of 1GB
    yield* makeFargateConfigs(4, makeMemoryConfigs(8, 30));
    return;
    function* makeMemoryConfigs(low, high) {
        if (low < 1) {
            throw new Error(`Invalid low: ${low}`);
        }
        if (high > 30) {
            throw new Error(`Invalid high: ${high}`);
        }
        for (let i = low; i <= high; i++) {
            yield i;
        }
    }
    function* makeFargateConfigs(vcpu, memory) {
        if (vcpu < .25 || vcpu > 4) {
            throw new Error(`Invalid vcpu: ${vcpu}`);
        }
        for (const mem of memory) {
            yield { vcpu, memGB: mem, cost: 0.04048 * vcpu + 0.004445 * mem };
        }
    }
}
function computeFargateMemoryAndCPU(containers) {
    return pulumi.output(containers).apply(containers => {
        // First, determine how much VCPU/GB that the user is asking for in their containers.
        let { requestedVCPU, requestedGB } = getRequestedVCPUandMemory();
        // Max CPU that can be requested is only 4.  Don't exceed that.  No need to worry about a
        // min as we're finding the first config that provides *at least* this amount.
        requestedVCPU = Math.min(requestedVCPU, 4);
        // Max memory that can be requested is only 30.  Don't exceed that.  No need to worry about
        // a min as we're finding the first config that provides *at least* this amount.
        requestedGB = Math.min(requestedGB, 30);
        // Get all configs that can at least satisfy this pair of cpu/memory needs.
        const configs = [...getAllFargateConfigs()];
        const validConfigs = configs.filter(c => c.vcpu >= requestedVCPU && c.memGB >= requestedGB);
        if (validConfigs.length === 0) {
            throw new Error(`Could not find fargate config that could satisfy: ${requestedVCPU} vCPU and ${requestedGB}GB.`);
        }
        // Now, find the cheapest config that satisfies both mem and cpu.
        const sorted = validConfigs.sort((c1, c2) => c1.cost - c2.cost);
        const config = sorted[0];
        // Want to return docker CPU units, not vCPU values. From AWS:
        //
        // You can determine the number of CPU units that are available per Amazon EC2 instance type by multiplying the
        // number of vCPUs listed for that instance type on the Amazon EC2 Instances detail page by 1,024.
        //
        // We return `memory` in MB units because that appears to be how AWS normalized these internally so this avoids
        // refresh issues.
        return { memory: `${config.memGB * 1024}`, cpu: `${config.vcpu * 1024}` };
        // local functions.
        function getRequestedVCPUandMemory() {
            // Sum the requested memory and CPU for each container in the task.
            //
            // Memory is in MB, and CPU values are in CPU shares.
            let minTaskMemoryMB = 0;
            let minTaskCPUUnits = 0;
            for (const containerName of Object.keys(containers)) {
                const containerDef = containers[containerName];
                if (containerDef.memoryReservation) {
                    minTaskMemoryMB += containerDef.memoryReservation;
                }
                else if (containerDef.memory) {
                    minTaskMemoryMB += containerDef.memory;
                }
                if (containerDef.cpu) {
                    minTaskCPUUnits += containerDef.cpu;
                }
            }
            // Convert docker cpu units values into vcpu values.  i.e. 256->.25, 4096->4.
            const requestedVCPU = minTaskCPUUnits / 1024;
            // Convert memory into GB values.  i.e. 2048MB -> 2GB.
            const requestedGB = minTaskMemoryMB / 1024;
            return { requestedVCPU, requestedGB };
        }
    });
}
class FargateService extends ecs.Service {
    constructor(name, args, opts = {}) {
        if (!args.taskDefinition && !args.taskDefinitionArgs) {
            throw new Error("Either [taskDefinition] or [taskDefinitionArgs] must be provided");
        }
        const cluster = args.cluster || x.ecs.Cluster.getDefault();
        const taskDefinition = args.taskDefinition ||
            new ecs.FargateTaskDefinition(name, Object.assign(Object.assign({}, args.taskDefinitionArgs), { vpc: cluster.vpc }), opts);
        const assignPublicIp = utils.ifUndefined(args.assignPublicIp, true);
        const securityGroups = x.ec2.getSecurityGroups(cluster.vpc, name, args.securityGroups || cluster.securityGroups, opts) || [];
        const subnets = getSubnets(cluster, args.subnets, assignPublicIp);
        super("awsx:x:ecs:FargateService", name, Object.assign(Object.assign({}, args), { taskDefinition,
            securityGroups, launchType: "FARGATE", networkConfiguration: {
                subnets,
                assignPublicIp,
                securityGroups: securityGroups.map(g => g.id),
            } }), opts);
        this.taskDefinition = taskDefinition;
        this.registerOutputs();
    }
}
exports.FargateService = FargateService;
/** @internal */
function getSubnets(cluster, subnets, assignPublicIp) {
    return pulumi.all([cluster.vpc.publicSubnetIds, cluster.vpc.privateSubnetIds, subnets, assignPublicIp])
        .apply(([publicSubnetIds, privateSubnetIds, subnets, assignPublicIp]) => {
        if (subnets) {
            return subnets;
        }
        return assignPublicIp ? publicSubnetIds : privateSubnetIds;
    });
}
exports.getSubnets = getSubnets;
// Make sure our exported args shape is compatible with the overwrite shape we're trying to provide.
const test1 = utils.checkCompat();
const test2 = utils.checkCompat();
//# sourceMappingURL=fargateService.js.map