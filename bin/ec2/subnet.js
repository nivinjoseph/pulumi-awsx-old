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
const utils = require("../utils");
class Subnet extends pulumi.ComponentResource {
    constructor(name, vpc, args, opts = {}) {
        super("awsx:x:ec2:Subnet", name, {}, Object.assign({ parent: vpc }, opts));
        // tslint:disable-next-line:variable-name
        this.__isSubnetInstance = true;
        this.routes = [];
        this.vpc = vpc;
        this.subnetName = name;
        if (isExistingSubnetArgs(args)) {
            this.subnet = args.subnet;
            this.id = args.subnet.id;
            // TODO(cyrusn): We should be able to find the existing RouteTable and RouteTableAssociation
            // when importing a subnet.
        }
        else {
            // Allow the individual subnet to decide it if wants an ipv6 address assigned at
            // creation. If not specified, assign by default if the Vpc has ipv6 assigned to
            // it, don't assign otherwise.
            const assignIpv6AddressOnCreation = utils.ifUndefined(args.assignIpv6AddressOnCreation, vpc.vpc.assignGeneratedIpv6CidrBlock);
            this.subnet = new aws.ec2.Subnet(name, Object.assign(Object.assign({ vpcId: vpc.id }, args), { assignIpv6AddressOnCreation }), {
                parent: this,
                // See https://github.com/pulumi/pulumi-awsx/issues/398.
                ignoreChanges: opts.ignoreChanges,
            });
            this.routeTable = new aws.ec2.RouteTable(name, {
                vpcId: vpc.id,
            }, { parent: this });
            this.routeTableAssociation = new aws.ec2.RouteTableAssociation(name, {
                routeTableId: this.routeTable.id,
                subnetId: this.subnet.id,
            }, { parent: this, customTimeouts: {
                    create: "5m",
                    delete: "5m",
                } });
            this.id = pulumi.all([this.subnet.id, this.routeTableAssociation.id])
                .apply(([id]) => id);
        }
        this.registerOutputs();
    }
    /** @internal */
    static isSubnetInstance(obj) {
        return !!obj.__isSubnetInstance;
    }
    createRoute(name, argsOrProvider, opts = {}) {
        if (!this.routeTable) {
            throw new Error("Cannot call [createRoute] on a [Subnet] that doesn't have a [RouteTable]");
        }
        opts = Object.assign({ parent: this, customTimeouts: {
                create: "5m",
                delete: "5m",
            } }, opts);
        const args = isSubnetRouteProvider(argsOrProvider)
            ? argsOrProvider.route(name, { parent: this })
            : argsOrProvider;
        this.routes.push(new aws.ec2.Route(`${this.subnetName}-${name}`, Object.assign(Object.assign({}, args), { routeTableId: this.routeTable.id }), opts));
    }
}
exports.Subnet = Subnet;
utils.Capture(Subnet.prototype).createRoute.doNotCapture = true;
function isSubnetRouteProvider(obj) {
    return obj.route instanceof Function;
}
function isExistingSubnetArgs(obj) {
    return !!obj.subnet;
}
// Make sure our exported args shape is compatible with the overwrite shape we're trying to provide.
const test1 = utils.checkCompat();
const test2 = utils.checkCompat();
//# sourceMappingURL=subnet.js.map