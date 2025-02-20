import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as x from "..";
export declare class AutoScalingLaunchConfiguration extends pulumi.ComponentResource {
    readonly launchConfiguration: aws.ec2.LaunchConfiguration;
    readonly id: pulumi.Output<string>;
    readonly securityGroups: x.ec2.SecurityGroup[];
    readonly instanceProfile: aws.iam.InstanceProfile;
    /**
     * Name to give the auto-scaling-group's cloudformation stack name.
     */
    readonly stackName: pulumi.Output<string>;
    constructor(name: string, vpc: x.ec2.Vpc, args?: AutoScalingLaunchConfigurationArgs, opts?: pulumi.ComponentResourceOptions);
    static defaultInstanceProfilePolicyDocument(): aws.iam.PolicyDocument;
    static defaultInstanceProfilePolicyARNs(): string[];
    /**
     * Creates the [instanceProfile] for a [ClusterAutoScalingLaunchConfiguration] if not provided
     * explicitly. If [assumeRolePolicy] is provided it will be used when creating the task,
     * otherwise [defaultInstanceProfilePolicyDocument] will be used.  If [policyArns] are provided,
     * they will be used to create [RolePolicyAttachment]s for the Role.  Otherwise,
     * [defaultInstanceProfilePolicyARNs] will be used.
     */
    static createInstanceProfile(name: string, assumeRolePolicy?: string | aws.iam.PolicyDocument, policyArns?: string[], opts?: pulumi.ComponentResourceOptions): import("@pulumi/aws/iam/instanceProfile").InstanceProfile;
}
/**
 * The set of arguments when creating the launch configuration for a cluster's autoscaling group.
 */
export interface AutoScalingLaunchConfigurationArgs {
    /**
     * Associate a public ip address with an instance in a VPC.
     */
    associatePublicIpAddress?: pulumi.Input<boolean>;
    /**
     * If true, the launched EC2 instance will be EBS-optimized.
     */
    ebsOptimized?: pulumi.Input<boolean>;
    /**
     * Enables/disables detailed monitoring. This is enabled by default.
     */
    enableMonitoring?: pulumi.Input<boolean>;
    /**
     * Customize Ephemeral (also known as
     * "Instance Store") volumes on the instance. See Block Devices below for details.
     */
    ephemeralBlockDevices?: aws.ec2.LaunchConfigurationArgs["ephemeralBlockDevices"];
    /**
     * The name attribute of the IAM instance profile to associate
     * with launched instances.
     */
    iamInstanceProfile?: pulumi.Input<string | aws.iam.InstanceProfile>;
    /**
     * The key name that should be used for the instance.
     */
    keyName?: pulumi.Input<string>;
    /**
     * The name of the launch configuration. If you leave
     * this blank, Terraform will auto-generate a unique name.
     */
    name?: pulumi.Input<string>;
    /**
     * Creates a unique name beginning with the specified
     * prefix. Conflicts with `name`.
     */
    namePrefix?: pulumi.Input<string>;
    /**
     * The maximum price to use for reserving spot instances.
     */
    spotPrice?: pulumi.Input<string>;
    /**
     * Can be used instead of `user_data` to pass base64-encoded binary data directly. Use this
     * instead of `user_data` whenever the value is not a valid UTF-8 string. For example,
     * gzip-encoded user data must be base64-encoded and passed via this argument to avoid
     * corruption.
     */
    userDataBase64?: pulumi.Input<string>;
    /**
     * The ID of a ClassicLink-enabled VPC. Only applies to EC2-Classic instances. (eg. `vpc-2730681a`)
     */
    vpcClassicLinkId?: pulumi.Input<string>;
    /**
     * The IDs of one or more security groups for the specified ClassicLink-enabled VPC (eg. `sg-46ae3d11`).
     */
    vpcClassicLinkSecurityGroups?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * The name of the stack the launch configuration will signal.
     */
    stackName?: pulumi.Input<string>;
    /**
     * The instance profile to use for the autoscaling group.  If not provided, a default one will
     * be created.
     */
    instanceProfile?: aws.iam.InstanceProfile;
    /**
     * The EC2 image ID to launch.  If this is not provided, then [ecsOptimizedAMIName] will be
     * used. If neither are provided the imageId for Amazon'
     * `"/aws/service/ecs/optimized-ami/amazon-linux/recommended"` image will be used.
     */
    imageId?: pulumi.Input<string>;
    /**
     * The name of the ECS-optimzed AMI to use for the Container Instances in this cluster, e.g.
     * "amzn-ami-2017.09.l-amazon-ecs-optimized". Defaults to using the latest recommended ECS Linux
     * Optimized AMI, which may change over time and cause recreation of EC2 instances when new
     * versions are release. To control when these changes are adopted, set this parameter
     * explicitly to the version you would like to use.
     *
     * See http://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-optimized_AMI.html for
     * valid values.
     */
    ecsOptimizedAMIName?: string;
    /**
     * The size of instance to launch.  Defaults to t2.micro if unspecified.
     */
    instanceType?: pulumi.Input<aws.ec2.InstanceType>;
    /**
     * The tenancy of the instance. Valid values are `"default"` or `"dedicated"`, see
     * http://docs.aws.amazon.com/AutoScaling/latest/APIReference/API_CreateLaunchConfiguration.html
     * for more details.  Default is "default" if unspecified.
     */
    placementTenancy?: pulumi.Input<"default" | "dedicated">;
    /**
     * Customize details about the root block device of the instance. See Block Devices below for
     * details.
     *
     * If not provided, an 32gb 'gp2' root device will be created.  This device will be deleted upon
     * termination.
     */
    rootBlockDevice?: aws.ec2.LaunchConfigurationArgs["rootBlockDevice"];
    /**
     * Additional EBS block devices to attach to the instance.  See Block Devices below for details.
     *
     * If not provided, a 5gb 'gp2' device will be mounted at '/dev/xvdb' and a 50gb 'gp2' device
     * will be mounted at '/dev/xvdcz'.  Both devices will be deleted upon termination.
     */
    ebsBlockDevices?: aws.ec2.LaunchConfigurationArgs["ebsBlockDevices"];
    /**
    * A list of associated security group IDs.
    */
    securityGroups?: x.ec2.SecurityGroupOrId[];
    /**
     * The user data to provide when launching the instance. Do not pass gzip-compressed data via this argument; see `user_data_base64` instead.
     */
    userData?: pulumi.Input<string> | AutoScalingUserData;
}
export interface AutoScalingUserData {
    /**
     * Additional lines to be placed in the `runcmd` section of the launch configuration.
     */
    extraRuncmdLines?(): pulumi.Input<UserDataLine[]>;
    /**
     * Additional lines to be placed in the `bootcmd` section of the launch configuration.
     */
    extraBootcmdLines?(): pulumi.Input<UserDataLine[]>;
}
/**
 * A line that should be added to the [userData] section of a LaunchConfiguration template.
 */
export interface UserDataLine {
    /**
     * Actual contents of the line.
     */
    contents: string;
    /**
     * Whether the line should be automatically indented to the right level.  Defaults to [true].
     * Set explicitly to [false] to control all indentation.
     */
    automaticallyIndent?: boolean;
}
