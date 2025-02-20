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
class NatGateway extends pulumi.ComponentResource {
    constructor(name, vpc, args, opts = {}) {
        super("awsx:x:ec2:NatGateway", name, {}, Object.assign({ parent: vpc }, opts));
        this.vpc = vpc;
        this.natGatewayName = name;
        if (isExistingNatGatewayArgs(args)) {
            this.natGateway = args.natGateway;
        }
        else {
            // from https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html
            //
            // you must also specify an Elastic IP address to associate with the NAT gateway
            // when you create it. After you've created a NAT gateway, you must update the route
            // table associated with one or more of your private subnets to point Internet-bound
            // traffic to the NAT gateway. This enables instances in your private subnets to
            // communicate with the internet.
            this.elasticIP = new aws.ec2.Eip(name, {
                // vpc: true,
                domain: "vpc",
                tags: { Name: name },
            }, { parent: this });
            const subnetId = x.ec2.Subnet.isSubnetInstance(args.subnet)
                ? args.subnet.id
                : args.subnet;
            this.natGateway = new aws.ec2.NatGateway(name, Object.assign(Object.assign({}, args), { subnetId, allocationId: this.elasticIP.id }), { parent: this });
        }
        this.registerOutputs();
    }
    route(name, opts) {
        return {
            // From https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html#nat-gateway-create-route
            // Choose Add another route. For Destination, type 0.0.0.0/0. For Target, select the ID
            // of your NAT gateway.
            destinationCidrBlock: "0.0.0.0/0",
            natGatewayId: this.natGateway.id,
        };
    }
}
exports.NatGateway = NatGateway;
function isExistingNatGatewayArgs(obj) {
    return !!obj.natGateway;
}
//# sourceMappingURL=natGateway.js.map