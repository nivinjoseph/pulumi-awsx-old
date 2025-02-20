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
const roleUtils = require("../role");
const utils = require("../utils");
class AutoScalingLaunchConfiguration extends pulumi.ComponentResource {
    constructor(name, vpc, args = {}, opts = {}) {
        super("awsx:x:autoscaling:AutoScalingLaunchConfiguration", name, {}, opts);
        // Create the full name of our CloudFormation stack here explicitly. Since the CFN stack
        // references the launch configuration and vice-versa, we use this to break the cycle.
        // TODO[pulumi/pulumi#381]: Creating an S3 bucket is an inelegant way to get a durable,
        // unique name.
        this.stackName = pulumi.output(args.stackName).apply(sn => sn ? pulumi.output(sn) : new aws.s3.Bucket(name, {}, { parent: this }).id);
        // Use the instance provided, or create a new one.
        this.instanceProfile = args.instanceProfile ||
            AutoScalingLaunchConfiguration.createInstanceProfile(name, /*assumeRolePolicy:*/ undefined, /*policyArns:*/ undefined, { parent: this });
        this.securityGroups = x.ec2.getSecurityGroups(vpc, name, args.securityGroups, { parent: this }) || [];
        this.launchConfiguration = new aws.ec2.LaunchConfiguration(name, Object.assign(Object.assign({}, args), { securityGroups: this.securityGroups.map(g => g.id), imageId: utils.ifUndefined(args.imageId, getEcsAmiId(args.ecsOptimizedAMIName, { parent: this })), instanceType: utils.ifUndefined(args.instanceType, "t2.micro"), iamInstanceProfile: this.instanceProfile.id, enableMonitoring: utils.ifUndefined(args.enableMonitoring, true), placementTenancy: utils.ifUndefined(args.placementTenancy, "default"), rootBlockDevice: utils.ifUndefined(args.rootBlockDevice, defaultRootBlockDevice), ebsBlockDevices: utils.ifUndefined(args.ebsBlockDevices, defaultEbsBlockDevices), userData: getInstanceUserData(args, this.stackName) }), { parent: this });
        this.id = this.launchConfiguration.id;
        this.registerOutputs();
    }
    static defaultInstanceProfilePolicyDocument() {
        return {
            Version: "2012-10-17",
            Statement: [{
                    Action: [
                        "sts:AssumeRole",
                    ],
                    Effect: "Allow",
                    Principal: {
                        Service: ["ec2.amazonaws.com"],
                    },
                }],
        };
    }
    static defaultInstanceProfilePolicyARNs() {
        return [aws.iam.ManagedPolicies.AmazonEC2ContainerServiceforEC2Role, aws.iam.ManagedPolicies.AmazonEC2ReadOnlyAccess];
    }
    /**
     * Creates the [instanceProfile] for a [ClusterAutoScalingLaunchConfiguration] if not provided
     * explicitly. If [assumeRolePolicy] is provided it will be used when creating the task,
     * otherwise [defaultInstanceProfilePolicyDocument] will be used.  If [policyArns] are provided,
     * they will be used to create [RolePolicyAttachment]s for the Role.  Otherwise,
     * [defaultInstanceProfilePolicyARNs] will be used.
     */
    static createInstanceProfile(name, assumeRolePolicy, policyArns, opts) {
        const { role, policies } = roleUtils.createRoleAndPolicies(name, assumeRolePolicy || AutoScalingLaunchConfiguration.defaultInstanceProfilePolicyDocument(), policyArns || AutoScalingLaunchConfiguration.defaultInstanceProfilePolicyARNs(), opts);
        return new aws.iam.InstanceProfile(name, { role }, Object.assign(Object.assign({}, opts), { dependsOn: policies }));
    }
}
exports.AutoScalingLaunchConfiguration = AutoScalingLaunchConfiguration;
// http://docs.aws.amazon.com/AmazonECS/latest/developerguide/container_agent_versions.html
async function getEcsAmiId(name, opts) {
    // If a name was not provided, use the latest recommended version.
    if (!name) {
        // https://docs.aws.amazon.com/AmazonECS/latest/developerguide/retrieve-ecs-optimized_AMI.html
        const ecsRecommendedAMI = await aws.ssm.getParameter({
            name: "/aws/service/ecs/optimized-ami/amazon-linux/recommended",
        }, Object.assign(Object.assign({}, opts), { async: true }));
        return JSON.parse(ecsRecommendedAMI.value).image_id;
    }
    // Else, if a name was provided, look it up and use that imageId.
    const result = await aws.ec2.getAmi({
        owners: [
            "591542846629",
        ],
        filters: [
            {
                name: "name",
                values: [name],
            },
        ],
        mostRecent: true,
    }, Object.assign(Object.assign({}, opts), { async: true }));
    return result.imageId;
}
const defaultRootBlockDevice = {
    volumeSize: 32,
    volumeType: "gp2",
    deleteOnTermination: true,
};
const defaultEbsBlockDevices = [{
        // Swap volume
        deviceName: "/dev/xvdb",
        volumeSize: 5,
        volumeType: "gp2",
        deleteOnTermination: true,
    }, {
        // Docker image and metadata volume
        deviceName: "/dev/xvdcz",
        volumeSize: 50,
        volumeType: "gp2",
        deleteOnTermination: true,
    }];
