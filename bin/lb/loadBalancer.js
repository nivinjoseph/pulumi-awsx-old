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
class LoadBalancer extends pulumi.ComponentResource {
    constructor(type, name, args, opts) {
        super(type, name, {}, opts);
        this.listeners = [];
        this.targetGroups = [];
        if (args.loadBalancer) {
            this.loadBalancer = args.loadBalancer;
            this.vpc = x.ec2.Vpc.fromExistingIds(`${name}-vpc`, { vpcId: this.loadBalancer.vpcId });
            this.securityGroups = x.ec2.getSecurityGroups(this.vpc, name, args.securityGroups, { parent: this }) || [];
            return;
        }
        this.vpc = args.vpc || x.ec2.Vpc.getDefault({ parent: this });
        this.securityGroups = x.ec2.getSecurityGroups(this.vpc, name, args.securityGroups, { parent: this }) || [];
        const external = utils.ifUndefined(args.external, true);
        const lbArgs = Object.assign(Object.assign({}, args), { subnets: getSubnets(args, this.vpc, external), internal: external.apply(ex => !ex), securityGroups: this.securityGroups.map(g => g.id), tags: utils.mergeTags(args.tags, { Name: name }) });
        // If we're explicitly provided subnetMappings, then remove the `subnets` property
        // because they are mutually exclusive.
        if (lbArgs.subnetMappings) {
            delete lbArgs.subnets;
        }
        // We used to hash the name of an LB to keep the name short.  This was necessary back when
        // people didn't have direct control over creating the LB.  In awsx though creating the LB
        // is easy to do, so we just let the user pass in the name they want.  We simply add an
        // alias from the old name to the new one to keep things from being recreated.
        this.loadBalancer = new aws.lb.LoadBalancer(name, lbArgs, {
            parent: this,
            aliases: [{ name: args.name || utils.sha1hash(name) }],
        });
    }
    /**
     * Attaches a target to the first `listener` of this LoadBalancer.  If there are multiple
     * `listeners` you can add a target to specific listener to by calling `.attachTarget` directly
     * on it.
     */
    attachTarget(name, args, opts = {}) {
        if (this.listeners.length === 0) {
            throw new pulumi.ResourceError("Load balancer must have at least one [Listener] in order to attach a target.", this);
        }
        return this.listeners[0].attachTarget(name, args, opts);
    }
}
exports.LoadBalancer = LoadBalancer;
function getSubnets(args, vpc, external) {
    if (!args.subnets) {
        // No subnets requested.  Determine the subnets automatically from the vpc.
        return external.apply(e => e ? vpc.publicSubnetIds : vpc.privateSubnetIds);
    }
    return isLoadBalancerSubnets(args.subnets)
        ? args.subnets.subnets()
        : args.subnets;
}
function isLoadBalancerSubnets(obj) {
    return obj && obj.subnets instanceof Function;
}
function isLoadBalancerTargetInfoProvider(obj) {
    return obj.loadBalancerTargetInfo instanceof Function;
}
exports.isLoadBalancerTargetInfoProvider = isLoadBalancerTargetInfoProvider;
//# sourceMappingURL=loadBalancer.js.map