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
const topology = require("./vpcTopology");
const utils = require("../utils");
// Mapping from provider to Vpc. 'undefined' is used to encode the Vpc we create when no provider
// is passed in.
const providerToDefaultVpc = new Map();
class VpcData {
    /** @internal */
    constructor(name, parent, args, opts) {
        // Convenience properties.  Equivalent to getting the IDs from the corresponding XxxSubnets
        // properties.
        /** @internal */
        this.publicSubnetIds = [];
        /** @internal */
        this.privateSubnetIds = [];
        /** @internal */
        this.isolatedSubnetIds = [];
        /** @internal */
        this.publicSubnets = [];
        /** @internal */
        this.privateSubnets = [];
        /** @internal */
        this.isolatedSubnets = [];
        /**
         * @internal
         * The nat gateways created to allow private subnets access to the internet.
         * Only available if this was created using [VpcArgs].
         */
        this.natGateways = [];
        this.parent = parent;
        if (isExistingVpcArgs(args)) {
            this.vpc = args.vpc;
            this.id = this.vpc.id;
        }
        else if (isExistingVpcIdArgs(args)) {
            this.vpc = aws.ec2.Vpc.get(name, args.vpcId, {}, opts),
                this.id = this.vpc.id;
            getExistingSubnets(this, this.parent, name, "public", args.publicSubnetIds);
            getExistingSubnets(this, this.parent, name, "private", args.privateSubnetIds);
            getExistingSubnets(this, this.parent, name, "isolated", args.isolatedSubnetIds);
            // Pass along aliases so that the previously unparented resources are now properly parented
            // to the vpc.
            if (args.internetGatewayId) {
                const igName = `${name}-ig`;
                this.internetGateway = new x.ec2.InternetGateway(igName, parent, {
                    internetGateway: aws.ec2.InternetGateway.get(igName, args.internetGatewayId, {}, { parent }),
                }, { parent, aliases: [{ parent: pulumi.rootStackResource }] });
            }
            if (args.natGatewayIds) {
                for (let i = 0, n = args.natGatewayIds.length; i < n; i++) {
                    const natGatewayId = args.natGatewayIds[i];
                    const natName = `${name}-nat-${i}`;
                    this.natGateways.push(new x.ec2.NatGateway(natName, parent, {
                        natGateway: aws.ec2.NatGateway.get(natName, natGatewayId, {}, { parent }),
                    }, { parent, aliases: [{ parent: pulumi.rootStackResource }] }));
                }
            }
        }
        else {
            const cidrBlock = args.cidrBlock === undefined ? "10.0.0.0/16" : args.cidrBlock;
            const availabilityZones = args.availabilityZones;
            const numberOfNatGateways = args.numberOfNatGateways === undefined ? availabilityZones.length : args.numberOfNatGateways;
            const assignGeneratedIpv6CidrBlock = utils.ifUndefined(args.assignGeneratedIpv6CidrBlock, false);
            // We previously did not parent the underlying Vpc to this component. We now do. Provide
            // an alias so this doesn't cause resources to be destroyed/recreated for existing
            // stacks.
            this.vpc = new aws.ec2.Vpc(name, Object.assign(Object.assign({}, args), { cidrBlock, enableDnsHostnames: utils.ifUndefined(args.enableDnsHostnames, true), enableDnsSupport: utils.ifUndefined(args.enableDnsSupport, true), instanceTenancy: utils.ifUndefined(args.instanceTenancy, "default"), assignGeneratedIpv6CidrBlock }), { parent, aliases: [{ parent: pulumi.rootStackResource }] });
            this.id = this.vpc.id;
            const subnets = args.subnets || [
                { type: "public" },
                { type: "private" },
            ];
            this.partition(name, cidrBlock, availabilityZones, numberOfNatGateways, assignGeneratedIpv6CidrBlock, subnets, opts);
            // Create an internet gateway if we have public subnets.
            this.addInternetGateway(name, this.publicSubnets);
        }
    }
    /** @internal */
    partition(name, cidrBlock, availabilityZones, numberOfNatGateways, assignGeneratedIpv6CidrBlock, subnetArgs, opts) {
        // Create the appropriate subnets.  Default to a single public and private subnet for each
        // availability zone if none were specified.
        const { subnets, natGateways, natRoutes } = topology.create(this.parent, name, cidrBlock, this.vpc.ipv6CidrBlock, availabilityZones, numberOfNatGateways, assignGeneratedIpv6CidrBlock, subnetArgs);
        for (const desc of subnets) {
            // We previously did not parent the subnet to this component. We now do. Provide an
            // alias so this doesn't cause resources to be destroyed/recreated for existing
            // stacks.
            // Only set one of availabilityZone or availabilityZoneId
            const availabilityZone = desc.args.availabilityZone;
            const availabilityZoneId = availabilityZone ? undefined : desc.args.availabilityZoneId;
            const subnet = new x.ec2.Subnet(desc.subnetName, this.parent, Object.assign(Object.assign({}, desc.args), { availabilityZone,
                availabilityZoneId, tags: utils.mergeTags({ type: desc.type, Name: desc.subnetName }, desc.args.tags) }), { aliases: [{ parent: opts.parent }], ignoreChanges: desc.ignoreChanges, parent: this.parent });
            this.addSubnet(desc.type, subnet);
        }
        for (const desc of natGateways) {
            const publicSubnet = this.publicSubnets.find(s => s.subnetName === desc.publicSubnet);
            if (!publicSubnet) {
                throw new pulumi.ResourceError(`Could not find public subnet named ${desc.publicSubnet}`, this.parent);
            }
            this.addNatGateway(desc.name, { subnet: publicSubnet });
        }
        for (const desc of natRoutes) {
            const privateSubnet = this.privateSubnets.find(s => s.subnetName === desc.privateSubnet);
            if (!privateSubnet) {
                throw new pulumi.ResourceError(`Could not find private subnet named ${desc.privateSubnet}`, this.parent);
            }
            const natGateway = this.natGateways.find(g => g.natGatewayName === desc.natGateway);
            if (!natGateway) {
                throw new pulumi.ResourceError(`Could not find nat gateway named ${desc.natGateway}`, this.parent);
            }
            privateSubnet.createRoute(desc.name, natGateway);
        }
    }
    /** @internal */
    addSubnet(type, subnet) {
        this.getSubnets(type).push(subnet);
        this.getSubnetIds(type).push(subnet.id);
    }
    /** @internal */
    getSubnets(type) {
        switch (type) {
            case "public": return this.publicSubnets;
            case "private": return this.privateSubnets;
            case "isolated": return this.isolatedSubnets;
            default: throw new Error("Unexpected subnet type: " + type);
        }
    }
    /** @internal */
    getSubnetIds(type) {
        switch (type) {
            case "public": return this.publicSubnetIds;
            case "private": return this.privateSubnetIds;
            case "isolated": return this.isolatedSubnetIds;
            default: throw new Error("Unexpected subnet type: " + type);
        }
    }
    /**
     * @internal
     * Adds an [awsx.ec2.InternetGateway] to this VPC.  Will fail if this Vpc already has an
     * InternetGateway.
     *
     * @param subnets The subnets to route the InternetGateway to.  Will default to the [public]
     *        subnets of this Vpc if not specified.
     */
    addInternetGateway(name, subnets, args = {}, opts = {}) {
        if (this.internetGateway) {
            throw new Error("Cannot add InternetGateway to Vpc that already has one.");
        }
        // See https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html#Add_IGW_Attach_Gateway
        // for more details.
        this.internetGateway = new x.ec2.InternetGateway(name, this.parent, args, opts);
        subnets = subnets || this.publicSubnets;
        for (const subnet of subnets) {
            subnet.createRoute("ig", this.internetGateway);
        }
        return this.internetGateway;
    }
    /**
     * @internal
     * Adds an [awsx.ec2.NatGateway] to this VPC. The NatGateway must be supplied a subnet (normally
     * public) to be placed in.  After adding the NatGateway you should update the route table
     * associated with one or more of your private subnets to point Internet-bound traffic to the
     * NAT gateway. This enables instances in your private subnets to communicate with the internet.
     *
     * This can be done by calling [subnet.createRoute] and passing in the newly created NatGateway.
     */
    addNatGateway(name, args, opts = {}) {
        const natGateway = new x.ec2.NatGateway(name, this.parent, args, opts);
        this.natGateways.push(natGateway);
        return natGateway;
    }
}
VpcData.doNotCapture = true;
utils.Capture(VpcData.prototype).addInternetGateway.doNotCapture = true;
utils.Capture(VpcData.prototype).addNatGateway.doNotCapture = true;
utils.Capture(VpcData.prototype).partition.doNotCapture = true;
class Vpc extends pulumi.ComponentResource {
    constructor(name, args, opts = {}) {
        super("awsx:x:ec2:Vpc", name, { name, args, opts }, opts);
        const data = this.getData();
        this.id = pulumi.output(data.then(v => v.id));
        this.vpc = pulumi.output(data.then(d => d.vpc));
    }
    initialize(props) {
        const name = props.name;
        const args = props.args;
        const opts = props.opts;
        if (isExistingVpcArgs(args)) {
            return this.initializeExistingVpcArgs(name, args, opts);
        }
        else if (isDefaultVpcArgs(args)) {
            return this.initializeDefaultVpcArgs(name, args, opts);
        }
        else if (isExistingVpcIdArgs(args)) {
            return this.initializeExistingVpcIdArgs(name, args, opts);
        }
        else {
            return this.initializeVpcArgs(name, args, opts);
        }
    }
    /** @internal */
    async initializeExistingVpcArgs(name, args, opts) {
        return new VpcData(name, this, args, opts);
    }
    /** @internal */
    async initializeExistingVpcIdArgs(name, args, opts) {
        return new VpcData(name, this, args, opts);
    }
    /** @internal */
    async initializeDefaultVpcArgs(name, args, opts) {
        // back compat.  We always would just use the first two public subnets of the region
        // we're in.  So preserve that, even though we could get all of them here.  Pulling in
        // more than the two we pulled in before could have deep implications for clients as
        // those subnets are used to make many downstream resource-creating decisions.
        const vpcId = await args.vpcId;
        const provider = args.provider;
        const getSubnetsResult = await aws.ec2.getSubnets({ filters: [{ name: "vpcId", values: [vpcId] }] }, { provider, async: true });
        const publicSubnetIds = getSubnetsResult.ids.slice(0, 2);
        return new VpcData(name, this, {
            vpcId,
            publicSubnetIds,
        }, opts);
    }
    /** @internal */
    async initializeVpcArgs(name, args, opts) {
        var _a;
        const provider = Vpc.getProvider(opts);
        const availabilityZones = await getAvailabilityZones(opts.parent, provider, (_a = args.requestedAvailabilityZones, (_a !== null && _a !== void 0 ? _a : args.numberOfAvailabilityZones)));
        return new VpcData(name, this, Object.assign(Object.assign({}, args), { availabilityZones }), opts);
    }
    static getProvider(opts = {}) {
        // Pull out the provider to ensure we're looking up the default vpc in the right location.
        // Note that we do not pass 'parent' along as we want the default vpc to always be parented
        // logically by hte stack.
        const provider = opts.provider ? opts.provider :
            opts.parent ? opts.parent.getProvider("aws::") : undefined;
        return provider;
    }
    async addInternetGateway(name, subnets, args = {}, opts = {}) {
        const vpc = await this.getData();
        vpc.addInternetGateway(name, subnets, args, opts);
    }
    async addNatGateway(name, args, opts = {}) {
        const vpc = await this.getData();
        vpc.addNatGateway(name, args, opts);
    }
    /**
     * Get an existing Vpc resource's state with the given name and IDs of its relevant
     * sub-resources. This will not cause a VPC (or any sub-resources) to be created, and removing
     * this Vpc from your pulumi application will not cause the existing cloud resource (or
     * sub-resources) to be destroyed.
     */
    static fromExistingIds(name, idArgs, opts) {
        return new Vpc(name, idArgs, opts);
    }
    /**
     * Gets the default vpc for the current aws account and region.
     *
     * See https://docs.aws.amazon.com/vpc/latest/userguide/default-vpc.html for more details.
     *
     * Note: the no-arg version of this call is not recommended.  It will acquire the default Vpc
     * for the current region and cache it.  Instead, it is recommended that the `getDefault(opts)`
     * version be used instead with either `opts.provider` or `opts.parent` set.  This version will
     * properly get the default vpc for the region the provider specifies.
     *
     * This method will return the same Vpc instance when passed the same `provider`.
     */
    static getDefault(opts = {}) {
        // Pull out the provider to ensure we're looking up the default vpc in the right location.
        // Note that we do not pass 'parent' along as we want the default vpc to always be parented
        // logically by hte stack.
        const provider = Vpc.getProvider(opts);
        let vpc = providerToDefaultVpc.get(provider);
        if (!vpc) {
            const vpcName = "default-" + (provider ? provider.__name : "vpc");
            // For back compat with how we previously named things, also create an alias from
            // "default-vpc" to this name for the very first default Vpc we create as that's how we
            // used to name them.
            const aliases = providerToDefaultVpc.size === 0
                ? [{ name: "default-vpc" }]
                : [];
            // Also add an alias to "default-vpc-id".  This is the name we generated for
            // default-vpcs when we had sync data-sources.
            const vpcId = aws.ec2.getVpc({ default: true }, { provider, async: true }).then(r => r.id);
            aliases.push({ name: vpcId.then(vpcId => "default-" + vpcId) });
            vpc = new Vpc(vpcName, {
                isDefault: true,
                vpcId,
                provider,
            }, { provider, aliases });
            providerToDefaultVpc.set(provider, vpc);
        }
        return vpc;
    }
    // lifted members of VpcData
    /** @internal */
    async liftMember(func, def) {
        const data = await this.getData();
        if (!data) {
            return def;
        }
        return func(data);
    }
    /**
     * Asynchronously retrieves the IDs for the public subnets in this Vpc.  This will only retrieve
     * data for the subnets specified when the Vpc was created.  If subnets were created externally,
     * they will not be included.
     */
    get publicSubnetIds() { return this.liftMember(v => v.publicSubnetIds, []); }
    /**
     * Asynchronously retrieves the IDs for the private subnets in this Vpc.  This will only retrieve
     * data for the subnets specified when the Vpc was created.  If subnets were created externally,
     * they will not be included.
     */
    get privateSubnetIds() { return this.liftMember(v => v.privateSubnetIds, []); }
    /**
     * Asynchronously retrieves the IDs for the isolated subnets in this Vpc.  This will only retrieve
     * data for the subnets specified when the Vpc was created.  If subnets were created externally,
     * they will not be included.
     */
    get isolatedSubnetIds() { return this.liftMember(v => v.isolatedSubnetIds, []); }
    /**
     * Asynchronously retrieves the IDs for the subnets of a particular type in this Vpc.  This will
     * only retrieve data for the subnets specified when the Vpc was created.  If subnets were
     * created externally, they will not be included.
     */
    getSubnetsIds(type) { return this.liftMember(d => d.getSubnetIds(type), []); }
    /**
     * Asynchronously retrieves the public subnets in this Vpc.  This will only retrieve data for
     * the subnets specified when the Vpc was created.  If subnets were created externally, they
     * will not be included.
     */
    get publicSubnets() { return this.liftMember(v => v.publicSubnets, []); }
    /**
     * Asynchronously retrieves the private subnets in this Vpc.  This will only retrieve data for
     * the subnets specified when the Vpc was created.  If subnets were created externally, they
     * will not be included.
     */
    get privateSubnets() { return this.liftMember(v => v.privateSubnets, []); }
    /**
     * Asynchronously retrieves the isolated subnets in this Vpc.  This will only retrieve data for
     * the subnets specified when the Vpc was created.  If subnets were created externally, they
     * will not be included.
     */
    get isolatedSubnets() { return this.liftMember(v => v.isolatedSubnets, []); }
    /**
     * Asynchronously retrieves the subnets of a particular type in this Vpc.  This will only
     * retrieve data for the subnets specified when the Vpc was created.  If subnets were created
     * externally, they will not be included.
     */
    getSubnets(type) { return this.liftMember(d => d.getSubnets(type), []); }
    /**
     * The internet gateway created to allow traffic to/from the internet to the public subnets.
     * Only available if this was created using [VpcArgs].
     */
    get internetGateway() { return this.liftMember(v => v.internetGateway, undefined); }
    /**
     * The nat gateways created to allow private subnets access to the internet.
     * Only available if this was created using [VpcArgs].
     */
    get natGateways() { return this.liftMember(v => v.natGateways, []); }
}
exports.Vpc = Vpc;
utils.Capture(Vpc.prototype).addInternetGateway.doNotCapture = true;
utils.Capture(Vpc.prototype).addNatGateway.doNotCapture = true;
utils.Capture(Vpc.prototype).initializeDefaultVpcArgs.doNotCapture = true;
utils.Capture(Vpc.prototype).initializeExistingVpcArgs.doNotCapture = true;
utils.Capture(Vpc.prototype).initializeExistingVpcIdArgs.doNotCapture = true;
utils.Capture(Vpc.prototype).initializeVpcArgs.doNotCapture = true;
async function getAvailabilityZones(parent, provider, requestedZones = 2) {
    const result = await aws.getAvailabilityZones(/*args:*/ undefined, { provider, async: true });
    if (result.names.length !== result.zoneIds.length) {
        throw new pulumi.ResourceError("Availability zones for region had mismatched names and ids.", parent);
    }
    const descriptions = result.names.map((name, idx) => ({ name, id: result.zoneIds[idx] }));
    if (Array.isArray(requestedZones) || typeof requestedZones === "object") {
        return new Promise((resolve, reject) => {
            pulumi.Output.create(requestedZones).apply(requestedZones => {
                const mappedZones = descriptions.filter(zone => requestedZones.includes(zone.name));
                mappedZones.length === requestedZones.length ?
                    resolve(mappedZones) :
                    reject(new pulumi.ResourceError("Availability zones did not match requested zones", parent));
            });
        });
    }
    else {
        return descriptions.slice(0, requestedZones === "all" ? descriptions.length : requestedZones);
    }
}
function getExistingSubnets(vpcData, vpc, vpcName, type, inputs = []) {
    const subnets = vpcData.getSubnets(type);
    const subnetIds = vpcData.getSubnetIds(type);
    for (let i = 0, n = inputs.length; i < n; i++) {
        const subnetName = `${vpcName}-${type}-${i}`;
        const subnet = new x.ec2.Subnet(subnetName, vpc, {
            subnet: aws.ec2.Subnet.get(subnetName, inputs[i], /*state:*/ undefined, { parent: vpc }),
        }, { parent: vpc });
        subnets.push(subnet);
        subnetIds.push(subnet.id);
    }
}
getExistingSubnets.doNotCapture = true;
function isExistingVpcIdArgs(obj) {
    return !!obj.vpcId;
}
function isDefaultVpcArgs(obj) {
    return obj.isDefault === true;
}
function isExistingVpcArgs(obj) {
    return !!obj.vpc;
}
// Make sure our exported args shape is compatible with the overwrite shape we're trying to provide.
const test1 = utils.checkCompat();
//# sourceMappingURL=vpc.js.map