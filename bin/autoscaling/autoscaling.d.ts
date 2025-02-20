import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as x from "..";
import { AutoScalingLaunchConfiguration, AutoScalingLaunchConfigurationArgs } from "./launchConfiguration";
import { ScheduleArgs } from "./schedule";
import * as stepScaling from "./stepScaling";
import * as targetTracking from "./targetTracking";
export declare class AutoScalingGroup extends pulumi.ComponentResource {
    readonly vpc: x.ec2.Vpc;
    /**
     * The [cloudformation.Stack] that was used to create this [AutoScalingGroup].  [CloudFormation]
     * is used here as the existing AWS apis for creating [AutoScalingGroup]s are not rich enough to
     * express everything that can be configured through [CloudFormation] itself.
     */
    readonly stack: aws.cloudformation.Stack;
    /**
     * The launch configuration for this auto scaling group.
     */
    readonly launchConfiguration: AutoScalingLaunchConfiguration;
    /**
     * Underlying [autoscaling.Group] that is created by cloudformation.
     */
    readonly group: aws.autoscaling.Group;
    /**
     * Target groups this [AutoScalingGroup] is attached to.  See
     * https://docs.aws.amazon.com/autoscaling/ec2/userguide/attach-load-balancer-asg.html
     * for more details.
     */
    readonly targetGroups: x.lb.TargetGroup[];
    constructor(name: string, args: AutoScalingGroupArgs, opts?: pulumi.ComponentResourceOptions);
    scaleOnSchedule(name: string, args: ScheduleArgs, opts?: pulumi.CustomResourceOptions): import("@pulumi/aws/autoscaling/schedule").Schedule;
    /**
     * With target tracking scaling policies, you select a scaling metric and set a target value.
     * Amazon EC2 Auto Scaling creates and manages the CloudWatch alarms that trigger the scaling
     * policy and calculates the scaling adjustment based on the metric and the target value. The
     * scaling policy adds or removes capacity as required to keep the metric at, or close to, the
     * specified target value. In addition to keeping the metric close to the target value, a target
     * tracking scaling policy also adjusts to the changes in the metric due to a changing load
     * pattern.
     *
     * For example, you can use target tracking scaling to:
     *
     * * Configure a target tracking scaling policy to keep the average aggregate CPU utilization of
     *   your Auto Scaling group at 50 percent.
     *
     * * Configure a target tracking scaling policy to keep the request count per target of your
     *   Elastic Load Balancing target group at 1000 for your Auto Scaling group.
     *
     * We recommend that you scale on Amazon EC2 instance metrics with a 1-minute frequency because
     * that ensures a faster response to utilization changes. Scaling on metrics with a 5-minute
     * frequency can result in slower response times and scaling on stale metric data. By default,
     * Amazon EC2 instances are enabled for basic monitoring, which means metric data for instances
     * is available at 5-minute intervals. You can enable detailed monitoring to get metric data for
     * instances at 1-minute frequency. For more information, see
     * [Configure-Monitoring-for-Auto-Scaling-Instances](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-instance-monitoring.html#enable-as-instance-metrics).
     *
     * See https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-target-tracking.html for
     * more details.
     */
    scaleToTrackMetric(name: string, args: targetTracking.CustomMetricTargetTrackingPolicyArgs, opts?: pulumi.ComponentResourceOptions): aws.autoscaling.Policy;
    /**
     * Scales in response to the average CPU utilization of the [AutoScalingGroup].
     */
    scaleToTrackAverageCPUUtilization(name: string, args: targetTracking.TargetTrackingPolicyArgs, opts?: pulumi.ComponentResourceOptions): aws.autoscaling.Policy;
    /**
     * Scales in response to the average number of bytes received on all network interfaces by the
     * [AutoScalingGroup].
     */
    scaleToTrackAverageNetworkIn(name: string, args: targetTracking.TargetTrackingPolicyArgs, opts?: pulumi.ComponentResourceOptions): aws.autoscaling.Policy;
    /**
     * Scales in response to the average number of bytes sent out on all network interfaces by the
     * [AutoScalingGroup].
     */
    scaleToTrackAverageNetworkOut(name: string, args: targetTracking.TargetTrackingPolicyArgs, opts?: pulumi.ComponentResourceOptions): aws.autoscaling.Policy;
    /**
     * Scales in response to the number of requests completed per target in an [TargetGroup].
     * [AutoScalingGroup].  These [TargetGroup]s must have been provided to the [AutoScalingGroup]
     * when constructed using [AutoScalingGroupArgs.targetGroups].
     */
    scaleToTrackRequestCountPerTarget(name: string, args: targetTracking.ApplicationTargetGroupTrackingPolicyArgs, opts?: pulumi.ComponentResourceOptions): import("@pulumi/aws/autoscaling/policy").Policy;
    /**
     * Creates a [StepScalingPolicy]  that increases or decreases the current capacity of this
     * AutoScalingGroup based on a set of scaling adjustments, known as step adjustments. The
     * adjustments vary based on the size of the alarm breach.
     *
     * See [StepScalingPolicy] for more details.
     */
    scaleInSteps(name: string, args: stepScaling.StepScalingPolicyArgs, opts?: pulumi.ComponentResourceOptions): x.autoscaling.StepScalingPolicy;
}
export interface AutoScalingGroupArgs {
    /**
     * The vpc this autoscaling group is for.  If not provided this autoscaling group will be
     * created for the default vpc.
     */
    vpc?: x.ec2.Vpc;
    /**
     * The subnets to use for the autoscaling group.  If not provided, the `private` subnets of
     * the `vpc` will be used.
     */
    subnetIds?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * The config to use when creating the auto scaling group.
     *
     * [launchConfiguration] or [launchConfigurationArgs] can be provided.  And, if either are
     * provided will be used as the launch configuration for the auto scaling group.
     *
     * If neither are provided, a default instance will be create by calling
     * [cluster.createAutoScalingConfig()].
     */
    launchConfiguration?: AutoScalingLaunchConfiguration;
    /**
     * The config to use when creating the auto scaling group.
     *
     * [launchConfiguration] or [launchConfigurationArgs] can be provided.  And, if either are
     * provided will be used as the launch configuration for the auto scaling group.
     *
     * If neither are provided, a default instance will be create by calling
     * [cluster.createAutoScalingConfig()].
     */
    launchConfigurationArgs?: AutoScalingLaunchConfigurationArgs;
    /**
     * Parameters to control the cloud formation stack template that is created.  If not provided
     * the defaults specified in TemplateParameters will be used.
     */
    templateParameters?: pulumi.Input<TemplateParameters>;
    /**
     * A list of target groups to associate with the Auto Scaling group.  All target groups must
     * have the "instance" [targetType].
     */
    targetGroups?: x.lb.TargetGroup[];
    /**
     * Set to true to disable rollback of the underlying aws.cloudformation.Stack if that Stack
     * creation failed.  Defaults to 'false'.  Conflicts with `onFailure`.
     */
    disableRollback?: pulumi.Input<boolean>;
    /**
     * Action to be taken if stack creation fails. This must be
     * one of: `DO_NOTHING`, `ROLLBACK`, or `DELETE`. Conflicts with `disableRollback`.
     */
    onFailure?: pulumi.Input<"DO_NOTHING" | "ROLLBACK" | "DELETE">;
}
export interface TemplateParameters {
    /**
     * The amount of time, in seconds, after a scaling activity completes before another scaling
     * activity can start.  Defaults to 300 if unspecified.
     */
    defaultCooldown?: pulumi.Input<number>;
    /**
     * Time (in seconds) after instance comes into service before checking health. Defaults to 120
     * if unspecified.
     */
    healthCheckGracePeriod?: pulumi.Input<number>;
    /**
     * "EC2" or "ELB". Controls how health checking is done.  Defaults to "EC2" if unspecified.
     */
    healthCheckType?: pulumi.Input<"EC2" | "ELB">;
    /**
     * A list of processes to suspend for the AutoScaling Group. The allowed values are `Launch`,
     * `Terminate`, `HealthCheck`, `ReplaceUnhealthy`, `AZRebalance`, `AlarmNotification`,
     * `ScheduledActions`, `AddToLoadBalancer`. Note that if you suspend either the `Launch` or
     * `Terminate` process types, it can prevent your autoscaling group from functioning properly.
     *
     * Defaults to "ScheduledActions" if not specified
     */
    suspendedProcesses?: pulumi.Input<pulumi.Input<"Launch" | "Terminate" | "HealthCheck" | "ReplaceUnhealthy" | "AZRebalance" | "AlarmNotification" | "ScheduledActions" | "AddToLoadBalancer">[]>;
    /**
     * The maximum size of the auto scale group.  Defaults to 100 if unspecified.
     */
    maxSize?: pulumi.Input<number>;
    /**
     * The minimum size of the auto scale group.  Defaults to 2 if unspecified.
     */
    minSize?: pulumi.Input<number>;
    /**
     * The desired size of the auto scale group.  Defaults to [minSize] if unspecified.
     */
    desiredCapacity?: pulumi.Input<number>;
}