// http://cloudinit.readthedocs.io/en/latest/topics/format.html#cloud-config-data
// ours seems inspired by:
// https://github.com/convox/rack/blob/023831d8/provider/aws/dist/rack.json#L1669
// https://github.com/awslabs/amazon-ecs-amazon-efs/blob/d92791f3/amazon-efs-ecs.json#L655
function getInstanceUserData(args, cloudFormationStackName) {
    const autoScalingUserData = args.userData;
    if (args.userData !== undefined && !isAutoScalingUserData(args.userData)) {
        return args.userData;
    }
    const additionalBootcmdLines = getAdditionalBootcmdLines(autoScalingUserData);
    const additionalRuncmdLines = getAdditionalRuncmdLines(autoScalingUserData);
    return pulumi.all([additionalBootcmdLines, additionalRuncmdLines, cloudFormationStackName])
        .apply(([additionalBootcmdLines, additionalRuncmdLines, cloudFormationStackName]) => {
        let userData = `#cloud-config
        repo_upgrade_exclude:
            - kernel*
        packages:
            - aws-cfn-bootstrap
            - aws-cli
            - nfs-utils
        mounts:
            - ['/dev/xvdb', 'none', 'swap', 'sw', '0', '0']
        bootcmd:
            - mkswap /dev/xvdb
            - swapon /dev/xvdb
            - echo ECS_ENGINE_AUTH_TYPE=docker >> /etc/ecs/ecs.config
`;
        userData += collapseLines(additionalBootcmdLines);
        userData +=
            `        runcmd:
            # Set and use variables in the same command, since it's not obvious if
            # different commands will run in different shells.
            - |
                # Knock one letter off of availability zone to get region.
                AWS_AVAILABILITY_ZONE=$(curl -s 169.254.169.254/2016-09-02/meta-data/placement/availability-zone)
                AWS_REGION=$(echo $AWS_AVAILABILITY_ZONE | sed 's/.$//')

`;
        userData += collapseLines(additionalRuncmdLines);
        userData += `
                # Disable container access to EC2 metadata instance
                # See http://docs.aws.amazon.com/AmazonECS/latest/developerguide/instance_IAM_role.html
                iptables --insert FORWARD 1 --in-interface docker+ --destination 169.254.169.254/32 --jump DROP
                service iptables save

                /opt/aws/bin/cfn-signal \
                    --region "\${AWS_REGION}" \
                    --stack "${cloudFormationStackName}" \
                    --resource Instances
        `;
        return userData;
    });
}
function collapseLines(additionalBootcmdLines) {
    let result = "";
    for (const line of additionalBootcmdLines) {
        let contents = line.contents;
        // By default, automatically indent.  Do not indent only in the case where the client
        // explicitly passes 'false'.
        if (line.automaticallyIndent !== false) {
            contents = "            " + contents;
            if (contents[contents.length - 1] !== "\n") {
                contents += "\n";
            }
        }
        result += contents;
    }
    return result;
}
function getAdditionalBootcmdLines(args) {
    if (!args || !args.extraBootcmdLines) {
        return pulumi.output([]);
    }
    return pulumi.output(args.extraBootcmdLines());
}
function getAdditionalRuncmdLines(args) {
    if (!args || !args.extraRuncmdLines) {
        return pulumi.output([]);
    }
    return pulumi.output(args.extraRuncmdLines());
}
function isAutoScalingUserData(obj) {
    return obj !== undefined &&
        (obj.extraBootcmdLines instanceof Function ||
            obj.extraRuncmdLines instanceof Function);
}
// Make sure our exported args shape is compatible with the overwrite shape we're trying to provide.
const test2 = utils.checkCompat();
//# sourceMappingURL=launchConfiguration.js.map