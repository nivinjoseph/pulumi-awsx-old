import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as ecs from ".";
import * as x from "..";
export declare class EC2TaskDefinition extends ecs.TaskDefinition {
    constructor(name: string, args: EC2TaskDefinitionArgs, opts?: pulumi.ComponentResourceOptions);
    /**
     * Creates a service with this as its task definition.
     */
    createService(name: string, args: ecs.EC2ServiceArgs, opts?: pulumi.ComponentResourceOptions): ecs.EC2Service;
}
export declare class EC2Service extends ecs.Service {
    readonly taskDefinition: EC2TaskDefinition;
    constructor(name: string, args: EC2ServiceArgs, opts?: pulumi.ComponentResourceOptions);
}
export interface EC2TaskDefinitionArgs {
    /**
     * The vpc that the service for this task will run in.  Does not normally need to be explicitly
     * provided as it will be inferred from the cluster the service is associated with.
     */
    vpc?: x.ec2.Vpc;
    /**
     * A set of placement constraints rules that are taken into consideration during task placement.
     * Maximum number of `placement_constraints` is `10`.
     */
    placementConstraints?: aws.ecs.TaskDefinitionArgs["placementConstraints"];
    /**
     * The proxy configuration details for the App Mesh proxy.
     */
    proxyConfiguration?: aws.ecs.TaskDefinitionArgs["proxyConfiguration"];
    /**
     * A set of volume blocks that containers in your task may use.
     */
    volumes?: aws.ecs.TaskDefinitionArgs["volumes"];
    /**
     * Log group for logging information related to the service.  If `undefined` a default instance
     * with a one-day retention policy will be created.  If `null` no log group will be created.
     */
    logGroup?: aws.cloudwatch.LogGroup | null;
    /**
     * IAM role that allows your Amazon ECS container task to make calls to other AWS services. If
     * `undefined`, a default will be created for the task.  If `null` no role will be created.
     */
    taskRole?: aws.iam.Role | null;
    /**
     * An optional family name for the Task Definition. If not specified, then a suitable default will be created.
     */
    family?: pulumi.Input<string>;
    /**
     * The execution role that the Amazon ECS container agent and the Docker daemon can assume.
     *
     * If `undefined`, a default will be created for the task.  If `null` no role will be created.
     */
    executionRole?: aws.iam.Role | null;
    /**
     * The Docker networking mode to use for the containers in the task. The valid values are
     * `none`, `bridge`, `awsvpc`, and `host`.
     */
    networkMode?: pulumi.Input<"none" | "bridge" | "awsvpc" | "host">;
    /**
     * Single container to make a TaskDefinition from.  Useful for simple cases where there aren't
     * multiple containers, especially when creating a TaskDefinition to call [run] on.
     *
     * Either [container] or [containers] must be provided.
     */
    container?: ecs.Container;
    /**
     * All the containers to make a TaskDefinition from.  Useful when creating a
     * Service that will contain many containers within.
     *
     * Either [container] or [containers] must be provided.
     */
    containers?: Record<string, ecs.Container>;
    /**
     * Key-value mapping of resource tags
     */
    tags?: pulumi.Input<aws.Tags>;
}
export interface EC2ServiceArgs {
    /**
     * Configuration block for deployment circuit breaker.
     */
    deploymentCircuitBreaker?: aws.ecs.ServiceArgs["deploymentCircuitBreaker"];
    /**
     * Configuration block containing deployment controller configuration.
     */
    deploymentController?: aws.ecs.ServiceArgs["deploymentController"];
    /**
     * The upper limit (as a percentage of the service's desiredCount) of the number of running
     * tasks that can be running in a service during a deployment. Not valid when using the `DAEMON`
     * scheduling strategy.
     */
    deploymentMaximumPercent?: pulumi.Input<number>;
    /**
     * The lower limit (as a percentage of the service's desiredCount) of the number of running
     * tasks that must remain running and healthy in a service during a deployment.
     */
    deploymentMinimumHealthyPercent?: pulumi.Input<number>;
    /**
     * The number of instances of the task definition to place and keep running. Defaults to 1. Do
     * not specify if using the `DAEMON` scheduling strategy.
     */
    desiredCount?: pulumi.Input<number>;
    /**
     * Specifies whether to enable Amazon ECS managed tags for the tasks within the service.
     */
    enableEcsManagedTags?: pulumi.Input<boolean>;
    /**
     * Specifies whether to enable Amazon ECS Exec for the tasks within the service.
     */
    enableExecuteCommand?: pulumi.Input<boolean>;
    /**
     * Enable to force a new task deployment of the service. This can be used to update tasks to use a newer
     * Docker image with same image/tag combination (e.g. myimage:latest) or immediately deploy
     * orderedPlacementStrategies and placementConstraints updates.
     */
    forceNewDeployment?: pulumi.Input<boolean>;
    /**
     * Seconds to ignore failing load balancer health checks on newly instantiated tasks to prevent
     * premature shutdown, up to 7200. Only valid for services configured to use load balancers.
     */
    healthCheckGracePeriodSeconds?: pulumi.Input<number>;
    /**
     * ARN of the IAM role that allows Amazon ECS to make calls to your load balancer on your
     * behalf. This parameter is required if you are using a load balancer with your service, but
     * only if your task definition does not use the `awsvpc` network mode. If using `awsvpc`
     * network mode, do not specify this role. If your account has already created the Amazon ECS
     * service-linked role, that role is used by default for your service unless you specify a role
     * here.
     */
    iamRole?: pulumi.Input<string>;
    /**
     * A load balancer block. Load balancers documented below.
     */
    loadBalancers?: (pulumi.Input<x.ecs.ServiceLoadBalancer> | x.ecs.ServiceLoadBalancerProvider)[];
    /**
     * The name of the service (up to 255 letters, numbers, hyphens, and underscores)
     */
    name?: pulumi.Input<string>;
    /**
     * The security groups to use for the instances.
     *
     * Defaults to [cluster.securityGroups] if unspecified.
     */
    securityGroups?: x.ec2.SecurityGroupOrId[];
    /**
     * The subnets to connect the instances to.  If unspecified then these will be the public
     * subnets of the cluster's vpc.
     */
    subnets?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * Service level strategy rules that are taken into consideration during task placement. List
     * from top to bottom in order of precedence. The maximum number of `ordered_placement_strategy`
     * blocks is `5`. Defined below.
     */
    orderedPlacementStrategies?: aws.ecs.ServiceArgs["orderedPlacementStrategies"];
    /**
     * rules that are taken into consideration during task placement. Maximum number of
     * `placement_constraints` is `10`. Defined below.
     */
    placementConstraints?: aws.ecs.ServiceArgs["placementConstraints"];
    /**
     * Specifies whether to propagate the tags from the task definition or the service
     * to the tasks. The valid values are `SERVICE` and `TASK_DEFINITION`.
     */
    propagateTags?: pulumi.Input<string>;
    /**
     * The scheduling strategy to use for the service. The valid values are `REPLICA` and `DAEMON`.
     * Defaults to `REPLICA`. Note that [*Fargate tasks do not support the `DAEMON` scheduling
     * strategy*](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/scheduling_tasks.html).
     */
    schedulingStrategy?: pulumi.Input<string>;
    /**
     * The service discovery registries for the service. The maximum number of `service_registries` blocks is `1`.
     */
    serviceRegistries?: aws.ecs.ServiceArgs["serviceRegistries"];
    /**
     * Cluster this service will run in.
     */
    cluster?: ecs.Cluster;
    os?: pulumi.Input<"linux" | "windows">;
    /**
     * Wait for the service to reach a steady state (like [`aws ecs wait
     * services-stable`](https://docs.aws.amazon.com/cli/latest/reference/ecs/wait/services-stable.html))
     * before continuing. Defaults to `true`.
     */
    waitForSteadyState?: pulumi.Input<boolean>;
    /**
     * The task definition to create the service from.  Either [taskDefinition] or
     * [taskDefinitionArgs] must be provided.
     */
    taskDefinition?: EC2TaskDefinition;
    /**
     * The task definition to create the service from.  Either [taskDefinition] or
     * [taskDefinitionArgs] must be provided.
     */
    taskDefinitionArgs?: EC2TaskDefinitionArgs;
    /**
     * Key-value mapping of resource tags
     */
    tags?: pulumi.Input<aws.Tags>;
}
