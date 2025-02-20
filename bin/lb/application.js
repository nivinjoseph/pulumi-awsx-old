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
const mod = require(".");
const x = require("..");
const utils = require("../utils");
/**
 * A application load balancer serves as the single point of contact for clients. The load balancer
 * distributes incoming application traffic across multiple targets, such as EC2 instances, in
 * multiple Availability Zones. This increases the availability of your application. You add one or
 * more listeners to your load balancer.
 *
 * See https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html for
 * more details.
 */
class ApplicationLoadBalancer extends mod.LoadBalancer {
    constructor(name, args = {}, opts = {}) {
        const argsCopy = Object.assign(Object.assign({ vpc: args.vpc || x.ec2.Vpc.getDefault(opts) }, args), { loadBalancerType: "application" });
        if (!argsCopy.securityGroups) {
            argsCopy.securityGroups = [new x.ec2.SecurityGroup(name, {
                    description: `Default security group for ALB: ${name}`,
                    vpc: argsCopy.vpc,
                }, opts)];
        }
        super("aws:lb:ApplicationLoadBalancer", name, argsCopy, pulumi.mergeOptions(opts, { aliases: [{ type: "awsx:x:elasticloadbalancingv2:ApplicationLoadBalancer" }] }));
        this.listeners = [];
        this.targetGroups = [];
        this.registerOutputs();
    }
    /**
     * Creates a new listener for this [ApplicationLoadBalancer] see ApplicationListener for more
     * details.
     */
    createListener(name, args, opts = {}) {
        return new ApplicationListener(name, Object.assign({ loadBalancer: this }, args), Object.assign({ parent: this }, opts));
    }
    /**
     * Creates a target group for this [ApplicationLoadBalancer] see ApplicationTargetGroup for more
     * details.
     */
    createTargetGroup(name, args, opts = {}) {
        return new ApplicationTargetGroup(name, Object.assign({ loadBalancer: this }, args), Object.assign({ parent: this }, opts));
    }
}
exports.ApplicationLoadBalancer = ApplicationLoadBalancer;
/**
 * Each target group routes requests to one or more registered targets, such as EC2 instances, using
 * the protocol and port number that you specify. You can register a target with multiple target
 * groups. You can configure health checks on a per target group basis. Health checks are performed
 * on all targets registered to a target group that is specified in a listener rule for your load
 * balancer.
 */
