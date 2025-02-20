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
const x = require("..");
const utils = require("../utils");
class Service extends pulumi.ComponentResource {
    constructor(type, name, args, opts) {
        super(type, name, {}, opts);
        /**
         * Mapping from container in this service to the ELB listener exposing it through a load
         * balancer. Only present if a listener was provided in [Container.portMappings] or in
         * [Container.applicationListener] or [Container.networkListener].
         */
        this.listeners = {};
        this.applicationListeners = {};
        this.networkListeners = {};
        this.cluster = args.cluster || x.ecs.Cluster.getDefault();
        this.listeners = args.taskDefinition.listeners;
        this.applicationListeners = args.taskDefinition.applicationListeners;
        this.networkListeners = args.taskDefinition.networkListeners;
        // Determine which load balancers we're attached to based on the information supplied to the
        // containers for this service.
        const loadBalancers = getLoadBalancers(this, name, args);
        this.service = new aws.ecs.Service(name, Object.assign(Object.assign({}, args), { loadBalancers, cluster: this.cluster.cluster.arn, taskDefinition: args.taskDefinition.taskDefinition.arn, desiredCount: utils.ifUndefined(args.desiredCount, 1), waitForSteadyState: utils.ifUndefined(args.waitForSteadyState, true) }), pulumi.mergeOptions(opts, {
            parent: this,
            dependsOn: this.cluster.autoScalingGroups.map(g => g.stack),
        }));
        this.taskDefinition = args.taskDefinition;
    }
}
exports.Service = Service;
function getLoadBalancers(service, name, args) {
    const result = [];
    // Get the initial set of load balancers if specified directly in our args.
    if (args.loadBalancers) {
        for (const obj of args.loadBalancers) {
            const loadBalancer = isServiceLoadBalancerProvider(obj)
                ? obj.serviceLoadBalancer(name, service)
                : obj;
            result.push(pulumi.output(loadBalancer));
        }
    }
    const containerLoadBalancerProviders = [];
    // Now walk each container and see if it wants to add load balancer information as well.
    for (const containerName of Object.keys(args.taskDefinition.containers)) {
        const container = args.taskDefinition.containers[containerName];
        if (!container.portMappings) {
            continue;
        }
        for (const obj of container.portMappings) {
            if (x.ecs.isContainerLoadBalancerProvider(obj)) {
                containerLoadBalancerProviders.push([containerName, obj]);
            }
        }
    }
    // Finally see if we were directly given load balancing listeners to associate our containers
    // with. If so, use their information to populate our LB information.
    for (const containerName of Object.keys(service.listeners)) {
        const provider = service.listeners[containerName];
        if (!containerLoadBalancerProviders.some(p => p[0] === containerName && p[1] === provider)) {
            containerLoadBalancerProviders.push([containerName, provider]);
        }
    }
    for (const [containerName, provider] of containerLoadBalancerProviders) {
        processContainerLoadBalancerProvider(containerName, provider);
    }
    return pulumi.output(result);
    function processContainerLoadBalancerProvider(containerName, prov) {
        // Containers don't know their own name.  So we add the name in here on their behalf.
        const containerLoadBalancer = prov.containerLoadBalancer(name, service);
        const serviceLoadBalancer = pulumi.output(containerLoadBalancer).apply(lb => (Object.assign(Object.assign({}, lb), { containerName })));
        result.push(serviceLoadBalancer);
    }
}
/** @internal */
function isServiceLoadBalancerProvider(obj) {
    return obj && obj.serviceLoadBalancer instanceof Function;
}
exports.isServiceLoadBalancerProvider = isServiceLoadBalancerProvider;
// Make sure our exported args shape is compatible with the overwrite shape we're trying to provide.
const test1 = utils.checkCompat();
//# sourceMappingURL=service.js.map