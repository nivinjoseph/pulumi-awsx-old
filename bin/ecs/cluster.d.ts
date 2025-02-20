import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as x from "..";
/**
 * A Cluster is a general purpose ECS cluster configured to run in a provided Network.
 */
export declare class Cluster extends pulumi.ComponentResource implements x.autoscaling.AutoScalingUserData {
    readonly cluster: aws.ecs.Cluster;
    readonly id: pulumi.Output<string>;
    /**
     * The network in which to create this cluster.
     */
    readonly vpc: x.ec2.Vpc;
    /**
     * Security groups associated with this this ECS Cluster.
     */
    readonly securityGroups: x.ec2.SecurityGroup[];
    readonly extraBootcmdLines: () => pulumi.Input<x.autoscaling.UserDataLine[]>;
    readonly autoScalingGroups: x.autoscaling.AutoScalingGroup[];
    constructor(name: string, args?: ClusterArgs, opts?: pulumi.ComponentResourceOptions);
    addAutoScalingGroup(group: x.autoscaling.AutoScalingGroup): void;
    /**
     * Creates a new autoscaling group and adds it to the list of autoscaling groups targeting this
     * cluster.  The autoscaling group will be created with is network set to the same network as
     * this cluster as well as using this cluster to initialize both its securityGroups and
     * launchConfiguration userData.
     */
    createAutoScalingGroup(name: string, args?: x.autoscaling.AutoScalingGroupArgs, opts?: pulumi.ComponentResourceOptions): x.autoscaling.AutoScalingGroup;
    /**
     * Gets or creates a cluster that can be used by default for the current aws account and region.
     * The cluster will use the default Vpc for the account and will be provisioned with a security
     * group created by [createDefaultSecurityGroup].
     */
    static getDefault(opts?: pulumi.ComponentResourceOptions): Cluster;
    static createDefaultSecurityGroup(name: string, vpc?: x.ec2.Vpc, opts?: pulumi.ComponentResourceOptions): x.ec2.SecurityGroup;
    static createDefaultSecurityGroupEgressRules(name: string, securityGroup: x.ec2.SecurityGroup): x.ec2.EgressSecurityGroupRule[];
    static createDefaultSecurityGroupIngressRules(name: string, securityGroup: x.ec2.SecurityGroup): x.ec2.IngressSecurityGroupRule[];
}
/**
 * Arguments bag for creating infrastructure for a new Cluster.
 */
export interface ClusterArgs {
    /**
     * List of short names of one or more capacity providers to associate with the cluster.
     * Valid values also include `FARGATE` and `FARGATE_SPOT`.
     */
    /**
     * The capacity provider strategy to use by default for the cluster. Can be one or more.
     */
    /**
     * Configuration block(s) with cluster settings. For example, this can be used to enable CloudWatch Container Insights for a cluster.
     */
    settings?: aws.ecs.ClusterArgs["settings"];
    /**
     * The network in which to create this cluster.  If not provided, Vpc.getDefault() will be
     * used.
     */
    vpc?: x.ec2.Vpc;
    /**
     * An existing aws.ecs.Cluster (or the name of an existing aws.ecs.Cluster) to use for this
     * awsx.ecs.Cluster.  If not provided, a default one will be created.
     *
     * Note: If passing a string, use the *name* of an existing ECS Cluster instead of its *id*.
     */
    cluster?: aws.ecs.Cluster | pulumi.Input<string>;
    /**
     * The name of the cluster (up to 255 letters, numbers, hyphens, and underscores)
     */
    name?: pulumi.Input<string>;
    /**
     * The security group to place new instances into.  If not provided, a default will be
     * created. Pass an empty array to create no security groups.
     */
    securityGroups?: x.ec2.SecurityGroupOrId[];
    /**
     * Key-value mapping of resource tags
     */
    tags?: pulumi.Input<aws.Tags>;
}