class ApplicationTargetGroup extends mod.TargetGroup {
    constructor(name, args = {}, opts = {}) {
        const loadBalancer = args.loadBalancer || new ApplicationLoadBalancer(name, {
            vpc: args.vpc,
            name: args.name,
        }, opts);
        const { port, protocol } = args.targetGroup ? { port: undefined, protocol: undefined } : computePortInfo(args.port, args.protocol);
        opts = pulumi.mergeOptions(opts, { aliases: [{ type: "awsx:x:elasticloadbalancingv2:ApplicationTargetGroup" }] });
        super("awsx:lb:ApplicationTargetGroup", name, loadBalancer, Object.assign(Object.assign({}, args), { vpc: loadBalancer.vpc, port,
            protocol }), opts);
        this.__isApplicationTargetGroup = true;
        this.listeners = [];
        this.loadBalancer = loadBalancer;
        loadBalancer.targetGroups.push(this);
        this.registerOutputs();
    }
    createListener(name, args, opts = {}) {
        // We didn't use to parent the listener to the target group.  Now we do.  Create an alias
        // from the old parent to the current one if this moves over.
        return new ApplicationListener(name, Object.assign({ defaultAction: this, loadBalancer: this.loadBalancer }, args), Object.assign({ parent: this }, pulumi.mergeOptions(opts, { aliases: [{ parent: opts.parent }] })));
    }
    static isInstance(obj) {
        return utils.isInstance(obj, "__isApplicationTargetGroup");
    }
}
exports.ApplicationTargetGroup = ApplicationTargetGroup;
function computePortInfo(port, protocol) {
    if (port === undefined && protocol === undefined) {
        throw new Error("At least one of [port] or [protocol] must be provided.");
    }
    const computedPort = pulumi.all([port, protocol]).apply(([port, protocol]) => {
        if (port !== undefined) {
            return port;
        }
        switch (protocol) {
            case "HTTP": return 80;
            case "HTTPS": return 443;
            default: throw new Error(`Could not automatically determine port for protocol ${JSON.stringify(protocol)}. Please provide an explicit port.`);
        }
    });
    protocol = pulumi.all([port, protocol]).apply(([port, protocol]) => {
        if (protocol !== undefined) {
            return protocol;
        }
        switch (port) {
            case 80:
            case 8000:
            case 8008:
            case 8080: return "HTTP";
            case 443:
            case 8443: return "HTTPS";
            default: throw new Error(`Could not automatically determine protocol for port ${JSON.stringify(port)}. Please specify either "HTTP" or "HTTPS"`);
        }
    });
    return { port: computedPort, protocol };
}
class ApplicationListener extends mod.Listener {
    constructor(name, args, opts = {}) {
        var _a, _b;
        const argCount = (args.defaultAction ? 1 : 0) +
            (args.defaultActions ? 1 : 0) +
            (args.targetGroup ? 1 : 0);
        if (argCount >= 2) {
            throw new Error("Only provide one of [defaultAction], [defaultActions] or [targetGroup].");
        }
        const loadBalancer = pulumi.Resource.isInstance(args.loadBalancer)
            ? args.loadBalancer
            : new ApplicationLoadBalancer(name, Object.assign(Object.assign({}, args.loadBalancer), { vpc: args.vpc, name: args.name }), opts);
        const { port, protocol } = computePortInfo(args.port || ((_a = args.listener) === null || _a === void 0 ? void 0 : _a.port), args.protocol || ((_b = args.listener) === null || _b === void 0 ? void 0 : _b.protocol));
        const { defaultActions, defaultListener } = getDefaultActions(name, loadBalancer, args, port, protocol, opts);
        // Pass along the target as the defaultTarget for this listener.  This allows this listener
        // to defer to it for ContainerPortMappings information.  this allows this listener to be
        // passed in as the portMappings information needed for a Service.
        opts = pulumi.mergeOptions(opts, { aliases: [{ type: "awsx:x:elasticloadbalancingv2:ApplicationListener" }] });
        super("awsx:lb:ApplicationListener", name, defaultListener, Object.assign(Object.assign({}, args), { defaultActions,
            loadBalancer,
            port,
            protocol }), opts);
        this.__isApplicationListenerInstance = true;
        this.loadBalancer = loadBalancer;
        loadBalancer.listeners.push(this);
        // As per https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-update-security-groups.html
        //
        // Whenever you add a listener to your load balancer or update the health check port for a
        // target group used by the load balancer to route requests, you must verify that the
        // security groups associated with the load balancer allow traffic on the new port in both
        // directions.
        if (!args.listener && args.external !== false) {
            const args = {
                location: new x.ec2.AnyIPv4Location(),
                ports: new x.ec2.TcpPorts(port),
                description: pulumi.interpolate `Externally available at port ${port}`,
            };
            for (let i = 0, n = this.loadBalancer.securityGroups.length; i < n; i++) {
                const securityGroup = this.loadBalancer.securityGroups[i];
                securityGroup.createIngressRule(`${name}-external-${i}-ingress`, args, { parent: this });
                securityGroup.createEgressRule(`${name}-external-${i}-egress`, args, { parent: this });
            }
        }
        this.registerOutputs();
    }
    /** @internal */
    static isApplicationListenerInstance(obj) {
        return obj && !!obj.__isApplicationListenerInstance;
    }
}
exports.ApplicationListener = ApplicationListener;
function getDefaultActions(name, loadBalancer, args, port, protocol, opts) {
    if (args.defaultActions) {
        return { defaultActions: args.defaultActions, defaultListener: undefined };
    }
    if (args.defaultAction) {
        return x.lb.isListenerDefaultAction(args.defaultAction)
            ? { defaultActions: [args.defaultAction.listenerDefaultAction()], defaultListener: args.defaultAction }
            : { defaultActions: [args.defaultAction], defaultListener: undefined };
    }
    // User didn't provide default actions for this listener.  Create a reasonable target group for
    // us and use that as our default action.
    const targetGroup = createTargetGroup();
    return { defaultActions: [targetGroup.listenerDefaultAction()], defaultListener: targetGroup };
    function createTargetGroup() {
        // Use the target group if provided by the client.  Otherwise, create a reasonable default
        // one for our LB that will connect to this listener's port using our app protocol.
        if (pulumi.Resource.isInstance(args.targetGroup)) {
            return args.targetGroup;
        }
        else if (args.targetGroup) {
            return new ApplicationTargetGroup(name, Object.assign(Object.assign({}, args.targetGroup), { loadBalancer }), opts);
        }
        else {
            return new ApplicationTargetGroup(name, {
                port,
                protocol,
                loadBalancer,
                name: args.name,
            }, opts);
        }
    }
}
//# sourceMappingURL=application.js.map